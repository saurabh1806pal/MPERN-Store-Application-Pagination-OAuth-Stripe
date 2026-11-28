import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  UserRound,
  Mail,
  ShieldCheck,
  CalendarDays,
  ShoppingBag,
  IndianRupee,
  CreditCard,
  Package,
  ExternalLink,
  Power,
  X,
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
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
      statusStyles[status] || "bg-gray-100 text-gray-700"
    }`}
  >
    {status || "UNKNOWN"}
  </span>
);

const StatCard = ({ title, value, description, icon: Icon }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        {description && (
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        )}
      </div>
      <div className="rounded-lg bg-blue-50 p-3">
        <Icon className="text-blue-600" size={22} />
      </div>
    </div>
  </div>
);

const BreakdownList = ({ title, items }) => (
  <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <h2 className="mb-4 font-semibold text-gray-900">{title}</h2>
    {items?.length ? (
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.status}
            className="flex items-center justify-between gap-3"
          >
            <StatusBadge status={item.status} />
            <span className="text-sm font-semibold text-gray-900">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-gray-500">No records available.</p>
    )}
  </section>
);

function AdminCustomersDetails() {
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedForId, setLoadedForId] = useState(null);
  const [error, setError] = useState("");
  const [showStatusPrompt, setShowStatusPrompt] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const fetchCustomer = useCallback(async () => {
  try {
    const response = await api.get(`/admin/users/${id}`);

    setCustomer(response.data.customer);
    setStatistics(response.data.statistics);
    setError("");
  } catch (err) {
    console.error("Fetch customer details error:", err);
    setCustomer(null);
    setStatistics(null);
    setError(
      err.response?.data?.message ||
        "Unable to retrieve customer details. Please try again."
    );
  } finally {
    setLoadedForId(id);
    setLoading(false);
  }
}, [id]);

useEffect(() => {
  let ignore = false;

  const loadCustomer = async () => {
    try {
      const response = await api.get(`/admin/users/${id}`);

      if (!ignore) {
        setCustomer(response.data.customer);
        setStatistics(response.data.statistics);
        setError("");
      }
    } catch (err) {
      if (!ignore) {
        console.error("Fetch customer details error:", err);
        setCustomer(null);
        setStatistics(null);
        setError(
          err.response?.data?.message ||
            "Unable to retrieve customer details. Please try again."
        );
      }
    } finally {
      if (!ignore) {
        setLoadedForId(id);
        setLoading(false);
      }
    }
  };

  loadCustomer();

  return () => {
    ignore = true;
  };
}, [id]);

const isLoading = loading || loadedForId !== id;

const handleRefresh = () => {
  setLoading(true);
  setError("");
  fetchCustomer();
};

  const handleStatusChange = async () => {
    if (!customer) return;

    const nextStatus = !customer.isActive;

    try {
      setUpdatingStatus(true);
      setStatusError("");
      setStatusMessage("");

      const response = await api.patch(`/admin/users/${id}/status`, {
        isActive: nextStatus,
      });

      setCustomer((previous) => ({
        ...previous,
        ...response.data.customer,
      }));
      setStatusMessage(
        response.data.message ||
          `Customer ${nextStatus ? "activated" : "deactivated"} successfully.`
      );
      setShowStatusPrompt(false);
    } catch (err) {
      console.error("Update customer status error:", err);
      setStatusError(
        err.response?.data?.message ||
          "Unable to update customer status. Please try again."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            size={30}
            className="mx-auto mb-3 animate-spin text-blue-600"
          />
          <p className="text-sm text-gray-500">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-white p-8 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-red-500" />
          <h2 className="font-semibold text-gray-900">
            Unable to load customer
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {error || "Customer not found."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try Again
            </button>
            <Link
              to="/admin/customers"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Customers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const recentOrders = customer.orders || [];
  const totalOrders = statistics?.totalOrders ?? 0;
  const paidOrders = statistics?.paidOrders ?? 0;
  const totalSpent = statistics?.totalSpent ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      {showStatusPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4 py-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !updatingStatus) {
              setShowStatusPrompt(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-status-dialog-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full ${
                  customer.isActive ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                }`}
              >
                <Power size={21} />
              </div>
              <button
                type="button"
                onClick={() => setShowStatusPrompt(false)}
                disabled={updatingStatus}
                aria-label="Close confirmation"
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <h2
              id="customer-status-dialog-title"
              className="text-lg font-bold text-gray-900"
            >
              {customer.isActive ? "Deactivate this customer?" : "Activate this customer?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {customer.isActive
                ? `This will prevent ${customer.name || customer.email} from signing in and accessing protected store features. Their profile and order history will remain intact.`
                : `This will restore ${customer.name || customer.email}'s ability to sign in and access the store.`}
            </p>

            {statusError && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {statusError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowStatusPrompt(false)}
                disabled={updatingStatus}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusChange}
                disabled={updatingStatus}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  customer.isActive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {updatingStatus && <RefreshCw size={15} className="animate-spin" />}
                {updatingStatus
                  ? "Updating..."
                  : customer.isActive
                    ? "Yes, Deactivate"
                    : "Yes, Activate"}
              </button>
            </div>
          </section>
        </div>
      )}

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin/customers"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft size={17} />
            Back to Customers
          </Link>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Customer Profile
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Customer ID: {customer.id}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Customer Overview */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <UserRound size={30} className="text-blue-600" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="wrap-break-word text-xl font-bold text-gray-900">
                {customer.name || "Unnamed Customer"}
              </h2>
              <p className="mt-1 flex items-center gap-2 break-all text-sm text-gray-500">
                <Mail size={15} className="shrink-0" />
                {customer.email}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                  {customer.role}
                </span>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                    customer.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      customer.isActive ? "bg-green-600" : "bg-red-600"
                    }`}
                  />
                  {customer.isActive ? "Active Account" : "Inactive Account"}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    customer.emailVerified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  <ShieldCheck size={13} />
                  {customer.emailVerified
                    ? "Email Verified"
                    : "Email Not Verified"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Customer account access
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {customer.isActive
                  ? "This customer can sign in and access the store."
                  : "This customer is blocked from signing in and accessing protected APIs."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setStatusError("");
                setStatusMessage("");
                setShowStatusPrompt(true);
              }}
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                customer.isActive
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              <Power size={16} />
              {customer.isActive ? "Deactivate Account" : "Activate Account"}
            </button>
          </div>

          {statusMessage && (
            <div
              role="status"
              className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
            >
              {statusMessage}
            </div>
          )}

          {statusError && !showStatusPrompt && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {statusError}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <CalendarDays size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Registered On</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(customer.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(customer.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Total Orders"
            value={totalOrders}
            description="All orders placed by this customer"
            icon={ShoppingBag}
          />
          <StatCard
            title="Paid Orders"
            value={paidOrders}
            description="Orders with successful payment"
            icon={CreditCard}
          />
          <StatCard
            title="Total Spent"
            value={formatCurrency(totalSpent)}
            description="Sum of orders with PAID status"
            icon={IndianRupee}
          />
        </div>

        {/* Order and Payment Breakdowns */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BreakdownList
            title="Order Status Breakdown"
            items={statistics?.orderStatusBreakdown}
          />
          <BreakdownList
            title="Payment Status Breakdown"
            items={statistics?.paymentStatusBreakdown}
          />
        </div>

        {/* Recent Orders */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <Package className="text-blue-600" size={20} />
              <div>
                <h2 className="font-semibold text-gray-900">Recent Orders</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Showing the five most recent orders
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Order
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Items
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Order Status
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Payment
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-14 text-center">
                      <ShoppingBag
                        size={30}
                        className="mx-auto mb-3 text-gray-300"
                      />
                      <p className="font-medium text-gray-700">
                        No orders found
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        This customer has not placed any orders yet.
                      </p>
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="transition hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-900">
                          #{order.id}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {order._count?.items ?? "N/A"}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount, order.currency)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.paymentStatus} />
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          View Order
                          <ExternalLink size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminCustomersDetails;
