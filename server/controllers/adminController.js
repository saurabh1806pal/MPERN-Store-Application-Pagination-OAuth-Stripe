
import { prisma } from "../config/prisma.js";

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
