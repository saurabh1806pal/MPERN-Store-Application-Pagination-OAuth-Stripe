
import cron from "node-cron";
import { reconcileAllPayments } from "../services/paymentReconciliationService.js";

// Run payment and refund reconciliation every 3 hours.
export const startPaymentReconciliationJob = () => {
  cron.schedule("0 */3 * * *", async () => {
    console.log("\nStarting scheduled Razorpay reconciliation...\n");

    try {
      const summary = await reconcileAllPayments({
        dryRun: false,
      });

      console.log(
        "Scheduled Razorpay reconciliation completed:",
        JSON.stringify(summary, null, 2)
      );
    } catch (error) {
      console.error(
        "Scheduled Razorpay reconciliation failed:",
        error
      );
    }
  });

  console.log("Payment reconciliation cron job scheduled.");
};
