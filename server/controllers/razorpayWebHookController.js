
import crypto from "crypto";
import { prisma } from "../config/prisma.js";

// Map Razorpay refund statuses to our database enum.
const mapRefundStatus = (status) => {
  const statusMap = {
    pending: "PENDING",
    processed: "PROCESSED",
    failed: "FAILED",
  };

  return statusMap[status] || null;
};

// Handle refund.created, refund.processed and refund.failed.
const handleRefundWebhookEvent = async (event, eventId) => {
  const refund = event.payload?.refund?.entity;

  if (
    !refund?.id ||
    !refund.payment_id ||
    !Number.isInteger(refund.amount) ||
    refund.amount <= 0
  ) {
    throw new Error("Invalid refund information.");
  }

  const incomingStatus = mapRefundStatus(refund.status);

  if (!incomingStatus) {
    throw new Error("Unsupported refund status.");
  }

  const order = await prisma.order.findUnique({
    where: {
      razorpayPaymentId: refund.payment_id,
    },
  });

  if (!order) {
    return {
      matched: false,
      message: "No matching application order found.",
    };
  }

  if (
    refund.currency?.toUpperCase() !==
    order.currency?.toUpperCase()
  ) {
    throw new Error("Refund currency mismatch.");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Record the event. Unique eventId prevents duplicate processing.
    await tx.webhookEvent.create({
      data: {
        eventId,
        eventType: event.event,
      },
    });

    const existingRefund = await tx.refund.findUnique({
      where: {
        razorpayRefundId: refund.id,
      },
    });

    if (
      existingRefund &&
      (
        existingRefund.orderId !== order.id ||
        existingRefund.razorpayPaymentId !== refund.payment_id
      )
    ) {
      throw new Error(
        "Refund is already associated with another order."
      );
    }

    // A terminal status must not be overwritten by an older event.
    const existingIsTerminal =
      existingRefund &&
      ["PROCESSED", "FAILED"].includes(existingRefund.status);

    const effectiveStatus = existingIsTerminal
      ? existingRefund.status
      : incomingStatus;

    const processedAt =
      effectiveStatus === "PROCESSED"
        ? existingRefund?.processedAt ||
          (refund.created_at
            ? new Date(refund.created_at * 1000)
            : new Date())
        : null;

    await tx.refund.upsert({
      where: {
        razorpayRefundId: refund.id,
      },
      create: {
        orderId: order.id,
        razorpayRefundId: refund.id,
        razorpayPaymentId: refund.payment_id,
        requestKey: `razorpay:${refund.id}`,
        amount: (refund.amount / 100).toFixed(2),
        currency: refund.currency,
        status: effectiveStatus,
        failureReason:
          effectiveStatus === "FAILED"
            ? refund.error_description ||
              refund.error_reason ||
              null
            : null,
        processedAt,
      },
      update: {
        amount: (refund.amount / 100).toFixed(2),
        currency: refund.currency,
        status: effectiveStatus,
        failureReason:
          effectiveStatus === "FAILED"
            ? refund.error_description ||
              refund.error_reason ||
              null
            : null,
        processedAt,
      },
    });

    // Recalculate payment status using all processed refunds.
    const processedRefunds = await tx.refund.findMany({
      where: {
        orderId: order.id,
        status: "PROCESSED",
      },
      select: {
        amount: true,
      },
    });

    const totalRefundedInPaise = processedRefunds.reduce(
      (total, item) =>
        total + Math.round(Number(item.amount) * 100),
      0
    );

    const orderAmountInPaise = Math.round(
      Number(order.totalAmount) * 100
    );

    if (totalRefundedInPaise > orderAmountInPaise) {
      throw new Error(
        "Total processed refunds exceed the order amount."
      );
    }

    let paymentStatus = "PAID";

    if (totalRefundedInPaise === orderAmountInPaise) {
      paymentStatus = "REFUNDED";
    } else if (totalRefundedInPaise > 0) {
      paymentStatus = "PARTIALLY_REFUNDED";
    }

    await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymentStatus,
      },
    });

    return {
      orderId: order.id,
      refundId: refund.id,
      refundStatus: effectiveStatus,
      paymentStatus,
    };
  });

  return {
    matched: true,
    ...result,
  };
};

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

    if (
      typeof signature !== "string" ||
      !/^[a-f0-9]{64}$/i.test(signature)
    ) {
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

    // 2. Parse body only after signature verification.
    const event = JSON.parse(req.body.toString("utf8"));

    // 3. Identify supported events.
    const supportedEvents = [
      "payment.captured",
      "payment.failed",
      "refund.created",
      "refund.processed",
      "refund.failed",
    ];

    if (!supportedEvents.includes(event.event)) {
      return res.status(200).json({
        success: true,
        message: "Event ignored.",
      });
    }

    // 4. Route refund events separately from payment events.
    const refundEvents = [
      "refund.created",
      "refund.processed",
      "refund.failed",
    ];

    if (refundEvents.includes(event.event)) {
      const result = await handleRefundWebhookEvent(event, eventId);

      return res.status(200).json({
        success: true,
        message: result.matched
          ? "Refund webhook processed successfully."
          : result.message,
        ...result,
      });
    }

    // 5. Existing payment event handling.
    const payment = event.payload?.payment?.entity;

    if (!payment?.id || !payment?.order_id) {
      return res.status(400).json({
        success: false,
        message: "Payment information is missing.",
      });
    }

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

    const expectedAmount = Math.round(
      Number(order.totalAmount) * 100
    );

    if (
      payment.amount !== expectedAmount ||
      payment.currency !== order.currency
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount or currency mismatch.",
      });
    }

    if (
      event.event === "payment.captured" &&
      payment.status !== "captured"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment is not captured.",
      });
    }

    // 6. Atomically record payment event and update the order.
    await prisma.$transaction(async (tx) => {
      await tx.webhookEvent.create({
        data: {
          eventId,
          eventType: event.event,
        },
      });

      if (event.event === "payment.captured") {
        const paymentConditions = {
          id: order.id,
          paymentStatus: {
            in: ["PENDING", "FAILED"],
          },
          OR: [
            { razorpayPaymentId: null },
            { razorpayPaymentId: payment.id },
          ],
        };

        // Case 1: Order is still pending.
        const pendingResult = await tx.order.updateMany({
          where: {
            ...paymentConditions,
            status: "PENDING",
          },
          data: {
            razorpayPaymentId: payment.id,
            paymentStatus: "PAID",
            status: "CONFIRMED",
          },
        });

        // Case 2: Order was already cancelled.
        // Preserve CANCELLED while recording the captured payment.
        let cancelledResult = { count: 0 };

        if (pendingResult.count === 0) {
          cancelledResult = await tx.order.updateMany({
            where: {
              ...paymentConditions,
              status: "CANCELLED",
            },
            data: {
              razorpayPaymentId: payment.id,
              paymentStatus: "PAID",
            },
          });
        }

        if (
          pendingResult.count === 0 &&
          cancelledResult.count === 0
        ) {
          const currentOrder = await tx.order.findUnique({
            where: {
              id: order.id,
            },
          });

          const alreadyProcessed =
            currentOrder?.paymentStatus === "PAID" &&
            currentOrder?.razorpayPaymentId === payment.id;

          if (!alreadyProcessed) {
            throw new Error(
              "Order could not be updated for captured payment."
            );
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
