import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { getSuperAdminGyms } from "../../services/billingService";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const date = (value) => value ? new Date(value).toLocaleDateString("en-IN") : "—";

export default function SuperAdminGyms() {
  const [gyms, setGyms] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({ search: "", status: "all" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getSuperAdminGyms({ ...filters, page, limit: 10 })
      .then((response) => {
        setGyms(response.data.data);
        setPagination(response.data.pagination);
      })
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Unable to load gyms.")
      )
      .finally(() => setLoading(false));
  }, [filters, page]);

  const submitSearch = (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setPage(1);
    setFilters((current) => ({ ...current, search: searchInput.trim() }));
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600">Accounts</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Registered gyms</h1>
        <p className="mt-2 text-sm text-slate-500">Search, review, and manage every GymPro account.</p>
      </header>
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <form onSubmit={submitSearch} className="flex flex-1 gap-2">
          <label htmlFor="gym-search" className="sr-only">Search gyms</label>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="gym-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search gym, admin, email, or phone" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" />
          </div>
          <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Search</button>
        </form>
        <label className="sr-only" htmlFor="gym-status">Filter by status</label>
        <select id="gym-status" value={filters.status} onChange={(event) => { setLoading(true); setError(""); setPage(1); setFilters((current) => ({ ...current, status: event.target.value })); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500">
          <option value="all">All account statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </section>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading gyms…</p>
        ) : gyms.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Gym</th><th className="px-5 py-3">Gym admin</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Registered</th><th className="px-5 py-3">Members</th><th className="px-5 py-3">Active</th><th className="px-5 py-3">Membership revenue</th><th className="px-5 py-3">GymPro billing</th><th className="px-5 py-3">Status / expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gyms.map((gym) => (
                  <tr key={gym._id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4"><Link to={`/super-admin/gyms/${gym._id}`} className="font-semibold text-indigo-700 hover:text-indigo-900">{gym.gymName}</Link><p className="mt-1 text-xs text-slate-500">{gym.city}, {gym.state}</p></td>
                    <td className="px-5 py-4"><p className="font-medium text-slate-800">{gym.admin?.username || gym.ownerName}</p><p className="mt-1 text-xs text-slate-500">{gym.admin?.email || "—"}</p></td>
                    <td className="px-5 py-4 text-slate-600">{gym.phone}</td>
                    <td className="px-5 py-4 text-slate-600">{date(gym.createdAt)}</td>
                    <td className="px-5 py-4 text-slate-600">{gym.totalMembers}</td>
                    <td className="px-5 py-4 text-slate-600">{gym.activeMembers}</td>
                    <td className="px-5 py-4 text-slate-600">{money.format(gym.membershipRevenue)}</td>
                    <td className="px-5 py-4 font-medium text-slate-800">{money.format(gym.billingAmount)}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${gym.accountStatus === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{gym.accountStatus}</span><p className="mt-2 text-xs text-slate-500">{gym.expiresAt ? `Expires ${date(gym.expiresAt)}` : "No expiry date"}</p></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="p-10 text-center text-sm text-slate-500">No gyms match your search.</div>}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm">
            <p className="text-slate-500">Page {page} of {pagination.totalPages} · {pagination.total} gyms</p>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 disabled:opacity-40">Previous</button>
              <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
