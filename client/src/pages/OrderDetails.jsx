
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useOrder } from "../context/OrderContext";

const statusStyles = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const paymentStyles = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-purple-100 text-purple-800",
};

const statusSteps = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(amount));
};

const formatDate = (date) => {
  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const OrderDetails = () => {
  const { id } = useParams();

  const {
    selectedOrder,
    orderLoading,
    actionLoading,
    error,
    fetchOrderById,
    cancelOrder,
  } = useOrder();

  useEffect(() => {
    fetchOrderById(id).catch(() => {});
  }, [id, fetchOrderById]);

  const handleCancelOrder = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    try {
      await cancelOrder(id);
    } catch {
      // Error is already stored in OrderContext
    }
  };

  if (orderLoading) {
    return (
      <div className="p-8 text-center">
        Loading order details...
      </div>
    );
  }

  if (error && !selectedOrder) {
    return (
      <div className="mx-auto max-w-4xl p-8 text-center">
        <p className="text-red-600">{error}</p>

        <Link
          to="/orders"
          className="mt-4 inline-block text-blue-600"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  if (!selectedOrder) {
    return (
      <div className="p-8 text-center">
        Order not found.
      </div>
    );
  }

  const order = selectedOrder;

  const itemCount = order.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const currentStep = statusSteps.indexOf(order.status);

  const canCancel =
    ["PENDING", "CONFIRMED"].includes(order.status) &&
    ["PENDING", "FAILED"].includes(order.paymentStatus);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <Link
          to="/orders"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to My Orders
        </Link>

        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row">
          <div>
            <h1 className="text-3xl font-bold">
              Order #{order.id}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>

          <span
            className={`h-fit w-fit rounded-full px-4 py-2 text-sm font-semibold ${
              statusStyles[order.status] ||
              "bg-gray-100 text-gray-800"
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      {/* Order Tracking */}
      <section className="mb-8 rounded-lg border p-6">
        <h2 className="mb-6 text-xl font-semibold">
          Order Tracking
        </h2>

        {order.status === "CANCELLED" ? (
          <div className="rounded bg-red-50 p-4 text-red-700">
            This order has been cancelled.
          </div>
        ) : (
          <div className="space-y-5">
            {statusSteps.map((step, index) => {
              const completed = currentStep >= index;

              return (
                <div key={step} className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                      completed
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {completed ? "✓" : index + 1}
                  </div>

                  <div>
                    <p
                      className={`font-medium ${
                        completed
                          ? "text-green-700"
                          : "text-gray-500"
                      }`}
                    >
                      {step}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Products */}
      <section className="mb-8 rounded-lg border p-6">
        <h2 className="mb-5 text-xl font-semibold">
          Purchased Products ({itemCount})
        </h2>

        <div className="space-y-5">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between gap-2 border-b pb-4 sm:flex-row"
            >
              <div>
                <h3 className="font-medium">
                  {item.productName}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {formatCurrency(item.productPrice)} × {item.quantity}
                </p>
              </div>

              <p className="font-semibold">
                {formatCurrency(item.lineTotal)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Price Summary */}
      <section className="mb-8 rounded-lg border p-6">
        <h2 className="mb-5 text-xl font-semibold">
          Payment Summary
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            <span>{formatCurrency(order.shippingFee)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Tax</span>
            <span>{formatCurrency(order.taxAmount)}</span>
          </div>

          <div className="flex justify-between border-t pt-3 text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        <div className="mt-5">
          <span className="text-sm text-gray-500">
            Payment Status
          </span>

          <div className="mt-2">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                paymentStyles[order.paymentStatus] ||
                "bg-gray-100 text-gray-800"
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>
        </div>
      </section>

      {/* Shipping Address */}
      <section className="mb-8 rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Shipping Address
        </h2>

        <div className="space-y-1 text-gray-700">
          <p className="font-semibold">{order.fullName}</p>
          <p>{order.phone}</p>
          <p>{order.addressLine1}</p>

          {order.addressLine2 && (
            <p>{order.addressLine2}</p>
          )}

          <p>
            {order.city}, {order.state} - {order.postalCode}
          </p>

          <p>{order.country}</p>
        </div>
      </section>

      {/* Cancel Order */}
      {canCancel && (
        <section className="rounded-lg border border-red-200 p-6">
          <h2 className="font-semibold">
            Cancel this order
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            You can cancel this order before it enters processing.
          </p>

          <button
            onClick={handleCancelOrder}
            disabled={actionLoading}
            className="mt-4 rounded bg-red-600 px-5 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {actionLoading ? "Cancelling..." : "Cancel Order"}
          </button>
        </section>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

    </div>
  );
};

export default OrderDetails;
