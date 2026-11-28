import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  User,
  ShieldCheck,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  LogOut,
} from "lucide-react";

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600">
        <Icon size={16} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-stone-500">{label}</p>
        <div className="truncate text-sm font-medium text-stone-900">
          {children}
        </div>
      </div>
    </div>
  );
}

function Profile() {
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

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#faf8f4] font-sans">
        <p className="text-sm text-stone-500">Loading profile...</p>
      </div>
    );
  }

  const isAdmin = user.role === "ADMIN";
  const AvatarIcon = isAdmin ? ShieldCheck : User;
  const VerifiedIcon = user.emailVerified ? CheckCircle2 : AlertCircle;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#faf8f4] px-4 py-10 font-sans sm:py-16">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="mb-6 text-xl font-semibold tracking-tight text-stone-900">
          My profile
        </h1>

        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-200/60">
          {/* Header: icon avatar, name, email, role */}
          <div className="flex flex-col items-center border-b border-stone-100 bg-[#faf8f4] px-6 py-8 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-stone-800 text-stone-50 ring-4 ring-white">
              <AvatarIcon size={34} strokeWidth={1.5} />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-stone-900">
              {user.name || "Not provided"}
            </h2>
            <p className="text-sm text-stone-500">{user.email}</p>
            <span className="mt-3 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium capitalize text-stone-700">
              {user.role?.toLowerCase()}
            </span>
          </div>

          {/* Details */}
          <div className="divide-y divide-stone-100">
            <DetailRow icon={Mail} label="Email">
              {user.email}
            </DetailRow>
            <DetailRow icon={Shield} label="Role">
              <span className="capitalize">{user.role?.toLowerCase()}</span>
            </DetailRow>
            <DetailRow icon={VerifiedIcon} label="Email verified">
              {user.emailVerified ? "Yes" : "No"}
            </DetailRow>
            <DetailRow icon={CalendarDays} label="Account created">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Unavailable"}
            </DetailRow>
          </div>

          {/* Actions */}
          <div className="border-t border-stone-100 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;