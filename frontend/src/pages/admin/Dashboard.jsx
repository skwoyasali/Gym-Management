import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  IndianRupee,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { getDashboardSummary } from "../../services/dashboardService";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-IN");

const loadSummary = async () => {
  const response = await getDashboardSummary();
  return response.data.data;
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    loadSummary()
      .then((data) => {
        if (isMounted) setSummary(data);
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load your gym dashboard."
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRetry = () => {
    setError("");
    setLoading(true);
    loadSummary()
      .then(setSummary)
      .catch((requestError) => {
        setError(
          requestError.response?.data?.message ||
            "Unable to load your gym dashboard."
        );
      })
      .finally(() => setLoading(false));
  };

  const today = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const stats = [
    {
      title: "Total Members",
      value:
        summary === null
          ? "—"
          : numberFormatter.format(summary.totalMembers),
      note: "Members in your gym workspace",
      icon: Users,
      iconClass: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Active Memberships",
      value:
        summary === null
          ? "—"
          : numberFormatter.format(summary.activeMemberships),
      note: "Active and within their membership dates",
      icon: UserRoundCheck,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Membership Value",
      value:
        summary === null
          ? "—"
          : currencyFormatter.format(summary.membershipValue),
      note: "Sum of assigned plan prices, not confirmed payments",
      icon: IndianRupee,
      iconClass: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Gym overview</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            A live overview of your gym&apos;s members and memberships.
          </p>
        </div>
        <p className="text-sm font-medium text-slate-500">{today}</p>
      </header>

      {error && (
        <div
          className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={handleRetry}
            className="self-start font-semibold underline underline-offset-2 hover:text-rose-900 sm:self-auto"
          >
            Try again
          </button>
        </div>
      )}

      <section
        aria-label="Gym statistics"
        aria-busy={loading}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {stats.map(({ title, value, note, icon: Icon, iconClass }) => (
          <article
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p
                  className="mt-3 text-3xl font-bold tracking-tight text-slate-900"
                  aria-live="polite"
                >
                  {loading && summary === null ? "Loading..." : value}
                </p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-500">
              {note}
            </p>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-5 rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="text-sm font-semibold text-indigo-300">Quick access</p>
          <h2 className="mt-1 text-xl font-semibold">Manage your members</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            View your member list or add someone new to your gym.
          </p>
        </div>
        <Link
          to="/admin/members"
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-white/20 sm:self-auto"
        >
          View members
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
