import api from "./api";

export const getPlans = async () => {
  return await api.get("/plans");
};

export const createPlan = async (planData) => {
  return await api.post("/plans", planData);
};

export const updatePlan = async (id, planData) => {
  return await api.put(`/plans/${id}`, planData);
};

export const deletePlan = async (id) => {
  return await api.delete(`/plans/${id}`);
};
