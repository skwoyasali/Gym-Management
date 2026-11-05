import api from "./api";

export const getPlans = async () => {
  return await api.get("/plans");
};
