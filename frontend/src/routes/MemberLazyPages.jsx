import { lazy, Suspense } from "react";

const RechargePanel = lazy(() =>
  import("../components/member/RechargePanel")
);

function PageFallback() {
  return (
    <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      Loading member information...
    </p>
  );
}

export function RechargePlanRoute() {
  return (
    <Suspense fallback={<PageFallback />}>
      <RechargePanel view="plan" />
    </Suspense>
  );
}

export function RechargeHistoryRoute() {
  return (
    <Suspense fallback={<PageFallback />}>
      <RechargePanel view="history" />
    </Suspense>
  );
}
