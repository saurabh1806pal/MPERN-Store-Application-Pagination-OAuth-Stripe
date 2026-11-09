
import { useAuth } from "../context/AuthContext.jsx";

function Home() {
  const {
    user,
    loading,
    isAuthenticated,
    logout,
  } = useAuth();

  if (loading) {
    return <div className="p-8">Checking authentication...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-10 text-white">
      <h1 className="text-3xl font-bold">
        Welcome to MPERN Store
      </h1>

      {isAuthenticated ? (
        <div className="mt-6 space-y-3">
          <p>Welcome, {user.name || user.email}</p>
          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>

          <button
            onClick={logout}
            className="rounded-lg bg-red-600 px-5 py-2"
          >
            Logout
          </button>
        </div>
      ) : (
        <p className="mt-6 text-slate-400">
          You are currently logged out.
        </p>
      )}
    </div>
  );
}

export default Home;
