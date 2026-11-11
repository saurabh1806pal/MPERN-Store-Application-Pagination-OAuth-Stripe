
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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
    return <p>Loading profile...</p>;
  }

  return (
    <>

    <div>
      <h1>My Profile</h1>

      <div>
        <p>Name: {user.name || "Not provided"}</p>
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
        <p>
          Email Verified: {user.emailVerified ? "Yes" : "No"}
        </p>
        <p>
          Account Created:{" "}
          {user.createdAt
            ? new Date(user.createdAt).toLocaleDateString()
            : "Unavailable"}
        </p>
      </div>

      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
    </>
  );
}

export default Profile;
