import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import {CartProvider} from "./context/CartContext"
import Navbar from "./components/common/Navbar";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
        <Navbar />
        <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;