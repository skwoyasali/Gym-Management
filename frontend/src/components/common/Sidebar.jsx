import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Users,
  UserRoundCog,
  X,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Members", path: "/admin/members", icon: Users },
  { name: "Attendance", path: "/admin/attendance", icon: BarChart3 },
  { name: "Payments", path: "/admin/payments", icon: CreditCard },
  { name: "Plans", path: "/admin/plans", icon: Dumbbell },
  { name: "Recharge Requests", path: "/admin/recharge-requests", icon: ReceiptText },
  { name: "Settings", path: "/admin/settings", icon: Settings },
  { name: "Trainers", path: "/admin/trainers", icon: UserRoundCog },
];

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) {
  useEffect(() => {
    if (!mobileOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCloseMobile();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen, onCloseMobile]);

  const sidebarContent = (
    <>
      <div
        className={`flex h-20 items-center justify-between border-b border-slate-800/80 px-5 ${
          collapsed ? "lg:justify-center lg:px-3" : ""
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-950/30">
            <Dumbbell className="h-5 w-5" aria-hidden="true" />
          </div>
          <div
            className={`min-w-0 ${
              collapsed ? "lg:hidden" : ""
            }`}
          >
            <p className="truncate text-lg font-bold tracking-tight text-white">
              GymPro
            </p>
            <p className="truncate text-xs text-slate-400">Gym management</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:block"
        >
          <LayoutDashboard
            className={`h-4 w-4 transition-transform ${
              collapsed ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Main navigation">
        <p
          className={`mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 ${
            collapsed ? "lg:hidden" : ""
          }`}
        >
          Workspace
        </p>
        {menuItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/admin/dashboard"}
            title={collapsed ? name : undefined}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                collapsed ? "lg:justify-center lg:px-3" : ""
              } ${
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
                    isActive
                      ? "text-white"
                      : "text-slate-500 group-hover:text-slate-200"
                  }`}
                  aria-hidden="true"
                />
                <span className={collapsed ? "lg:hidden" : ""}>{name}</span>
                {!collapsed && isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                )}
                {collapsed && isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white lg:hidden" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800/80 p-4">
        <div
          className={`flex items-center gap-3 rounded-xl bg-slate-800/70 p-3 ${
          collapsed ? "lg:justify-center" : ""
          }`}
          title={collapsed ? "Gym workspace active" : undefined}
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
            <p className="text-xs font-medium text-slate-200">Gym workspace</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Active</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col bg-slate-900 text-white shadow-2xl transition-[transform,width] duration-300 ease-in-out lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0 lg:shadow-none ${
          collapsed ? "lg:w-[5.25rem]" : "lg:w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
