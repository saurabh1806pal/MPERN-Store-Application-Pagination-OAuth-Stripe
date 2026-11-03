import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-3 text-slate-500">Page not found.</p>

      <Link
        to="/"
        className="mt-5 rounded-lg bg-blue-600 px-5 py-3 text-white"
      >
        Back to Home
      </Link>
    </div>
  );
}

export default NotFound;