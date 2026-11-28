
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Calendar,
  RefreshCw,
  AlertCircle,
  Truck,
} from "lucide-react";

import api from "../../services/api";

const statusStyles = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-orange-100 text-orange-800",
};

const orderStatusTransitions = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "DELIVERED",
};

const formatCurrency = (amount, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
      statusStyles[status] || "bg-gray-100 text-gray-700"
    }`}
  >
    {status || "UNKNOWN"}
  </span>
);

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-1 border-b border-gray-100 py-3 last:border-0 sm:flex-row sm:justify-between">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="break-all text-sm font-medium text-gray-900 sm:text-right">
      {value || "N/A"}
    </span>
  </div>
);

function AdminOrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);
  const [orderStatusMessage, setOrderStatusMessage] = useState("");

  const fetchOrder = async () => {
  try {
    const response = await api.get(`/admin/orders/${id}`);
    setOrder(response.data.order);
    setError("");
  } catch (err) {
    console.error("Fetch admin order details error:", err);
    setOrder(null);
    setError(
      err.response?.data?.message ||
        "Unable to retrieve order details."
    );
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  let ignore = false;

  const loadOrder = async () => {
    try {
      const response = await api.get(`/admin/orders/${id}`);

      if (!ignore) {
        setOrder(response.data.order);
        setError("");
      }
    } catch (err) {
      if (!ignore) {
        console.error("Fetch admin order details error:", err);
        setOrder(null);
        setError(
          err.response?.data?.message ||
            "Unable to retrieve order details."
        );
      }
    } finally {
      if (!ignore) {
        setLoading(false);
      }
    }
  };

  loadOrder();

  return () => {
    ignore = true;
  };
}, [id]);

  const handleOrderStatusUpdate = async (newStatus) => {
    const confirmed = window.confirm(
      `Are you sure you want to move this order to ${newStatus}?`
    );

    if (!confirmed) return;

    try {
      setUpdatingOrderStatus(true);
      setOrderStatusMessage("");

      const response = await api.patch(`/admin/orders/${id}/status`, {
        status: newStatus,
      });

      setOrder(response.data.order);
      setOrderStatusMessage(
        response.data.message || "Order status updated successfully."
      );
    } catch (err) {
      console.error("Update order status error:", err);
      setOrderStatusMessage(
        err.response?.data?.message ||
          "Unable to update order status. Please try again."
      );
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            size={30}
            className="mx-auto mb-3 animate-spin text-blue-600"
          />
          <p className="text-sm text-gray-500">
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-white p-8 text-center">
          <AlertCircle
            size={32}
            className="mx-auto mb-3 text-red-500"
          />

          <h2 className="font-semibold text-gray-900">
            Unable to load order
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {error || "Order not found."}
          </p>

          <div className="mt-5 flex justify-center gap-3">
            <button
  onClick={() => {
    setLoading(true);
    setError("");
    fetchOrder();
  }}
>
  Try Again
</button>

            <Link
              to="/admin/orders"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const customerName = order.fullName || order.user?.name || "N/A";
  const items = order.items || [];
  const nextOrderStatus = orderStatusTransitions[order.status];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin/orders"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft size={17} />
            Back to Orders
          </Link>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Order #{order.id}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge status={order.status} />
              <StatusBadge status={order.paymentStatus} />
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Products */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
                <Package className="text-blue-600" size={20} />
                <h2 className="font-semibold text-gray-900">
                  Ordered Products
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-137.5 text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-500">
                        Product
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-500">
                        Price
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-500">
                        Quantity
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-500">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">
                            {item.productName}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Product ID: {item.productId}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {formatCurrency(
                            item.productPrice,
                            order.currency
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {item.quantity}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrency(item.lineTotal, order.currency)}
                        </td>
                      </tr>
                    ))}

                    {items.length === 0 && (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-5 py-10 text-center text-sm text-gray-500"
                        >
                          No products found in this order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Shipping Address */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <MapPin className="text-blue-600" size={20} />
                <h2 className="font-semibold text-gray-900">
                  Shipping Address
                </h2>
              </div>

              <div className="space-y-1">
                <InfoRow label="Full Name" value={order.fullName} />
                <InfoRow label="Phone" value={order.phone} />
                <InfoRow label="Address Line 1" value={order.addressLine1} />
                <InfoRow label="Address Line 2" value={order.addressLine2} />
                <InfoRow label="City" value={order.city} />
                <InfoRow label="State" value={order.state} />
                <InfoRow label="Postal Code" value={order.postalCode} />
                <InfoRow label="Country" value={order.country} />
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Customer */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <User className="text-blue-600" size={20} />
                <h2 className="font-semibold text-gray-900">
                  Customer Details
                </h2>
              </div>

              <div className="space-y-1">
                <InfoRow label="Name" value={customerName} />
                <InfoRow label="Email" value={order.user?.email} />
                <InfoRow label="Phone" value={order.phone} />
                <InfoRow label="Customer ID" value={order.user?.id} />
              </div>
            </section>

            {/* Order Status Management */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <Truck className="text-blue-600" size={20} />
                <h2 className="font-semibold text-gray-900">
                  Manage Order Status
                </h2>
              </div>

              <div className="mb-4">
                <p className="mb-2 text-sm text-gray-500">
                  Current Status
                </p>
                <StatusBadge status={order.status} />
              </div>

              {nextOrderStatus ? (
                <button
                  type="button"
                  onClick={() => handleOrderStatusUpdate(nextOrderStatus)}
                  disabled={updatingOrderStatus}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingOrderStatus
                    ? "Updating..."
                    : `Move to ${nextOrderStatus}`}
                </button>
              ) : (
                <p className="rounded-lg bg-gray-50 p-3 text-center text-sm text-gray-500">
                  This order has reached a final status.
                </p>
              )}

              {orderStatusMessage && (
                <p
                  role="status"
                  className="mt-3 text-sm text-gray-600"
                >
                  {orderStatusMessage}
                </p>
              )}
            </section>

            {/* Payment Status - Read Only */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <CreditCard className="text-blue-600" size={20} />
                <h2 className="font-semibold text-gray-900">
                  Payment Status
                </h2>
              </div>

              <div className="mb-4">
                <p className="mb-2 text-sm text-gray-500">
                  Current Status
                </p>
                <StatusBadge status={order.paymentStatus} />
              </div>

              <p className="rounded-lg bg-gray-50 p-3 text-sm leading-5 text-gray-600">
                Payment status is updated automatically through verified
                Razorpay payment and refund events. Administrators cannot
                manually change payment status.
              </p>
            </section>

            {/* Order Summary */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <CreditCard className="text-blue-600" size={20} />
                <h2 className="font-semibold text-gray-900">
                  Order Summary
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(order.subtotal, order.currency)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping Fee</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(order.shippingFee, order.currency)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(order.taxAmount, order.currency)}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">
                      Total
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(order.totalAmount, order.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Payment Details */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <CreditCard className="text-blue-600" size={20} />
                <h2 className="font-semibold text-gray-900">
                  Payment Details
                </h2>
              </div>

              <div className="space-y-1">
                <InfoRow
                  label="Payment Status"
                  value={order.paymentStatus}
                />
                <InfoRow label="Currency" value={order.currency} />
                <InfoRow
                  label="Razorpay Order ID"
                  value={order.razorpayOrderId}
                />
                <InfoRow
                  label="Razorpay Payment ID"
                  value={order.razorpayPaymentId}
                />
              </div>
            </section>

            {/* Timeline */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <Calendar className="text-blue-600" size={20} />
                <h2 className="font-semibold text-gray-900">
                  Order Timeline
                </h2>
              </div>

              <div className="space-y-1">
                <InfoRow
                  label="Created At"
                  value={formatDate(order.createdAt)}
                />
                <InfoRow
                  label="Last Updated"
                  value={formatDate(order.updatedAt)}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOrderDetails;
