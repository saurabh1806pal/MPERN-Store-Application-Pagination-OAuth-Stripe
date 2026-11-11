import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";

import api from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch user data on Component mount 

    const refreshUser = useCallback(async() => {
        try{
            const response = await api.get("/auth/me");

            const currentUser = response.data.user ?? response.data.data ?? response.data;

            setUser(currentUser);
            return currentUser;
        }catch(error){
            setUser(null);
            console.error("Error fetching user data:", error);

        }finally{
            setLoading(false);
        }
    }, []);

    // Check Authentication when Application loads;

    
    useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
        try {
        const response = await api.get("/auth/me");

        const currentUser =
            response.data.user ??
            response.data.data ??
            response.data;

        if (isMounted) {
            setUser(currentUser);
        }
        } catch (error) {
            console.error("Error fetching user data:", error);
        if (isMounted) {
            setUser(null);
        }
        } finally {
        if (isMounted) {
            setLoading(false);
        }
        }
    };

    initializeAuth();

    return () => {
        isMounted = false;
    };
    }, []);


    // Login using Email and Password

    const login = async (credentials) => {
        await api.post("/auth/login", credentials);
        return await refreshUser();
    }

    // Logout the current user

    const logout = async () => {
        try{
            await api.post("/auth/logout");
            
        }finally{
            setUser(null);
            console.log("User logged out successfully");
        }
    };

    // Start Google Auth

    const googleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
    };

    // Register a new User

    const register = async (userData) => {
        const response = await api.post("/auth/register", userData);
        return response.data;
    }

    const value = {
        user, loading, isAuthenticated: Boolean(user), login, logout, googleLogin, refreshUser, register
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the AuthContext

export const useAuth = () => {
    const context = useContext(AuthContext);

    if(!context){
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
};