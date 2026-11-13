import { lazy, Suspense } from "react";

const Plans = lazy(() => import("../pages/admin/Plans"));
const Settings = lazy(() => import("../pages/admin/Settings"));
const Billing = lazy(() => import("../pages/admin/Billing"));
const RechargeRequests = lazy(() =>
  import("../pages/admin/RechargeRequests")
);

const PageFallback = ({ children }) => (
  <p className="p-6 text-sm text-slate-500">Loading {children}...</p>
);

export function PlansRoute() {
  return (
    <Suspense fallback={<PageFallback>plans</PageFallback>}>
      <Plans />
    </Suspense>
  );
}

export function SettingsRoute() {
  return (
    <Suspense fallback={<PageFallback>settings</PageFallback>}>
      <Settings />
    </Suspense>
  );
}

export function BillingRoute() {
  return (
    <Suspense fallback={<PageFallback>billing</PageFallback>}>
      <Billing />
    </Suspense>
  );
}

export function RechargeRequestsRoute() {
  return (
    <Suspense fallback={<PageFallback>recharge requests</PageFallback>}>
      <RechargeRequests />
    </Suspense>
  );
}
