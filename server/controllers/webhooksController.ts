import { Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { inngest } from "../inngest/index.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const stripeWebhook = async (
    request: Request,
    response: Response
) => {
    let event: Stripe.Event;

    if (!endpointSecret) {
        console.error("STRIPE_WEBHOOK_SECRET is not configured");
        return response.sendStatus(500);
    }

    // Get the signature sent by Stripe
    const signature = request.headers["stripe-signature"];

    if (!signature) {
        console.error("Stripe signature is missing");
        return response.sendStatus(400);
    }

    try {
        event = stripe.webhooks.constructEvent(
            request.body,
            signature,
            endpointSecret
        );
    } catch (error) {
        console.error(
            "Webhook signature verification failed:",
            error
        );

        return response.sendStatus(400);
    }

    // Handle the event
    switch (event.type) {
        case "payment_intent.succeeded": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const paymentIntentId = paymentIntent.id;

            // Get checkout session using payment intent
            const sessions = await stripe.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });

            const session = sessions.data[0];

            if (!session) {
                console.error("Checkout session not found");
                break;
            }

            const orderId = session.metadata?.orderId;

            if (!orderId) {
                console.error("Order ID not found in session metadata");
                break;
            }

            // Mark payment as paid
            const paidOrder = await prisma.order.update({
                where: {
                    id: orderId,
                },
                data: {
                    isPaid: true,
                },
            });

            // Get order items
            const orderItems = Array.isArray(paidOrder.items)
                ? paidOrder.items
                : [];

            // Decrease stock
            for (const item of orderItems as any[]) {
                await prisma.product.update({
                    where: {
                        id: item.product,
                    },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                    },
                });
            }

            // Send order placed event
            if (paidOrder) {
                await inngest.send({
                    name: "order/placed",
                    data: {
                        orderId,
                    },
                });
            }

            // Send stock update event for each product
            for (const item of orderItems as any[]) {
                await inngest.send({
                    name: "inventory/stock.updated",
                    data: {
                        productId: item.product,
                    },
                });
            }

            break;
        }

        case "payment_intent.canceled":
        case "payment_intent.payment_failed": {
            const paymentIntentFailure =
                event.data.object as Stripe.PaymentIntent;

            const paymentIntentFailureId =
                paymentIntentFailure.id;

            // Get checkout session
            const sessions = await stripe.checkout.sessions.list({
                payment_intent: paymentIntentFailureId,
            });

            const session = sessions.data[0];

            if (!session) {
                console.error("Checkout session not found");
                break;
            }

            const failureOrderId = session.metadata?.orderId;

            if (!failureOrderId) {
                console.error("Order ID not found in session metadata");
                break;
            }

            // Delete failed/cancelled order
            await prisma.order.delete({
                where: {
                    id: failureOrderId,
                },
            });

            break;
        }

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return response.json({
        received: true,
    });
};