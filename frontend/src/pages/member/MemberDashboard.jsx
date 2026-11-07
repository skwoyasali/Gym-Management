import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, CalendarDays, CircleAlert, CreditCard } from "lucide-react";
import { getMyAttendance } from "../../services/attendanceService";

const formatDateKey = (dateKey) => {
  if (!dateKey) return "—";
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
};

const membershipStatus = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700" },
  upcoming: { label: "Starts soon", className: "bg-indigo-50 text-indigo-700" },
  expired: { label: "Expired", className: "bg-amber-50 text-amber-700" },
  inactive: { label: "Inactive", className: "bg-slate-100 text-slate-600" },
};

export default function MemberDashboard() {
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getMyAttendance()
      .then((response) => {
        if (active) setMembership(response.data.membership);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load your membership information."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const status =
    membershipStatus[membership?.status] || membershipStatus.inactive;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-medium text-indigo-300">MEMBER PORTAL</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          Your membership
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Check your current plan and membership dates, or recharge when you’re
          ready.
        </p>
        <Link
          to="/member/recharge"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-300/30"
        >
          <CreditCard className="h-4 w-4" aria-hidden="true" />
          Recharge plan
        </Link>
      </header>

      {error && (
        <p
          className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <section
        aria-label="Membership details"
        className="grid gap-4 sm:grid-cols-2"
      >
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Membership remaining
              </p>
              {loading ? (
                <p className="mt-2 text-sm text-slate-400">Loading...</p>
              ) : (
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {membership?.daysRemaining ?? 0}
                  <span className="ml-2 text-base font-medium text-slate-500">
                    {membership?.daysRemaining === 1 ? "day" : "days"}
                  </span>
                </p>
              )}
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
            <span className="text-sm text-slate-500">
              {membership?.status === "upcoming"
                ? `Starts in ${membership.daysUntilStart} ${
                    membership.daysUntilStart === 1 ? "day" : "days"
                  }`
                : `Expires ${formatDateKey(membership?.endDate)}`}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
            >
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {status.label}
            </span>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Your plan</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {loading ? "Loading..." : membership?.planName || "No plan"}
          </p>
          <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-500">
            {membership?.startDate
              ? `Started ${formatDateKey(membership.startDate)}`
              : "Plan details are not available"}
          </p>
        </article>
      </section>
    </div>
  );
}
