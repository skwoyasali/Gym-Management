import api from "./api";

export const getPaymentSettings = async () =>
  api.get("/gym/payment-settings");

export const updatePaymentSettings = async (settings) =>
  api.put("/gym/payment-settings", settings);

export const uploadPaymentQr = async (file) => {
  const formData = new FormData();
  formData.append("qr", file);
  return api.post("/gym/payment-qr", formData);
};

export const deletePaymentQr = async () => api.delete("/gym/payment-qr");

export const getPaymentQr = async () =>
  api.get("/gym/payment-qr", { responseType: "blob" });
