
import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

import api from "../services/api";

const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch customer's orders
  const fetchOrders = useCallback(async (page = 1, limit = 10) => {
    try {
      setOrdersLoading(true);
      setError(null);

      const response = await api.get("/orders", {
        params: { page, limit },
      });

      setOrders(response.data.orders || []);
      setPagination(
        response.data.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 0,
        }
      );

      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch orders";

      setError(message);
      throw error;
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // 2. Fetch individual order details
  const fetchOrderById = useCallback(async (id) => {
    try {
      setOrderLoading(true);
      setError(null);
      setSelectedOrder(null);

      const response = await api.get(`/orders/${id}`);

      setSelectedOrder(response.data.order);

      return response.data.order;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch order";

      setError(message);
      throw error;
    } finally {
      setOrderLoading(false);
    }
  }, []);

  // 3. Create a new order
  const createOrder = useCallback(async (orderData) => {
    try {
      setActionLoading(true);
      setError(null);

      const response = await api.post("/orders", orderData);

      const newOrder = response.data.order;

      setSelectedOrder(newOrder);

      // Add the newly created order to the current order list
      setOrders((previousOrders) => [
        newOrder,
        ...previousOrders,
      ]);

      return newOrder;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create order";

      setError(message);
      throw error;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // 4. Cancel an existing order
  const cancelOrder = useCallback(async (id) => {
    try {
      setActionLoading(true);
      setError(null);

      const response = await api.patch(`/orders/${id}/cancel`);

      const cancelledOrder = response.data.order;

      // Update the order in the orders list
      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.id === cancelledOrder.id
            ? cancelledOrder
            : order
        )
      );

      // Update selected order if it is currently open
      setSelectedOrder((previousOrder) =>
        previousOrder?.id === cancelledOrder.id
          ? cancelledOrder
          : previousOrder
      );

      return cancelledOrder;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to cancel order";

      setError(message);
      throw error;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const value = {
    orders,
    selectedOrder,
    pagination,

    ordersLoading,
    orderLoading,
    actionLoading,
    error,

    fetchOrders,
    fetchOrderById,
    createOrder,
    cancelOrder,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

// Custom hook
export const useOrder = () => {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error(
      "useOrder must be used inside OrderProvider"
    );
  }

  return context;
};
