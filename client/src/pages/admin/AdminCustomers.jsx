import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Users,
  AlertCircle,
  Eye,
  Mail,
  CalendarDays,
} from "lucide-react";

import api from "../../services/api";

const formatDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const VerificationBadge = ({ verified }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
      verified
        ? "bg-green-100 text-green-800"
        : "bg-yellow-100 text-yellow-800"
    }`}
  >
    {verified ? "Verified" : "Not verified"}
  </span>
);

const AccountStatusBadge = ({ isActive }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
      isActive
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800"
    }`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        isActive ? "bg-green-600" : "bg-red-600"
      }`}
    />
    {isActive ? "Active" : "Inactive"}
  </span>
);

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalUsers: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/users", {
        params: {
          page,
          limit: pagination.pageSize,
          search: search.trim(),
          sortBy,
          order: sortOrder,
        },
      });

      const data = response.data;

      setCustomers(data.data || []);
      setPagination(
        data.pagination || {
          currentPage: page,
          pageSize: pagination.pageSize,
          totalUsers: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        }
      );
    } catch (err) {
      console.error("Fetch admin customers error:", err);
      setCustomers([]);
      setError(
        err.response?.data?.message ||
          "Unable to fetch customers. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Reload the first page whenever search, sorting or page size changes.
  useEffect(() => {
    let ignore = false;

    const loadCustomers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/admin/users", {
          params: {
            page: 1,
            limit: pagination.pageSize,
            search: search.trim(),
            sortBy,
            order: sortOrder,
          },
        });

        if (ignore) return;

        const data = response.data;

        setCustomers(data.data || []);
        setPagination(
          data.pagination || {
            currentPage: 1,
            pageSize: pagination.pageSize,
            totalUsers: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          }
        );
      } catch (err) {
        if (ignore) return;

        console.error("Fetch admin customers error:", err);
        setCustomers([]);
        setError(
          err.response?.data?.message ||
            "Unable to fetch customers. Please try again."
        );
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadCustomers();

    return () => {
      ignore = true;
    };
  }, [search, sortBy, sortOrder, pagination.pageSize]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchCustomers(newPage);
  };

  const handleLimitChange = (event) => {
    const newLimit = Number(event.target.value);

    setPagination((previous) => ({
      ...previous,
      pageSize: newLimit,
      currentPage: 1,
    }));
  };

  const toggleSortOrder = () => {
    setSortOrder((previous) => (previous === "asc" ? "desc" : "asc"));
  };

  const clearFilters = () => {
    setSearch("");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Customer Management
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View and manage registered customers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchCustomers(pagination.currentPage)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Customer Count */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-50 p-3">
              <Users className="text-blue-600" size={24} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {pagination.totalUsers}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Sorting */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customers by name or email..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
            <span className="text-sm font-medium text-gray-600">
              Sort by:
            </span>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="createdAt">Registration Date</option>
              <option value="updatedAt">Last Updated</option>
              <option value="name">Customer Name</option>
              <option value="email">Email</option>
              <option value="isActive">Account Status</option>
            </select>

            <button
              type="button"
              onClick={toggleSortOrder}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
            >
              <ArrowUpDown size={15} />
              {sortOrder === "asc" ? "Ascending" : "Descending"}
            </button>

            <button
              type="button"
              onClick={clearFilters}
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

        {/* Customers Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-left">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Email Verification
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Account Status
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Registered
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Last Updated
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
                      Loading customers...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-16 text-center">
                      <Users
                        size={32}
                        className="mx-auto mb-3 text-gray-300"
                      />

                      <p className="font-medium text-gray-700">
                        No customers found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Try changing your search.
                      </p>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">
                          {customer.name || "N/A"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Customer ID: {customer.id}
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                          <Mail size={12} />
                          {customer.email}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <VerificationBadge
                          verified={customer.emailVerified}
                        />
                      </td>

                      <td className="px-5 py-4">
                        <AccountStatusBadge isActive={customer.isActive} />
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays size={14} className="text-gray-400" />
                          {formatDate(customer.createdAt)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(customer.updatedAt)}
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          to={`/admin/users/${customer.id}`}
                          className="inline-flex items-center gap-2 font-medium text-blue-600 hover:text-blue-800"
                        >
                          <Eye size={16} />
                          View Profile
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
                Total: <strong>{pagination.totalUsers}</strong> customers
              </span>

              <select
                value={pagination.pageSize}
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
                type="button"
                onClick={() =>
                  handlePageChange(pagination.currentPage - 1)
                }
                disabled={loading || !pagination.hasPrevPage}
                className="rounded-lg border border-gray-300 p-2 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={() =>
                  handlePageChange(pagination.currentPage + 1)
                }
                disabled={loading || !pagination.hasNextPage}
                className="rounded-lg border border-gray-300 p-2 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
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

export default AdminCustomers;
