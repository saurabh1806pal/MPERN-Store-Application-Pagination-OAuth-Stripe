
import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
  return (
    <div className="border rounded-lg p-4">
      {/* Product Information */}
      <div className="bg-gray-100 h-48 flex items-center justify-center rounded-md mb-4">
        <span className="text-gray-400">
          No Image Available
        </span>
      </div>

      <h2 className="text-lg font-semibold">
        {product.name}
      </h2>

      <p className="text-gray-500 text-sm mt-1">
        {product.category}
      </p>

      <p className="text-xl font-bold mt-3">
        ₹{product.price}
      </p>

      <p className="text-sm text-gray-500 mt-1">
        {product.quantity > 0
          ? `${product.quantity} items available`
          : "Out of Stock"}
      </p>

      {/* Product Details Link */}
      <Link
        to={`/products/${product._id}`}
        className="block text-center bg-black text-white py-2 rounded-md mt-4 hover:bg-gray-800"
      >
        View Details
      </Link>
    </div>
  );
};

export default ProductCard;
