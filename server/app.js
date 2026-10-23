import express from 'express';
import cors from 'cors';

import { prisma } from './config/prisma.js';
import mongoose from 'mongoose';





const app = express();
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({ 
        success: true,
        message: "Server is running" });
});


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

export default app;