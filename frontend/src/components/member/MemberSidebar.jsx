import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarCheck,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  X,
} from "lucide-react";

const accountLinks = [
  { label: "Dashboard", to: "/member/dashboard", icon: LayoutDashboard },
  { label: "Recharge Plan", to: "/member/recharge", icon: CreditCard },
  { label: "Recharge History", to: "/member/history", icon: ReceiptText },
];

export default function MemberSidebar({
  user,
  mobileOpen,
  onClose,
  onLogout,
}) {
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen, onClose]);

  const renderLink = ({ label, to, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      end
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
          isActive
            ? "bg-indigo-500 text-white shadow-md shadow-indigo-950/20"
            : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`h-5 w-5 shrink-0 ${
              isActive ? "text-white" : "text-slate-500"
            }`}
            aria-hidden="true"
          />
          <span>{label}</span>
          {isActive && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close member navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(16rem,85vw)] flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-300 lg:w-[250px] lg:translate-x-0 lg:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800/80 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-950/30">
              <Dumbbell className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">
                GymPro
              </p>
              <p className="text-xs text-slate-400">Member portal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-6" aria-label="Member navigation">
          <section className="space-y-1">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              My Account
            </p>
            {accountLinks.map(renderLink)}
          </section>
          <section className="space-y-1">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Attendance
            </p>
            {renderLink({
              label: "Check In",
              to: "/member/check-in",
              icon: CalendarCheck,
            })}
          </section>
        </nav>

        <div className="border-t border-slate-800/80 p-4">
          <div className="mb-3 flex min-w-0 items-center gap-3 rounded-xl bg-slate-800/70 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-200">
              {(user?.username || user?.name || "M").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">
                {user?.username || user?.name || "Member"}
              </p>
              <p className="truncate text-xs text-slate-400">
                {user?.email || "GymPro member"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
