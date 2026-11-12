
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import api from "../services/api";
import { useCart } from "../context/CartContext";

const ProductDetails = () => {
  const { id } = useParams();

  const { addToCart } = useCart();

  // Product States
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cart States
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  // Fetch Product
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

  // Add Product to Cart
  // const handleAddToCart = async () => {
  //   try {
  //     setAdding(true);
  //     setCartMessage("");

  //     await addToCart(product._id, quantity);

  //     setCartMessage("Product added to cart successfully!");

  //   } catch (error) {
  //     setCartMessage(
  //       error.response?.data?.message ||
  //       "Unable to add product to cart."
  //     );

  //   } finally {
  //     setAdding(false);
  //   }
  // };
  const handleAddToCart = async () => {
  console.log("ADD TO CART CLICKED");
  console.log("Product ID:", product._id);
  console.log("Quantity:", quantity);

  try {
    setAdding(true);
    setCartMessage("");

    const result = await addToCart(product._id, quantity);

    console.log("CART RESPONSE:", result);

    setCartMessage("Product added successfully!");

  } catch (error) {
    console.error("ADD TO CART ERROR:", error);

    setCartMessage(
      error.response?.data?.message ||
      error.message ||
      "Unable to add product to cart."
    );

  } finally {
    setAdding(false);
  }
};

  if (loading) {
    return <p className="p-8">Loading product details...</p>;
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error}</p>
        <Link to="/products">Back to Products</Link>
      </div>
    );
  }

  if (!product) {
    return <p className="p-8">Product not found.</p>;
  }

  return (
    <main className="px-8 py-10">

      <Link to="/products" className="text-blue-600">
        ← Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-8">

        <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
          <span className="text-gray-400">
            No Image Available
          </span>
        </div>

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
            <strong>Available Quantity:</strong>{" "}
            {product.quantity}
          </p>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 mb-6">

            <label htmlFor="quantity">
              Quantity:
            </label>

            <input
              id="quantity"
              type="number"
              min="1"
              max={product.quantity}
              value={quantity}
              onChange={(e) => {
                const value = Number(e.target.value);

                if (
                  Number.isInteger(value) &&
                  value >= 1 &&
                  value <= product.quantity
                ) {
                  setQuantity(value);
                }
              }}
              className="border rounded-md px-3 py-2 w-20"
            />

          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={
              adding ||
              product.quantity <= 0 ||
              quantity > product.quantity
            }
            className="bg-black text-white px-8 py-3 rounded-md disabled:opacity-40"
          >
            {adding ? "Adding..." : "Add to Cart"}
          </button>

          {cartMessage && (
            <p className="mt-4 text-sm">
              {cartMessage}
            </p>
          )}

        </div>
      </div>
    </main>
  );
};

export default ProductDetails;
