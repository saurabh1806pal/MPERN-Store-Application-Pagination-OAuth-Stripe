
import { useEffect } from "react";
import { Link } from "react-router-dom";
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

const MyOrders = () => {
  const {
    orders,
    pagination,
    ordersLoading,
    error,
    fetchOrders,
  } = useOrder();

  useEffect(() => {
    fetchOrders(1, 10).catch(() => {});
  }, [fetchOrders]);

  const handlePageChange = (page) => {
    fetchOrders(page, pagination.limit).catch(() => {});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (ordersLoading && orders.length === 0) {
    return (
      <div className="p-8 text-center">
        Loading your orders...
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => fetchOrders().catch(() => {})}
          className="mt-4 rounded bg-black px-4 py-2 text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="mt-2 text-gray-600">
          View and manage your purchases.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <h2 className="text-xl font-semibold">
            No orders yet
          </h2>

          <p className="mt-2 text-gray-500">
            Your purchases will appear here.
          </p>

          <Link
            to="/products"
            className="mt-5 inline-block rounded bg-black px-5 py-2 text-white"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-5">
            {orders.map((order) => {
              const itemCount = order.items.reduce(
                (total, item) => total + item.quantity,
                0
              );

              return (
                <div
                  key={order.id}
                  className="rounded-lg border p-5 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div>
                      <p className="font-semibold">
                        Order #{order.id}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          statusStyles[order.status] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          paymentStyles[order.paymentStatus] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        Payment: {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="my-4 grid grid-cols-2 gap-4 border-y py-4 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-gray-500">
                        Items
                      </p>
                      <p className="font-semibold">
                        {itemCount}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Total
                      </p>
                      <p className="font-semibold">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-sm text-gray-500">
                        Order Date
                      </p>
                      <p className="font-semibold">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      to={`/orders/${order.id}`}
                      className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                disabled={pagination.page <= 1 || ordersLoading}
                onClick={() =>
                  handlePageChange(pagination.page - 1)
                }
                className="rounded border px-4 py-2 disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                disabled={
                  pagination.page >= pagination.totalPages ||
                  ordersLoading
                }
                onClick={() =>
                  handlePageChange(pagination.page + 1)
                }
                className="rounded border px-4 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyOrders;
