import { useCallback, useState } from "react";
import { Menu } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import MemberSidebar from "../member/MemberSidebar";
import MemberAvatar from "../common/MemberAvatar";
import { logout as clearStoredAuth } from "../../services/authService";
import { logout } from "../../store/authSlice";

export default function MemberLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const closeMobileSidebar = useCallback(
    () => setMobileSidebarOpen(false),
    []
  );

  const handleLogout = () => {
    clearStoredAuth();
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <MemberSidebar
        user={user}
        mobileOpen={mobileSidebarOpen}
        onClose={closeMobileSidebar}
        onLogout={handleLogout}
      />
      <div className="min-w-0 flex-1 lg:ml-[250px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open member navigation"
            aria-expanded={mobileSidebarOpen}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="font-bold text-slate-900">GymPro</span>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <MemberAvatar
              name={user?.username || user?.name}
              photoUrl={
                user?.memberId
                  ? `/members/${user.memberId}/photo`
                  : null
              }
              className="h-8 w-8 text-xs"
            />
            <span className="max-w-[40vw] truncate text-sm text-slate-500">
              {user?.username || user?.name || "Member"}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
