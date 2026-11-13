import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log("Headers:", config.headers);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const response = error.response;
    const isLoginRequest = error.config?.url?.includes("/auth/login");
    if (
      response?.status === 403 &&
      ["GYM_ACCOUNT_EXPIRED", "GYM_ACCOUNT_INACTIVE"].includes(
        response.data?.code
      ) &&
      !isLoginRequest
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export default api;
