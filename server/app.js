import express from 'express';
import cors from 'cors';
import { prisma } from './config/prisma.js';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
const app = express();

// Local Routes import
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';


app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

// Middleware to parse JSON and cookies
app.use(express.json());
app.use(cookieParser());

// Check if the API is working
app.get("/api/health", (req, res) => {
    res.status(200).json({ 
        success: true,
        message: "Server is running" });
});

// Check if the databases are connected (MongoBD and PostgreSQL) and return their status
app.get("/api/health/db", async (req, res) => {
    let postgres = "disconnected";
    let mongodb = "disconnected";

    try{
        await prisma.$queryRaw`SELECT 1`;
        postgres = "connected";
    }catch(error){
        console.error("PostgreSQL connection error: fileName: app.js", error);
    }

    if(mongoose.connection.readyState === 1){
        mongodb = "connected";
    }

    const success = postgres === "connected" && mongodb === "connected";

    res.status(success ? 200 : 503).json({
        success,
        databases: {
            postgres,
            mongodb
        }
    });
})

// Use the auth routes
app.use("/api/auth", authRoutes);

// Use the product routes
app.use("/api/products", productRoutes);


export default app;