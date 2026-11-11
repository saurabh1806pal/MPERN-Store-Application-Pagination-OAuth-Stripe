
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import ProductCard from "../components/products/ProductCard";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products", {
          params: {
            limit: 4,
            sortBy: "createdAt",
            order: "desc",
          },
        });

        setProducts(response.data.products);
      } catch (error) {
        setError(
          error.response?.data?.message ||
          "Unable to fetch products."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <main>
      {/* Hero Section */}
      <section className="px-8 py-20 text-center bg-gray-100">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to MPERN Store
        </h1>

        <p className="text-gray-600 text-lg mb-8">
          Discover quality products at the best prices.
        </p>

        <Link
          to="/products"
          className="inline-block bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800"
        >
          Shop Now
        </Link>
      </section>

      {/* Featured Products */}
      <section className="px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">
            Latest Products
          </h2>

          <Link
            to="/products"
            className="text-blue-600 hover:underline"
          >
            View All
          </Link>
        </div>

        {loading && <p>Loading products...</p>}

        {error && (
          <p className="text-red-600">{error}</p>
        )}

        {!loading && !error && products.length === 0 && (
          <p>No products available yet.</p>
        )}

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
      </section>
    </main>
  );
};

export default Home;
