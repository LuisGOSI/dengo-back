import express from "express";
import { createPaymentIntent, stripeWebhook } from "../controllers/stripe.controller.js";

const apiRouter = express.Router();

// ====================================================================
//? Rutas de Stripe
apiRouter.post('/stripe/create-payment-intent', createPaymentIntent);
apiRouter.post('/stripe/webhook', express.raw({type:'application/json'}),stripeWebhook);
// ====================================================================

export default apiRouter;
