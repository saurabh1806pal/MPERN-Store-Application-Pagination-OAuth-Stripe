import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useOrder } from "../context/OrderContext";
import { usePayment } from "../context/PaymentContext";
import { useAuth } from "../context/AuthContext";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(price);

const Checkout = () => {
  const navigate = useNavigate();

  const { cart, loading, error: cartError } = useCart();

  const { createOrder, actionLoading, error: orderError } = useOrder();

  const { openCheckout, paymentLoading, paymentError, verifyPayment } =
    usePayment();

  const { user } = useAuth();

  const [shippingDetails, setShippingDetails] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const [formError, setFormError] = useState("");
  const [pendingOrderId, setPendingOrderId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setShippingDetails((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    try {
      let orderId = pendingOrderId;

      // Create PostgreSQL order only once
      if (!orderId) {
        const newOrder = await createOrder(shippingDetails);

        orderId = newOrder.id;
        setPendingOrderId(orderId);
      }

      // Open Razorpay Checkout
      const paymentResponse = await openCheckout({
        orderId,
        customer: {
          name: shippingDetails.fullName,
          email: user?.email || "",
          phone: shippingDetails.phone,
        },
      });

      // Verify payment on the backend
      const verification = await verifyPayment({
        ...paymentResponse,
        orderId,
      });

      // Navigate only after successful verification
      if (verification.success) {
        navigate(`/orders/${orderId}`, {
          replace: true,
        });
      }

      // Payment response received.
      // Backend signature verification comes next.
      navigate(`/orders/${orderId}`, {
        replace: true,
        state: {
          paymentResponse,
          awaitingVerification: true,
        },
      });
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Unable to initiate payment. Please try again.",
      );
    }
  };

  if (loading) {
    return <p className="p-8">Loading checkout...</p>;
  }

  if (cartError) {
    return <p className="p-8 text-red-600">{cartError}</p>;
  }

  if (!cart?.items?.length && !pendingOrderId) {
    return (
      <main className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>

        <Link to="/products" className="text-blue-600">
          Continue Shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Shipping Information */}
        <section className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block mb-2">
                Full Name *
              </label>

              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={shippingDetails.fullName}
                onChange={handleChange}
                className="w-full border rounded-md px-4 py-3"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block mb-2">
                Phone Number *
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                required
                pattern="[0-9]{10}"
                maxLength={10}
                value={shippingDetails.phone}
                onChange={handleChange}
                className="w-full border rounded-md px-4 py-3"
                placeholder="10-digit mobile number"
              />
            </div>

            <div>
              <label htmlFor="addressLine1" className="block mb-2">
                Address Line 1 *
              </label>

              <input
                id="addressLine1"
                name="addressLine1"
                type="text"
                required
                maxLength={200}
                value={shippingDetails.addressLine1}
                onChange={handleChange}
                className="w-full border rounded-md px-4 py-3"
                placeholder="House number, street, locality"
              />
            </div>

            <div>
              <label htmlFor="addressLine2" className="block mb-2">
                Address Line 2
              </label>

              <input
                id="addressLine2"
                name="addressLine2"
                type="text"
                maxLength={200}
                value={shippingDetails.addressLine2}
                onChange={handleChange}
                className="w-full border rounded-md px-4 py-3"
                placeholder="Apartment, landmark (optional)"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="city" className="block mb-2">
                  City *
                </label>

                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  maxLength={100}
                  value={shippingDetails.city}
                  onChange={handleChange}
                  className="w-full border rounded-md px-4 py-3"
                  placeholder="City"
                />
              </div>

              <div>
                <label htmlFor="state" className="block mb-2">
                  State *
                </label>

                <input
                  id="state"
                  name="state"
                  type="text"
                  required
                  maxLength={100}
                  value={shippingDetails.state}
                  onChange={handleChange}
                  className="w-full border rounded-md px-4 py-3"
                  placeholder="State"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="postalCode" className="block mb-2">
                  Postal Code *
                </label>

                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={shippingDetails.postalCode}
                  onChange={handleChange}
                  className="w-full border rounded-md px-4 py-3"
                  placeholder="6-digit PIN code"
                />
              </div>

              <div>
                <label htmlFor="country" className="block mb-2">
                  Country *
                </label>

                <input
                  id="country"
                  name="country"
                  type="text"
                  required
                  value={shippingDetails.country}
                  onChange={handleChange}
                  className="w-full border rounded-md px-4 py-3"
                  placeholder="Country"
                />
              </div>
            </div>

            {/* Error Message */}
            {(formError || orderError || paymentError) && (
              <p className="text-red-600 text-sm">
                {formError || paymentError || orderError}
              </p>
            )}

            <button
              type="submit"
              disabled={actionLoading || paymentLoading}
              className="bg-black text-white px-8 py-3 rounded-md disabled:opacity-50"
            >
              {actionLoading
                ? "Creating Order..."
                : paymentLoading
                  ? "Opening Payment..."
                  : pendingOrderId
                    ? "Retry Payment"
                    : "Proceed to Payment"}
            </button>
          </form>
        </section>

        {/* Order Summary */}
        <aside className="border rounded-lg p-6 h-fit">
          <h2 className="text-xl font-bold mb-6">Order Summary</h2>

          {cart?.items?.length > 0 ? (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-4 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.product?.name}</p>

                    <p className="text-gray-500">Quantity: {item.quantity}</p>
                  </div>

                  <p className="font-medium whitespace-nowrap">
                    {formatPrice(item.lineTotal)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Your order has already been created.
            </p>
          )}

          <div className="border-t mt-6 pt-4 space-y-3">
            <div className="flex justify-between">
              <span>Total Items</span>
              <span>{cart?.totalItems || 0}</span>
            </div>

            <div className="flex justify-between font-bold text-lg">
              <span>Subtotal</span>
              <span>{formatPrice(cart?.subtotal || 0)}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Payment is processed in Razorpay Test Mode. No real money will be
            transferred.
          </p>

          <Link to="/cart" className="block text-center text-blue-600 mt-5">
            Back to Cart
          </Link>
        </aside>
      </div>
    </main>
  );
};

export default Checkout;
