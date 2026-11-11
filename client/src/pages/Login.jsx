import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";


const initialForm = {
  email: "",
  password: "",
};

function Field({ id, label, ...props }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-orange-900"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2.5 text-sm text-orange-950 placeholder-orange-300 shadow-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
        {...props}
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.9h5.35c-.23 1.4-1.65 4.1-5.35 4.1a6 6 0 010-12c1.9 0 3.17.8 3.9 1.5l2.65-2.55C17.85 3.5 15.15 2.4 12 2.4a9.6 9.6 0 100 19.2c5.55 0 9.2-3.9 9.2-9.4 0-.63-.07-1.1-.15-1.1z"
      />
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(formData);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">


      <main className="mx-auto flex max-w-md flex-col px-4 py-10 sm:py-16">
        <div className="overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-lg shadow-orange-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-6 text-center">
            <div className="text-3xl">🍂</div>
            <h1 className="mt-1 text-2xl font-bold text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-orange-100">
              Log in to continue shopping
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4 px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-orange-300 bg-orange-100 px-3 py-2 text-sm font-medium text-orange-900"
                >
                  {error}
                </div>
              )}

              <Field
                id="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />

              <Field
                id="password"
                label="Password"
                type="password"
                placeholder="Your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-orange-300"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-orange-200" />
              <span className="text-xs font-medium uppercase tracking-wide text-orange-400">
                or
              </span>
              <div className="h-px flex-1 bg-orange-200" />
            </div>

            <button
              type="button"
              onClick={googleLogin}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-orange-300 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 shadow-sm transition hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </div>

          {/* Footer */}
          <div className="border-t border-orange-100 bg-orange-50 px-6 py-4 text-center text-sm text-orange-800">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-orange-600 underline-offset-2 hover:text-orange-700 hover:underline"
            >
              Register
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;