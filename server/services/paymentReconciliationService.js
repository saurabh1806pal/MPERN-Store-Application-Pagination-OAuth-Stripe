
import { prisma } from "../config/prisma.js";
import { razorpay } from "../config/razorpay.js";

// Reconcile one application order with Razorpay.
const reconcileSingleOrder = async (order, dryRun = true) => {
  try {
    if (!order.razorpayOrderId) {
      return {
        orderId: order.id,
        result: "UNCHANGED",
        reason: "No Razorpay order ID.",
      };
    }

    // Fetch all payment attempts associated with this Razorpay order.
    const response = await razorpay.orders.fetchPayments(
      order.razorpayOrderId
    );

    const payments = response?.items || [];

    // Find captured payments.
    const capturedPayments = payments.filter(
      (payment) => payment.status === "captured"
    );

    // Multiple captured payments require manual investigation.
    if (capturedPayments.length > 1) {
      return {
        orderId: order.id,
        result: "REVIEW_REQUIRED",
        reason: "Multiple captured payments found.",
      };
    }

    // Handle successful payment.
    if (capturedPayments.length === 1) {
      const payment = capturedPayments[0];

      const expectedAmount = Math.round(
        Number(order.totalAmount) * 100
      );

      const amountMatches = payment.amount === expectedAmount;

      const currencyMatches =
        payment.currency?.toUpperCase() ===
        order.currency?.toUpperCase();

      if (!amountMatches || !currencyMatches) {
        return {
          orderId: order.id,
          result: "REVIEW_REQUIRED",
          reason: "Payment amount or currency mismatch.",
          paymentId: payment.id,
        };
      }

      // Do not overwrite an existing, different payment ID.
      if (
        order.razorpayPaymentId &&
        order.razorpayPaymentId !== payment.id
      ) {
        return {
          orderId: order.id,
          result: "REVIEW_REQUIRED",
          reason: "A different payment ID is already recorded.",
          paymentId: payment.id,
        };
      }

      // A cancelled order stays CANCELLED.
      // A pending order becomes CONFIRMED.
      const newOrderStatus =
        order.status === "PENDING"
          ? "CONFIRMED"
          : order.status;

      // Safe preview: no database modification.
      if (dryRun) {
        return {
          orderId: order.id,
          result: "WOULD_UPDATE",
          paymentId: payment.id,
          previousOrderStatus: order.status,
          newOrderStatus,
          previousPaymentStatus: order.paymentStatus,
          newPaymentStatus: "PAID",
        };
      }

      const updated = await prisma.order.updateMany({
        where: {
          id: order.id,
          status: order.status,
          paymentStatus: "PENDING",
          razorpayPaymentId: order.razorpayPaymentId,
        },
        data: {
          razorpayPaymentId: payment.id,
          paymentStatus: "PAID",
          status: newOrderStatus,
        },
      });

      if (updated.count === 1) {
        return {
          orderId: order.id,
          result: "UPDATED",
          paymentId: payment.id,
          orderStatus: newOrderStatus,
          paymentStatus: "PAID",
        };
      }

      // Check whether another process updated this order first.
      const currentOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });

      if (
        currentOrder?.paymentStatus === "PAID" &&
        currentOrder?.razorpayPaymentId === payment.id
      ) {
        return {
          orderId: order.id,
          result: "ALREADY_UPDATED",
        };
      }

      return {
        orderId: order.id,
        result: "REVIEW_REQUIRED",
        reason: "Order changed during reconciliation.",
      };
    }

    // Mark an order FAILED only when every payment attempt failed.
    const allPaymentsFailed =
      payments.length > 0 &&
      payments.every((payment) => payment.status === "failed");

    if (allPaymentsFailed) {
      if (dryRun) {
        return {
          orderId: order.id,
          result: "WOULD_MARK_FAILED",
        };
      }

      const updated = await prisma.order.updateMany({
        where: {
          id: order.id,
          status: order.status,
          paymentStatus: "PENDING",
          razorpayPaymentId: order.razorpayPaymentId,
        },
        data: {
          paymentStatus: "FAILED",
        },
      });

      return {
        orderId: order.id,
        result:
          updated.count === 1
            ? "MARKED_FAILED"
            : "UNCHANGED",
      };
    }

    return {
      orderId: order.id,
      result: "UNCHANGED",
      reason: "No captured payment found.",
    };
  } catch (error) {
    console.error(
      `Reconciliation failed for order ${order.id}:`,
      error.message
    );

    return {
      orderId: order.id,
      result: "ERROR",
      reason: error.message,
    };
  }
};


// Bulk reconciliation service.
// dryRun defaults to true to prevent accidental database updates.
export const reconcilePendingPayments = async ({
  dryRun = true,
} = {}) => {
  if (!razorpay) {
    throw new Error("Razorpay is not configured.");
  }

  // Include cancelled orders because payment may have been
  // captured even after the customer cancelled the order.
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "PENDING",
      razorpayOrderId: {
        not: null,
      },
      status: {
        in: ["PENDING", "CANCELLED"],
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const results = [];

  // Sequential processing avoids sending too many requests
  // to Razorpay simultaneously.
  for (const order of orders) {
    const result = await reconcileSingleOrder(order, dryRun);
    results.push(result);
  }

  return {
    dryRun,
    totalChecked: results.length,

    updated: results.filter(
      (item) => item.result === "UPDATED"
    ).length,

    wouldUpdate: results.filter(
      (item) => item.result === "WOULD_UPDATE"
    ).length,

    markedFailed: results.filter(
      (item) => item.result === "MARKED_FAILED"
    ).length,

    wouldMarkFailed: results.filter(
      (item) => item.result === "WOULD_MARK_FAILED"
    ).length,

    alreadyUpdated: results.filter(
      (item) => item.result === "ALREADY_UPDATED"
    ).length,

    unchanged: results.filter(
      (item) => item.result === "UNCHANGED"
    ).length,

    reviewRequired: results.filter(
      (item) => item.result === "REVIEW_REQUIRED"
    ).length,

    errors: results.filter(
      (item) => item.result === "ERROR"
    ).length,

    results,
  };
};



// Map Razorpay refund statuses to our database enum.
const mapRazorpayRefundStatus = (status) => {
  const statusMap = {
    pending: "PENDING",
    processed: "PROCESSED",
    failed: "FAILED",
  };

  return statusMap[status] || null;
};

// Fetch every refund for a payment using pagination.
const fetchAllPaymentRefunds = async (paymentId) => {
  const refunds = [];
  const count = 100;
  let skip = 0;

  while (true) {
    const response = await razorpay.payments.fetchMultipleRefund(
      paymentId,
      { count, skip }
    );

    const items = response?.items || [];
    refunds.push(...items);

    if (items.length < count) {
      break;
    }

    skip += count;
  }

  return refunds;
};

// Reconcile refunds for one application order.
const reconcileSingleOrderRefunds = async (order, dryRun = true) => {
  try {
    const razorpayRefunds = await fetchAllPaymentRefunds(
      order.razorpayPaymentId
    );

    if (razorpayRefunds.length === 0) {
      return {
        orderId: order.id,
        result: "UNCHANGED",
        reason: "No refunds found.",
      };
    }

    const refundRecords = [];

    for (const refund of razorpayRefunds) {
      if (
        !refund.id ||
        refund.payment_id !== order.razorpayPaymentId ||
        !Number.isInteger(refund.amount) ||
        refund.amount <= 0 ||
        refund.currency?.toUpperCase() !== order.currency?.toUpperCase()
      ) {
        return {
          orderId: order.id,
          result: "REVIEW_REQUIRED",
          reason: "Refund details failed validation.",
          refundId: refund.id || null,
        };
      }

      const mappedStatus = mapRazorpayRefundStatus(refund.status);

      if (!mappedStatus) {
        return {
          orderId: order.id,
          result: "REVIEW_REQUIRED",
          reason: `Unsupported Razorpay refund status: ${refund.status}`,
          refundId: refund.id,
        };
      }

      refundRecords.push({
        id: refund.id,
        paymentId: refund.payment_id,
        amountInPaise: refund.amount,
        amount: (refund.amount / 100).toFixed(2),
        currency: refund.currency,
        status: mappedStatus,
        failureReason:
          mappedStatus === "FAILED"
            ? refund.error_description ||
              refund.error_reason ||
              null
            : null,
      });
    }

    // Calculate the payment status using all refunds returned by Razorpay.
    const processedRefundAmount = refundRecords
      .filter((refund) => refund.status === "PROCESSED")
      .reduce((total, refund) => total + refund.amountInPaise, 0);

    const orderAmount = Math.round(Number(order.totalAmount) * 100);

    let newPaymentStatus = "PAID";

    if (processedRefundAmount >= orderAmount) {
      newPaymentStatus = "REFUNDED";
    } else if (processedRefundAmount > 0) {
      newPaymentStatus = "PARTIALLY_REFUNDED";
    }

    // Preview without modifying the database.
    if (dryRun) {
      return {
        orderId: order.id,
        result: "WOULD_SYNC",
        refundsFound: refundRecords.length,
        processedRefundAmount: (processedRefundAmount / 100).toFixed(2),
        previousPaymentStatus: order.paymentStatus,
        newPaymentStatus,
      };
    }

    // Save refund records and update the order atomically.
    await prisma.$transaction(async (tx) => {
      for (const refund of refundRecords) {
        const existingRefund = await tx.refund.findUnique({
          where: {
            razorpayRefundId: refund.id,
          },
        });

        const processedAt =
          refund.status === "PROCESSED"
            ? existingRefund?.processedAt || new Date()
            : null;

        await tx.refund.upsert({
          where: {
            razorpayRefundId: refund.id,
          },
          create: {
            orderId: order.id,
            razorpayRefundId: refund.id,
            razorpayPaymentId: refund.paymentId,
            requestKey: `razorpay:${refund.id}`,
            amount: refund.amount,
            currency: refund.currency,
            status: refund.status,
            failureReason: refund.failureReason,
            processedAt,
          },
          update: {
            amount: refund.amount,
            currency: refund.currency,
            status: refund.status,
            failureReason: refund.failureReason,
            processedAt,
          },
        });
      }

      await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          paymentStatus: newPaymentStatus,
        },
      });
    });

    return {
      orderId: order.id,
      result: "SYNCED",
      refundsFound: refundRecords.length,
      processedRefundAmount: (processedRefundAmount / 100).toFixed(2),
      paymentStatus: newPaymentStatus,
    };
  } catch (error) {
    console.error(
      `Refund reconciliation failed for order ${order.id}:`,
      error.message
    );

    return {
      orderId: order.id,
      result: "ERROR",
      reason: error.message,
    };
  }
};

// Bulk refund reconciliation service.
export const reconcilePendingRefunds = async ({
  dryRun = true,
} = {}) => {
  if (!razorpay) {
    throw new Error("Razorpay is not configured.");
  }

  const orders = await prisma.order.findMany({
    where: {
      razorpayPaymentId: {
        not: null,
      },
      paymentStatus: {
        in: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"],
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const results = [];

  // Process sequentially to avoid excessive Razorpay API requests.
  for (const order of orders) {
    const result = await reconcileSingleOrderRefunds(order, dryRun);
    results.push(result);
  }

  return {
    dryRun,
    totalChecked: results.length,

    synced: results.filter(
      (item) => item.result === "SYNCED"
    ).length,

    wouldSync: results.filter(
      (item) => item.result === "WOULD_SYNC"
    ).length,

    unchanged: results.filter(
      (item) => item.result === "UNCHANGED"
    ).length,

    reviewRequired: results.filter(
      (item) => item.result === "REVIEW_REQUIRED"
    ).length,

    errors: results.filter(
      (item) => item.result === "ERROR"
    ).length,

    results,
  };
};



// Run complete Razorpay reconciliation.
export const reconcileAllPayments = async ({
  dryRun = false,
} = {}) => {
  if (!razorpay) {
    throw new Error("Razorpay is not configured.");
  }

  // First synchronize payment records.
  const paymentSummary = await reconcilePendingPayments({
    dryRun,
  });

  // Then synchronize refund records.
  const refundSummary = await reconcilePendingRefunds({
    dryRun,
  });

  return {
    success: true,
    dryRun,
    payments: paymentSummary,
    refunds: refundSummary,
  };
};
