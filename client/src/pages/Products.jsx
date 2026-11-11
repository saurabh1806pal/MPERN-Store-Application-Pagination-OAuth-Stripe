
import { useEffect, useState } from "react";

import api from "../services/api";
import ProductCard from "../components/products/ProductCard";

const Products = () => {
  // Product States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search, Filter and Sorting States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  // Pagination States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/products", {
          params: {
            page,
            limit: 10,
            search: search || undefined,
            category: category || undefined,
            sortBy,
            order,
          },
        });

        setProducts(response.data.products);
        setTotalPages(response.data.totalPages);
        setTotalProducts(response.data.totalProducts);

      } catch (error) {
        setError(
          error.response?.data?.message ||
          "Unable to fetch products."
        );

        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);

      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

  }, [page, search, category, sortBy, order]);

  return (
    <main className="px-8 py-10">

      {/* Page Heading */}
      <h1 className="text-3xl font-bold mb-2">
        All Products
      </h1>

      <p className="text-gray-500 mb-8">
        Explore our complete product collection.
      </p>

      {/* Search, Filter and Sorting */}
      <div className="flex flex-wrap gap-4 mb-8">

        {/* Search */}
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border rounded-md px-4 py-2 w-full max-w-md"
        />

        {/* Category Filter */}
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="border rounded-md px-4 py-2"
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Furniture">Furniture</option>
          <option value="Books">Books</option>
          <option value="Accessories">Accessories</option>
        </select>

        {/* Sorting */}
        <select
          value={`${sortBy}-${order}`}
          onChange={(e) => {
            const [newSortBy, newOrder] =
              e.target.value.split("-");

            setSortBy(newSortBy);
            setOrder(newOrder);
            setPage(1);
          }}
          className="border rounded-md px-4 py-2"
        >
          <option value="createdAt-desc">Newest First</option>
          <option value="createdAt-asc">Oldest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>

      </div>

      {/* Product Count */}
      {!loading && !error && totalProducts > 0 && (
        <p className="text-gray-500 mb-4">
          Showing {products.length} of {totalProducts} products
        </p>
      )}

      {/* Loading State */}
      {loading && (
        <p>Loading products...</p>
      )}

      {/* Error State */}
      {error && (
        <p className="text-red-600">{error}</p>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <p>No products found.</p>
      )}

      {/* Product Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
            />
          ))}

        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalProducts > 0 && (
        <div className="flex items-center justify-center gap-4 mt-10">

          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="border px-4 py-2 rounded-md disabled:opacity-40"
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            className="border px-4 py-2 rounded-md disabled:opacity-40"
          >
            Next
          </button>

        </div>
      )}

    </main>
  );
};

export default Products;
