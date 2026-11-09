import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function ProtectedRoutes(){
    const { isAuthenticated, loading } = useAuth();

    if(loading){
        return <p>Checking Authentication...</p>
    };

    if(!isAuthenticated){
        return <Navigate to="/login" />;
    }

    return <Outlet />;
}

export default ProtectedRoutes;