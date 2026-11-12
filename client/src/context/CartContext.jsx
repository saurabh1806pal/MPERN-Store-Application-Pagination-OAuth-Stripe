import {
    createContext, useContext, useState, useEffect, useCallback
} from "react";

import api from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const CartProvider = ({children}) => {
    const {user, loading: authLoading} = useAuth();

    // Cart States
    const [cart, setCart] = useState({
        id: null,
        items: [],
        totalItems: 0,
        subtotal: 0
    })

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");



    // fetch cart items
    const fetchCart = useCallback(async () => {
        if(!user) return null;
        try{
            setLoading(true);
            setError("")
            const response = await api.get("/cart");
            setCart(response.data.cart);
            return response.data.cart;

        }catch(error){
            setError(error.response?.data?.message || "Unable to Fetch Cart")
            throw error;
        }finally{
            setLoading(false)
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
            setError(error.response?.data?.message || "Unable to add product into the Cart");
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
    if (authLoading) return;

    if(user){
        fetchCart().catch(() => {})
    }else{
        setCart({
            id: null,
            items: [],
            totalItems: 0,
            subtotal: 0
        })
        setError("")
        setLoading(false)
    }
  }, [user, authLoading, fetchCart]);

  const value = {
    cart, loading, error, fetchCart, addToCart, updateCartItem, removeCartItem, clearCart
  };

  return (
    <CartContext.Provider value = {value}>  {children}</CartContext.Provider>
  )

}

export const useCart = () => {
    const context = useContext(CartContext);

    if(!context) {
        throw new Error("Use Cart must be used inside a CartProvider")
    }
    return context;
}