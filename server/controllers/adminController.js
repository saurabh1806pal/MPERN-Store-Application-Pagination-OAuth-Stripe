import { prisma } from "../config/prisma.js";

export const getAllUsers = async (req, res, next) => {
  try {
    // pagination implementation
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );

    const skip = (page - 1) * limit;

    // Optional Search
    const search = req.query.search?.trim();
    const where = search
      ? {
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
        }
      : {};

      // Fetch Users and Total Count in one go
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          role: true,
          googleId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      data: users,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalUsers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get all users error:", error)
    return res.status(500).json({
        success: false,
        message: "Unable to retrieve User."
    })
  }
};
