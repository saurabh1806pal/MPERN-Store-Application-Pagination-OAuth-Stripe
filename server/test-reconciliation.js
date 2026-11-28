
import "dotenv/config";
import { prisma } from "./config/prisma.js";
import { reconcilePendingPayments } from "./services/paymentReconciliationService.js";

const runTest = async () => {
  try {
    console.log("\nStarting payment reconciliation DRY RUN...\n");

    const summary = await reconcilePendingPayments({
      dryRun: false,
    });

    console.log("\n========== RECONCILIATION SUMMARY ==========\n");

    console.log(JSON.stringify(summary, null, 2));

    console.log("\n============================================\n");
  } catch (error) {
    console.error("Test failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
};

runTest();
