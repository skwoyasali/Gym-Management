import api from "./api";

export const getMyRechargeOverview = async () => api.get("/recharges/me");

export const submitRechargeRequest = async (formData) =>
  api.post("/recharges/requests", formData);

export const getRechargeRequests = async (status = "pending") =>
  api.get("/recharges/admin/requests", { params: { status } });

export const reviewRechargeRequest = async (id, action, reason = "") =>
  api.post(`/recharges/admin/requests/${id}/${action}`, { reason });

export const getMemberRechargeHistory = async (memberId) =>
  api.get(`/recharges/admin/members/${memberId}/history`);

export const getRechargeProof = async (requestId) =>
  api.get(`/recharges/requests/${requestId}/proof`, {
    responseType: "blob",
  });
