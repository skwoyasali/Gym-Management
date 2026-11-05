import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Building2,
  ChevronDown,
  Menu,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";
import { logout as clearStoredAuth } from "../../services/authService";
import { logout } from "../../store/authSlice";

export default function Topbar({ onOpenSidebar }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const account = useSelector((state) => state.auth.user);

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const user = {
    name: account?.username || "Gym Admin",
    email: account?.email || "",
    role: account?.role === "admin" ? "Gym Owner" : "Admin",
  };

  const handleLogout = () => {
    clearStoredAuth();
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-3 shadow-sm backdrop-blur sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation menu"
          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-100 lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
          <Building2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            {account?.tenantName || "Gym Management"}
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            Welcome to the Admin Dashboard
          </p>
        </div>
      </div>

      <div className="relative ml-3" ref={menuRef}>
        <button
          type="button"
          onClick={() => setShowMenu((isOpen) => !isOpen)}
          aria-haspopup="menu"
          aria-expanded={showMenu}
          aria-label="Open account menu"
          className="flex items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100 sm:gap-3 sm:px-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 ring-2 ring-white">
            {user.name.charAt(0)}
          </span>
          <span className="hidden sm:block">
            <span className="block text-sm font-semibold leading-5 text-slate-800">
              {user.name}
            </span>
            <span className="block text-xs text-slate-500">{user.role}</span>
          </span>
          <ChevronDown
            className={`hidden h-4 w-4 text-slate-400 transition sm:block ${
              showMenu ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>

        {showMenu && (
          <div
            role="menu"
            className="absolute right-0 mt-3 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10"
          >
            <div className="bg-gradient-to-br from-indigo-50 to-white p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white shadow-sm">
                  {user.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {user.name}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {user.email}
                  </p>
                  <p className="mt-1 text-xs font-medium text-indigo-600">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setShowMenu(false);
                  navigate("/admin/profile");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <UserRound className="h-4 w-4 text-slate-400" aria-hidden="true" />
                My Profile
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setShowMenu(false);
                  navigate("/admin/settings");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <Settings className="h-4 w-4 text-slate-400" aria-hidden="true" />
                Settings
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-100"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
