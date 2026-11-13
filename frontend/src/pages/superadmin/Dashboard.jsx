import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CreditCard,
  IndianRupee,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { getSuperAdminDashboard } from "../../services/billingService";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const count = new Intl.NumberFormat("en-IN");

export default function SuperAdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSuperAdminDashboard()
      .then((response) => setSummary(response.data.data))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ||
            "Unable to load platform statistics."
        )
      );
  }, []);

  const stats = summary
    ? [
        ["Total gyms", count.format(summary.totalGyms), Building2, "bg-indigo-50 text-indigo-600"],
        ["Active gyms", count.format(summary.activeGyms), UserRoundCheck, "bg-emerald-50 text-emerald-600"],
        ["Inactive gyms", count.format(summary.inactiveGyms), Building2, "bg-amber-50 text-amber-600"],
        ["Active memberships", count.format(summary.totalMembers), Users, "bg-violet-50 text-violet-600"],
        ["Membership revenue", money.format(summary.totalMembershipRevenue), IndianRupee, "bg-sky-50 text-sky-600"],
        ["GymPro collected", money.format(summary.totalPlatformRevenue), CreditCard, "bg-emerald-50 text-emerald-600"],
        ["GymPro outstanding", money.format(summary.outstandingBalance), IndianRupee, "bg-rose-50 text-rose-600"],
        ["Rate per member / month", money.format(summary.pricePerMemberMonth), IndianRupee, "bg-slate-100 text-slate-600"],
      ]
    : [];

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Platform overview</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Super Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Monitor gyms, memberships, and GymPro billing from one place.
          </p>
        </div>
        <Link
          to="/super-admin/gyms"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Manage gyms <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>
      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {!summary && !error ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Loading platform statistics…
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Platform statistics">
          {stats.map(([title, value, Icon, color]) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold text-slate-900">{value}</p>
            </article>
          ))}
        </section>
      )}
      {summary && (
        <section className="rounded-2xl bg-slate-900 p-6 text-white sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-300">Platform billing</p>
            <h2 className="mt-1 text-xl font-semibold">
              {money.format(summary.totalPlatformPayable)} total GymPro billing
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              {money.format(summary.totalPlatformRevenue)} received · {money.format(summary.outstandingBalance)} outstanding
            </p>
          </div>
          <Link to="/super-admin/billing" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 hover:text-white sm:mt-0">
            View billing <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      )}
    </div>
  );
}
