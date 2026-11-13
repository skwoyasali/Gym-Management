import { useEffect, useState } from "react";
import { CheckCircle2, IndianRupee } from "lucide-react";
import {
  getSuperAdminBilling,
  getSuperAdminGyms,
  recordSuperAdminPayment,
} from "../../services/billingService";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const date = (value) => value ? new Date(value).toLocaleDateString("en-IN") : "—";
const today = () => new Date().toLocaleDateString("en-CA");

export default function SuperAdminBilling() {
  const [gyms, setGyms] = useState([]);
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ gymId: "", status: "all", from: "", to: "" });
  const [selected, setSelected] = useState(null);
  const [paymentDate, setPaymentDate] = useState(today());
  const [reference, setReference] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getSuperAdminGyms({ limit: 100 })
      .then((response) => setGyms(response.data.data))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load gym filters."));
  }, []);

  useEffect(() => {
    getSuperAdminBilling({ ...filters, page, limit: 20 })
      .then((response) => {
        setBills(response.data.data);
        setSummary({
          ...response.data.summary,
          gymOutstanding: response.data.gymOutstanding,
        });
        setPagination(response.data.pagination);
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load billing records."))
      .finally(() => setLoading(false));
  }, [filters, page]);

  const changeFilter = (key, value) => {
    setLoading(true);
    setError("");
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await recordSuperAdminPayment(selected._id, {
        paymentDate: new Date(`${paymentDate}T00:00:00`).toISOString(),
        reference: reference.trim(),
      });
      setNotice("Payment recorded and bill marked paid.");
      setSelected(null);
      setReference("");
      setLoading(true);
      setPage(1);
      setFilters((current) => ({ ...current }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to record this payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600">Revenue operations</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">GymPro billing</h1>
        <p className="mt-2 text-sm text-slate-500">Review gym-wise charges and record received payments.</p>
      </header>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}
      {summary && (
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["Total payable", summary.totalPayable],
            ["Payments received", summary.totalPaid],
            ["Outstanding", summary.outstanding],
          ].map(([label, amount]) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><p className="text-sm text-slate-500">{label}</p><IndianRupee className="h-5 w-5 text-indigo-500" aria-hidden="true" /></div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{money.format(amount)}</p>
            </article>
          ))}
        </section>
      )}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Gym-wise outstanding balances</h2>
        </div>
        {loading && !summary ? (
          <p className="p-5 text-sm text-slate-500">Loading gym balances…</p>
        ) : bills.length === 0 && !summary ? (
          <p className="p-5 text-sm text-slate-500">No billing data available.</p>
        ) : null}
        {summary && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-5 py-3">Gym</th><th className="px-5 py-3">Outstanding balance</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.gymOutstanding?.length ? summary.gymOutstanding.map((entry) => (
                  <tr key={entry.gymId}>
                    <td className="px-5 py-3 font-medium text-slate-800">{entry.gymName}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{money.format(entry.outstanding)}</td>
                  </tr>
                )) : <tr><td colSpan="2" className="px-5 py-5 text-center text-slate-500">No outstanding balances.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-medium text-slate-500">Gym
          <select value={filters.gymId} onChange={(event) => changeFilter("gymId", event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
            <option value="">All gyms</option>
            {gyms.map((gym) => <option key={gym._id} value={gym.ownerId}>{gym.gymName}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">Payment status
          <select value={filters.status} onChange={(event) => changeFilter("status", event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
            <option value="all">All statuses</option><option value="pending">Pending</option><option value="paid">Paid</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">From
          <input type="date" value={filters.from} onChange={(event) => changeFilter("from", event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700" />
        </label>
        <label className="text-xs font-medium text-slate-500">To
          <input type="date" value={filters.to} onChange={(event) => changeFilter("to", event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700" />
        </label>
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? <p className="p-6 text-sm text-slate-500">Loading billing records…</p> : bills.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Gym / admin</th><th className="px-5 py-3">Member</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Duration</th><th className="px-5 py-3">Purchase date</th><th className="px-5 py-3">Rate / month</th><th className="px-5 py-3">Charge</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((bill) => (
                  <tr key={bill._id}>
                    <td className="px-5 py-4"><p className="font-semibold text-slate-800">{bill.gym?.gymName || "Gym"}</p><p className="mt-1 text-xs text-slate-500">{bill.admin?.username || bill.admin?.email || "—"}</p></td>
                    <td className="px-5 py-4 text-slate-600">{bill.memberId?.name || "Member"}</td>
                    <td className="px-5 py-4 text-slate-600">{bill.planName}</td>
                    <td className="px-5 py-4 text-slate-600">{bill.durationMonths} months</td>
                    <td className="px-5 py-4 text-slate-600">{date(bill.purchasedAt)}</td>
                    <td className="px-5 py-4 text-slate-600">{money.format(bill.pricePerMemberMonth)}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{money.format(bill.amount)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${bill.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{bill.status}</span>
                      {bill.paymentId && (
                        <p className="mt-1 text-xs text-slate-500">
                          {date(bill.paymentId.paymentDate)} · Ref {bill.paymentId.reference || "—"}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">{bill.status === "pending" ? <button type="button" onClick={() => { setSelected(bill); setPaymentDate(today()); }} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700">Mark paid</button> : <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Recorded</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="p-10 text-center text-sm text-slate-500">No billing records match these filters.</div>}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm">
            <p className="text-slate-500">Page {page} of {pagination.totalPages} · {pagination.total} records</p>
            <div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Previous</button><button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Next</button></div>
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
          <form onSubmit={submitPayment} role="dialog" aria-modal="true" aria-labelledby="payment-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="payment-title" className="text-lg font-bold text-slate-900">Record GymPro payment</h2>
            <p className="mt-2 text-sm text-slate-500">{selected.gym?.gymName} · {money.format(selected.amount)}</p>
            <label className="mt-5 block text-sm font-medium text-slate-700">Payment date
              <input required type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">Payment reference
              <input maxLength={120} value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Bank transfer / UTR reference" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Confirm payment"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
