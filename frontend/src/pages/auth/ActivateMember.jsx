import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";
import { activateMember } from "../../services/authService";
import { login } from "../../store/authSlice";

export default function ActivateMember() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: "",
    activationCode: "",
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

    if (
      formData.password.length < 8 ||
      formData.password.length > 128 ||
      !/[A-Z]/.test(formData.password) ||
      !/[a-z]/.test(formData.password) ||
      !/[0-9]/.test(formData.password)
    ) {
      setError(
        "Password must be 8–128 characters and include uppercase, lowercase, and a number."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const data = await activateMember({
        email: formData.email.trim(),
        activationCode: formData.activationCode.trim(),
        password: formData.password,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.userData));
      dispatch(login({ user: data.userData, token: data.token }));
      navigate("/member/check-in", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to activate your account. Check the code and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-bold tracking-tight text-slate-900">GymPro</p>
            <p className="text-xs text-slate-500">Member account setup</p>
          </div>
        </div>

        <div className="mb-7">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <KeyRound className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Activate your account
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enter the email and one-time code provided by your gym, then create
            a password.
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
              htmlFor="activation-email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Member email
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="activation-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="activation-code"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              One-time activation code
            </label>
            <div className="relative">
              <KeyRound
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="activation-code"
                name="activationCode"
                type="text"
                autoComplete="one-time-code"
                required
                value={formData.activationCode}
                onChange={handleChange}
                placeholder="Paste the code from your gym"
                className={inputClass}
              />
            </div>
          </div>

          {["password", "confirmPassword"].map((field) => {
            const isConfirm = field === "confirmPassword";
            const visible = isConfirm ? showConfirmPassword : showPassword;
            return (
              <div key={field}>
                <label
                  htmlFor={field}
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  {isConfirm ? "Confirm password" : "Create password"}
                </label>
                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id={field}
                    name={field}
                    type={visible ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                    value={formData[field]}
                    onChange={handleChange}
                    placeholder={
                      isConfirm ? "Enter password again" : "At least 8 characters"
                    }
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      isConfirm
                        ? setShowConfirmPassword((shown) => !shown)
                        : setShowPassword((shown) => !shown)
                    }
                    aria-label={visible ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700"
                  >
                    {visible ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          <p className="text-xs leading-5 text-slate-500">
            Use 8–128 characters with uppercase and lowercase letters and at
            least one number. The code expires after 24 hours.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Activating account..." : "Activate account"}
            {!loading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Gym owner?{" "}
          <Link
            to="/login"
            className="font-semibold text-violet-700 hover:text-violet-800"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
