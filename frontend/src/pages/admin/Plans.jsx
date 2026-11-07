import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CircleAlert,
  Dumbbell,
  IndianRupee,
  Loader2,
  Plus,
} from "lucide-react";
import { createPlan, getPlans } from "../../services/planService";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const initialForm = { name: "", price: "", duration: "" };

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    getPlans()
      .then((response) => {
        if (active) setPlans(response.data.data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load membership plans."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await createPlan({
        name: formData.name.trim(),
        price: Number(formData.price),
        duration: Number(formData.duration),
      });

      setPlans((currentPlans) =>
        [...currentPlans, response.data.data].sort(
          (first, second) => first.duration - second.duration
        )
      );
      setFormData(initialForm);
      setSuccess(
        "Plan created. It is now available when you add or edit a member."
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to create the membership plan."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-indigo-600">Gym operations</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Membership plans
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Set your prices and membership durations, then assign a plan to each
          member.
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
      {success && (
        <p
          className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          role="status"
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {success}
        </p>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Plus className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">Create a plan</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Make a membership option for your gym.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="plan-name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Plan name
              </label>
              <input
                id="plan-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                minLength={2}
                maxLength={80}
                placeholder="e.g. Weekend Warrior"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div>
                <label
                  htmlFor="plan-price"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Price (₹)
                </label>
                <div className="relative">
                  <IndianRupee
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="plan-price"
                    name="price"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="1500"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="plan-duration"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Duration (months)
                </label>
                <input
                  id="plan-duration"
                  name="duration"
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="1"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              {saving ? "Creating plan..." : "Create plan"}
            </button>
          </form>

          <div className="mt-5 rounded-xl bg-indigo-50/70 p-4">
            <p className="text-sm leading-6 text-slate-600">
              Plans created by your gym are private to your workspace. Once
              created, they appear in the membership selector when you add a
              member.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Dumbbell className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-900">Available plans</h2>
                <p className="text-sm text-slate-500">
                  {loading
                    ? "Loading plans..."
                    : `${plans.length} ${plans.length === 1 ? "plan" : "plans"}`}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="px-6 py-12 text-center text-sm text-slate-500">
              Loading membership plans...
            </p>
          ) : plans.length ? (
            <ul className="divide-y divide-slate-100">
              {plans.map((plan) => (
                <li
                  key={plan._id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                      <Dumbbell className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{plan.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {plan.duration}{" "}
                        {plan.duration === 1 ? "month" : "months"}
                      </p>
                    </div>
                  </div>
                  <p className="pl-[3.25rem] text-sm font-semibold text-slate-800 sm:pl-0">
                    {currencyFormatter.format(plan.price)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-12 text-center">
              <Dumbbell
                className="mx-auto h-8 w-8 text-slate-300"
                aria-hidden="true"
              />
              <p className="mt-3 font-medium text-slate-900">
                No plans available
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Create a plan to start assigning memberships.
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl bg-slate-900 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="font-semibold">Ready to enroll a member?</p>
          <p className="mt-1 text-sm text-slate-300">
            Your active plans are available in the member form.
          </p>
        </div>
        <Link
          to="/admin/members"
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-white/20 sm:self-auto"
        >
          Go to members
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
