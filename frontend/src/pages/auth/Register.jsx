import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { registerUser } from "../../services/authService";
import { login } from "../../store/authSlice";

const passwordRules = [
  { label: "At least 8 characters", test: (password) => password.length >= 8 },
  { label: "One uppercase letter", test: (password) => /[A-Z]/.test(password) },
  { label: "One lowercase letter", test: (password) => /[a-z]/.test(password) },
  { label: "One number", test: (password) => /[0-9]/.test(password) },
];

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!passwordRules.every(({ test }) => test(formData.password))) {
      setError("Choose a password that meets all the requirements.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const data = await registerUser({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.userData));
      dispatch(
        login({
          user: data.userData,
          token: data.token,
        })
      );
      navigate("/complete-profile");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col xl:px-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_15%,rgba(124,58,237,0.28),transparent_42%),radial-gradient(ellipse_at_85%_85%,rgba(79,70,229,0.22),transparent_40%)]" />
        <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-950/40">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold tracking-tight">GymPro</span>
        </div>

        <div className="relative my-auto max-w-xl py-12">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-violet-200">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            YOUR GYM&apos;S NEXT CHAPTER
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Build your
            <br />
            gym&apos;s home
            <br />
            <span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
              on GymPro.
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Create your workspace and bring your memberships, operations, and
            team together in one place.
          </p>

          <div className="mt-10 max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-white">Your own gym workspace</p>
                <p className="mt-1 text-sm text-slate-400">
                  Your account. Your gym. Your data.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-slate-500">
          A better way to run your fitness business.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              GymPro
            </span>
          </div>

          <div className="mb-7">
            <p className="text-sm font-semibold text-violet-600">
              Get started for free
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Create your account
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Set up your owner account first. You&apos;ll add your gym details
              in the next step.
            </p>
          </div>

          {error && (
            <div
              className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Your name
              </label>
              <div className="relative">
                <UserRound
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Alex Morgan"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Work email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  placeholder="you@yourgym.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((isVisible) => !isVisible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              <ul
                className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2"
                aria-label="Password requirements"
              >
                {passwordRules.map(({ label, test }) => {
                  const meetsRule = test(formData.password);
                  return (
                    <li
                      key={label}
                      className={`flex items-center gap-1.5 text-xs ${
                        meetsRule ? "text-emerald-700" : "text-slate-400"
                      }`}
                    >
                      <Check
                        className={`h-3.5 w-3.5 ${
                          meetsRule ? "opacity-100" : "opacity-40"
                        }`}
                        aria-hidden="true"
                      />
                      {label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm password
              </label>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="Enter your password again"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((isVisible) => !isVisible)
                  }
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-200"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating your account..." : "Create account"}
              {!loading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-violet-700 hover:text-violet-800"
            >
              Sign in
            </Link>
          </p>
          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            Your account will have its own secure gym workspace.
          </p>
        </div>
      </section>
    </main>
  );
}
