import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Check,
  CircleAlert,
  Clock3,
  Image,
  IndianRupee,
  Loader2,
  X,
} from "lucide-react";
import MemberAvatar from "../../components/common/MemberAvatar";
import {
  getRechargeProof,
  getRechargeRequests,
  reviewRechargeRequest,
} from "../../services/rechargeService";

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
};

export default function RechargeRequests() {
  const [status, setStatus] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyRequestId, setBusyRequestId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [proofRequest, setProofRequest] = useState(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofLoading, setProofLoading] = useState(false);

  useEffect(() => {
    let active = true;
    getRechargeRequests(status)
      .then((response) => {
        if (active) setRequests(response.data.data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load recharge requests."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status]);

  useEffect(() => {
    if (!proofRequest) return undefined;
    let active = true;
    let objectUrl;
    getRechargeProof(proofRequest._id)
      .then((response) => {
        if (active) {
          objectUrl = URL.createObjectURL(response.data);
          setProofUrl(objectUrl);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load payment proof."
          );
          setProofRequest(null);
        }
      })
      .finally(() => {
        if (active) setProofLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setProofUrl("");
    };
  }, [proofRequest]);

  const refreshRequests = async () => {
    const response = await getRechargeRequests(status);
    setRequests(response.data.data);
  };

  const handleReview = async (request, action) => {
    if (
      !window.confirm(
        action === "approve"
          ? `Confirm the UPI payment from ${request.memberId?.name || "this member"} and activate their new membership?`
          : `Reject the recharge request from ${request.memberId?.name || "this member"}?`
      )
    ) {
      return;
    }

    const reason =
      action === "reject"
        ? window.prompt("Optional rejection reason (leave blank if none):") ?? null
        : "";
    if (reason === null) return;

    setError("");
    setNotice("");
    setBusyRequestId(request._id);
    try {
      const response = await reviewRechargeRequest(
        request._id,
        action,
        reason
      );
      setNotice(response.data.message);
      await refreshRequests();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          `Unable to ${action} this recharge request.`
      );
    } finally {
      setBusyRequestId("");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600">Gym operations</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Recharge requests
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Verify each UPI payment manually. A submitted screenshot is only a
          payment claim and does not activate a membership.
        </p>
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
      {notice && (
        <p
          className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          role="status"
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {notice}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Clock3 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">Payment claims</h2>
              <p className="text-sm text-slate-500">
                {loading ? "Loading..." : `${requests.length} requests`}
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span>Show</span>
            <select
              value={status}
              onChange={(event) => {
                setLoading(true);
                setError("");
                setStatus(event.target.value);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All requests</option>
            </select>
          </label>
        </div>

        {loading ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">
            Loading recharge requests...
          </p>
        ) : requests.length ? (
          <ul className="divide-y divide-slate-100">
            {requests.map((request) => (
              <li key={request._id} className="space-y-4 p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <MemberAvatar
                        name={request.memberId?.name}
                        photoUrl={request.memberId?.photoUrl}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {request.memberId?.name || "Member"}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClassName[request.status]}`}
                        >
                          {request.status}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {request.memberId?.email || request.memberId?.phone || "Member contact unavailable"}
                      {request.memberId?.email && request.memberId?.phone
                        ? ` · ${request.memberId.phone}`
                        : ""}
                    </p>
                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Plan
                        </p>
                        <p className="mt-1 font-medium text-slate-800">
                          {request.planName} · {request.durationMonths}{" "}
                          {request.durationMonths === 1 ? "month" : "months"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Amount claimed
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1 font-semibold text-slate-800">
                          <IndianRupee className="h-3.5 w-3.5" aria-hidden="true" />
                          {currencyFormatter.format(request.amount).replace("₹", "")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Submitted
                        </p>
                        <p className="mt-1 text-slate-700">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          UPI reference
                        </p>
                        <p className="mt-1 break-all text-slate-700">
                          {request.transactionReference || "Not provided"}
                        </p>
                      </div>
                    </div>
                    {request.rejectionReason && (
                      <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        Rejection reason: {request.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setProofUrl("");
                        setProofLoading(true);
                        setProofRequest(request);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Image className="h-4 w-4" aria-hidden="true" />
                      View proof
                    </button>
                    {request.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReview(request, "approve")}
                          disabled={Boolean(busyRequestId)}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {busyRequestId === request._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                          )}
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview(request, "reject")}
                          disabled={Boolean(busyRequestId)}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3.5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-14 text-center">
            <Clock3
              className="mx-auto h-8 w-8 text-slate-300"
              aria-hidden="true"
            />
            <p className="mt-3 font-medium text-slate-900">
              No {status === "all" ? "" : `${status} `}requests
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Recharge requests from your members will appear here.
            </p>
          </div>
        )}
      </section>

      {proofRequest && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setProofRequest(null);
              setProofUrl("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-proof-title"
            className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <MemberAvatar
                  name={proofRequest.memberId?.name}
                  photoUrl={proofRequest.memberId?.photoUrl}
                />
                <div>
                <h2
                  id="payment-proof-title"
                  className="font-semibold text-slate-900"
                >
                  Payment proof
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {proofRequest.memberId?.name || "Member"} ·{" "}
                  {proofRequest.transactionReference || "No reference ID"}
                </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProofRequest(null);
                  setProofUrl("");
                }}
                aria-label="Close payment proof"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-5 flex min-h-64 items-center justify-center rounded-xl bg-slate-100 p-3">
              {proofLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" aria-label="Loading proof" />
              ) : (
                <img
                  src={proofUrl}
                  alt="Member submitted payment proof"
                  className="max-h-[70vh] max-w-full rounded-lg object-contain"
                />
              )}
            </div>
            <p className="mt-3 text-xs leading-5 text-amber-700">
              Confirm this payment with your UPI account before approving. The
              uploaded image is not proof of settled funds by itself.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
