import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowRight,
  Building2,
  Check,
  MapPin,
  Phone,
  Sparkles,
  UserRound,
} from "lucide-react";
import api from "../../services/api";
import { updateUser } from "../../store/authSlice";

const initialFormData = {
  gymName: "",
  ownerName: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);

  const [formData, setFormData] = useState(initialFormData);
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

    try {
      setLoading(true);
      const response = await api.post("/gym/profile", {
        ...formData,
        gymName: formData.gymName.trim(),
        ownerName: formData.ownerName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      });

      const updatedUser = {
        ...currentUser,
        tenantName: response.data.gym.gymName,
        isProfileCompleted: true,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      dispatch(updateUser(updatedUser));
      navigate("/admin/dashboard", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't save your gym details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[0.85fr_1.15fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col xl:px-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_15%,rgba(124,58,237,0.28),transparent_42%),radial-gradient(ellipse_at_85%_85%,rgba(79,70,229,0.22),transparent_40%)]" />
        <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-950/40">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold tracking-tight">GymPro</span>
        </div>

        <div className="relative my-auto max-w-lg py-12">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-violet-300">
            <Building2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mb-4 text-xs font-semibold tracking-widest text-violet-200">
            YOUR WORKSPACE, YOUR WAY
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Let&apos;s set up
            <br />
            your gym.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
            Add a few details so your GymPro workspace is ready for your team
            and members.
          </p>

          <div className="mt-9 space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-xs font-semibold text-white">
                1
              </span>
              <span className="font-medium text-white">Gym details</span>
            </div>
            <div className="ml-3.5 h-5 border-l border-dashed border-slate-600" />
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-600 text-xs font-semibold">
                2
              </span>
              <span>Start managing memberships</span>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-slate-500">
          Your gym information stays in your workspace.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-2xl">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              GymPro
            </span>
          </div>

          <div className="mb-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ACCOUNT CREATED
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Complete your gym profile
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              This information helps personalize your workspace. You can update
              it later.
            </p>
          </div>

          {error && (
            <div
              className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Building2
                  className="h-4 w-4 text-violet-600"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-semibold text-slate-900">
                  Gym information
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="gymName"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Gym name
                  </label>
                  <input
                    id="gymName"
                    name="gymName"
                    type="text"
                    autoComplete="organization"
                    minLength={2}
                    maxLength={120}
                    required
                    value={formData.gymName}
                    onChange={handleChange}
                    placeholder="e.g. Northside Fitness"
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor="ownerName"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Owner or manager name
                  </label>
                  <div className="relative">
                    <UserRound
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="ownerName"
                      name="ownerName"
                      type="text"
                      autoComplete="name"
                      minLength={2}
                      maxLength={100}
                      required
                      value={formData.ownerName}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className={`${inputClassName} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Business phone
                  </label>
                  <div className="relative">
                    <Phone
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      maxLength={30}
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className={`${inputClassName} pl-10`}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="border-t border-slate-100 pt-5">
              <div className="mb-4 flex items-center gap-2">
                <MapPin
                  className="h-4 w-4 text-violet-600"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-semibold text-slate-900">
                  Gym location
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="address"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Street address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={2}
                    maxLength={300}
                    autoComplete="street-address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street, building, or area"
                    className={`${inputClassName} resize-y`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    maxLength={100}
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    State or region
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    autoComplete="address-level1"
                    maxLength={100}
                    required
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State or region"
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor="pincode"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Postal code
                  </label>
                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    autoComplete="postal-code"
                    maxLength={20}
                    required
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Postal code"
                    className={inputClassName}
                  />
                </div>
              </div>
            </section>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving your gym profile..." : "Save and continue"}
              {!loading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </button>
            <p className="text-center text-xs text-slate-400">
              You&apos;ll be able to manage your members after setup.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
