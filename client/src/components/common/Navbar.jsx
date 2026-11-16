import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate, useLocation, NavLink, Link } from "react-router-dom";
import { ShoppingBag, LogOut, ChevronDown } from "lucide-react";

const navLinkClass = ({ isActive }) =>
  `relative py-2 text-[13px] tracking-wide transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:transition-colors ${
    isActive
      ? "font-medium text-stone-900 after:bg-stone-900"
      : "text-stone-500 after:bg-transparent hover:text-stone-900"
  }`;

function ModeToggle({ adminMode, onChange }) {
  const options = [
    { label: "User", value: false },
    { label: "Admin", value: true },
  ];

  return (
    <div
      role="group"
      aria-label="View mode"
      className="flex rounded-full bg-stone-200/70 p-0.5"
    >
      {options.map(({ label, value }) => {
        const active = adminMode === value;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={active}
            onClick={() => !active && onChange(value)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-widest transition-all ${
              active
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function UserMenu({ user, onLogout }) {
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
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-stone-200/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-400"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-800 text-xs font-medium text-stone-50">
          {initial}
        </span>
        <ChevronDown
          size={14}
          className={`text-stone-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg shadow-stone-200/60"
        >
          <div className="px-4 py-3">
            <p className="truncate text-sm font-medium text-stone-900">
              {user.name || "Not provided"}
            </p>
            <p className="truncate text-xs text-stone-500">{user.email}</p>
          </div>

          <dl className="space-y-2 border-t border-stone-100 bg-[#faf8f4] px-4 py-3 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-stone-500">Role</dt>
              <dd className="font-medium capitalize text-stone-800">
                {user.role?.toLowerCase()}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-stone-500">Verified</dt>
              <dd className="flex items-center gap-1.5 font-medium text-stone-800">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    user.emailVerified ? "bg-stone-800" : "bg-stone-400"
                  }`}
                />
                {user.emailVerified ? "Yes" : "No"}
              </dd>
            </div>
          </dl>

          <div className="border-t border-stone-100 p-1.5">
            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-[13px] text-stone-700 transition-colors hover:bg-stone-100"
            >
              View profile
            </Link>
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] text-stone-700 transition-colors hover:bg-stone-100"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuthButtons() {
  return (
    <div className="flex items-center gap-4">
      <Link
        to="/login"
        className="text-[13px] text-stone-600 transition-colors hover:text-stone-900"
      >
        Login
      </Link>
      <Link
        to="/register"
        className="rounded-full bg-stone-900 px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-stone-700"
      >
        Sign up
      </Link>
    </div>
  );
}

function CartButton() {
  return (
    <Link
      to="/cart"
      aria-label="Shopping cart"
      className="rounded-full p-2 text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900"
    >
      <ShoppingBag size={18} strokeWidth={1.75} />
    </Link>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isAdmin = user?.role === "ADMIN";
  // Mode comes from the URL, so it survives refresh and back/forward
  const adminMode = isAdmin && pathname.startsWith("/admin");

  const handleModeChange = (toAdmin) => {
    navigate(toAdmin ? "/admin/products" : "/");
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200 bg-[#faf8f4]/90 font-sans backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-2 items-center gap-y-2 px-4 py-3 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
        {/* Left: brand + mode toggle */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-[15px] font-semibold tracking-tight text-stone-900"
          >
            My Store
          </Link>
          {isAdmin && (
            <ModeToggle adminMode={adminMode} onChange={handleModeChange} />
          )}
        </div>

        {/* Center: links (own row on mobile, truly centered on desktop) */}
        <div className="col-span-2 row-start-2 flex items-center justify-center gap-8 md:col-span-1 md:col-start-2 md:row-start-1">
          {!adminMode ? (
            <>
              <NavLink to="/" end className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/products" className={navLinkClass}>
                Products
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/admin/products" end className={navLinkClass}>
                View Inventory
              </NavLink>
              <NavLink to="/admin/products/create" className={navLinkClass}>
                Create Order
              </NavLink>
            </>
          )}
        </div>

        {/* Right: orders, cart, profile */}
        <div className="flex items-center justify-end gap-3 md:col-start-3">
          {user ? (
            <>
              {!adminMode && (
                <>
                  <NavLink to="/orders" className={navLinkClass}>
                    My Orders
                  </NavLink>
                  <CartButton />
                </>
              )}
              <UserMenu user={user} onLogout={handleLogout} />
            </>
          ) : (
            <AuthButtons />
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;