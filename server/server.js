import app from './app.js';
import { connectMongo } from './config/mongo.js';
import { prisma } from './config/prisma.js';

const PORT = process.env.PORT || 5050;

async function startServer(){
    try{
        // Connect to PostgreSQL
        await prisma.$connect();
        console.log("Connected to PostgreSQL Successfully: fileName: server.js");

        // Connect to MongoDB
        await connectMongo();
        console.log("Connected to MongoDB Successfully: fileName: server.js");

        // Start the Express Server
        app.listen(PORT, ()=> {
            console.log(`Server is running on port ${PORT}`);
        })
    }catch(error){
        console.error("Server Startup failed: fileName: server.js", error);
        await prisma.$disconnect().catch(()=> {})
        process.exit(1);
    }
}
// This is an important backend pattern: initialize dependencies before accepting requests. If either database fails to connect, the server won't start in a misleading partially initialized state.

startServer();