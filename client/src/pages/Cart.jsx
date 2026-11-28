
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(price);

const Cart = () => {
  const {
    cart,
    loading,
    error,
    updateCartItem,
    removeCartItem,
    clearCart,
    fetchCart
  } = useCart();

  const [actionError, setActionError] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [clearing, setClearing] = useState(false);

  // Automatically refresh cart stock every 5 seconds
useEffect(() => {
    const refreshCart = () => {
        if (document.visibilityState === "visible") {
            fetchCart({ silent: true }).catch(() => {});
        }
    };

    const intervalId = window.setInterval(refreshCart, 5000);

    // Refresh immediately when the customer returns to this tab
    document.addEventListener("visibilitychange", refreshCart);

    return () => {
        window.clearInterval(intervalId);
        document.removeEventListener("visibilitychange", refreshCart);
    };
}, [fetchCart]);

  // Check whether any cart item cannot be purchased.
  const hasInvalidItems = cart?.items?.some(
    (item) =>
      !item.isAvailable ||
      !item.hasSufficientStock
  );

  const handleQuantityChange = async (item, newQuantity) => {
    if (
      !item.isAvailable ||
      newQuantity < 1 ||
      newQuantity > item.availableStock
    ) {
      return;
    }

    try {
      setActionError("");
      setUpdatingItemId(item.id);

      await updateCartItem(item.id, newQuantity);
    } catch (error) {
      setActionError(
        error.response?.data?.message ||
          "Unable to update quantity."
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
      setActionError(
        error.response?.data?.message ||
          "Unable to remove item."
      );
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
      setActionError(
        error.response?.data?.message ||
          "Unable to clear cart."
      );
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
        <h1 className="text-3xl font-bold mb-4">
          Your Cart
        </h1>

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

      {/* Cart Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Shopping Cart
          </h1>

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

      {actionError && (
        <p className="text-red-600 mb-6">
          {actionError}
        </p>
      )}

      {/* Checkout Warning */}
      {hasInvalidItems && (
        <div className="border border-red-300 bg-red-50 text-red-700 rounded-lg p-4 mb-6">
          <p className="font-semibold">
            Action required before checkout
          </p>

          <p className="text-sm mt-1">
            Some products in your cart are unavailable
            or have insufficient stock. Please update
            or remove those items before proceeding.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Cart Items */}
        <section className="lg:col-span-2 space-y-4">

          {cart.items.map((item) => {
            const product = item.product;
            const isUpdating = updatingItemId === item.id;
            const isRemoving = removingItemId === item.id;

            return (
              <div
                key={item.id}
                className="border rounded-lg p-5 flex flex-col sm:flex-row justify-between gap-5"
              >

                {/* Product Information */}
                <div>
                  <h2 className="text-lg font-semibold">
                    {product?.name || "Product unavailable"}
                  </h2>

                  {product && (
                    <>
                      <p className="text-gray-500 mt-2">
                        {product.category}
                      </p>

                      <p className="font-medium mt-3">
                        {formatPrice(product.price)}
                      </p>
                    </>
                  )}

                  {/* Inventory Status */}
                  {item.stockStatus === "IN_STOCK" && (
                    <p className="text-green-600 text-sm mt-3">
                      In stock
                    </p>
                  )}

                  {item.stockStatus === "LOW_STOCK" && (
                    <p className="text-orange-600 text-sm mt-3">
                      Only {item.availableStock} units left!
                    </p>
                  )}

                  {item.stockStatus === "OUT_OF_STOCK" && (
                    <p className="text-red-600 text-sm font-medium mt-3">
                      Out of stock
                    </p>
                  )}

                  {item.stockStatus === "UNAVAILABLE" && (
                    <p className="text-red-600 text-sm font-medium mt-3">
                      This product is no longer available.
                    </p>
                  )}

                  {/* Insufficient Stock Warning */}
                  {item.isAvailable &&
                    !item.hasSufficientStock && (
                      <p className="text-red-600 text-sm mt-2">
                        You have {item.quantity} in your cart,
                        but only {item.availableStock} units
                        are currently available.
                      </p>
                    )}
                </div>

                {/* Quantity and Actions */}
                <div className="flex flex-col items-start sm:items-end justify-between gap-4">

                  <p className="font-semibold">
                    {item.lineTotal !== null
                      ? formatPrice(item.lineTotal)
                      : "Unavailable"}
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">

                    <button
                      onClick={() =>
                        handleQuantityChange(
                          item,
                          item.quantity - 1
                        )
                      }
                      disabled={
                        isUpdating ||
                        !item.isAvailable ||
                        item.quantity <= 1
                      }
                      className="border rounded px-3 py-1 disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() =>
                        handleQuantityChange(
                          item,
                          item.quantity + 1
                        )
                      }
                      disabled={
                        isUpdating ||
                        !item.isAvailable ||
                        item.quantity >= item.availableStock
                      }
                      className="border rounded px-3 py-1 disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>

                  </div>

                  {/* Remove Item */}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={isRemoving}
                    className="text-sm text-red-600 hover:underline disabled:opacity-50"
                  >
                    {isRemoving ? "Removing..." : "Remove"}
                  </button>

                </div>
              </div>
            );
          })}

        </section>

        {/* Order Summary */}
        <aside className="border rounded-lg p-6 h-fit">

          <h2 className="text-xl font-bold mb-6">
            Order Summary
          </h2>

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

          {/* Checkout Button */}
          {hasInvalidItems ? (
            <button
              disabled
              className="w-full bg-gray-400 text-white py-3 rounded-md mt-6 cursor-not-allowed"
              title="Resolve unavailable or insufficient-stock items first"
            >
              Proceed to Checkout
            </button>
          ) : (
            <Link
              to="/checkout"
              className="block w-full text-center bg-black text-white py-3 rounded-md mt-6"
            >
              Proceed to Checkout
            </Link>
          )}

          <Link
            to="/products"
            className="block text-center text-blue-600 mt-4"
          >
            Continue Shopping
          </Link>

        </aside>
      </div>
    </main>
  );
};

export default Cart;
