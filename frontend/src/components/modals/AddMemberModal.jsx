import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Loader2,
  Mail,
  MapPin,
  Phone,
  UserPlus,
  UserRound,
  VenusAndMars,
  X,
} from "lucide-react";
import { createMember, updateMember } from "../../services/memberService";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  gender: "",
  dateOfBirth: "",
  address: "",
};

const inputBaseClass =
  "w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4";

const getMemberForm = (member) =>
  member
    ? {
        name: member.name || "",
        phone: member.phone || "",
        email: member.email || "",
        gender: member.gender || "",
        dateOfBirth: member.dateOfBirth
          ? new Date(member.dateOfBirth).toISOString().slice(0, 10)
          : "",
        address: member.address || "",
      }
    : initialForm;

const AddMemberModal = ({
  isOpen,
  onClose,
  onSuccess,
  member = null,
}) => {
  const [formData, setFormData] = useState(() => getMemberForm(member));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData(initialForm);
    setErrors({});
  };

  const closeModal = useCallback(() => {
    if (loading) return;
    resetForm();
    onClose();
  }, [loading, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, loading, closeModal]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name] || errors.submit) {
      setErrors((previous) => ({
        ...previous,
        [name]: "",
        submit: "",
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      newErrors.email = "Enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const memberData = {
        ...formData,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
      };
      const response = member
        ? await updateMember(member._id, memberData)
        : await createMember(memberData);

      if (!response.data?.success) {
        setErrors({
          submit:
            response.data?.message ||
            `Failed to ${member ? "update" : "create"} member`,
        });
        return;
      }

      onSuccess?.(response.data.data);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Create member error:", error);
      setErrors({
        submit:
          error.response?.data?.message ||
          `Failed to ${member ? "update" : "create"} member`,
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `${inputBaseClass} ${
      errors[field]
        ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
        : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
    }`;

  const fieldLabelClass =
    "mb-2 block text-sm font-medium text-slate-700";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) closeModal();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-member-title"
        className="flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl shadow-slate-950/25"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-white px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <UserPlus className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Member management
              </p>
              <h2
                id="add-member-title"
                className="mt-0.5 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
              >
                {member ? "Edit member" : "Add a new member"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={loading}
            aria-label="Close dialog"
            className="rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-y-auto px-5 py-6 sm:px-7">
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="mt-0.5 text-indigo-600">
                <BadgeCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-sm leading-5 text-slate-600">
                {member
                  ? "Update the member’s personal and contact information."
                  : "Add the member’s personal and contact information. Assign a membership plan later using Recharge."}
                <span className="ml-1 text-rose-600">* Required fields</span>
              </p>
            </div>

            <section aria-labelledby="member-details-heading">
              <div className="mb-4 flex items-center gap-2">
                <UserRound
                  className="h-4 w-4 text-indigo-600"
                  aria-hidden="true"
                />
                <h3
                  id="member-details-heading"
                  className="text-sm font-semibold text-slate-900"
                >
                  Personal details
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="member-name" className={fieldLabelClass}>
                    Full name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="member-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter member name"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "member-name-error" : undefined}
                    className={inputClass("name")}
                  />
                  {errors.name && (
                    <p id="member-name-error" className="mt-1.5 text-xs text-rose-600">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="member-phone" className={fieldLabelClass}>
                    Phone number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="member-phone"
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="10-digit phone number"
                      maxLength={10}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? "member-phone-error" : undefined}
                      className={`${inputClass("phone")} pl-10`}
                    />
                  </div>
                  {errors.phone && (
                    <p id="member-phone-error" className="mt-1.5 text-xs text-rose-600">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="member-email" className={fieldLabelClass}>
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="member-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="member@example.com"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "member-email-error" : undefined}
                      className={`${inputClass("email")} pl-10`}
                    />
                  </div>
                  {errors.email && (
                    <p id="member-email-error" className="mt-1.5 text-xs text-rose-600">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="member-gender" className={fieldLabelClass}>
                    Gender
                  </label>
                  <div className="relative">
                    <VenusAndMars
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <select
                      id="member-gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={`${inputClass("gender")} appearance-none pl-10`}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="member-dob" className={fieldLabelClass}>
                    Date of birth
                  </label>
                  <div className="relative">
                    <CalendarDays
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="member-dob"
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={`${inputClass("dateOfBirth")} pl-10`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="member-address" className={fieldLabelClass}>
                    Address
                  </label>
                  <div className="relative">
                    <MapPin
                      className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400"
                      aria-hidden="true"
                    />
                    <textarea
                      id="member-address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={2}
                      maxLength={500}
                      placeholder="Enter member address"
                      className={`${inputClass("address")} resize-y pl-10`}
                    />
                  </div>
                </div>
              </div>
            </section>

            {errors.submit && (
              <div
                className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                role="alert"
              >
                {errors.submit}
              </div>
            )}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Adding member...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  {member ? "Save changes" : "Add member"}
                </>
              )}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};

export default AddMemberModal;
