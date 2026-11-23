
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

// Authenticate user using JWT stored in HttpOnly cookies.
export const authenticateUser = async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "mpern-store",
      audience: "mpern-store-client",
    });

    // Fetch the latest account status from PostgreSQL.
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    if (!user.isActive) {
      res.clearCookie("accessToken");

      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // Attach current database user information.
    req.user = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};
