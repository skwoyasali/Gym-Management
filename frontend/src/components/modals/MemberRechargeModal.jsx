import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CircleAlert,
  Loader2,
  ReceiptText,
  X,
} from "lucide-react";
import { createAdminMemberRecharge } from "../../services/rechargeService";

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "other", label: "Other" },
];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export default function MemberRechargeModal({
  member,
  plans,
  onClose,
  onSuccess,
}) {
  const [planId, setPlanId] = useState(plans[0]?._id || "");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amount, setAmount] = useState(
    plans[0] ? String(plans[0].price) : ""
  );
  const [transactionReference, setTransactionReference] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan._id === planId),
    [planId, plans]
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [loading, onClose]);

  const handlePlanChange = (event) => {
    const nextPlanId = event.target.value;
    setPlanId(nextPlanId);
    const nextPlan = plans.find((plan) => plan._id === nextPlanId);
    setAmount(nextPlan ? String(nextPlan.price) : "");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const receivedAmount = Number(amount);
    if (!selectedPlan) {
      setError("Select an available membership plan.");
      return;
    }
    if (!Number.isFinite(receivedAmount) || receivedAmount < 0) {
      setError("Enter a valid amount received.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const response = await createAdminMemberRecharge(member._id, {
        planId,
        paymentMethod,
        amount: receivedAmount,
        transactionReference: transactionReference.trim(),
      });
      onSuccess(response.data.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to recharge this member."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-recharge-title"
        className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Banknote className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-indigo-600">Member payment</p>
              <h2
                id="member-recharge-title"
                className="font-bold text-slate-900"
              >
                Recharge {member.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close recharge dialog"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-6"
        >
          {error && (
            <p
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <div>
            <label
              htmlFor="admin-recharge-plan"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Membership plan
            </label>
            <select
              id="admin-recharge-plan"
              value={planId}
              onChange={handlePlanChange}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name}
                </option>
              ))}
            </select>
            {!plans.length && (
              <p className="mt-2 text-sm text-rose-600" role="alert">
                Create an active membership plan before recharging a member.
              </p>
            )}
          </div>

          {selectedPlan && (
            <div className="grid gap-3 rounded-xl bg-indigo-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                  Plan price
                </p>
                <p className="mt-1 font-semibold text-indigo-950">
                  {currencyFormatter.format(selectedPlan.price)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                  Duration
                </p>
                <p className="mt-1 font-semibold text-indigo-950">
                  {selectedPlan.duration}{" "}
                  {selectedPlan.duration === 1 ? "month" : "months"}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="admin-recharge-method"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Payment method
              </label>
              <select
                id="admin-recharge-method"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="admin-recharge-amount"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Amount received (₹)
              </label>
              <input
                id="admin-recharge-amount"
                type="number"
                min="0"
                step="0.01"
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-recharge-reference"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Transaction ID / reference (optional)
            </label>
            <div className="relative">
              <ReceiptText
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="admin-recharge-reference"
                value={transactionReference}
                onChange={(event) => setTransactionReference(event.target.value)}
                maxLength={120}
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                placeholder="Enter transaction reference"
              />
            </div>
          </div>

          <p className="text-xs leading-5 text-slate-500">
            Membership start and expiry dates are calculated automatically.
            Previous membership and recharge records are preserved.
          </p>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !plans.length}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {loading ? "Processing..." : "Recharge"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
