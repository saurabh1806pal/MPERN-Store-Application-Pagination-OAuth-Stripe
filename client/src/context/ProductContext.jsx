import { createContext, useCallback, useContext, useState } from "react";
import api from "../services/api";

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all products
  const fetchProducts = useCallback(async (params = {}) => {
  try {
    setLoading(true);
    setError(null);

    const response = await api.get("/products", { params });

    setProducts(response.data.products);
    return response.data;
  } catch (error) {
    setError(error.response?.data?.message || "Failed to fetch products.");
    throw error;
  } finally {
    setLoading(false);
  }
}, []);

  // Fetch single product
const fetchProductById = useCallback(async (id) => {
    try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/products/${id}`);

        setSelectedProduct(response.data.product);

        return response.data.product;

    } catch (error) {
        setError(
            error.response?.data?.message ||
            "Failed to fetch product."
        );

        throw error;

    } finally {
        setLoading(false);
    }
}, []);

  // Create product
  const createProduct = async (productData) => {
    const response = await api.post("/products", productData);

    return response.data;
  };

  // Delete Product
  const deleteProduct = async (id) => {
    try {
      const response = await api.delete(`/products/${id}`);

      // Remove the deleted product from the local state
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product._id !== id),
      );

      // Clear selected product if it was deleted
      setSelectedProduct((prevProduct) =>
        prevProduct?._id === id ? null : prevProduct,
      );

      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete product.");
      throw error;
    }
  };

  // Update product content
  const updateProduct = async (id, productData) => {
    const response = await api.patch(`/products/${id}`, productData);

    setSelectedProduct(response.data.product);
    return response.data;
  };

  // Upload multiple product images

  const uploadProductImages = async (id, files) => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("images", file);
    });

    const response = await api.post(`/products/${id}/images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    setSelectedProduct(response.data.product);
    return response.data;
  };

  // Replace an existing image
  const replaceProductImage = async (id, imageId, file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.put(
      `/products/${id}/images/${imageId}`,
      formData,
    );

    setSelectedProduct(response.data.product);
    return response.data;
  };

  // Delete product image
  const deleteProductImage = async (id, imageId) => {
    const response = await api.delete(`/products/${id}/images/${imageId}`);

    setSelectedProduct(response.data.product);
    return response.data;
  };

  // Reorder images
  const reorderProductImages = async (id, imageOrder) => {
    const response = await api.patch(`/products/${id}/images/reorder`, {
      imageOrder,
    });

    setSelectedProduct(response.data.product);
    return response.data;
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        selectedProduct,
        loading,
        error,
        fetchProducts,
        fetchProductById,
        createProduct,
        updateProduct,
        uploadProductImages,
        replaceProductImage,
        deleteProductImage,
        reorderProductImages,
        deleteProduct
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useProducts = () => {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error("useProducts must be used within ProductProvider");
  }

  return context;
};
