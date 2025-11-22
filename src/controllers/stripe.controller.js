import { supabase } from '../config/supabase.js';

// En tu archivo de rutas o controlador:
const stripe = require('stripe')('sk_test_TU_SECRET_KEY_AQUI');

// POST /api/stripe/create-payment-intent
const createPaymentIntent = async (req, res) => {
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
            const { data: usuario } = await supabase
                .from('usuarios')
                .select('stripe_customer_id')
                .eq('id', usuario_id)
                .single();

            if (usuario?.stripe_customer_id) {
                customerId = usuario.stripe_customer_id;
            } else {
                // Crear nuevo customer en Stripe
                const { data: userData } = await supabase
                    .from('usuarios')
                    .select('email, nombre, apellidos')
                    .eq('id', usuario_id)
                    .single();

                const customer = await stripe.customers.create({
                    email: userData.email,
                    name: `${userData.nombre} ${userData.apellidos}`,
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
            ephemeralKey = await stripe.ephemeralKeys.create(
                { customer: customerId },
                { apiVersion: '2024-11-20.acacia' } // Usa la versión actual de Stripe
            );
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
const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = 'whsec_TU_WEBHOOK_SECRET_AQUI';

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manejar el evento
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('PaymentIntent was successful!', paymentIntent.id);

            // Aquí puedes verificar que la venta fue registrada
            // o registrarla automáticamente si no lo hizo el frontend
            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.error('Payment failed:', failedPayment.id);
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
};

module.exports = {
    createPaymentIntent,
    stripeWebhook
};