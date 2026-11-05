import api from "./api";

export const getDashboardSummary = async () => {
  return await api.get("/dashboard/summary");
};
