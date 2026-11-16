import { BrowserRouter } from "react-router-dom";

import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { OrderProvider } from "./context/OrderContext";
import { PaymentProvider } from "./context/PaymentContext";
import { ProductProvider } from "./context/ProductContext";

import Navbar from "./components/common/Navbar";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <OrderProvider>
              <PaymentProvider>
                <Navbar />
                <AppRoutes />
              </PaymentProvider>
            </OrderProvider>
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
