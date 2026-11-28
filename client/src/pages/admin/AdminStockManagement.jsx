
import { useEffect, useState } from "react";
import {
    Search,
    Package,
    ChevronLeft,
    ChevronRight,
    Save,
    RefreshCw,
} from "lucide-react";

import { useProducts } from "../../context/ProductContext";
import api from "../../services/api";

const LOW_STOCK_THRESHOLD = 10;

const AdminStockManagement = () => {
    const {
        products,
        loading,
        error,
        fetchProducts,
    } = useProducts();

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [quantities, setQuantities] = useState({});
    const [updatingId, setUpdatingId] = useState(null);

    const [successMessage, setSuccessMessage] = useState("");
    const [updateError, setUpdateError] = useState("");

    const limit = 10;

    // Fetch products whenever search or pagination changes.
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const response = await fetchProducts({
                    page,
                    limit,
                    search,
                    sortBy: "name",
                    order: "asc",
                });

                setTotalPages(response.totalPages || 1);
            } catch (fetchError) {
                console.error(
                    "Failed to load stock:",
                    fetchError
                );
            }
        };

        loadProducts();
    }, [page, search, fetchProducts]);

    const handleSearch = (value) => {
        setSearch(value);
        setPage(1);
        setSuccessMessage("");
        setUpdateError("");
    };

    const handleQuantityChange = (productId, value) => {
        setQuantities((previous) => ({
            ...previous,
            [productId]: value,
        }));

        setSuccessMessage("");
        setUpdateError("");
    };

    const getStockStatus = (quantity) => {
        if (quantity === 0) {
            return {
                label: "Out of Stock",
                className: "bg-red-100 text-red-700",
            };
        }

        if (quantity <= LOW_STOCK_THRESHOLD) {
            return {
                label: "Low Stock",
                className: "bg-yellow-100 text-yellow-700",
            };
        }

        return {
            label: "In Stock",
            className: "bg-green-100 text-green-700",
        };
    };

    const handleUpdateStock = async (product) => {
        const rawQuantity = quantities[product._id] ?? String(product.quantity);

        if (
            rawQuantity === "" ||
            !/^\d+$/.test(rawQuantity)
        ) {
            setUpdateError(
                "Please enter a valid non-negative whole number."
            );
            setSuccessMessage("");
            return;
        }

        const newQuantity = Number(rawQuantity);

        if (!Number.isSafeInteger(newQuantity)) {
            setUpdateError(
                "Please enter a valid stock quantity."
            );
            setSuccessMessage("");
            return;
        }

        if (newQuantity === product.quantity) {
            setUpdateError(
                "The entered quantity is the same as the current quantity."
            );
            setSuccessMessage("");
            return;
        }

        try {
            setUpdatingId(product._id);
            setUpdateError("");
            setSuccessMessage("");

            await api.patch(`/products/${product._id}`, {
                quantity: newQuantity,
            });

            setSuccessMessage(
                `Stock updated successfully for ${product.name}.`
            );

            // Refresh products to display the latest database values.
            const response = await fetchProducts({
                page,
                limit,
                search,
                sortBy: "name",
                order: "asc",
            });

            setTotalPages(response.totalPages || 1);
        } catch (updateError) {
            console.error(
                "Stock update failed:",
                updateError
            );

            setUpdateError(
                updateError.response?.data?.message ||
                "Unable to update stock. Please try again."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRefresh = async () => {
        try {
            setSuccessMessage("");
            setUpdateError("");

            const response = await fetchProducts({
                page,
                limit,
                search,
                sortBy: "name",
                order: "asc",
            });

            setTotalPages(response.totalPages || 1);
        } catch {
            setUpdateError(
                "Unable to refresh products. Please try again."
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">

            {/* Header */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Stock Management
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        View and update individual product stock quantities.
                    </p>
                </div>

                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                    <RefreshCw
                        size={17}
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh Stock
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(event) =>
                            handleSearch(event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-black"
                    />
                </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {successMessage}
                </div>
            )}

            {/* Error Message */}
            {updateError && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {updateError}
                </div>
            )}

            {/* Product Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

                {loading ? (
                    <div className="p-12 text-center text-gray-500">
                        Loading products...
                    </div>
                ) : error ? (
                    <div className="p-12 text-center text-red-500">
                        {error}
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package
                            size={40}
                            className="mx-auto mb-3 text-gray-300"
                        />

                        <p className="font-medium text-gray-700">
                            No products found
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            Try changing your search.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-212.5 text-left text-sm">

                            <thead className="border-b bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-5 py-4">
                                        Product Name
                                    </th>

                                    <th className="px-5 py-4">
                                        Current Quantity
                                    </th>

                                    <th className="px-5 py-4">
                                        Edit
                                    </th>

                                    <th className="px-5 py-4">
                                        Update
                                    </th>

                                    <th className="px-5 py-4">
                                        Stock Warning
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {products.map((product) => {
                                    const currentQuantity =
                                        Number(product.quantity);

                                    const stockStatus =
                                        getStockStatus(currentQuantity);

                                    const isUpdating =
                                        updatingId === product._id;

                                    return (
                                        <tr key={product._id}>

                                            {/* Product Name */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    {product.images?.[0]?.url ? (
                                                        <img
                                                            src={product.images[0].url}
                                                            alt={product.name}
                                                            className="h-11 w-11 rounded-lg border object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100">
                                                            <Package
                                                                size={19}
                                                                className="text-gray-400"
                                                            />
                                                        </div>
                                                    )}

                                                    <span className="font-medium text-gray-900">
                                                        {product.name}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Current Quantity */}
                                            <td className="px-5 py-4 font-semibold text-gray-700">
                                                {currentQuantity}
                                            </td>

                                            {/* Edit Quantity */}
                                            <td className="px-5 py-4">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={
                                                        quantities[product._id] ?? String(product.quantity)
                                                    }
                                                    onChange={(event) =>
                                                        handleQuantityChange(
                                                            product._id,
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={isUpdating}
                                                    className="w-28 rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-black disabled:bg-gray-100"
                                                    aria-label={`New stock quantity for ${product.name}`}
                                                />
                                            </td>

                                            {/* Update Button */}
                                            <td className="px-5 py-4">
                                                <button
                                                    onClick={() =>
                                                        handleUpdateStock(product)
                                                    }
                                                    disabled={
                                                        isUpdating ||
                                                        String(quantities[product._id] ?? product.quantity) ===
                                                            String(product.quantity)
                                                    }
                                                    className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    {isUpdating ? (
                                                        <>
                                                            <RefreshCw
                                                                size={14}
                                                                className="animate-spin"
                                                            />
                                                            Updating
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save size={14} />
                                                            Update
                                                        </>
                                                    )}
                                                </button>
                                            </td>

                                            {/* Stock Warning */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${stockStatus.className}`}
                                                >
                                                    {stockStatus.label}
                                                </span>
                                            </td>

                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="mt-5 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                </p>

                <div className="flex gap-2">
                    <button
                        disabled={page <= 1 || loading}
                        onClick={() =>
                            setPage((previous) => previous - 1)
                        }
                        className="rounded-lg border bg-white p-2 disabled:opacity-40"
                        aria-label="Previous page"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <button
                        disabled={page >= totalPages || loading}
                        onClick={() =>
                            setPage((previous) => previous + 1)
                        }
                        className="rounded-lg border bg-white p-2 disabled:opacity-40"
                        aria-label="Next page"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

        </div>
    );
};

export default AdminStockManagement;
