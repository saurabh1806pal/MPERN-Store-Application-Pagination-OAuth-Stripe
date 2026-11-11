import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";


const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
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

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate("/check-email", { state: { email: formData.email } });
    } catch (err) {
      console.error("Registration error:", err.response?.data);
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.message ||
          "Registration failed. Please try again.",
      );
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
            <h1 className="mt-1 text-2xl font-bold text-white">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-orange-100">
              Join us and start shopping
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-orange-300 bg-orange-100 px-3 py-2 text-sm font-medium text-orange-900"
              >
                {error}
              </div>
            )}

            <Field
              id="name"
              label="Name"
              type="text"
              placeholder="Your full name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />

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
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
              minLength={8}
            />

            <Field
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
              minLength={8}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-orange-300"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          {/* Footer */}
          <div className="border-t border-orange-100 bg-orange-50 px-6 py-4 text-center text-sm text-orange-800">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-orange-600 underline-offset-2 hover:text-orange-700 hover:underline"
            >
              Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Register;