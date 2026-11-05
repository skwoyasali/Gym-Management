import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import CompleteProfile from "./pages/auth/completeProfile";

import AdminLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/admin/Dashboard";
import Members from "./pages/admin/Members";
// import Members from "./pages/admin/Members";
// import Attendance from "./pages/admin/Attendance";
// import Payments from "./pages/admin/Payments";
// import Plans from "./pages/admin/Plans";
// import Trainers from "./pages/admin/Trainers";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },

  {
    path: "/register",
    element: <Register />,
  },

  {
    path: "/complete-profile",
    element: <CompleteProfile />,
  },

  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
        {
        path: "members",
        element: <Members />,
      },
      
    ],
  },

  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

export default router;