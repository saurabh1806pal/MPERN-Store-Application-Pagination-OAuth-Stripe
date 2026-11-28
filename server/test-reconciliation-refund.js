
import "dotenv/config";
import { prisma } from "./config/prisma.js";
import { reconcilePendingRefunds } from "./services/paymentReconciliationService.js";

const runTest = async () => {
  try {
    console.log("\nStarting refund reconciliation DRY RUN...\n");

    const summary = await reconcilePendingRefunds({
      dryRun: false,
    });

    console.log("\n========== REFUND RECONCILIATION SUMMARY ==========\n");
    console.log(JSON.stringify(summary, null, 2));
    console.log("\n===================================================\n");
  } catch (error) {
    console.error("Refund reconciliation test failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
};

runTest();
