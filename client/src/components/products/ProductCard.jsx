
import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Eye, Package } from "lucide-react";
import { useCart } from "../../context/CartContext";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.quantity <= 0;

  const primaryImage =
    product.images?.find((image) => image.isPrimary)?.url ||
    product.images?.[0]?.url;

  const handleAddToCart = async () => {
  if (isOutOfStock || adding) return;

  try {
    setAdding(true);

    // Pass product ID instead of the complete product object
    await addToCart(product._id, 1);

    setAdded(true);

    setTimeout(() => setAdded(false), 1800);
  } catch (error) {
    console.error(
      "Unable to add product to cart:",
      error.response?.data?.message || error.message
    );
  } finally {
    setAdding(false);
  }
};

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl">

      {/* Product Image */}
      <Link
        to={`/products/${product._id}`}
        className="relative block overflow-hidden bg-gray-50"
      >
        <div className="flex h-56 items-center justify-center">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              className="h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Package size={42} strokeWidth={1.2} />
              <span className="text-sm">No Image Available</span>
            </div>
          )}
        </div>

        {/* Stock Badge */}
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium ${
            isOutOfStock
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {isOutOfStock ? "Out of Stock" : "In Stock"}
        </span>

        {/* Image Count */}
        {product.images?.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs text-gray-600 shadow-sm">
            {product.images.length} Photos
          </span>
        )}
      </Link>

      {/* Product Information */}
      <div className="p-5">

        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {product.category}
        </p>

        <Link to={`/products/${product._id}`}>
          <h2 className="line-clamp-1 text-lg font-semibold text-gray-900 transition-colors group-hover:text-gray-600">
            {product.name}
          </h2>
        </Link>

        {product.shortDescription && (
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500">
            {product.shortDescription}
          </p>
        )}

        {/* Price and Quantity */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-400">Price</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </p>
          </div>

          <p className="text-xs text-gray-500">
            {isOutOfStock
              ? "Currently unavailable"
              : `${product.quantity} available`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex gap-2">

          <Link
            to={`/products/${product._id}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:border-black hover:bg-gray-50"
          >
            <Eye size={16} />
            View Details
          </Link>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white transition ${
              isOutOfStock
                ? "cursor-not-allowed bg-gray-300"
                : added
                ? "bg-green-600"
                : "bg-black hover:bg-gray-800"
            }`}
          >
            <ShoppingCart size={16} />

            {adding
              ? "Adding..."
              : added
              ? "Added!"
              : isOutOfStock
              ? "Unavailable"
              : "Add to Cart"}
          </button>

        </div>
      </div>
    </div>
  );
};

export default ProductCard;
