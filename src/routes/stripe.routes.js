import { Router } from "express";
import { createPaymentIntent, stripeWebhook } from "../controllers/stripe.controller.js";

const apiRouter = Router();

// ====================================================================
//? Rutas de Stripe
apiRouter.post('/stripe/create-payment-intent', createPaymentIntent);
apiRouter.post('/stripe/webhook', stripeWebhook);
// ====================================================================

export default apiRouter;
