import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";

export default function Topbar({ toggleSidebar }) {
  const navigate = useNavigate();

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Later you can fetch these from your API
  const user = {
    name: "Admin",
    email: "admin@gympro.com",
    role: "Super Admin",
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="h-16 bg-white border-b shadow-sm flex items-center justify-between px-4 md:px-6">
      {/* Left */}
      <div className="flex items-center gap-4">
     

        <div>
          <h2 className="text-xl md:text-2xl font-bold">
            Gym Management
          </h2>

          <p className="hidden md:block text-sm text-gray-500">
            Welcome to the Admin Dashboard
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-3 hover:bg-gray-100 rounded-lg px-2 py-1 transition"
        >
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            {user.name.charAt(0)}
          </div>

          <div className="hidden md:block text-left">
            <p className="font-semibold">{user.name}</p>
            <p className="text-xs text-gray-500">{user.role}</p>
          </div>
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-lg border overflow-hidden z-50">
            {/* Profile Info */}
            <div className="p-5 border-b">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                  {user.name.charAt(0)}
                </div>

                <div>
                  <h3 className="font-semibold text-lg">
                    {user.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {user.email}
                  </p>

                  <p className="text-xs text-blue-600 mt-1">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu */}
            <button
              onClick={() => navigate("/admin/profile")}
              className="w-full text-left px-5 py-3 hover:bg-gray-100"
            >
              👤 My Profile
            </button>

            <button
              onClick={() => navigate("/admin/settings")}
              className="w-full text-left px-5 py-3 hover:bg-gray-100"
            >
              ⚙️ Settings
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-left px-5 py-3 text-red-600 hover:bg-red-50"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}