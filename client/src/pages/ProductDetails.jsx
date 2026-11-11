
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import api from "../services/api";

const ProductDetails = () => {
  // Extract product ID from URL
  const { id } = useParams();

  // Component States
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch Individual Product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/products/${id}`);

        setProduct(response.data.product);

      } catch (error) {
        setError(
          error.response?.data?.message ||
          "Unable to fetch product details."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

  }, [id]);

  // Loading State
  if (loading) {
    return <p className="p-8">Loading product details...</p>;
  }

  // Error State
  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error}</p>
        <Link to="/products" className="text-blue-600 underline">
          Back to Products
        </Link>
      </div>
    );
  }

  // Product Not Found
  if (!product) {
    return (
      <div className="p-8">
        <p>Product not found.</p>
        <Link to="/products" className="text-blue-600 underline">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <main className="px-8 py-10">

      <Link
        to="/products"
        className="text-blue-600 hover:underline"
      >
        ← Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-8">

        {/* Product Image Placeholder */}
        <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
          <span className="text-gray-400">
            No Image Available
          </span>
        </div>

        {/* Product Information */}
        <div>

          <p className="text-gray-500 mb-2">
            {product.category}
          </p>

          <h1 className="text-3xl font-bold mb-4">
            {product.name}
          </h1>

          <p className="text-2xl font-bold mb-6">
            ₹{product.price}
          </p>

          <p className="text-gray-600 mb-6">
            {product.description}
          </p>

          <p className="mb-6">
            <span className="font-semibold">Availability: </span>

            {product.quantity > 0
              ? `${product.quantity} items available`
              : "Out of Stock"}
          </p>

          <button
            disabled={product.quantity <= 0}
            className="bg-black text-white px-8 py-3 rounded-md disabled:opacity-40"
          >
            Add to Cart
          </button>

        </div>

      </div>
    </main>
  );
};

export default ProductDetails;
