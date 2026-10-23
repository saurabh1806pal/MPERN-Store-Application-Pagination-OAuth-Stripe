import "dotenv/config";

import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

export const prisma = new PrismaClient({
  adapter,
});


// This creates one reusable Prisma client for your backend.

// Why do we use a singleton-style client? We want different controllers and services to reuse the same client rather than creating a new database client for every API request.

// If the generated client import produces a module-resolution error, check the generated files in server/generated/prisma/ and match the import to the entry point created by your installed Prisma version.