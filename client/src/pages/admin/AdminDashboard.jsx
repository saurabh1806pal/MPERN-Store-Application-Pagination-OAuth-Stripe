
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingBag,
  Users,
  XCircle,
} from "lucide-react";

import api from "../../services/api";

const PERIOD_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "This Month", value: "thisMonth" },
  { label: "All Time", value: "all" },
];

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const PAYMENT_STATUSES = [
  "PAID",
  "PENDING",
  "FAILED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
];

const REFUND_STATUSES = ["PROCESSED", "PENDING", "FAILED"];

const formatCurrency = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatStatus = (status = "") =>
  status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getStatusStyle = (status) => {
  const styles = {
    PAID: "bg-green-100 text-green-700",
    DELIVERED: "bg-green-100 text-green-700",
    PROCESSED: "bg-green-100 text-green-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    SHIPPED: "bg-indigo-100 text-indigo-700",
    PROCESSING: "bg-purple-100 text-purple-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    PARTIALLY_REFUNDED: "bg-orange-100 text-orange-700",
    REFUNDED: "bg-orange-100 text-orange-700",
    FAILED: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-600",
  };

  return styles[status] || "bg-gray-100 text-gray-600";
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
      status
    )}`}
  >
    {formatStatus(status)}
  </span>
);

const SectionCard = ({ title, subtitle, action, children }) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const MetricCard = ({ title, value, icon: Icon, description }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="mt-3 text-2xl font-bold text-gray-900">
          {value}
        </h3>
        <p className="mt-2 text-xs text-gray-500">{description}</p>
      </div>

      <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
        <Icon size={21} />
      </div>
    </div>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
    {message}
  </div>
);

const AnalyticsChart = ({ title, data, dataKey, formatter }) => {
  const maxValue = Math.max(
    ...data.map((item) => Number(item[dataKey] || 0)),
    1
  );

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        {title}
      </h3>

      {data.length === 0 ? (
        <EmptyState message="No analytics data available for this period." />
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-full items-end gap-3">
            {data.map((item) => {
              const value = Number(item[dataKey] || 0);
              const height = Math.max((value / maxValue) * 150, 4);

              return (
                <div
                  key={item.date}
                  className="flex min-w-[42px] flex-1 flex-col items-center"
                >
                  <span className="mb-2 max-w-full truncate text-[10px] text-gray-500">
                    {formatter(value)}
                  </span>

                  <div
                    className="flex h-[150px] w-full items-end justify-center"
                    title={`${item.label}: ${formatter(value)}`}
                  >
                    <div
                      className="w-full max-w-10 rounded-t-md bg-blue-500 transition-all"
                      style={{ height: `${height}px` }}
                    />
                  </div>

                  <span className="mt-2 whitespace-nowrap text-[10px] text-gray-500">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const BreakdownList = ({ items, statusKey = "status", valueKey = "count" }) => {
  const maxValue = Math.max(
    ...items.map((item) => Number(item[valueKey] || 0)),
    1
  );

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const value = Number(item[valueKey] || 0);
        const status = item[statusKey];

        return (
          <div key={status}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <StatusBadge status={status} />
              <span className="text-sm font-semibold text-gray-700">
                {value}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{
                  width: `${(value / maxValue) * 100}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

function AdminDashboard() {
  const [period, setPeriod] = useState("30d");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/dashboard", {
        params: { period },
      });

      setDashboard(response.data.dashboard);
    } catch (err) {
      console.error("Admin dashboard error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setMessage("");
      setError("");

      const response = await api.post("/admin/payments/reconcile");

      setMessage(
        response.data.message ||
          "Payment and refund reconciliation completed."
      );

      await fetchDashboard();
    } catch (err) {
      console.error("Payment reconciliation error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to synchronize payments and refunds."
      );
    } finally {
      setSyncing(false);
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto animate-spin text-blue-600" size={30} />
          <p className="mt-3 text-sm text-gray-500">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const {
    overview,
    salesAnalytics,
    orderOverview,
    recentOrders,
    inventory,
    payments,
    refunds,
  } = dashboard;

  const totalRefundAmount = refunds.overview
    .filter((item) => item.status === "PROCESSED")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Admin</span>
              <ChevronRight size={14} />
              <span className="text-gray-900">Dashboard</span>
            </div>

            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Dashboard Overview
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Monitor your store performance, orders, inventory and payments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <CalendarDays size={17} className="text-gray-500" />

              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 outline-none"
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(overview.totalRevenue)}
            icon={DollarSign}
            description={`${overview.paidOrders} paid orders in selected period`}
          />

          <MetricCard
            title="Total Orders"
            value={overview.totalOrders.toLocaleString("en-IN")}
            icon={ShoppingBag}
            description="Orders in selected period"
          />

          <MetricCard
            title="Total Customers"
            value={overview.totalCustomers.toLocaleString("en-IN")}
            icon={Users}
            description="Lifetime registered customers"
          />

          <MetricCard
            title="Total Products"
            value={overview.totalProducts.toLocaleString("en-IN")}
            icon={Package}
            description="Products currently in catalogue"
          />
        </div>

        {/* Sales Analytics */}
        <SectionCard
          title="Sales Analytics"
          subtitle="Revenue and order activity over the selected period"
        >
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-sm text-blue-700">Average Order Value</p>
              <p className="mt-2 text-xl font-bold text-blue-900">
                {formatCurrency(overview.averageOrderValue)}
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-sm text-green-700">Paid Orders</p>
              <p className="mt-2 text-xl font-bold text-green-900">
                {overview.paidOrders}
              </p>
            </div>

            <div className="rounded-xl bg-purple-50 p-4">
              <p className="text-sm text-purple-700">Total Orders</p>
              <p className="mt-2 text-xl font-bold text-purple-900">
                {overview.totalOrders}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <AnalyticsChart
              title="Revenue Over Time"
              data={salesAnalytics}
              dataKey="revenue"
              formatter={(value) => formatCurrency(value)}
            />

            <AnalyticsChart
              title="Orders Over Time"
              data={salesAnalytics}
              dataKey="orders"
              formatter={(value) => `${value} orders`}
            />
          </div>
        </SectionCard>

        {/* Order Overview */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-1">
            <SectionCard
              title="Order Overview"
              subtitle="Orders grouped by current status"
              action={
                <Link
                  to="/admin/orders"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View All
                </Link>
              }
            >
              <BreakdownList items={orderOverview} />
            </SectionCard>
          </div>

          <div className="xl:col-span-2">
            <SectionCard
              title="Recent Orders"
              subtitle="Latest orders in the selected period"
              action={
                <Link
                  to="/admin/orders"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Manage Orders
                </Link>
              }
            >
              {recentOrders.length === 0 ? (
                <EmptyState message="No orders found for this period." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
                        <th className="pb-3 pr-4 font-semibold">Order</th>
                        <th className="pb-3 pr-4 font-semibold">Customer</th>
                        <th className="pb-3 pr-4 font-semibold">Amount</th>
                        <th className="pb-3 pr-4 font-semibold">Payment</th>
                        <th className="pb-3 pr-4 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="py-4 pr-4 font-semibold text-gray-900">
                            #{order.id}
                            <p className="mt-1 text-xs font-normal text-gray-400">
                              {formatDate(order.createdAt)}
                            </p>
                          </td>

                          <td className="py-4 pr-4">
                            <p className="font-medium text-gray-800">
                              {order.user?.name ||
                                order.fullName ||
                                "Customer"}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              {order.user?.email || ""}
                            </p>
                          </td>

                          <td className="py-4 pr-4 font-semibold text-gray-800">
                            {formatCurrency(
                              order.totalAmount,
                              order.currency
                            )}
                          </td>

                          <td className="py-4 pr-4">
                            <StatusBadge status={order.paymentStatus} />
                          </td>

                          <td className="py-4 pr-4">
                            <StatusBadge status={order.status} />
                          </td>

                          <td className="py-4">
                            <Link
                              to={`/admin/orders/${order.id}`}
                              className="font-semibold text-blue-600 hover:underline"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {/* Inventory */}
        <SectionCard
          title="Inventory Overview"
          subtitle="Current product stock levels"
          action={
            <Link
              to="/admin/inventory"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Manage Inventory <ChevronRight size={16} />
            </Link>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 p-5">
              <div>
                <p className="text-sm font-medium text-green-700">
                  In Stock
                </p>
                <p className="mt-2 text-2xl font-bold text-green-900">
                  {inventory.inStock}
                </p>
              </div>
              <CheckCircle2 size={28} className="text-green-600" />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-yellow-100 bg-yellow-50 p-5">
              <div>
                <p className="text-sm font-medium text-yellow-700">
                  Low Stock
                </p>
                <p className="mt-2 text-2xl font-bold text-yellow-900">
                  {inventory.lowStock}
                </p>
                <p className="mt-1 text-xs text-yellow-700">
                  1–{inventory.lowStockThreshold} units
                </p>
              </div>
              <AlertTriangle size={28} className="text-yellow-600" />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-5">
              <div>
                <p className="text-sm font-medium text-red-700">
                  Out of Stock
                </p>
                <p className="mt-2 text-2xl font-bold text-red-900">
                  {inventory.outOfStock}
                </p>
              </div>
              <XCircle size={28} className="text-red-600" />
            </div>
          </div>
        </SectionCard>

        {/* Payments and Refunds */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SectionCard
            title="Payment Overview"
            subtitle="Order payment status breakdown"
            action={
              <button
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={14}
                  className={syncing ? "animate-spin" : ""}
                />
                {syncing ? "Syncing..." : "Sync Payments & Refunds"}
              </button>
            }
          >
            <div className="mb-5 rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Revenue from paid orders
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatCurrency(overview.totalRevenue)}
              </p>
            </div>

            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.status}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-0"
                >
                  <div>
                    <StatusBadge status={payment.status} />
                    <p className="mt-1 text-xs text-gray-500">
                      {payment.count} orders
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-gray-800">
                    {formatCurrency(payment.orderAmount)}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Refund Overview"
            subtitle="Refund records and recent refund activity"
          >
            <div className="mb-5 rounded-xl bg-orange-50 p-4">
              <p className="text-sm text-orange-700">
                Successfully processed refunds
              </p>
              <p className="mt-2 text-2xl font-bold text-orange-900">
                {formatCurrency(totalRefundAmount)}
              </p>
            </div>

            <div className="mb-6 space-y-4">
              {refunds.overview.map((refund) => (
                <div
                  key={refund.status}
                  className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-0"
                >
                  <div>
                    <StatusBadge status={refund.status} />
                    <p className="mt-1 text-xs text-gray-500">
                      {refund.count} refunds
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-gray-800">
                    {formatCurrency(refund.amount)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-800">
                Recent Refund Activity
              </h3>

              {refunds.recent.length === 0 ? (
                <EmptyState message="No refund activity found for this period." />
              ) : (
                <div className="space-y-4">
                  {refunds.recent.map((refund) => (
                    <div
                      key={refund.id}
                      className="flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          Order #{refund.orderId}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(refund.createdAt)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800">
                          {formatCurrency(refund.amount, refund.currency)}
                        </p>
                        <div className="mt-1">
                          <StatusBadge status={refund.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Footer note */}
        <div className="flex items-center gap-2 pb-4 text-xs text-gray-400">
          <Activity size={14} />
          Dashboard data is retrieved from PostgreSQL and MongoDB.
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
