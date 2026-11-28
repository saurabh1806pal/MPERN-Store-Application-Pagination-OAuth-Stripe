import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Package,
  Minus,
  Plus,
  Trash2,
  AlertCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useCart } from "../context/CartContext";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(price);

const stepperBtn =
  "flex h-8 w-8 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

const Cart = () => {
  const {
    cart,
    loading,
    error,
    updateCartItem,
    removeCartItem,
    clearCart,
    fetchCart,
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
    (item) => !item.isAvailable || !item.hasSufficientStock
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
        error.response?.data?.message || "Unable to update quantity."
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
        error.response?.data?.message || "Unable to remove item."
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
        error.response?.data?.message || "Unable to clear cart."
      );
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#faf8f4] font-sans">
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <Loader2 size={16} className="animate-spin" />
          Loading your cart...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#faf8f4] px-4 font-sans">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm shadow-stone-200/60">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-700">
            <AlertCircle size={22} strokeWidth={1.75} />
          </span>
          <h2 className="mt-4 text-base font-semibold text-stone-900">
            Couldn't load your cart
          </h2>
          <p className="mt-1 text-sm text-stone-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#faf8f4] px-4 font-sans">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm shadow-stone-200/60">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-600">
            <ShoppingBag size={24} strokeWidth={1.5} />
          </span>
          <h1 className="mt-4 text-base font-semibold text-stone-900">
            Your cart is empty
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Items you add will show up here.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-stone-700"
          >
            Continue shopping
            <ArrowRight size={14} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#faf8f4] px-4 py-10 font-sans sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-6xl">
        {/* Cart header */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
              Shopping cart
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {cart.totalItems} {cart.totalItems === 1 ? "item" : "items"} in
              your cart
            </p>
          </div>

          <button
            onClick={handleClearCart}
            disabled={clearing}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-rose-700 disabled:opacity-50"
          >
            {clearing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            {clearing ? "Clearing..." : "Clear cart"}
          </button>
        </div>

        {actionError && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            <AlertCircle size={16} className="shrink-0" />
            {actionError}
          </div>
        )}

        {/* Checkout warning */}
        {hasInvalidItems && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Action required before checkout
              </p>
              <p className="mt-0.5 text-sm text-rose-700">
                Some products in your cart are unavailable or have
                insufficient stock. Update or remove those items to continue.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Cart items */}
          <section className="space-y-4 lg:col-span-2">
            {cart.items.map((item) => {
              const product = item.product;
              const isUpdating = updatingItemId === item.id;
              const isRemoving = removingItemId === item.id;
              const hasProblem =
                !item.isAvailable || !item.hasSufficientStock;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between gap-5 rounded-2xl border bg-white p-5 shadow-sm shadow-stone-200/60 transition-opacity sm:flex-row ${
                    hasProblem ? "border-rose-200" : "border-stone-200"
                  } ${isRemoving ? "opacity-50" : "opacity-100"}`}
                >
                  {/* Product information */}
                  <div className="flex gap-4">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
                      <Package size={24} strokeWidth={1.5} />
                    </span>

                    <div className="min-w-0">
                      <h2 className="truncate text-[15px] font-semibold text-stone-900">
                        {product?.name || "Product unavailable"}
                      </h2>

                      {product && (
                        <>
                          <p className="mt-0.5 text-xs text-stone-500">
                            {product.category}
                          </p>
                          <p className="mt-2 text-sm font-medium text-stone-800">
                            {formatPrice(product.price)}
                          </p>
                        </>
                      )}

                      {/* Inventory status */}
                      {item.stockStatus === "IN_STOCK" && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          In stock
                        </p>
                      )}

                      {item.stockStatus === "LOW_STOCK" && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Only {item.availableStock} units left
                        </p>
                      )}

                      {item.stockStatus === "OUT_OF_STOCK" && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                          Out of stock
                        </p>
                      )}

                      {item.stockStatus === "UNAVAILABLE" && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                          This product is no longer available
                        </p>
                      )}

                      {/* Insufficient stock warning */}
                      {item.isAvailable && !item.hasSufficientStock && (
                        <p className="mt-2 text-xs text-rose-700">
                          You have {item.quantity} in your cart, but only{" "}
                          {item.availableStock} units are currently available.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity and actions */}
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <p className="text-[15px] font-semibold text-stone-900">
                      {item.lineTotal !== null
                        ? formatPrice(item.lineTotal)
                        : "Unavailable"}
                    </p>

                    <div className="flex items-center gap-3">
                      {/* Quantity controls */}
                      <div className="flex items-center rounded-full border border-stone-300 bg-white">
                        <button
                          onClick={() =>
                            handleQuantityChange(item, item.quantity - 1)
                          }
                          disabled={
                            isUpdating ||
                            !item.isAvailable ||
                            item.quantity <= 1
                          }
                          className={stepperBtn}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>

                        <span className="flex w-8 items-center justify-center text-sm font-medium text-stone-900">
                          {isUpdating ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            item.quantity
                          )}
                        </span>

                        <button
                          onClick={() =>
                            handleQuantityChange(item, item.quantity + 1)
                          }
                          disabled={
                            isUpdating ||
                            !item.isAvailable ||
                            item.quantity >= item.availableStock
                          }
                          className={stepperBtn}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Remove item */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isRemoving}
                        aria-label="Remove item"
                        title="Remove"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-400 disabled:opacity-50"
                      >
                        {isRemoving ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Order summary */}
          <aside className="h-fit rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-200/60 lg:sticky lg:top-24">
            <div className="border-b border-stone-100 bg-[#faf8f4] px-6 py-4">
              <h2 className="text-base font-semibold text-stone-900">
                Order summary
              </h2>
            </div>

            <div className="space-y-3 px-6 py-5 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Total items</span>
                <span className="text-stone-900">{cart.totalItems}</span>
              </div>

              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="text-stone-900">
                  {formatPrice(cart.subtotal)}
                </span>
              </div>

              <div className="flex justify-between border-t border-stone-100 pt-4 text-base font-semibold text-stone-900">
                <span>Total</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
            </div>

            <div className="px-6 pb-6">
              {/* Checkout button */}
              {hasInvalidItems ? (
                <button
                  disabled
                  className="w-full cursor-not-allowed rounded-full bg-stone-300 py-2.5 text-[13px] font-medium text-stone-500"
                  title="Resolve unavailable or insufficient-stock items first"
                >
                  Proceed to checkout
                </button>
              ) : (
                <Link
                  to="/checkout"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
                >
                  Proceed to checkout
                  <ArrowRight size={14} />
                </Link>
              )}

              <Link
                to="/products"
                className="mt-3 block text-center text-[13px] text-stone-600 transition-colors hover:text-stone-900"
              >
                Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Cart;