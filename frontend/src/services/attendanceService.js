import api from "./api";

export const getTenantAttendance = async (date) => {
  return await api.get("/attendance", { params: { date } });
};

export const getMyAttendance = async () => {
  return await api.get("/attendance/mine");
};

export const checkIn = async () => {
  return await api.post("/attendance/check-in");
};
