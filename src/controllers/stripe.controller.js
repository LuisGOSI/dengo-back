// stripe.controller.js
import Stripe from 'stripe';
import { supabase } from '../config/supabase.js';

// Inicializar Stripe con la key desde variables de entorno
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover', // Versión actual de Stripe API
});

// POST /api/stripe/create-payment-intent
export const createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency = 'mxn', usuario_id } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Monto inválido' });
        }

        // Crear o recuperar cliente de Stripe (opcional pero recomendado)
        let customerId;
        let ephemeralKey;

        if (usuario_id) {
            // Buscar si el usuario ya tiene un customer ID en tu BD
            const { data: usuario, error: errorUsuario } = await supabase
                .from('usuarios')
                .select('stripe_customer_id, email, nombre, apellidos')
                .eq('id', usuario_id)
                .single();

            if (errorUsuario && errorUsuario.code !== 'PGRST116') {
                throw new Error('Error al buscar usuario');
            }

            if (usuario?.stripe_customer_id) {
                customerId = usuario.stripe_customer_id;
            } else if (usuario) {
                // Crear nuevo customer en Stripe
                const customer = await stripe.customers.create({
                    email: usuario.email,
                    name: `${usuario.nombre} ${usuario.apellidos || ''}`.trim(),
                    metadata: {
                        usuario_id: usuario_id.toString()
                    }
                });

                customerId = customer.id;

                // Guardar customer ID en tu BD
                await supabase
                    .from('usuarios')
                    .update({ stripe_customer_id: customerId })
                    .eq('id', usuario_id);
            }

            // Crear Ephemeral Key para el customer
            if (customerId) {
                ephemeralKey = await stripe.ephemeralKeys.create(
                    { customer: customerId },
                    { apiVersion: '2024-11-20.acacia' }
                );
            }
        }

        // Crear Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // Ya debe venir en centavos
            currency: currency,
            customer: customerId,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                usuario_id: usuario_id?.toString() || 'guest',
            },
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            customer: customerId,
            ephemeralKey: ephemeralKey?.secret,
        });

    } catch (error) {
        console.error('Error creando Payment Intent:', error);
        res.status(500).json({
            error: 'Error al crear Payment Intent',
            details: error.message
        });
    }
};

// Webhook para confirmar pagos (IMPORTANTE para producción)
// POST /api/stripe/webhook
export const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // req.body debe ser el raw body (buffer), no JSON parseado
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manejar el evento
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('PaymentIntent fue exitoso!', paymentIntent.id);
            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.error('Pago falló:', failedPayment.id);
            break;

        case 'payment_intent.canceled':
            const canceledPayment = event.data.object;
            console.log('Pago cancelado:', canceledPayment.id);
            break;

        default:
            console.log(`Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
};