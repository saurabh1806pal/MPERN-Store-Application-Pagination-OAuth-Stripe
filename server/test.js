import { razorpay } from "./config/razorpay.js";

console.log(
  razorpay ? "Razorpay initialized" : "Razorpay credentials missing"
);