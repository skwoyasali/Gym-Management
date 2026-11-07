import { useEffect, useState } from "react";
import {
  Check,
  CircleAlert,
  ImagePlus,
  Loader2,
  QrCode,
  Save,
  Trash2,
} from "lucide-react";
import {
  deletePaymentQr,
  getPaymentQr,
  getPaymentSettings,
  updatePaymentSettings,
  uploadPaymentQr,
} from "../../services/gymService";

const initialSettings = {
  upiId: "",
  receiverName: "",
  paymentNumber: "",
  instructions: "",
  qrConfigured: false,
};

const isAllowedImage = (file) =>
  ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
  file.size <= 5 * 1024 * 1024;

export default function Settings() {
  const [settings, setSettings] = useState(initialSettings);
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    getPaymentSettings()
      .then(async (response) => {
        if (!active) return;
        const data = response.data.data;
        setSettings(data);
        if (data.qrConfigured) {
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
              "Unable to load payment settings."
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

  useEffect(
    () => () => {
      if (qrPreview) URL.revokeObjectURL(qrPreview);
    },
    [qrPreview]
  );

  const handleChange = (event) => {
    setSettings((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
    setError("");
    setNotice("");
  };

  const handleSelectQr = (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    setError("");
    setNotice("");
    if (file && !isAllowedImage(file)) {
      setError("Choose a JPG, PNG, or WEBP image no larger than 5 MB.");
      return;
    }
    setQrFile(file);
    if (file) setQrPreview(URL.createObjectURL(file));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const response = await updatePaymentSettings({
        upiId: settings.upiId,
        receiverName: settings.receiverName,
        paymentNumber: settings.paymentNumber,
        instructions: settings.instructions,
      });
      let updatedSettings = response.data.data;

      if (qrFile) {
        const qrResponse = await uploadPaymentQr(qrFile);
        updatedSettings = qrResponse.data.data;
        const imageResponse = await getPaymentQr();
        setQrPreview(URL.createObjectURL(imageResponse.data));
        setQrFile(null);
      }

      setSettings(updatedSettings);
      setNotice("UPI payment settings saved.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to save UPI payment settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQr = async () => {
    if (!window.confirm("Remove the gym's UPI QR code?")) return;
    setError("");
    setNotice("");
    try {
      const response = await deletePaymentQr();
      setSettings(response.data.data);
      setQrFile(null);
      setQrPreview("");
      setNotice("UPI QR code removed.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to remove the UPI QR code."
      );
    }
  };

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-indigo-600">Gym operations</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Payment settings
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Configure the UPI details members use when submitting recharge requests.
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

      {loading ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Loading payment settings...
        </p>
      ) : (
        <form
          onSubmit={handleSave}
          className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]"
        >
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h2 className="font-semibold text-slate-900">UPI details</h2>
              <p className="mt-1 text-sm text-slate-500">
                These details are shown to your members at checkout.
              </p>
            </div>

            <div>
              <label
                htmlFor="upi-id"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                UPI ID
              </label>
              <input
                id="upi-id"
                name="upiId"
                value={settings.upiId}
                onChange={handleChange}
                maxLength={120}
                placeholder="yourgym@bank"
                autoComplete="off"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="upi-receiver"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Receiver name
                </label>
                <input
                  id="upi-receiver"
                  name="receiverName"
                  value={settings.receiverName}
                  onChange={handleChange}
                  maxLength={120}
                  placeholder="Gym account name"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label
                  htmlFor="upi-number"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Payment number
                </label>
                <input
                  id="upi-number"
                  name="paymentNumber"
                  type="tel"
                  value={settings.paymentNumber}
                  onChange={handleChange}
                  maxLength={30}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="upi-instructions"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Payment instructions (optional)
              </label>
              <textarea
                id="upi-instructions"
                name="instructions"
                value={settings.instructions}
                onChange={handleChange}
                rows={4}
                maxLength={500}
                placeholder="Add any details members should include with their payment."
                className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {saving ? "Saving..." : "Save payment settings"}
            </button>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <QrCode className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-900">UPI QR code</h2>
                <p className="text-sm text-slate-500">JPG, PNG, or WEBP · max 5 MB</p>
              </div>
            </div>

            <div className="mt-5 flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
              {qrPreview ? (
                <img
                  src={qrPreview}
                  alt="Gym UPI QR code preview"
                  className="max-h-56 max-w-full rounded-lg object-contain"
                />
              ) : (
                <div className="text-center">
                  <QrCode
                    className="mx-auto h-10 w-10 text-slate-300"
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-sm text-slate-500">
                    No QR code uploaded
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                Choose QR image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleSelectQr}
                  className="sr-only"
                />
              </label>
              {settings.qrConfigured && (
                <button
                  type="button"
                  onClick={handleDeleteQr}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Remove QR
                </button>
              )}
            </div>
            {qrFile && (
              <p className="mt-2 text-xs text-slate-500">
                {qrFile.name} — upload it by saving the settings.
              </p>
            )}
          </section>
        </form>
      )}
    </div>
  );
}
