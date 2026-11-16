import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShoppingCart,
  Minus,
  Plus,
  Package,
  CheckCircle2,
  ArrowLeft,
  Truck,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

import api from "../services/api";
import { useCart } from "../context/CartContext";

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();

  // Product states
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Gallery states
  const [selectedImage, setSelectedImage] = useState(0);

  // Cart states
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState(false);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/products/${id}`);
        const fetchedProduct = response.data.product;

        setProduct(fetchedProduct);
        setQuantity(1);

        const primaryIndex =
          fetchedProduct.images?.findIndex((image) => image.isPrimary) ?? -1;

        setSelectedImage(primaryIndex >= 0 ? primaryIndex : 0);
      } catch (error) {
        setError(
          error.response?.data?.message || "Unable to fetch product details.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Product data
  const images = product?.images || [];
  const currentImage = images[selectedImage];
  const specifications = product?.specifications
    ? Object.entries(product.specifications)
    : [];

  const brandName =
    typeof product?.brand === "object"
      ? product.brand?.name
      : product?.brand || product?.brandName;

  const brandDescription =
    typeof product?.brand === "object"
      ? product.brand?.description
      : product?.brandDescription;

  // Quantity controls
  const decreaseQuantity = () => {
    setQuantity((previous) => Math.max(1, previous - 1));
  };

  const increaseQuantity = () => {
    setQuantity((previous) => Math.min(product.quantity, previous + 1));
  };

  // Add to cart
  const handleAddToCart = async () => {
    try {
      setAdding(true);
      setCartMessage("");
      setCartError(false);

      await addToCart(product._id, quantity);

      setCartMessage("Product added to your cart successfully!");
    } catch (error) {
      setCartError(true);
      setCartMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to add product to cart.",
      );
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-600">{error}</p>
        <Link
          to="/products"
          className="rounded-lg bg-black px-5 py-3 text-white"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-12 text-center">
        <Package size={40} className="mx-auto mb-4 text-gray-400" />
        <p>Product not found.</p>
        <Link to="/products" className="mt-4 inline-block text-blue-600">
          Back to Products
        </Link>
      </div>
    );
  }

  const inStock = product.quantity > 0;

  return (
    <main className="min-h-screen bg-white px-4 py-8 md:px-8 lg:px-12">
      {/* Breadcrumb */}
      <div className="mx-auto mb-8 max-w-7xl">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-black"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>
      </div>

      {/* Main Product Section */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Product Gallery */}
        <div>
          {/* Main Image */}
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
            {currentImage?.url ? (
              <img
                src={currentImage.url}
                alt={currentImage.alt || product.name}
                className="h-full w-full object-contain p-4 transition duration-300"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Package size={64} />
                <span>No Image Available</span>
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-5 gap-3">
              {images.map((image, index) => (
                <button
                  key={image._id || image.publicId || index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden rounded-xl border-2 bg-gray-50 transition ${
                    selectedImage === index
                      ? "border-black"
                      : "border-transparent hover:border-gray-300"
                  }`}
                  aria-label={`View product image ${index + 1}`}
                >
                  <img
                    src={image.url}
                    alt={image.alt || `${product.name} ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="flex flex-col">
          {/* Category and Brand */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
              {product.category}
            </span>

            {brandName && (
              <span className="text-sm text-gray-500">Brand: {brandName}</span>
            )}
          </div>

          {/* Name */}
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            {product.name}
          </h1>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="mt-4 text-base leading-7 text-gray-500">
              {product.shortDescription}
            </p>
          )}

          {/* Price */}
          <div className="mt-6 border-b border-gray-200 pb-6">
            <p className="text-3xl font-bold text-gray-900">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Inclusive of applicable taxes
            </p>
          </div>

          {/* Stock Status */}
          <div className="mt-6">
            {inStock ? (
              <p className="inline-flex items-center gap-2 text-sm font-medium text-green-700">
                <CheckCircle2 size={17} />
                In Stock ({product.quantity} available)
              </p>
            ) : (
              <p className="text-sm font-semibold text-red-600">
                Currently Out of Stock
              </p>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="mt-6">
            <label className="mb-3 block text-sm font-semibold text-gray-700">
              Quantity
            </label>

            <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-300">
              <button
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
                className="p-3 text-gray-600 transition hover:bg-gray-100 disabled:opacity-30"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>

              <span className="min-w-12 text-center font-semibold">
                {quantity}
              </span>

              <button
                onClick={increaseQuantity}
                disabled={!inStock || quantity >= product.quantity}
                className="p-3 text-gray-600 transition hover:bg-gray-100 disabled:opacity-30"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={adding || !inStock}
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl bg-black px-8 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart size={19} />
            {adding
              ? "Adding to Cart..."
              : inStock
                ? "Add to Cart"
                : "Out of Stock"}
          </button>

          {/* Cart Feedback */}
          {cartMessage && (
            <p
              className={`mt-4 rounded-lg p-3 text-sm ${
                cartError
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {cartMessage}
            </p>
          )}

          {/* Purchase Benefits */}
          <div className="mt-8 grid grid-cols-1 gap-5 border-t border-gray-200 pt-6 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <Truck size={22} className="text-gray-500" />
              <span className="text-xs font-medium text-gray-600">
                Delivery Information
              </span>
            </div>

            <div className="flex items-center gap-3">
              <ShieldCheck size={22} className="text-gray-500" />
              <span className="text-xs font-medium text-gray-600">
                Secure Checkout
              </span>
            </div>

            <div className="flex items-center gap-3">
              <RotateCcw size={22} className="text-gray-500" />
              <span className="text-xs font-medium text-gray-600">
                Easy Returns
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Description */}
<section className="mx-auto mt-20 max-w-7xl border-t border-gray-200 pt-10">
    <h2 className="text-2xl font-bold text-gray-900">
        Product Description
    </h2>

    <div className="mt-6 space-y-4 pl-5">
        {product.detailedDescription
            ? product.detailedDescription
                .split("$$ENTER$$")
                .map((point) => point.trim())
                .filter(Boolean)
                .map((point, index) => (
                    <p
                        key={index}
                        className="text-sm leading-7 text-gray-600"
                    >
                        ⏣ {point}
                    </p>
                ))
            : (
                <p className="text-sm leading-7 text-gray-600">
                    {product.description}
                </p>
            )}
    </div>
</section>

      {/* Product Highlights */}
      {product.highlights?.length > 0 && (
        <section className="mx-auto mt-14 max-w-7xl">
          <h2 className="text-2xl font-bold text-gray-900">
            Product Highlights
          </h2>

          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {product.highlights.map((highlight, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-700"
              >
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-green-600"
                />
                {highlight}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Specifications */}
      {specifications.length > 0 && (
        <section className="mx-auto mt-14 max-w-7xl pb-16">
          <h2 className="text-2xl font-bold text-gray-900">Specifications</h2>

          <div className="mt-6 max-w-4xl overflow-hidden rounded-xl border border-gray-200">
            {specifications.map(([key, value], index) => (
              <div
                key={key}
                className={`grid grid-cols-2 gap-4 px-5 py-4 text-sm ${
                  index % 2 === 0 ? "bg-gray-50" : "bg-white"
                }`}
              >
                <span className="font-semibold capitalize text-gray-700">
                  {key.replace(/([A-Z])/g, " $1")}
                </span>

                <span className="text-gray-600">{String(value)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Brand Information */}
      {(brandName || brandDescription) && (
        <section className="mx-auto mt-4 max-w-7xl border-t border-gray-200 py-10">
          <h2 className="text-2xl font-bold text-gray-900">
            About {brandName || "the Brand"}
          </h2>

          {brandDescription && (
            <p className="mt-4 max-w-4xl text-sm leading-7 text-gray-600">
              {brandDescription}
            </p>
          )}
        </section>
      )}
    </main>
  );
};

export default ProductDetails;
