import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("../pages/superadmin/Dashboard"));
const Gyms = lazy(() => import("../pages/superadmin/Gyms"));
const GymDetails = lazy(() => import("../pages/superadmin/GymDetails"));
const Billing = lazy(() => import("../pages/superadmin/Billing"));
const Pricing = lazy(() => import("../pages/superadmin/Pricing"));

const PageFallback = ({ children }) => (
  <p className="p-6 text-sm text-slate-500">Loading {children}...</p>
);

export function SuperAdminDashboardRoute() {
  return (
    <Suspense fallback={<PageFallback>dashboard</PageFallback>}>
      <Dashboard />
    </Suspense>
  );
}

export function SuperAdminGymsRoute() {
  return (
    <Suspense fallback={<PageFallback>gyms</PageFallback>}>
      <Gyms />
    </Suspense>
  );
}

export function SuperAdminGymDetailsRoute() {
  return (
    <Suspense fallback={<PageFallback>gym</PageFallback>}>
      <GymDetails />
    </Suspense>
  );
}

export function SuperAdminBillingRoute() {
  return (
    <Suspense fallback={<PageFallback>billing</PageFallback>}>
      <Billing />
    </Suspense>
  );
}

export function SuperAdminPricingRoute() {
  return (
    <Suspense fallback={<PageFallback>pricing</PageFallback>}>
      <Pricing />
    </Suspense>
  );
}
