import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useOrder } from "../context/OrderContext";

const FALLBACK_BADGE = "bg-stone-100 text-stone-700 ring-stone-200";

const statusStyles = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  CONFIRMED: "bg-sky-50 text-sky-800 ring-sky-200",
  PROCESSING: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  SHIPPED: "bg-violet-50 text-violet-800 ring-violet-200",
  DELIVERED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-800 ring-rose-200",
};

const paymentStyles = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  PAID: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  FAILED: "bg-rose-50 text-rose-800 ring-rose-200",
  REFUNDED: "bg-violet-50 text-violet-800 ring-violet-200",
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(amount));
};

const toLabel = (value) =>
  value ? value.charAt(0) + value.slice(1).toLowerCase() : "";

function Badge({ className, children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

function Stat({ label, children }) {
  return (
    <div>
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-stone-900">{children}</p>
    </div>
  );
}

const MyOrders = () => {
  const { orders, pagination, ordersLoading, error, fetchOrders } = useOrder();

  useEffect(() => {
    fetchOrders(1, 10).catch(() => {});
  }, [fetchOrders]);

  const handlePageChange = (page) => {
    fetchOrders(page, pagination.limit).catch(() => {});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Initial loading
  if (ordersLoading && orders.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#faf8f4] font-sans">
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <Loader2 size={16} className="animate-spin" />
          Loading your orders...
        </div>
      </div>
    );
  }

  // Error with nothing to show
  if (error && orders.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#faf8f4] px-4 font-sans">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm shadow-stone-200/60">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-700">
            <AlertCircle size={22} strokeWidth={1.75} />
          </span>
          <h2 className="mt-4 text-base font-semibold text-stone-900">
            Couldn't load your orders
          </h2>
          <p className="mt-1 text-sm text-stone-500">{error}</p>
          <button
            onClick={() => fetchOrders().catch(() => {})}
            className="mt-6 rounded-full bg-stone-900 px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#faf8f4] px-4 py-10 font-sans sm:py-14">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            My orders
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            View and manage your purchases.
          </p>
        </div>

        {/* Error while orders are already on screen */}
        {error && orders.length > 0 && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm shadow-stone-200/60">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-600">
              <Package size={24} strokeWidth={1.5} />
            </span>
            <h2 className="mt-4 text-base font-semibold text-stone-900">
              No orders yet
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Your purchases will appear here.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-stone-700"
            >
              Explore products
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <>
            <div
              className={`space-y-4 transition-opacity ${
                ordersLoading ? "opacity-60" : "opacity-100"
              }`}
            >
              {orders.map((order) => {
                const itemCount = (order.items || []).reduce(
                  (total, item) => total + item.quantity,
                  0
                );

                return (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-200/60"
                  >
                    {/* Header */}
                    <div className="flex flex-col justify-between gap-3 border-b border-stone-100 bg-[#faf8f4] px-5 py-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-800 text-stone-50">
                          <Package size={18} strokeWidth={1.5} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-stone-900">
                            Order #{order.id}
                          </p>
                          <p className="text-xs text-stone-500">
                            Placed on {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge
                          className={
                            statusStyles[order.status] || FALLBACK_BADGE
                          }
                        >
                          {toLabel(order.status)}
                        </Badge>
                        <Badge
                          className={
                            paymentStyles[order.paymentStatus] ||
                            FALLBACK_BADGE
                          }
                        >
                          Payment: {toLabel(order.paymentStatus)}
                        </Badge>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="grid grid-cols-3 gap-6">
                        <Stat label="Items">{itemCount}</Stat>
                        <Stat label="Total">
                          {formatCurrency(order.totalAmount)}
                        </Stat>
                        <Stat label="Order date">
                          {formatDate(order.createdAt)}
                        </Stat>
                      </div>

                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
                      >
                        View details
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  disabled={pagination.page <= 1 || ordersLoading}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-white px-4 py-2 text-[13px] font-medium text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>

                <span className="px-2 text-[13px] text-stone-500">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  disabled={
                    pagination.page >= pagination.totalPages || ordersLoading
                  }
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-white px-4 py-2 text-[13px] font-medium text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyOrders;