import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Clipboard,
  Clock3,
  CreditCard,
  ImagePlus,
  IndianRupee,
  Loader2,
  QrCode,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import {
  getMyRechargeOverview,
  getRechargeProof,
  submitRechargeRequest,
} from "../../services/rechargeService";
import { getPaymentQr } from "../../services/gymService";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const formatDate = (date) => (date ? dateFormatter.format(new Date(date)) : "—");

const statusClassName = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  verified: "bg-emerald-50 text-emerald-700",
  not_recorded: "bg-slate-100 text-slate-600",
};

const isAllowedImage = (file) =>
  ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
  file.size <= 5 * 1024 * 1024;

export default function RechargePanel({ onMembershipUpdate, view = "plan" }) {
  const [overview, setOverview] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState("");
  const [qrPreview, setQrPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const [viewingProof, setViewingProof] = useState(null);
  const [viewingProofUrl, setViewingProofUrl] = useState("");
  const [viewingProofLoading, setViewingProofLoading] = useState(false);

  const selectedPlan = useMemo(
    () => overview?.plans.find((plan) => plan._id === selectedPlanId) || null,
    [overview?.plans, selectedPlanId]
  );
  const hasPendingRequest = overview?.requests.some(
    (request) =>
      request.status === "pending" && request.planId === selectedPlanId
  );

  const loadOverview = async () => {
    const response = await getMyRechargeOverview();
    setOverview(response.data.data);
    setSelectedPlanId((current) =>
      response.data.data.plans.some((plan) => plan._id === current)
        ? current
        : response.data.data.plans[0]?._id || ""
    );
  };

  useEffect(() => {
    let active = true;
    getMyRechargeOverview()
      .then(async (response) => {
        if (!active) return;
        const data = response.data.data;
        setOverview(data);
        setSelectedPlanId(data.plans[0]?._id || "");
        if (view === "plan" && data.paymentSettings.qrUrl) {
          const imageResponse = await getPaymentQr();
          if (active) {
            setQrPreview(URL.createObjectURL(imageResponse.data));
          }
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load recharge options."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [view]);

  useEffect(
    () => () => {
      if (qrPreview) URL.revokeObjectURL(qrPreview);
    },
    [qrPreview]
  );

  useEffect(
    () => () => {
      if (proofPreview) URL.revokeObjectURL(proofPreview);
    },
    [proofPreview]
  );

  useEffect(() => {
    if (!viewingProof) return undefined;
    let active = true;
    let objectUrl;
    getRechargeProof(viewingProof._id)
      .then((response) => {
        if (active) {
          objectUrl = URL.createObjectURL(response.data);
          setViewingProofUrl(objectUrl);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load payment proof."
          );
          setViewingProof(null);
        }
      })
      .finally(() => {
        if (active) setViewingProofLoading(false);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [viewingProof]);

  const copyValue = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyNotice(`${label} copied`);
    } catch (copyError) {
      console.error("Copy UPI detail error:", copyError);
      setError(`Unable to copy the ${label.toLowerCase()}.`);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    setError("");
    if (file && !isAllowedImage(file)) {
      setProofFile(null);
      setProofPreview("");
      setError("Choose a JPG, PNG, or WEBP image no larger than 5 MB.");
      return;
    }
    setProofFile(file);
    setProofPreview(file ? URL.createObjectURL(file) : "");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPlan || !proofFile) {
      setError("Choose a plan and upload a payment screenshot.");
      return;
    }
    if (hasPendingRequest) {
      setError("You already have a pending request for this plan.");
      return;
    }

    setError("");
    setNotice("");
    setSubmitting(true);
    const formData = new FormData();
    formData.append("planId", selectedPlan._id);
    formData.append("transactionReference", transactionReference.trim());
    formData.append("proof", proofFile);

    try {
      const response = await submitRechargeRequest(formData);
      setNotice(response.data.message);
      setProofFile(null);
      setProofPreview("");
      setTransactionReference("");
      await loadOverview();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to submit your recharge request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const paymentSettings = overview?.paymentSettings;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-600">Membership</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {view === "plan" ? "Recharge your plan" : "Recharge history"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {view === "plan"
                ? "Choose a plan and submit your UPI payment proof. Your membership changes only after the gym verifies and approves your payment."
                : "Review your payment requests and approved membership recharge records."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError("");
              Promise.all([loadOverview(), onMembershipUpdate?.()])
                .catch((requestError) =>
                  setError(
                    requestError.response?.data?.message ||
                      "Unable to refresh recharge information."
                  )
                )
                .finally(() => setLoading(false));
            }}
            disabled={loading}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:self-center"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh status
          </button>
        </div>

        {error && (
          <p
            className="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        {notice && (
          <p
            className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            role="status"
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {notice}
          </p>
        )}
        {copyNotice && (
          <p className="mt-3 text-sm text-emerald-700" role="status">
            {copyNotice}
          </p>
        )}

        {loading && !overview ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading recharge options...
          </p>
        ) : !overview ? null : (
          <>
            {view === "plan" && (
              <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="recharge-plan"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Select a plan
                  </label>
                  <select
                    id="recharge-plan"
                    value={selectedPlanId}
                    onChange={(event) => setSelectedPlanId(event.target.value)}
                    disabled={!overview.plans.length || submitting}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                  >
                    {!overview.plans.length && (
                      <option value="">No plans currently available</option>
                    )}
                    {overview.plans.map((plan) => (
                      <option key={plan._id} value={plan._id}>
                        {plan.name} · {currencyFormatter.format(plan.price)} ·{" "}
                        {plan.duration}{" "}
                        {plan.duration === 1 ? "month" : "months"}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPlan && (
                  <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3">
                    <span className="text-sm font-medium text-indigo-900">
                      Amount to pay
                    </span>
                    <span className="inline-flex items-center gap-1 text-lg font-bold text-indigo-700">
                      <IndianRupee className="h-4 w-4" aria-hidden="true" />
                      {currencyFormatter
                        .format(selectedPlan.price)
                        .replace(/[^\d,.-]/g, "")}
                    </span>
                  </div>
                )}

                {hasPendingRequest && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    You already have a pending request for this plan. Wait for
                    your gym to review it before submitting another.
                  </p>
                )}

                <div>
                  <label
                    htmlFor="recharge-reference"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    UPI transaction/reference ID (optional)
                  </label>
                  <input
                    id="recharge-reference"
                    value={transactionReference}
                    onChange={(event) =>
                      setTransactionReference(event.target.value)
                    }
                    maxLength={120}
                    placeholder="Enter your UPI reference"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Payment screenshot
                  </span>
                  <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    {proofPreview ? (
                      <img
                        src={proofPreview}
                        alt="Payment screenshot preview"
                        className="max-h-52 max-w-full rounded-lg object-contain"
                      />
                    ) : (
                      <p className="text-center text-sm text-slate-500">
                        JPG, PNG, or WEBP · max 5 MB
                      </p>
                    )}
                  </div>
                  <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <ImagePlus className="h-4 w-4" aria-hidden="true" />
                    {proofFile ? "Choose another screenshot" : "Choose screenshot"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      disabled={submitting}
                      className="sr-only"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    loading ||
                    !selectedPlan ||
                    !proofFile ||
                    Boolean(hasPendingRequest)
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="h-4 w-4" aria-hidden="true" />
                  )}
                  {submitting ? "Submitting claim..." : "Submit payment claim"}
                </button>
                <p className="text-xs leading-5 text-slate-500">
                  Your request remains pending until a gym admin verifies the
                  payment. Uploading an image does not confirm payment.
                </p>
              </form>

              <aside className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <CreditCard
                    className="h-4 w-4 text-indigo-600"
                    aria-hidden="true"
                  />
                  <h3 className="font-semibold text-slate-900">
                    Pay your gym via UPI
                  </h3>
                </div>
                {paymentSettings?.qrUrl && qrPreview && (
                  <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-4">
                    <img
                      src={qrPreview}
                      alt="Gym UPI payment QR code"
                      className="max-h-52 max-w-full object-contain"
                    />
                  </div>
                )}
                {paymentSettings?.receiverName && (
                  <p className="text-sm text-slate-600">
                    Pay to{" "}
                    <span className="font-semibold text-slate-900">
                      {paymentSettings.receiverName}
                    </span>
                  </p>
                )}
                {paymentSettings?.upiId && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">UPI ID</p>
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {paymentSettings.upiId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyValue("UPI ID", paymentSettings.upiId)}
                      aria-label="Copy UPI ID"
                      className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Clipboard className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
                {paymentSettings?.paymentNumber && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3">
                    <div>
                      <p className="text-xs text-slate-500">Payment number</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {paymentSettings.paymentNumber}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyValue("Payment number", paymentSettings.paymentNumber)
                      }
                      aria-label="Copy payment number"
                      className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Clipboard className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
                {paymentSettings?.instructions && (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {paymentSettings.instructions}
                  </p>
                )}
                {!paymentSettings?.upiId &&
                  !paymentSettings?.paymentNumber &&
                  !paymentSettings?.qrUrl && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
                      Your gym has not added UPI payment details yet. Contact
                      the gym before making a payment.
                    </p>
                  )}
                {selectedPlan && (
                  <p className="text-sm text-slate-600">
                    Please pay exactly{" "}
                    <strong className="text-slate-900">
                      {currencyFormatter.format(selectedPlan.price)}
                    </strong>
                    .
                  </p>
                )}
              </aside>
              </div>
            )}
          </>
        )}
      </section>

      {view === "history" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Clock3 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-slate-900">Payment requests</h2>
            <p className="text-sm text-slate-500">
              Pending requests do not extend your membership.
            </p>
          </div>
        </div>
        {overview?.requests.length ? (
          <ul className="divide-y divide-slate-100">
            {overview.requests.map((request) => (
              <li
                key={request._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">
                      {request.planName} · {currencyFormatter.format(request.amount)}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClassName[request.status]}`}
                    >
                      {request.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Submitted {formatDate(request.createdAt)}
                    {request.transactionReference
                      ? ` · Ref: ${request.transactionReference}`
                      : ""}
                  </p>
                  {request.rejectionReason && (
                    <p className="mt-1 text-sm text-rose-700">
                      Reason: {request.rejectionReason}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setViewingProofUrl("");
                    setViewingProofLoading(true);
                    setViewingProof(request);
                  }}
                  className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:self-auto"
                >
                  <QrCode className="h-4 w-4" aria-hidden="true" />
                  View submitted proof
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-10 text-center text-sm text-slate-500">
            You have not submitted any recharge requests.
          </p>
        )}
        </section>
      )}

      {view === "history" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Check className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-slate-900">Recharge history</h2>
            <p className="text-sm text-slate-500">
              Approved membership records and payment verification
            </p>
          </div>
        </div>
        {overview?.history.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 sm:px-6">Plan</th>
                  <th className="px-5 py-3 sm:px-6">Recharge date</th>
                  <th className="px-5 py-3 sm:px-6">Membership dates</th>
                  <th className="px-5 py-3 sm:px-6">Amount</th>
                  <th className="px-5 py-3 sm:px-6">Payment method</th>
                  <th className="px-5 py-3 sm:px-6">Payment</th>
                  <th className="px-5 py-3 sm:px-6">Approval</th>
                  <th className="px-5 py-3 sm:px-6">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview.history.map((record) => (
                  <tr key={record._id}>
                    <td className="px-5 py-4 sm:px-6">
                      <p className="font-medium text-slate-900">{record.planName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {record.durationMonths}{" "}
                        {record.durationMonths === 1 ? "month" : "months"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(record.rechargedAt)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(record.membershipStart)} –{" "}
                      {formatDate(record.membershipEnd)}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {currencyFormatter.format(record.amount)}
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-600">
                      {record.paymentMethod?.replace("_", " ") || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName[record.paymentStatus]}`}
                      >
                        {record.paymentStatus === "verified"
                          ? "Verified"
                          : "Not recorded"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Approved
                      </span>
                    </td>
                    <td className="max-w-40 truncate px-5 py-4 text-slate-600">
                      {record.transactionReference || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-10 text-center text-sm text-slate-500">
            Your approved recharge history will appear here.
          </p>
        )}
        </section>
      )}

      {viewingProof && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setViewingProof(null);
              setViewingProofUrl("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-proof-title"
            className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2
                id="member-proof-title"
                className="font-semibold text-slate-900"
              >
                Submitted payment proof
              </h2>
              <button
                type="button"
                onClick={() => {
                  setViewingProof(null);
                  setViewingProofUrl("");
                }}
                aria-label="Close payment proof"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4 flex min-h-56 items-center justify-center rounded-xl bg-slate-100 p-3">
              {viewingProofLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" aria-label="Loading proof" />
              ) : (
                <img
                  src={viewingProofUrl}
                  alt="Your submitted payment proof"
                  className="max-h-[70vh] max-w-full rounded-lg object-contain"
                />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
