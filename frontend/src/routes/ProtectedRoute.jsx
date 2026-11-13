import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, token } = useSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role === "owner" ? "admin" : user.role;
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <Navigate
        to={
          role === "member"
            ? "/member/check-in"
            : role === "super_admin"
              ? "/super-admin/dashboard"
              : "/admin/dashboard"
        }
        replace
      />
    );
  }

  return children;
}
