import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate, NavLink, Link } from "react-router-dom";

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-orange-100 text-orange-800"
      : "text-amber-100 hover:bg-orange-700/60 hover:text-white"
  }`;

/* Cart is only shown to logged-in users */
function NavLinks({ user, className = "" }) {
  const links = [
    { to: "/", label: "Home", end: true },
    { to: "/products", label: "Products" },
    ...(user ? [{ to: "/cart", label: "Cart" }] : []),
  ];

  return (
    <div className={className}>
      {links.map(({ to, label, end }) => (
        <NavLink key={to} to={to} end={end} className={navLinkClass}>
          {label}
        </NavLink>
      ))}
    </div>
  );
}

function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full bg-orange-700/40 py-1 pl-1 pr-3 text-amber-100 ring-1 ring-orange-500/50 transition hover:bg-orange-700/70 focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-700 text-sm font-bold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[8rem] truncate text-sm font-medium sm:block">
          {user.name || "Account"}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-orange-200 bg-amber-50 shadow-xl"
        >
          <div className="bg-gradient-to-r from-orange-600 to-red-700 px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">
              {user.name || "Not provided"}
            </p>
            <p className="truncate text-xs text-amber-100">{user.email}</p>
          </div>

          <ul className="divide-y divide-orange-100 text-sm text-stone-700">
            <li className="flex items-center justify-between px-4 py-2">
              <span className="text-stone-500">Role</span>
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold capitalize text-amber-900">
                {user.role}
              </span>
            </li>
            <li className="flex items-center justify-between px-4 py-2">
              <span className="text-stone-500">Verified</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  user.emailVerified
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {user.emailVerified ? "Yes" : "No"}
              </span>
            </li>
          </ul>

          <div className="border-t border-orange-200 p-2">
            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-orange-800 hover:bg-orange-100"
            >
              View Profile
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function AuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <Link
        to="/login"
        className="rounded-md px-3 py-2 text-sm font-medium text-amber-100 ring-1 ring-orange-500/60 transition hover:bg-orange-700/60 hover:text-white"
      >
        Login
      </Link>
      <Link
        to="/register"
        className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-orange-500"
      >
        Sign Up
      </Link>
    </div>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-orange-600 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand + desktop links */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-xl font-bold tracking-wide text-orange-400 hover:text-orange-300"
          >
            🍂 My Store
          </Link>
          <NavLinks user={user} className="hidden items-center gap-1 sm:flex" />
        </div>

        {/* Right side: depends on auth state */}
        {user ? (
          <div className="flex items-center gap-3">
            <UserMenu user={user} />
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              Logout
            </button>
          </div>
        ) : (
          <AuthButtons />
        )}
      </div>

      {/* Mobile links */}
      <NavLinks
        user={user}
        className="flex items-center justify-center gap-1 border-t border-orange-900/50 pb-2 pt-1 sm:hidden"
      />
    </nav>
  );
}

export default Navbar;