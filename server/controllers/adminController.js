import Product from "../models/Product.js";
import { prisma } from "../config/prisma.js";
import { reconcileAllPayments } from "../services/paymentReconciliationService.js";

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    // 1. Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const skip = (page - 1) * limit;

    // 2. Search
    const search = req.query.search?.trim() || "";

    // 3. Sorting
    const allowedSortFields = [
      "name",
      "email",
      "createdAt",
      "updatedAt",
    ];

    const sortBy = allowedSortFields.includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";

    const sortOrder = req.query.order === "asc" ? "asc" : "desc";

    // 4. Filter customers
    const where = {
      role: "CUSTOMER",
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }),
    };

    // 5. Fetch customers and count
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          emailVerified: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      success: true,
      message: "Customers retrieved successfully.",
      data: users,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalUsers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      sorting: {
        sortBy,
        order: sortOrder,
      },
    });
  } catch (error) {
    console.error("Get all customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve customers.",
    });
  }
};


// GET /api/admin/users/:id
export const getUserById = async (req, res) => {
  try {
    // 1. Validate customer ID
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    // 2. Fetch customer and recent orders
    const customer = await prisma.user.findFirst({
      where: {
        id: customerId,
        role: "CUSTOMER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        isActive: true,
        role: true,
        createdAt: true,
        updatedAt: true,

        orders: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
          select: {
            id: true,
            totalAmount: true,
            currency: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
            _count: {
              select: {
                items: true,
              },
            },
          },
        },
      },
    });

    // 3. Handle missing customer
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // 4. Fetch customer statistics
    const [
      totalOrders,
      paidOrders,
      paidAmount,
      orderStatusBreakdown,
      paymentStatusBreakdown,
    ] = await Promise.all([
      prisma.order.count({
        where: {
          userId: customerId,
        },
      }),

      prisma.order.count({
        where: {
          userId: customerId,
          paymentStatus: "PAID",
        },
      }),

      prisma.order.aggregate({
        where: {
          userId: customerId,
          paymentStatus: "PAID",
        },
        _sum: {
          totalAmount: true,
        },
      }),

      prisma.order.groupBy({
        by: ["status"],
        where: {
          userId: customerId,
        },
        _count: {
          _all: true,
        },
      }),

      prisma.order.groupBy({
        by: ["paymentStatus"],
        where: {
          userId: customerId,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    // 5. Prepare statistics
    const statistics = {
      totalOrders,
      paidOrders,
      totalSpent: Number(paidAmount._sum.totalAmount || 0),

      orderStatusBreakdown: orderStatusBreakdown.map((item) => ({
        status: item.status,
        count: item._count._all,
      })),

      paymentStatusBreakdown: paymentStatusBreakdown.map((item) => ({
        status: item.paymentStatus,
        count: item._count._all,
      })),
    };

    // 6. Return customer details
    return res.status(200).json({
      success: true,
      message: "Customer details retrieved successfully.",

      customer,

      statistics,
    });
  } catch (error) {
    console.error("Get customer details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve customer details.",
    });
  }
};


// PATCH /api/admin/users/:id/status
// Update customer account status
export const updateCustomerStatus = async (req, res) => {
  try {
    const customerId = Number(req.params.id);
    const { isActive } = req.body;

    // Validate customer ID
    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    // Validate status
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    // Find customer
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!customer || customer.role !== "CUSTOMER") {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Avoid unnecessary database updates
    if (customer.isActive === isActive) {
      return res.status(200).json({
        success: true,
        message: `Customer is already ${isActive ? "active" : "inactive"}`,
        customer,
      });
    }

    // Update customer status
    const updatedCustomer = await prisma.user.update({
      where: { id: customerId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Customer ${isActive ? "activated" : "deactivated"} successfully`,
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("Update customer status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update customer status",
    });
  }
};


// POST /api/admin/payments/reconcile
// Synchronize payment and refund records with Razorpay
export const reconcilePayments = async (req, res) => {
  try {
    const summary = await reconcileAllPayments({
      dryRun: false,
    });

    return res.status(200).json({
      success: true,
      message: "Payment and refund reconciliation completed.",
      data: summary,
    });
  } catch (error) {
    console.error("Admin payment reconciliation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete payment reconciliation.",
    });
  }
};


// GET /api/admin/dashboard?period=30d
// Combined dashboard data from PostgreSQL and MongoDB.

const getDashboardDateFilter = (period) => {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;

    case "7d":
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;

    case "30d":
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;

    case "thisMonth":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;

    case "all":
      return null;

    default:
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
  }

  return { gte: start };
};

const getDashboardBucket = (date, period) => {
  const d = new Date(date);

  if (period === "all") {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getDashboardBucketLabel = (key, period) => {
  if (period === "all") {
    const [year, month] = key.split("-");
    return new Date(Number(year), Number(month) - 1, 1)
      .toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });
  }

  const [year, month, day] = key.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day))
    .toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
};

export const getAdminDashboard = async (req, res) => {
  try {
    const allowedPeriods = [
      "today",
      "7d",
      "30d",
      "thisMonth",
      "all",
    ];

    const period = allowedPeriods.includes(req.query.period)
      ? req.query.period
      : "30d";

    const dateFilter = getDashboardDateFilter(period);

    const orderWhere = dateFilter
      ? { createdAt: dateFilter }
      : {};

    const refundWhere = dateFilter
      ? { createdAt: dateFilter }
      : {};

    // Fetch PostgreSQL and MongoDB data concurrently.
    const [
      totalCustomers,
      totalProducts,
      inStockProducts,
      lowStockProducts,
      outOfStockProducts,
      totalOrders,
      paidOrderAggregate,
      orderStatusGroups,
      paymentStatusGroups,
      refundStatusGroups,
      chartOrders,
      recentOrders,
      recentRefunds,
    ] = await Promise.all([
      // Lifetime customer count.
      prisma.user.count({
        where: { role: "CUSTOMER" },
      }),

      // Lifetime product and inventory counts.
      Product.countDocuments(),

      Product.countDocuments({
        quantity: { $gt: 10 },
      }),

      Product.countDocuments({
        quantity: { $gt: 0, $lte: 10 },
      }),

      Product.countDocuments({
        quantity: { $lte: 0 },
      }),

      // Orders within the selected period.
      prisma.order.count({
        where: orderWhere,
      }),

      // Revenue from PAID orders only.
      prisma.order.aggregate({
        where: {
          ...orderWhere,
          paymentStatus: "PAID",
        },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),

      // Order status breakdown.
      prisma.order.groupBy({
        by: ["status"],
        where: orderWhere,
        _count: { _all: true },
      }),

      // Payment status breakdown.
      prisma.order.groupBy({
        by: ["paymentStatus"],
        where: orderWhere,
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),

      // Refund status breakdown.
      prisma.refund.groupBy({
        by: ["status"],
        where: refundWhere,
        _count: { _all: true },
        _sum: { amount: true },
      }),

      // Orders used to construct the analytics chart.
      prisma.order.findMany({
        where: orderWhere,
        select: {
          createdAt: true,
          totalAmount: true,
          paymentStatus: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),

      // Latest orders.
      prisma.order.findMany({
        where: orderWhere,
        take: 8,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          fullName: true,
          totalAmount: true,
          currency: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),

      // Latest refunds.
      prisma.refund.findMany({
        where: refundWhere,
        take: 6,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          orderId: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          processedAt: true,
        },
      }),
    ]);

    // Calculate revenue and order analytics by date.
    const analyticsMap = new Map();

    chartOrders.forEach((order) => {
      const key = getDashboardBucket(order.createdAt, period);

      if (!analyticsMap.has(key)) {
        analyticsMap.set(key, {
          key,
          orders: 0,
          revenue: 0,
        });
      }

      const bucket = analyticsMap.get(key);

      bucket.orders += 1;

      if (order.paymentStatus === "PAID") {
        bucket.revenue += Number(order.totalAmount);
      }
    });

    const salesAnalytics = Array.from(analyticsMap.values()).map(
      (item) => ({
        date: item.key,
        label: getDashboardBucketLabel(item.key, period),
        orders: item.orders,
        revenue: Number(item.revenue.toFixed(2)),
      })
    );

    const totalRevenue = Number(
      paidOrderAggregate._sum.totalAmount || 0
    );

    const paidOrders = paidOrderAggregate._count._all;

    const averageOrderValue =
      paidOrders > 0
        ? Number((totalRevenue / paidOrders).toFixed(2))
        : 0;

    // Include zero-count statuses so the dashboard always
    // displays the complete status list.
    const orderStatuses = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];

    const paymentStatuses = [
      "PENDING",
      "PAID",
      "FAILED",
      "PARTIALLY_REFUNDED",
      "REFUNDED",
    ];

    const refundStatuses = [
      "PENDING",
      "PROCESSED",
      "FAILED",
    ];

    const orderOverview = orderStatuses.map((status) => ({
      status,
      count:
        orderStatusGroups.find((item) => item.status === status)
          ?._count._all || 0,
    }));

    const paymentOverview = paymentStatuses.map((status) => {
      const item = paymentStatusGroups.find(
        (group) => group.paymentStatus === status
      );

      return {
        status,
        count: item?._count._all || 0,
        orderAmount: Number(item?._sum.totalAmount || 0),
      };
    });

    const refundOverview = refundStatuses.map((status) => {
      const item = refundStatusGroups.find(
        (group) => group.status === status
      );

      return {
        status,
        count: item?._count._all || 0,
        amount: Number(item?._sum.amount || 0),
      };
    });

    return res.status(200).json({
      success: true,
      message: "Admin dashboard data retrieved successfully.",

      dashboard: {
        period,

        overview: {
          totalRevenue,
          totalOrders,
          totalCustomers,
          totalProducts,
          averageOrderValue,
          paidOrders,
        },

        salesAnalytics,

        orderOverview,

        recentOrders,

        inventory: {
          inStock: inStockProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
          lowStockThreshold: 10,
        },

        payments: paymentOverview,

        refunds: {
          overview: refundOverview,
          recent: recentRefunds,
        },
      },
    });
  } catch (error) {
    console.error("Get admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve admin dashboard data.",
    });
  }
};
