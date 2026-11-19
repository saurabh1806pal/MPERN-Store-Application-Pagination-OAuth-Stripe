import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Package,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

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

const formatCurrency = (amount, currency = "INR") => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
};

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

const StatusBadge = ({ status }) => {
  const style = statusStyles[status] || "bg-gray-100 text-gray-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${style}`}
    >
      {status || "UNKNOWN"}
    </span>
  );
};

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    totalOrders: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch orders from the backend
  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/orders", {
        params: {
          page,
          limit: pagination.limit,
          search: search.trim(),
          status: status || undefined,
          paymentStatus: paymentStatus || undefined,
          sortBy,
          order: sortOrder,
        },
      });

      const data = response.data;

      setOrders(data.orders || []);
      setPagination(
        data.pagination || {
          currentPage: page,
          limit: pagination.limit,
          totalOrders: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      );
    } catch (err) {
      console.error("Fetch admin orders error:", err);

      setOrders([]);
      setError(
        err.response?.data?.message ||
          "Unable to fetch orders. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Reload whenever filters or sorting change

  useEffect(() => {
    let ignore = false;

    const loadOrders = async () => {
      try {
        setError("");

        const response = await api.get("/admin/orders", {
          params: {
            page: 1,
            limit: pagination.limit,
            search: search.trim(),
            status: status || undefined,
            paymentStatus: paymentStatus || undefined,
            sortBy,
            order: sortOrder,
          },
        });

        if (ignore) return;

        const data = response.data;

        setOrders(data.orders || []);
        setPagination(
          data.pagination || {
            currentPage: 1,
            limit: pagination.limit,
            totalOrders: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        );
      } catch (err) {
        if (ignore) return;

        console.error("Fetch admin orders error:", err);

        setOrders([]);
        setError(
          err.response?.data?.message ||
            "Unable to fetch orders. Please try again.",
        );
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      ignore = true;
    };
  }, [search, status, paymentStatus, sortBy, sortOrder, pagination.limit]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;

    fetchOrders(newPage);
  };

  const handleLimitChange = (event) => {
    const newLimit = Number(event.target.value);

    setPagination((previous) => ({
      ...previous,
      limit: newLimit,
      currentPage: 1,
    }));
  };

  const toggleSortOrder = () => {
    setSortOrder((previous) => (previous === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Order Management
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View and manage all customer orders.
            </p>
          </div>

          <button
            onClick={() => fetchOrders(pagination.currentPage)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Order Count */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-50 p-3">
              <Package className="text-blue-600" size={24} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Total Orders</p>

              <p className="text-2xl font-bold text-gray-900">
                {pagination.totalOrders}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order ID, customer, email or phone..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Order Status */}
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All Order Statuses</option>

              {ORDER_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {/* Payment Status */}
            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All Payment Statuses</option>

              {PAYMENT_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
            <span className="text-sm font-medium text-gray-600">Sort by:</span>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="createdAt">Order Date</option>
              <option value="totalAmount">Total Amount</option>
              <option value="status">Order Status</option>
              <option value="paymentStatus">Payment Status</option>
              <option value="id">Order ID</option>
            </select>

            <button
              onClick={toggleSortOrder}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
            >
              <ArrowUpDown size={15} />
              {sortOrder === "asc" ? "Ascending" : "Descending"}
            </button>

            <button
              onClick={() => {
                setSearch("");
                setStatus("");
                setPaymentStatus("");
                setSortBy("createdAt");
                setSortOrder("desc");
              }}
              className="ml-auto text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Orders Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-left">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Order
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Order Status
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Payment
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-16 text-center text-sm text-gray-500"
                    >
                      <RefreshCw
                        size={22}
                        className="mx-auto mb-3 animate-spin text-blue-600"
                      />
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-16 text-center">
                      <Package
                        size={32}
                        className="mx-auto mb-3 text-gray-300"
                      />

                      <p className="font-medium text-gray-700">
                        No orders found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="transition hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-900">
                          #{order.id}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">
                          {order.fullName || order.user?.name || "N/A"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {order.user?.email || "No email available"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-gray-900">
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
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </Link>
                    </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col justify-between gap-4 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span>
                Total: <strong>{pagination.totalOrders}</strong> orders
              </span>

              <select
                value={pagination.limit}
                onChange={handleLimitChange}
                className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Page {pagination.currentPage} of{" "}
                {Math.max(pagination.totalPages, 1)}
              </span>

              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={loading || !pagination.hasPreviousPage}
                className="rounded-lg border border-gray-300 p-2 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={loading || !pagination.hasNextPage}
                className="rounded-lg border border-gray-300 p-2 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOrders;
