import "dotenv/config";
import { prisma } from "./config/prisma.js";

try {
  const result = await prisma.$queryRaw`SELECT 1 AS connected`;
  console.log("PostgreSQL query succeeded:", result);
} catch (error) {
  console.error("PostgreSQL query failed:");
  console.error(error);
} finally {
  await prisma.$disconnect();
}