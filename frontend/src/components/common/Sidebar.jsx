import { useState } from "react";
import { NavLink } from "react-router-dom";

const menuItems = [
  { name: "Dashboard", path: "/admin/dashboard" },
  { name: "Members", path: "/admin/members" },
  { name: "Attendance", path: "/admin/attendance" },
  { name: "Payments", path: "/admin/payments" },
  { name: "Plans", path: "/admin/plans" },
  { name: "Trainers", path: "/admin/trainers" },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside
        className={`bg-slate-900 text-white min-h-screen transition-all duration-300 ${
          isOpen ? "w-64" : ""
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          {isOpen && (
            <div>
              <h1 className="text-2xl font-bold text-blue-400">GymPro</h1>
              <p className="text-xs text-slate-400">Gym Management</p>
            </div>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-2xl hover:text-blue-400 cursor-pointer"
          >
            ☰
          </button>
        </div>

        {/* Menu */}
        <nav className="mt-5 px-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-3 mb-2 transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "hover:bg-slate-800 text-slate-300"
                }`
              }
            >
              {isOpen ? item.name : item.name.charAt(0)}
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  );
}