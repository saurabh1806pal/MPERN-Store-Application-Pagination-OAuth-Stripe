
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";

function EmailVerification() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  // Prevent duplicate requests during React StrictMode development checks.
  const requestStarted = useRef(false);

  useEffect(() => {
    if (requestStarted.current) return;

    requestStarted.current = true;

    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const response = await api.get("/auth/verify-email", {
          params: { token },
        });

        setStatus("success");
        setMessage(
          response.data.message || "Email verified successfully."
        );
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Email verification failed. Please try again."
        );
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div>
      <h1>Email Verification</h1>

      {status === "loading" && (
        <p>Verifying your email. Please wait...</p>
      )}

      {status === "success" && (
        <div>
          <p>{message}</p>
          <Link to="/login">Go to Login</Link>
        </div>
      )}

      {status === "error" && (
        <div>
          <p>{message}</p>
          <Link to="/register">Back to Register</Link>
        </div>
      )}
    </div>
  );
}

export default EmailVerification;
