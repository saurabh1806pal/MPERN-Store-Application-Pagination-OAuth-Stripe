
import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

import api from "../services/api";

const PaymentContext = createContext(null);

// Load Razorpay Checkout script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

export const PaymentProvider = ({ children }) => {
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Create Razorpay Order through our backend
  const createPaymentOrder = useCallback(async (orderId) => {
    const response = await api.post("/payments/create-order", {
      orderId,
    });

    return response.data;
  }, []);

  // Open Razorpay Checkout
  const openCheckout = useCallback(
    async ({ orderId, customer = {} }) => {
      try {
        setPaymentLoading(true);
        setPaymentError(null);

        // Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();

        if (!scriptLoaded) {
          throw new Error("Unable to load Razorpay Checkout.");
        }

        // Create Razorpay Order
        const paymentOrder = await createPaymentOrder(orderId);

        return await new Promise((resolve, reject) => {
          const options = {
            key: paymentOrder.keyId,

            amount: paymentOrder.amount,
            currency: paymentOrder.currency,

            name: "MPERN Store",
            description: `Payment for Order #${orderId}`,

            order_id: paymentOrder.razorpayOrderId,

            prefill: {
              name: customer.name || "",
              email: customer.email || "",
              contact: customer.phone || "",
            },

            theme: {
              color: "#2563eb",
            },

            handler: (paymentResponse) => {
              resolve(paymentResponse);
            },

            modal: {
              ondismiss: () => {
                reject(new Error("Payment window was closed."));
              },
            },
          };

          const razorpayInstance = new window.Razorpay(options);

          razorpayInstance.on("payment.failed", (response) => {
            reject(
              new Error(
                response.error?.description || "Payment failed."
              )
            );
          });

          razorpayInstance.open();
        });
      } catch (error) {
        const message =
          error.response?.data?.message ||
          error.message ||
          "Payment could not be initiated.";

        setPaymentError(message);
        throw error;
      } finally {
        setPaymentLoading(false);
      }
    },
    [createPaymentOrder]
  );

  // Verify Payment
  const verifyPayment = useCallback(async (paymentData) => {
  const response = await api.post("/payments/verify", paymentData);

  return response.data;
}, []);

  const value = {
    paymentLoading,
    paymentError,
    createPaymentOrder,
    openCheckout,
    verifyPayment
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);

  if (!context) {
    throw new Error(
      "usePayment must be used inside PaymentProvider"
    );
  }

  return context;
};
