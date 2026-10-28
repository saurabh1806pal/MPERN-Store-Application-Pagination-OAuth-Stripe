import jwt from "jsonwebtoken";

export const authenticateUser = (req, res, next) => {
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

    // This line is essential!
    req.user = { id: decoded.userId };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};