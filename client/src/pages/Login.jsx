import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Login() {
    const navigate = useNavigate();
    const { login, googleLogin } = useAuth();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try{
            await login(formData);
            navigate("/");
        } catch(err){
            setError(err.response?.data?.message || "Login failed");
        }finally{
            setLoading(false);
        }
    };

    return (
        <div>
      <h1>Login</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <hr />

      <button type="button" onClick={googleLogin}>
        Continue with Google
      </button>

      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
    )
}

export default Login;