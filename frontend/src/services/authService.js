import api from "./api";

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user"); // if you store user data
};



export const loginUser = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};