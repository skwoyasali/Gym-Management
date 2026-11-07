import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import CompleteProfile from "./pages/auth/completeProfile";
import ActivateMember from "./pages/auth/ActivateMember";

import AdminLayout from "./components/layout/AppLayout";
import MemberLayout from "./components/layout/MemberLayout";
import Dashboard from "./pages/admin/Dashboard";
import Members from "./pages/admin/Members";
import Attendance from "./pages/admin/Attendance";
import MemberDashboard from "./pages/member/MemberDashboard";
import MemberCheckIn from "./pages/member/MemberCheckIn";
import Landing from "./pages/Landing";
import ProtectedRoute from "./routes/ProtectedRoute";
import {
  PlansRoute,
  RechargeRequestsRoute,
  SettingsRoute,
} from "./routes/AdminLazyPages";
import {
  RechargeHistoryRoute,
  RechargePlanRoute,
} from "./routes/MemberLazyPages";
// import Members from "./pages/admin/Members";
// import Attendance from "./pages/admin/Attendance";
// import Payments from "./pages/admin/Payments";
// import Plans from "./pages/admin/Plans";
// import Trainers from "./pages/admin/Trainers";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },

  {
    path: "/login",
    element: <Login />,
  },

  {
    path: "/register",
    element: <Register />,
  },

  {
    path: "/activate-member",
    element: <ActivateMember />,
  },

  {
    path: "/complete-profile",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <CompleteProfile />
      </ProtectedRoute>
    ),
  },

  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
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
      {
        path: "attendance",
        element: <Attendance />,
      },
      {
        path: "plans",
        element: <PlansRoute />,
      },
      {
        path: "recharge-requests",
        element: <RechargeRequestsRoute />,
      },
      {
        path: "settings",
        element: <SettingsRoute />,
      },
    ],
  },

  {
    path: "/member",
    element: (
      <ProtectedRoute allowedRoles={["member"]}>
        <MemberLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="check-in" replace />,
      },
      {
        path: "dashboard",
        element: <MemberDashboard />,
      },
      {
        path: "recharge",
        element: <RechargePlanRoute />,
      },
      {
        path: "history",
        element: <RechargeHistoryRoute />,
      },
      {
        path: "check-in",
        element: <MemberCheckIn />,
      },
    ],
  },

  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;