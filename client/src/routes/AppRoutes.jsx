import { Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home";
import Register from "../pages/Register";
import Products from "../pages/Products";
import ProductDetails from "../pages/ProductDetails";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";
import AdminDashboard from "../pages/AdminDashboard";
import EmailVerification from "../pages/EmailVerification";
import CheckEmail from "../pages/CheckEmail.jsx";
import Cart from "../pages/Cart.jsx";
import Checkout from "../pages/Checkout.jsx";

// Import the ProtectedRoutes component
import ProtectedRoutes from "./ProtectedRoutes.jsx";

// Import the PublicOnlyRoute component
import PublicOnlyRoute from "./PublicOnlyRoute.jsx";

function AppRoutes() {
    return (
        <Routes>
            {/*Public Routes */}
            <Route path="/" element={<Home />} />
            <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<EmailVerification />}/>
                <Route path="/check-email" element={<CheckEmail />}/>
            </Route>
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />

            {/* Private Routes */}
            <Route element={<ProtectedRoutes />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
            </Route>

            {/* Catch-all route for 404 Not Found */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default AppRoutes;