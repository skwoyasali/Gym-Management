import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, CheckCircle2, XCircle } from "lucide-react";
import {
  getSuperAdminGym,
  updateSuperAdminGym,
} from "../../services/billingService";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const date = (value) => value ? new Date(value).toLocaleDateString("en-IN") : "—";
const dateInputValue = (value) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

export default function SuperAdminGymDetails() {
  const { id } = useParams();
  const [gym, setGym] = useState(null);
  const [expiry, setExpiry] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [memberPage, setMemberPage] = useState(1);
  const [billingPage, setBillingPage] = useState(1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    getSuperAdminGym(id, { memberPage, billingPage })
      .then((response) => {
        setGym(response.data.data);
        setExpiry(dateInputValue(response.data.data.expiresAt));
      })
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Unable to load gym details.")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getSuperAdminGym(id, { memberPage, billingPage })
      .then((response) => {
        setGym(response.data.data);
        setExpiry(dateInputValue(response.data.data.expiresAt));
      })
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Unable to load gym details.")
      )
      .finally(() => setLoading(false));
  }, [id, memberPage, billingPage]);

  const saveAccount = async (accountStatus) => {
    if (
      !window.confirm(
        accountStatus === "active"
          ? "Reactivate this gym account? The gym admin will regain access."
          : "Deactivate this gym account? The gym admin will immediately lose access."
      )
    ) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const expiryToSave =
        accountStatus === "active" &&
        expiry &&
        new Date(`${expiry}T23:59:59.999Z`) <= new Date()
          ? null
          : expiry || null;
      const response = await updateSuperAdminGym(id, {
        accountStatus,
        expiresAt: expiryToSave,
      });
      setGym((current) => ({ ...current, ...response.data.data }));
      setNotice(accountStatus === "active" ? "Gym account reactivated." : "Gym account deactivated.");
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update this gym account.");
    } finally {
      setSaving(false);
    }
  };

  const saveExpiry = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await updateSuperAdminGym(id, { expiresAt: expiry || null });
      setGym((current) => ({ ...current, ...response.data.data }));
      setNotice("Account expiry date saved.");
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update the expiry date.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !gym) return <p className="p-6 text-sm text-slate-500">Loading gym details…</p>;
  if (!gym) {
    return (
      <div className="space-y-4">
        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        <button type="button" onClick={load} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Retry</button>
      </div>
    );
  }

  const stats = [
    ["Total members", gym.totalMembers],
    ["Active memberships", gym.activeMembers],
    ["Membership revenue", money.format(gym.membershipRevenue)],
    ["GymPro charges", money.format(gym.billingAmount)],
  ];

  return (
    <div className="space-y-7">
      <Link to="/super-admin/gyms" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to gyms
      </Link>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Gym account</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{gym.gymName}</h1>
          <p className="mt-2 text-sm text-slate-500">{gym.address}, {gym.city}, {gym.state} {gym.pincode}</p>
        </div>
        <span className={`self-start rounded-full px-3 py-1.5 text-sm font-semibold ${gym.accountStatus === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
          {gym.accountStatus === "active" ? "Active account" : "Inactive account"}
        </span>
      </header>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            <h2 className="font-semibold text-slate-900">Account access</h2>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Registered {date(gym.createdAt)} · expires {date(gym.expiresAt)}
          </p>
          <form onSubmit={saveExpiry} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="expiry" className="mb-1.5 block text-sm font-medium text-slate-700">Expiry date</label>
              <input id="expiry" type="date" value={expiry} onChange={(event) => setExpiry(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" />
            </div>
            <button type="submit" disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Save expiry</button>
          </form>
          <p className="mt-2 text-xs text-slate-500">Leave blank for no scheduled expiration.</p>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {gym.accountStatus === "active" ? (
              <button type="button" disabled={saving} onClick={() => saveAccount("inactive")} className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                <XCircle className="h-4 w-4" aria-hidden="true" /> Deactivate gym
              </button>
            ) : (
              <button type="button" disabled={saving} onClick={() => saveAccount("active")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Reactivate gym
              </button>
            )}
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Gym admin contact</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-slate-500">Admin name</dt><dd className="mt-1 text-sm font-medium text-slate-800">{gym.admin?.username || gym.ownerName}</dd></div>
            <div><dt className="text-xs text-slate-500">Email</dt><dd className="mt-1 break-all text-sm font-medium text-slate-800">{gym.admin?.email || "—"}</dd></div>
            <div><dt className="text-xs text-slate-500">Phone</dt><dd className="mt-1 text-sm font-medium text-slate-800">{gym.phone}</dd></div>
            <div><dt className="text-xs text-slate-500">Gym owner</dt><dd className="mt-1 text-sm font-medium text-slate-800">{gym.ownerName}</dd></div>
          </dl>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Members and memberships</h2>
        </div>
        {gym.members?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Member</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Membership end</th><th className="px-5 py-3">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {gym.members.map((member) => (
                  <tr key={member._id}>
                    <td className="px-5 py-4 font-medium text-slate-800">{member.name}</td>
                    <td className="px-5 py-4 text-slate-600">{member.phone}</td>
                    <td className="px-5 py-4 text-slate-600">{member.plan?.name || "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{date(member.membershipEnd)}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${member.active && member.membershipEnd && new Date(member.membershipEnd) >= new Date() ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{member.active && member.membershipEnd && new Date(member.membershipEnd) >= new Date() ? "Active" : "Inactive"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="p-6 text-sm text-slate-500">No members found for this gym.</p>}
        {gym.memberPagination?.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm">
            <p className="text-slate-500">Page {memberPage} of {gym.memberPagination.totalPages} · {gym.memberPagination.total} members</p>
            <div className="flex gap-2">
              <button type="button" disabled={memberPage <= 1} onClick={() => { setLoading(true); setMemberPage((page) => page - 1); }} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Previous</button>
              <button type="button" disabled={memberPage >= gym.memberPagination.totalPages} onClick={() => { setLoading(true); setMemberPage((page) => page + 1); }} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Gym billing and payment history</h2>
        </div>
        {gym.bills?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Member</th><th className="px-5 py-3">Plan / duration</th><th className="px-5 py-3">Purchased</th><th className="px-5 py-3">Rate</th><th className="px-5 py-3">Charge</th><th className="px-5 py-3">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {gym.bills.map((bill) => (
                  <tr key={bill._id}>
                    <td className="px-5 py-4 text-slate-800">{bill.memberId?.name || "Member"}</td>
                    <td className="px-5 py-4 text-slate-600">{bill.planName} · {bill.durationMonths} mo</td>
                    <td className="px-5 py-4 text-slate-600">{date(bill.purchasedAt)}</td>
                    <td className="px-5 py-4 text-slate-600">{money.format(bill.pricePerMemberMonth)}/mo</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{money.format(bill.amount)}</td>
                    <td className="px-5 py-4 capitalize text-slate-600">{bill.status}{bill.paymentId && <p className="mt-1 text-xs normal-case text-slate-500">{date(bill.paymentId.paymentDate)} · Ref {bill.paymentId.reference || "—"}</p>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="p-6 text-sm text-slate-500">No GymPro billing records for this gym yet.</p>}
        {gym.billingPagination?.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm">
            <p className="text-slate-500">Page {billingPage} of {gym.billingPagination.totalPages} · {gym.billingPagination.total} bills</p>
            <div className="flex gap-2">
              <button type="button" disabled={billingPage <= 1} onClick={() => { setLoading(true); setBillingPage((page) => page - 1); }} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Previous</button>
              <button type="button" disabled={billingPage >= gym.billingPagination.totalPages} onClick={() => { setLoading(true); setBillingPage((page) => page + 1); }} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
