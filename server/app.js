
import express from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { prisma } from "./config/prisma.js";
import passport from "./config/passport.js";

// Local routes
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"

const app = express();

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Parse request bodies and cookies
app.use(express.json());
app.use(cookieParser());

// Temporary session for OAuth state validation.
// The default MemoryStore is suitable only for local development.
if (!process.env.OAUTH_SESSION_SECRET) {
  throw new Error("OAUTH_SESSION_SECRET is missing from server/.env");
}

app.use(
  session({
    name: "oauth.sid",
    secret: process.env.OAUTH_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60 * 1000,
    },
  })
);

// Initialize Passport after the session middleware
app.use(passport.initialize());

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

// Database health check
app.get("/api/health/db", async (req, res) => {
  let postgres = "disconnected";
  let mongodb = "disconnected";

  try {
    await prisma.$queryRaw`SELECT 1`;
    postgres = "connected";
  } catch (error) {
    console.error("PostgreSQL connection error in app.js:", error);
  }

  if (mongoose.connection.readyState === 1) {
    mongodb = "connected";
  }

  const success = postgres === "connected" && mongodb === "connected";

  res.status(success ? 200 : 503).json({
    success,
    databases: {
      postgres,
      mongodb,
    },
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes)

export default app;
