import api from "./api";

export const getPlans = async () => {
  return await api.get("/plans");
};

export const createPlan = async (planData) => {
  return await api.post("/plans", planData);
};
