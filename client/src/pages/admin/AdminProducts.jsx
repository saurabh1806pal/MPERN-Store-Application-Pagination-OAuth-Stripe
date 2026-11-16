import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Package,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import { useProducts } from "../../context/ProductContext";

const AdminProducts = () => {
    const navigate = useNavigate();

    const {
        products,
        loading,
        error,
        fetchProducts,
        deleteProduct,
    } = useProducts();

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [deletingId, setDeletingId] = useState(null);

    const limit = 10;

    // Fetch products whenever filters or pagination change.
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const response = await fetchProducts({
                    page,
                    limit,
                    search,
                    category,
                    sortBy,
                    order: sortOrder,
                });

                setTotalPages(response.totalPages || 1);
            } catch (fetchError) {
                console.error("Failed to load products:", fetchError);
            }
        };

        loadProducts();
    }, [page, search, category, sortBy, sortOrder]);

    const handleSearch = (value) => {
        setSearch(value);
        setPage(1);
    };

    const handleCategoryChange = (value) => {
        setCategory(value);
        setPage(1);
    };

    const handleDelete = async (product) => {
        

        try {
            setDeletingId(product._id);

            await deleteProduct(product._id);

            // window.alert("Product deleted successfully!");

            // Move back if deleting the only product on the current page.
            if (products.length === 1 && page > 1) {
                setPage((currentPage) => currentPage - 1);
            } else {
                // Refresh the current page and its pagination count.
                const response = await fetchProducts({
                    page,
                    limit,
                    search,
                    category,
                    sortBy,
                    order: sortOrder,
                });

                setTotalPages(response.totalPages || 1);
            }
        } catch (deleteError) {
            window.alert(
                deleteError.response?.data?.message ||
                    "Failed to delete product."
            );
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
            {/* Header */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Products
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage your store products and inventory.
                    </p>
                </div>

                <button
                    onClick={() => navigate("/admin/products/create")}
                    className="flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
                >
                    <Plus size={18} />
                    Add Product
                </button>
            </div>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                {/* Search */}
                <div className="relative">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(event) => handleSearch(event.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-black"
                    />
                </div>

                {/* Category */}
                <select
                    value={category}
                    onChange={(event) =>
                        handleCategoryChange(event.target.value)
                    }
                    className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                >
                    <option value="">All Categories</option>
                    {products
                        .map((product) => product.category)
                        .filter(
                            (value, index, self) =>
                                value && self.indexOf(value) === index
                        )
                        .sort()
                        .map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                </select>

                {/* Sorting */}
                <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(event) => {
                        const [field, order] = event.target.value.split("-");
                        setSortBy(field);
                        setSortOrder(order);
                        setPage(1);
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name-asc">Name: A to Z</option>
                    <option value="name-desc">Name: Z to A</option>
                </select>
            </div>

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
                            Try changing your search or filters.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-5 py-4">Product</th>
                                    <th className="px-5 py-4">Category</th>
                                    <th className="px-5 py-4">Price</th>
                                    <th className="px-5 py-4">Stock</th>
                                    <th className="px-5 py-4 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {products.map((product) => (
                                    <tr key={product._id}>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {product.images?.[0]?.url ? (
                                                    <img
                                                        src={product.images[0].url}
                                                        alt={product.name}
                                                        className="h-12 w-12 rounded-lg border object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                                                        <Package
                                                            size={20}
                                                            className="text-gray-400"
                                                        />
                                                    </div>
                                                )}

                                                <span className="font-medium text-gray-900">
                                                    {product.name}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 text-gray-600">
                                            {product.category}
                                        </td>

                                        <td className="px-5 py-4 font-medium">
                                            ₹
                                            {Number(product.price).toLocaleString(
                                                "en-IN"
                                            )}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={
                                                    product.quantity > 0
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                                }
                                            >
                                                {product.quantity}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/products/${product._id}/edit`
                                                        )
                                                    }
                                                    title="Edit Product"
                                                    className="text-gray-500 hover:text-black"
                                                >
                                                    <Pencil size={18} />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleDelete(product)
                                                    }
                                                    disabled={
                                                        deletingId === product._id
                                                    }
                                                    title="Delete Product"
                                                    className="text-gray-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    {deletingId === product._id ? (
                                                        <span className="text-xs">
                                                            Deleting...
                                                        </span>
                                                    ) : (
                                                        <Trash2 size={18} />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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
                        onClick={() => setPage((previous) => previous - 1)}
                        className="rounded-lg border bg-white p-2 disabled:opacity-40"
                        aria-label="Previous page"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <button
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage((previous) => previous + 1)}
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

export default AdminProducts;
