import crypto from "crypto";
import { prisma } from "../config/prisma.js";

export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    const eventId = req.headers["x-razorpay-event-id"];

    if (!webhookSecret || !Buffer.isBuffer(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook configuration or body.",
      });
    }

    if (typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature.",
      });
    }

    if (typeof eventId !== "string" || !eventId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Webhook event ID is missing.",
      });
    }

    // 1. Verify webhook signature.
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest();

    const receivedSignature = Buffer.from(signature, "hex");

    if (!crypto.timingSafeEqual(expectedSignature, receivedSignature)) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature verification failed.",
      });
    }

    // TEMPORARY DEBUG LOGS
    console.log("Webhook Event ID:", req.headers["x-razorpay-event-id"]);

    console.log("Webhook Signature:", req.headers["x-razorpay-signature"]);

    console.log("Raw Webhook Body:", req.body.toString("utf8"));

    // 2. Parse body only after signature verification.
    const event = JSON.parse(req.body.toString("utf8"));

    const payment = event.payload?.payment?.entity;

    if (!payment?.id || !payment?.order_id) {
      return res.status(400).json({
        success: false,
        message: "Payment information is missing.",
      });
    }

    const supportedEvents = ["payment.captured", "payment.failed"];

    if (!supportedEvents.includes(event.event)) {
      return res.status(200).json({
        success: true,
        message: "Event ignored.",
      });
    }

    // 3. Validate payment against our application order.
    const order = await prisma.order.findUnique({
      where: {
        razorpayOrderId: payment.order_id,
      },
    });

    if (!order) {
      return res.status(200).json({
        success: true,
        message: "No matching application order found.",
      });
    }

    const expectedAmount = Math.round(Number(order.totalAmount) * 100);

    if (
      payment.amount !== expectedAmount ||
      payment.currency !== order.currency
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount or currency mismatch.",
      });
    }

    if (event.event === "payment.captured" && payment.status !== "captured") {
      return res.status(400).json({
        success: false,
        message: "Payment is not captured.",
      });
    }

    // 4. Atomically record the event and update the order.
    await prisma.$transaction(async (tx) => {
      // Unique eventId prevents duplicate processing.
      await tx.webhookEvent.create({
        data: {
          eventId,
          eventType: event.event,
        },
      });

      if (event.event === "payment.captured") {
        const result = await tx.order.updateMany({
          where: {
            id: order.id,
            status: "PENDING",
            paymentStatus: {
              in: ["PENDING", "FAILED"],
            },
            OR: [
              { razorpayPaymentId: null },
              { razorpayPaymentId: payment.id },
            ],
          },
          data: {
            razorpayPaymentId: payment.id,
            paymentStatus: "PAID",
            status: "CONFIRMED",
          },
        });

        // Do not silently discard an unexpected state conflict.
        if (result.count === 0) {
          const currentOrder = await tx.order.findUnique({
            where: { id: order.id },
          });

          const alreadyProcessed =
            currentOrder?.paymentStatus === "PAID" &&
            currentOrder?.razorpayPaymentId === payment.id;

          if (!alreadyProcessed) {
            throw new Error("Order could not be updated for captured payment.");
          }
        }
      }

      if (event.event === "payment.failed") {
        await tx.order.updateMany({
          where: {
            id: order.id,
            status: "PENDING",
            paymentStatus: "PENDING",
          },
          data: {
            paymentStatus: "FAILED",
          },
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully.",
    });
  } catch (error) {
    // P2002 means a unique constraint was violated.
    // For our eventId constraint, this means a duplicate delivery.
    if (error.code === "P2002") {
      return res.status(200).json({
        success: true,
        message: "Duplicate webhook event ignored.",
      });
    }

    console.error("Razorpay webhook error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed.",
    });
  }
};
