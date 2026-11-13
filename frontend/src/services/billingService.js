import api from "./api";

export const getGymBilling = (params) => api.get("/billing", { params });

export const getSuperAdminDashboard = () =>
  api.get("/super-admin/dashboard");

export const getSuperAdminGyms = (params) =>
  api.get("/super-admin/gyms", { params });

export const getSuperAdminGym = (id, params) =>
  api.get(`/super-admin/gyms/${id}`, { params });

export const updateSuperAdminGym = (id, data) =>
  api.patch(`/super-admin/gyms/${id}`, data);

export const getSuperAdminBilling = (params) =>
  api.get("/super-admin/billing", { params });

export const recordSuperAdminPayment = (id, data) =>
  api.post(`/super-admin/billing/${id}/payments`, data);

export const getPlatformPricing = () =>
  api.get("/super-admin/pricing");

export const updatePlatformPricing = (data) =>
  api.put("/super-admin/pricing", data);
