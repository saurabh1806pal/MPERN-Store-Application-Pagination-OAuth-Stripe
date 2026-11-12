import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(price);

const Cart = () => {
  const { cart, loading, error, updateCartItem, removeCartItem, clearCart } =
    useCart();

  const [actionError, setActionError] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [clearing, setClearing] = useState(false);

  const handleQuantityChange = async (item, newQuantity) => {
    if (newQuantity < 1 || newQuantity > item.product.quantity) return;

    try {
      setActionError("");
      setUpdatingItemId(item.id);

      await updateCartItem(item.id, newQuantity);
    } catch (error) {
      setActionError(
        error.response?.data?.message || "Unable to update quantity.",
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      setActionError("");
      setRemovingItemId(itemId);

      await removeCartItem(itemId);
    } catch (error) {
      setActionError(error.response?.data?.message || "Unable to remove item.");
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleClearCart = async () => {
    try {
      setActionError("");
      setClearing(true);

      await clearCart();
    } catch (error) {
      setActionError(error.response?.data?.message || "Unable to clear cart.");
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return <p className="p-8">Loading your cart...</p>;
  }

  if (error) {
    return <p className="p-8 text-red-600">{error}</p>;
  }

  if (!cart?.items?.length) {
    return (
      <main className="px-8 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Your Cart</h1>
        <p className="text-gray-600 mb-6">
          Your shopping cart is currently empty.
        </p>
        <Link
          to="/products"
          className="inline-block bg-black text-white px-6 py-3 rounded-md"
        >
          Continue Shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="px-8 py-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="text-gray-500 mt-2">
            {cart.totalItems} item(s) in your cart
          </p>
        </div>

        <button
          onClick={handleClearCart}
          disabled={clearing}
          className="text-red-600 hover:underline disabled:opacity-50"
        >
          {clearing ? "Clearing..." : "Clear Cart"}
        </button>
      </div>

      {actionError && <p className="text-red-600 mb-6">{actionError}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <section className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-5 flex flex-col sm:flex-row justify-between gap-5"
            >
              <div>
                <h2 className="text-lg font-semibold">
                  {item.product?.name || "Product unavailable"}
                </h2>

                <p className="text-gray-500 mt-2">{item.product?.category}</p>

                <p className="font-medium mt-3">
                  {formatPrice(item.product?.price || 0)}
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end justify-between gap-4">
                <p className="font-semibold">{formatPrice(item.lineTotal)}</p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      handleQuantityChange(item, item.quantity - 1)
                    }
                    disabled={updatingItemId === item.id || item.quantity <= 1}
                    className="border rounded px-3 py-1 disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() =>
                      handleQuantityChange(item, item.quantity + 1)
                    }
                    disabled={
                      updatingItemId === item.id ||
                      item.quantity >= (item.product?.quantity || 0)
                    }
                    className="border rounded px-3 py-1 disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={removingItemId === item.id}
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                  {removingItemId === item.id ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Order Summary */}
        <aside className="border rounded-lg p-6 h-fit">
          <h2 className="text-xl font-bold mb-6">Order Summary</h2>

          <div className="flex justify-between mb-4">
            <span>Total Items</span>
            <span>{cart.totalItems}</span>
          </div>

          <div className="flex justify-between mb-4">
            <span>Subtotal</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>

          <div className="border-t pt-4 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>

          <Link
            to="/checkout"
            className="block w-full text-center bg-black text-white py-3 rounded-md mt-6"
          >
            Proceed to Checkout
          </Link>

          <Link to="/products" className="block text-center text-blue-600 mt-4">
            Continue Shopping
          </Link>
        </aside>
      </div>
    </main>
  );
};

export default Cart;
