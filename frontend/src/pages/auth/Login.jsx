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
  Shield,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { login } from "../../store/authSlice";
import { loginUser } from "../../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);

      const data = await loginUser({
        email: email.trim(),
        password,
        accountType,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.userData));
      dispatch(
        login({
          user: data.userData,
          token: data.token,
        })
      );

      if (data.userData.role === "member") {
        navigate("/member/check-in");
      } else if (data.userData.role === "super_admin") {
        navigate("/super-admin/dashboard");
      } else if (!data.userData.isProfileCompleted) {
        navigate("/complete-profile");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't sign you in. Check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const isAdminLogin = accountType === "admin";
  const benefits = isAdminLogin
    ? [
        "Manage your gym from one workspace",
        "Keep membership and attendance organized",
        "Your gym data stays private to your business",
      ]
    : [
        "Check in when you arrive at the gym",
        "Review your personal attendance history",
        "Your account is securely linked to your gym",
      ];

  const selectAccountType = (type) => {
    setAccountType(type);
    setError("");
  };

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col xl:px-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_15%,rgba(124,58,237,0.28),transparent_42%),radial-gradient(ellipse_at_85%_85%,rgba(79,70,229,0.22),transparent_40%)]" />
        <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -right-36 bottom-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-950/40">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold tracking-tight">GymPro</span>
        </div>

        <div className="relative my-auto max-w-xl py-12">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-violet-200">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            {isAdminLogin ? "THE GYM MANAGEMENT PLATFORM" : "YOUR MEMBER PORTAL"}
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            {isAdminLogin ? "Your gym." : "Your fitness."}
            <br />
            {isAdminLogin ? "Your team." : "Your progress."}
            <br />
            <span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
              {isAdminLogin ? "One workspace." : "All in one place."}
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            {isAdminLogin
              ? "Manage members, track attendance, and keep your gym operations in sync."
              : "Access your gym membership and record your visits from your own secure portal."}
          </p>

          <div className="relative mt-10 max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs text-slate-400">
                  {isAdminLogin ? "OWNER WORKSPACE" : "MEMBER ACCOUNT"}
                </p>
                <p className="mt-1 font-medium text-white">
                  {isAdminLogin ? "Everything in one place" : "Your gym, connected"}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="relative text-xs text-slate-500">
          {isAdminLogin
            ? "Secure access for your gym, wherever you work."
            : "Your membership access, wherever you train."}
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              GymPro
            </span>
          </div>

          <div className="mb-8">
            <p className="text-sm font-semibold text-violet-600">
              {isAdminLogin ? "OWNER & ADMIN ACCESS" : "MEMBER ACCESS"}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {isAdminLogin ? "Sign in to your gym" : "Sign in as a member"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {isAdminLogin
                ? "Access your gym owner dashboard with your registered email and password."
                : "Use the email and password you created when activating your member account."}
            </p>
          </div>

          <div
            className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5"
            aria-label="Choose account type"
          >
            <button
              type="button"
              onClick={() => selectAccountType("admin")}
              aria-pressed={isAdminLogin}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-violet-100 ${
                isAdminLogin
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              Owner / Admin
            </button>
            <button
              type="button"
              onClick={() => selectAccountType("member")}
              aria-pressed={!isAdminLogin}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-violet-100 ${
                !isAdminLogin
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Member
            </button>
          </div>

          {error && (
            <div
              className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                {isAdminLogin ? "Owner email" : "Member email"}
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
                  autoComplete="username"
                  required
                  placeholder={
                    isAdminLogin ? "you@yourgym.com" : "you@example.com"
                  }
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">
              {isAdminLogin ? "NEW TO GYMPRO?" : "MEMBER ACCOUNT"}
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {isAdminLogin ? (
            <Link
              to="/register"
              className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-100"
            >
              Create a gym owner account
            </Link>
          ) : (
            <div className="rounded-xl border border-violet-100 bg-violet-50/70 px-4 py-3 text-center">
              <p className="text-sm text-slate-600">
                New member? Ask your gym owner for an activation code.
              </p>
              <Link
                to="/activate-member"
                className="mt-1 inline-block text-sm font-semibold text-violet-700 hover:text-violet-800"
              >
                Activate member account
              </Link>
            </div>
          )}

          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            By continuing, you agree to keep your account credentials secure.
          </p>
        </div>
      </section>
    </main>
  );
}
