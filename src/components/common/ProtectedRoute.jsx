import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "../ui";

const ROLE_DASHBOARD = {
  admin: "/admin",
  tutor: "/tutor/dashboard",
  student: "/student/dashboard",
};

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-muted/70">Loading...</p>
      </div>
    );
  }

  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role && user.role !== role) {
    return <Navigate to={ROLE_DASHBOARD[user.role] || "/"} replace />;
  }

  return children;
}
