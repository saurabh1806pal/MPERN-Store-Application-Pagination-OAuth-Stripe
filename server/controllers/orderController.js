
import mongoose from "mongoose";
import { prisma } from "../config/prisma.js";
import Product from "../models/Product.js";
import { success } from "zod";

// POST /api/orders
export const createOrder = async (req, res) => {
  const userId = req.user.id;

  // Keep track of inventory reserved in MongoDB.
  // We need this list if PostgreSQL order creation fails.
  const reservedProducts = [];

  try {
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    } = req.body;

    // 1. Validate shipping information
    const requiredFields = {
      fullName,
      phone,
      addressLine1,
      city,
      state,
      postalCode,
      country,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (typeof value !== "string" || !value.trim()) {
        return res.status(400).json({
          success: false,
          message: `${field} is required.`,
        });
      }
    }

    if (!/^\+?[0-9\s-]{7,15}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid phone number.",
      });
    }

    // 2. Retrieve the customer's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    // 3. Validate product IDs
    for (const item of cart.items) {
      if (!mongoose.isValidObjectId(item.productId)) {
        return res.status(400).json({
          success: false,
          message: "Your cart contains an invalid product.",
        });
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Your cart contains an invalid quantity.",
        });
      }
    }

    // 4. Reserve inventory and build order snapshots
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      // Atomically decrease inventory only if enough stock exists.
      const product = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          quantity: { $gte: item.quantity },
        },
        {
          $inc: { quantity: -item.quantity },
        },
        {
          new: true,
          runValidators: true,
        }
      ).lean();

      if (!product) {
        const error = new Error(
          `Insufficient stock or unavailable product: ${item.productId}`
        );
        error.statusCode = 409;
        throw error;
      }

      // Save the reservation for possible rollback.
      reservedProducts.push({
        productId: product._id,
        quantity: item.quantity,
      });

      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0) {
        const error = new Error("A product has an invalid price.");
        error.statusCode = 400;
        throw error;
      }

      const lineTotal = Number((price * item.quantity).toFixed(2));

      subtotal += lineTotal;

      // Store a snapshot of product information.
      orderItems.push({
        productId: product._id.toString(),
        productName: product.name,
        productPrice: price,
        quantity: item.quantity,
        lineTotal,
      });
    }

    subtotal = Number(subtotal.toFixed(2));

    // 5. Calculate financial amounts on the backend.
    // These are placeholders until we implement shipping and tax rules.
    const shippingFee = 0;
    const taxAmount = 0;

    const totalAmount = Number(
      (subtotal + shippingFee + taxAmount).toFixed(2)
    );

    // 6. Create the order and clear purchased cart items
    // inside one PostgreSQL transaction.
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,

          fullName: fullName.trim(),
          phone: phone.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2?.trim() || null,
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),

          subtotal,
          shippingFee,
          taxAmount,
          totalAmount,
          currency: "INR",

          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
        },
      });

      // Delete only the items that were checked out.
      await tx.cartItem.deleteMany({
        where: {
          id: {
            in: cart.items.map((item) => item.id),
          },
          cartId: cart.id,
        },
      });

      return newOrder;
    });

    // 7. Return the successfully created order
    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order,
    });

  } catch (error) {
    // 8. Compensating rollback:
    // Restore inventory if order creation fails.
    for (const reserved of reservedProducts) {
      try {
        await Product.updateOne(
          { _id: reserved.productId },
          { $inc: { quantity: reserved.quantity } }
        );
      } catch (rollbackError) {
        console.error(
          "Inventory rollback failed:",
          reserved.productId,
          rollbackError
        );
      }
    }

    console.error("Create order error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Unable to create your order. Please try again.",
    });
  }
};


// GET /api/orders
export const getMyOrders = async (req, res) => {
    try{
        const userId = req.user.id;

        // Read Pagination Parameters
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

        const skip = (page - 1) * limit;

        // Fetch Orders and total count
        const [orders, totalOrders] = await Promise.all([
            prisma.order.findMany({
                where: {userId},
                include: {
                    items: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: limit,
            }),
            prisma.order.count({
                where: { userId },
            })
        ])

        // Calculate Pagination Info
        const totalPages = Math.ceil(totalOrders/limit);

        // Return the Customer Order
        return res.status(200).json({
            success: true,
            message: "Orders fetched Successfully",
            pagination: {
                currentPage: page,
                limit,
                totalOrders, 
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
            orders,
        });

    }catch(error){
        console.error("get my order errors", error)
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve the Orders"
        })
    }
}


// GET /api/orders/:id

export const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = Number(req.params.id);

    // 1. Validate order ID
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    // 2. Find order belonging to the authenticated user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: true,
      },
    });

    // 3. Handle missing order
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // 4. Return complete order details
    return res.status(200).json({
      success: true,
      message: "Order details retrieved successfully.",
      order,
    });

  } catch (error) {
    console.error("Get order details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve order details.",
    });
  }
};


// PATCH /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    // 1. Validate order ID
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    // 2. Define allowed order status transitions
    const allowedTransitions = {
      PENDING: ["CONFIRMED"],
      CONFIRMED: ["PROCESSING"],
      PROCESSING: ["SHIPPED"],
      SHIPPED: ["DELIVERED"],
      DELIVERED: [],
      CANCELLED: [],
    };

    // 3. Validate requested status
    if (
      typeof status !== "string" ||
      !Object.prototype.hasOwnProperty.call(allowedTransitions, status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    // 4. Find the existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // 5. Validate the status transition
    const permittedStatuses = allowedTransitions[existingOrder.status];

    if (!permittedStatuses.includes(status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot change order status from ${existingOrder.status} to ${status}.`,
      });
    }

    // 6. Update only if the status has not changed concurrently
    const result = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: existingOrder.status,
      },
      data: {
        status,
      },
    });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message: "Order status changed. Please refresh and try again.",
      });
    }

    // 7. Retrieve updated order
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update order status.",
    });
  }
};


// PATCH /api/admin/orders/:id/payment

export const updatePaymentStatus = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { paymentStatus } = req.body;

    // 1. Validate order ID
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    // 2. Define allowed payment status transitions
    const allowedTransitions = {
      PENDING: ["PAID", "FAILED"],
      PAID: ["REFUNDED"],
      FAILED: [],
      REFUNDED: [],
    };

    // 3. Validate requested payment status
    if (
      typeof paymentStatus !== "string" ||
      !Object.prototype.hasOwnProperty.call(
        allowedTransitions,
        paymentStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status.",
      });
    }

    // 4. Find the existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // 5. Validate payment status transition
    const permittedStatuses =
      allowedTransitions[existingOrder.paymentStatus];

    if (!permittedStatuses.includes(paymentStatus)) {
      return res.status(409).json({
        success: false,
        message: `Cannot change payment status from ${existingOrder.paymentStatus} to ${paymentStatus}.`,
      });
    }

    // 6. Update only if the payment status hasn't changed concurrently
    const result = await prisma.order.updateMany({
      where: {
        id: orderId,
        paymentStatus: existingOrder.paymentStatus,
      },
      data: {
        paymentStatus,
      },
    });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message: "Payment status changed. Please refresh and try again.",
      });
    }

    // 7. Retrieve updated order
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully.",
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Update payment status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update payment status.",
    });
  }
};


// PATCH /api/orders/:id/cancel

export const cancelOrder = async (req, res) => {
  const userId = req.user.id;
  const orderId = Number(req.params.id);

  try {
    // 1. Validate order ID
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // 2. Find the customer's order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 3. Check payment status
    if (order.paymentStatus === "PAID") {
      return res.status(409).json({
        success: false,
        message: "Paid orders require a refund before cancellation",
      });
    }

    // 4. Check whether cancellation is allowed
    const cancellableStatuses = ["PENDING", "CONFIRMED"];

    if (!cancellableStatuses.includes(order.status)) {
      return res.status(409).json({
        success: false,
        message: `Order cannot be cancelled in ${order.status} status`,
      });
    }

    // 5. Claim cancellation using a conditional update.
    // This prevents two simultaneous cancellation requests
    // from restoring inventory twice.
    const cancellation = await prisma.order.updateMany({
      where: {
        id: orderId,
        userId,
        status: order.status,
        paymentStatus: {
          in: ["PENDING", "FAILED"],
        },
      },
      data: {
        status: "CANCELLED",
      },
    });

    if (cancellation.count === 0) {
      return res.status(409).json({
        success: false,
        message: "Order was already updated or cannot be cancelled",
      });
    }

    // 6. Restore inventory in MongoDB
    const restoredProducts = [];

    try {
      for (const item of order.items) {
        const product = await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              quantity: item.quantity,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

        if (!product) {
          throw new Error(
            `Product ${item.productId} not found during inventory restoration`
          );
        }

        restoredProducts.push(item);
      }
    } catch (inventoryError) {
      // 7. Compensate for any inventory already restored
      for (const item of restoredProducts.reverse()) {
        try {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: {
              quantity: -item.quantity,
            },
          });
        } catch (rollbackError) {
          console.error(
            "Inventory rollback failed:",
            item.productId,
            rollbackError
          );
        }
      }

      // 8. Revert the order status if inventory restoration fails
      await prisma.order.updateMany({
        where: {
          id: orderId,
          userId,
          status: "CANCELLED",
        },
        data: {
          status: order.status,
        },
      });

      throw inventoryError;
    }

    // 9. Return the updated order
    const updatedOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        items: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled and inventory restored successfully",
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Cancel order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel order",
    });
  }
};
