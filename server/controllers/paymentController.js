import crypto from 'crypto';
import { prisma } from "../config/prisma.js";
import { razorpay } from "../config/razorpay.js";


// POST /api/payments/create-order
export const createRazorpayOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: "Razorpay is not configured.",
      });
    }

    const userId = req.user.id;
    const { orderId } = req.body;

    // Validate application order ID
    const parsedOrderId = Number(orderId);

    if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    // Find the customer's order
    const order = await prisma.order.findFirst({
      where: {
        id: parsedOrderId,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Only unpaid pending orders can initiate payment
    if (
      order.status !== "PENDING" ||
      !["PENDING", "FAILED"].includes(order.paymentStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "This order cannot be paid.",
      });
    }

    // Reuse an existing Razorpay order when available
    if (order.razorpayOrderId) {
      return res.status(200).json({
        success: true,
        message: "Existing Razorpay order retrieved.",
        keyId: process.env.RAZORPAY_KEY_ID,
        razorpayOrderId: order.razorpayOrderId,
        amount: Math.round(Number(order.totalAmount) * 100),
        currency: order.currency.toUpperCase(),
        orderId: order.id,
      });
    }

    // Calculate amount from the database
    const amount = Math.round(Number(order.totalAmount) * 100);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount.",
      });
    }

    // Create order with Razorpay
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: order.currency.toUpperCase(),
      receipt: `order_${order.id}`,
      notes: {
        applicationOrderId: String(order.id),
        userId: String(userId),
      },
    });

    // Save Razorpay order ID in PostgreSQL
    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        razorpayOrderId: razorpayOrder.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Razorpay order created successfully.",
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Create Razorpay Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order.",
    });
  }
};


// POST /api/payments/verify
export const verifyRazorpayPayment = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: "Razorpay is not configured.",
      });
    }

    const userId = req.user.id;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    // Validate required fields
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification details.",
      });
    }

    const parsedOrderId = Number(orderId);

    if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid application order ID.",
      });
    }

    // Find the customer's application order
    const order = await prisma.order.findFirst({
      where: {
        id: parsedOrderId,
        userId,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Ensure Razorpay Order ID matches our database
    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order ID mismatch.",
      });
    }

    // Handle duplicate verification requests
    if (order.paymentStatus === "PAID") {
      if (order.razorpayPaymentId === razorpay_payment_id) {
        return res.status(200).json({
          success: true,
          message: "Payment already verified.",
          order,
        });
      }

      return res.status(409).json({
        success: false,
        message: "This order has already been paid.",
      });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Order is not eligible for payment verification.",
      });
    }

    // Generate expected HMAC signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // Compare signatures safely
    const expectedBuffer = Buffer.from(generatedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpay_signature, "hex");

    const signatureIsValid =
      /^[a-f0-9]{64}$/i.test(razorpay_signature) &&
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!signatureIsValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature.",
      });
    }

    // Fetch payment directly from Razorpay
    const payment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    // Verify payment belongs to the expected Razorpay Order
    if (payment.order_id !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Payment does not belong to this Razorpay order.",
      });
    }

    // Verify amount and currency
    const expectedAmount = Math.round(
      Number(order.totalAmount) * 100
    );

    if (
      payment.amount !== expectedAmount ||
      payment.currency.toUpperCase() !== order.currency.toUpperCase()
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount or currency mismatch.",
      });
    }

    // Only captured payments can confirm an order
    if (payment.status !== "captured") {
      return res.status(409).json({
        success: false,
        message: `Payment is currently ${payment.status}. It has not been captured.`,
      });
    }

    // Update both statuses atomically
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: {
          id: parsedOrderId,
          userId,
          razorpayOrderId: razorpay_order_id,
          status: "PENDING",
          paymentStatus: {
            in: ["PENDING", "FAILED"],
          },
          razorpayPaymentId: null,
        },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
      });

      if (updated.count !== 1) {
        throw new Error("ORDER_UPDATE_CONFLICT");
      }

      return tx.order.findUnique({
        where: {
          id: parsedOrderId,
        },
        include: {
          items: true,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      order: result,
    });

  } catch (error) {
    if (error.message === "ORDER_UPDATE_CONFLICT") {
      return res.status(409).json({
        success: false,
        message: "Order was already updated. Please refresh.",
      });
    }

    console.error("Razorpay Verification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment.",
    });
  }
};
