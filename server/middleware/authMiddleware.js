import jwt from "jsonwebtoken";



// This middleware function is for the Authentication of the user using JWT token stored in cookies. 
// It checks for the presence of a valid JWT token in the request cookies, verifies it, and attaches the decoded user information to the request object for further processing in subsequent middleware or route handlers.
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

