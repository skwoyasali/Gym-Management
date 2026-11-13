import { useEffect, useState } from "react";
import { IndianRupee } from "lucide-react";
import {
  getPlatformPricing,
  updatePlatformPricing,
} from "../../services/billingService";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export default function SuperAdminPricing() {
  const [price, setPrice] = useState("");
  const [savedPrice, setSavedPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getPlatformPricing()
      .then((response) => {
        setSavedPrice(response.data.data.pricePerMemberMonth);
        setPrice(String(response.data.data.pricePerMemberMonth));
      })
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Unable to load pricing.")
      )
      .finally(() => setLoading(false));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0 || parsedPrice > 100000) {
      setError("Enter a price between ₹0 and ₹100,000.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await updatePlatformPricing({
        pricePerMemberMonth: parsedPrice,
      });
      setSavedPrice(response.data.data.pricePerMemberMonth);
      setPrice(String(response.data.data.pricePerMemberMonth));
      setNotice("Pricing updated. The new rate will apply to future memberships and recharges.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update pricing.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600">Platform settings</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Pricing configuration</h1>
        <p className="mt-2 text-sm text-slate-500">Set GymPro’s per-member monthly charge.</p>
      </header>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {loading ? <p className="text-sm text-slate-500">Loading pricing…</p> : (
          <>
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <IndianRupee className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Price per member per month</h2>
                <p className="mt-1 text-sm text-slate-500">Existing billing records keep their saved rate and charge.</p>
              </div>
            </div>
            <form onSubmit={submit} className="mt-7 space-y-5">
              <label htmlFor="price" className="block text-sm font-medium text-slate-700">Monthly rate (INR)
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                  <input id="price" type="number" min="0" max="100000" step="0.01" required value={price} onChange={(event) => setPrice(event.target.value)} className="w-full rounded-xl border border-slate-200 py-3 pl-8 pr-4 text-lg font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" />
                </div>
              </label>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">Charge preview</p>
                <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                  <p>1 month <strong className="text-slate-900">{money.format(Number(price || 0))}</strong></p>
                  <p>6 months <strong className="text-slate-900">{money.format(Number(price || 0) * 6)}</strong></p>
                  <p>12 months <strong className="text-slate-900">{money.format(Number(price || 0) * 12)}</strong></p>
                </div>
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">Current saved rate: <strong className="text-slate-800">{money.format(savedPrice)}</strong></p>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving…" : "Save pricing"}</button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
