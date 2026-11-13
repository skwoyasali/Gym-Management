import { useEffect, useState } from "react";
import { CreditCard, IndianRupee, ReceiptText, Wallet } from "lucide-react";
import { getGymBilling } from "../../services/billingService";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const date = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN") : "—";

export default function Billing() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "all",
    month: "",
    year: "",
  });

  const load = () => {
    setLoading(true);
    setError("");
    getGymBilling({ page, limit: 20, ...filters })
      .then((response) => setData(response.data.data))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ||
            "Unable to load GymPro billing."
        )
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getGymBilling({ page, limit: 20, ...filters })
      .then((response) => setData(response.data.data))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ||
            "Unable to load GymPro billing."
        )
      )
      .finally(() => setLoading(false));
  }, [page, filters]);

  const changeFilter = (key, value) => {
    setLoading(true);
    setError("");
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const years = [...new Set([new Date().getFullYear(), ...(data?.years || [])])]
    .sort((first, second) => second - first);
  const hasFilters =
    filters.status !== "all" || filters.month !== "" || filters.year !== "";

  const cards = data
    ? [
        {
          title: "Total payable",
          value: money.format(data.totalPayable),
          icon: IndianRupee,
          color: "bg-indigo-50 text-indigo-600",
        },
        {
          title: "Already paid",
          value: money.format(data.totalPaid),
          icon: Wallet,
          color: "bg-emerald-50 text-emerald-600",
        },
        {
          title: "Outstanding",
          value: money.format(data.outstandingBalance),
          icon: CreditCard,
          color: "bg-amber-50 text-amber-600",
        },
        {
          title: "Billable memberships",
          value: new Intl.NumberFormat("en-IN").format(data.billableMemberships),
          icon: ReceiptText,
          color: "bg-violet-50 text-violet-600",
        },
      ]
    : [];

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-indigo-600">Account billing</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          GymPro Billing
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Every new membership and recharge is billed at the rate in effect at purchase.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
          <button type="button" onClick={load} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      <section
        aria-label="GymPro billing summary"
        aria-busy={loading}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {cards.map(({ title, value, icon: Icon, color }) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-slate-900">
              {loading && !data ? "Loading…" : value}
            </p>
          </article>
        ))}
      </section>

      {data && (
        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
          <h2 className="font-semibold text-slate-900">How your total is calculated</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Each bill = membership duration × {money.format(data.pricePerMemberMonth)} per member per month.
            The current rate applies to future purchases; existing bills keep their original rate.
          </p>
        </section>
      )}

      <section
        aria-label="Filter billing transactions"
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <label className="text-xs font-medium text-slate-500">
          Payment status
          <select
            value={filters.status}
            onChange={(event) => changeFilter("status", event.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Month
          <select
            value={filters.month}
            onChange={(event) => changeFilter("month", event.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="">All months</option>
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {new Intl.DateTimeFormat("en", { month: "long" }).format(
                  new Date(2024, index, 1)
                )}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Year
          <select
            value={filters.year}
            onChange={(event) => changeFilter("year", event.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="">All years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!hasFilters}
          onClick={() => {
            setLoading(true);
            setError("");
            setPage(1);
            setFilters({ status: "all", month: "", year: "" });
          }}
          className="self-end rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear filters
        </button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Billing transactions</h2>
        </div>
        {loading && !data ? (
          <p className="p-6 text-sm text-slate-500">Loading billing history…</p>
        ) : data?.bills?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Membership plan</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Purchase date</th>
                  <th className="px-5 py-3">Rate / month</th>
                  <th className="px-5 py-3">GymPro charge</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.bills.map((bill) => (
                  <tr key={bill._id}>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {bill.memberId?.name || "Member"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{bill.planName}</td>
                    <td className="px-5 py-4 text-slate-600">{bill.durationMonths} months</td>
                    <td className="px-5 py-4 text-slate-600">{date(bill.purchasedAt)}</td>
                    <td className="px-5 py-4 text-slate-600">{money.format(bill.pricePerMemberMonth)}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{money.format(bill.amount)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        bill.status === "paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {bill.status === "paid" ? "Paid" : "Pending"}
                      </span>
                      {bill.paymentId && (
                        <p className="mt-1 text-xs text-slate-500">
                          {date(bill.paymentId.paymentDate)} · Ref {bill.paymentId.reference || "—"}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="mt-3 font-medium text-slate-700">
              {hasFilters ? "No bills match these filters" : "No GymPro bills yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {hasFilters
                ? "Try changing the status, month, or year."
                : "A bill is generated when a membership is purchased or recharged."}
            </p>
          </div>
        )}
        {data?.pagination?.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm">
            <p className="text-slate-500">
              Page {page} of {data.pagination.totalPages} · {data.pagination.total} records
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  setPage((current) => current - 1);
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= data.pagination.totalPages}
                onClick={() => {
                  setLoading(true);
                  setPage((current) => current + 1);
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
