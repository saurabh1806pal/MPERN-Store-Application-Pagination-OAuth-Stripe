import {
    createContext, useContext, useState, useEffect, useCallback
} from "react";

import api from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();
const EMPTY_CART = {
  id: null,
  items: [],
  totalItems: 0,
  subtotal: 0
};

export const CartProvider = ({children}) => {
    const {user, loading: authLoading} = useAuth();

    // Cart States
    const [cart, setCart] = useState(EMPTY_CART)

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");



    // fetch cart items
    const fetchCart = useCallback(async ({ silent = false } = {}) => {
    if (!user) return null;

    try {
        if (!silent) {
            setLoading(true);
            setError("");
        }

        const response = await api.get("/cart");
        setCart(response.data.cart);

        return response.data.cart;

    } catch (error) {
        if (!silent) {
            setError(
                error.response?.data?.message || "Unable to Fetch Cart"
            );
        }

        throw error;

    } finally {
        if (!silent) {
            setLoading(false);
        }
    }
}, [user]);


    // Add Product to Cart

    const addToCart = async (productId, quantity = 1) => {
        try{
            setError("");
            const response = await api.post("/cart/items", {
                productId: productId, quantity: quantity
            });
            setCart(response.data.cart)
            return response.data
        }catch(error){
            console.log(error);
            throw error;
        }
    }

    const updateCartItem = async (itemId, quantity) => {
    try {
      setError("");

      const response = await api.patch(
        `/cart/items/${itemId}`,
        { quantity }
      );

      setCart(response.data.cart);

      return response.data;

    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Unable to update cart"
      );

      throw error;
    }
  };

  // --------------------------------------------------
  // REMOVE CART ITEM
  // --------------------------------------------------

  const removeCartItem = async (itemId) => {
    try {
      setError("");

      const response = await api.delete(
        `/cart/items/${itemId}`
      );

      setCart(response.data.cart);

      return response.data;

    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Unable to remove product"
      );

      throw error;
    }
  };

  // --------------------------------------------------
  // CLEAR CART
  // --------------------------------------------------

  const clearCart = async () => {
    try {
      setError("");

      const response = await api.delete("/cart");

      setCart(response.data.cart);

      return response.data;

    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Unable to clear cart"
      );

      throw error;
    }
  };


  // Initiate the Cart

  useEffect(() => {
  if (authLoading || !user) return;

  let ignore = false;

  const loadCart = async () => {
    try {
      const response = await api.get("/cart");

      if (!ignore) {
        setCart(response.data.cart);
      }
    } catch (error) {
      if (!ignore) {
        setError(
          error.response?.data?.message || "Unable to Fetch Cart"
        );
      }
    }
  };

  loadCart();

  return () => {
    ignore = true;
  };
}, [user, authLoading]);

  const value = {
  cart: user ? cart : EMPTY_CART,
  loading: user ? loading : false,
  error: user ? error : "",
  fetchCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};

  return (
    <CartContext.Provider value = {value}>  {children}</CartContext.Provider>
  )

}
// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
    const context = useContext(CartContext);

    if(!context) {
        throw new Error("Use Cart must be used inside a CartProvider")
    }
    return context;
}