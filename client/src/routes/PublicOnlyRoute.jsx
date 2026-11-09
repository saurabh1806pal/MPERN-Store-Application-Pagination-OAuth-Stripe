import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function PublicOnlyRoute() {
    const { isAuthenticated, loading } = useAuth();
    if(loading){
        return <p>Checking Authentication...</p>
    }
    if(isAuthenticated){
        return <Navigate to="/" />;
    }
    return <Outlet />
}

export default PublicOnlyRoute;