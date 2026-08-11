import axios from "axios";
import { toast } from "sonner";

const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const jwtToken = localStorage.getItem("lh.jwt.token");
    if (jwtToken) {
      config.headers.Authorization = `Bearer ${jwtToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const api = {
  async get(url, params = {}) {
    try {
      const res = await apiClient.get(url, { params });
      return res.data;
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  },

  async post(url, data = {}) {
    try {
      const res = await apiClient.post(url, data);
      if (res.data?.message) {
        toast.success(res.data.message);
      }
      return res.data;
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  },

  async put(url, data = {}) {
    try {
      const res = await apiClient.put(url, data);
      if (res.data?.message) {
        toast.success(res.data.message);
      }
      return res.data;
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  },

  async delete(url) {
    try {
      const res = await apiClient.delete(url);
      if (res.data?.message) {
        toast.success(res.data.message);
      }
      return res.data;
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  },
};

export function handleApiError(err) {
  if (err.response) {
    const status = err.response.status;
    const data = err.response.data;

    if (status === 401) {
      localStorage.removeItem("lh.jwt.token");
      localStorage.removeItem("lh.auth.user");
      toast.error("Your session has expired. Redirecting to login...");
      setTimeout(() => {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }, 1200);
      return;
    }

    // For 422 validation errors, caller receives error object for inline display
    if (status === 422 && data.errors) {
      const formattedErrors = {};
      Object.keys(data.errors).forEach((key) => {
        formattedErrors[key] = Array.isArray(data.errors[key]) ? data.errors[key][0] : data.errors[key];
      });
      return formattedErrors;
    }

    if (data.message) {
      const msg = String(data.message);
      if (msg.includes("SQLSTATE") || msg.includes("SQL:") || msg.includes("Data truncated")) {
        toast.error("Unable to save record due to database validation. Please check your entries.");
        return;
      }
      toast.error(msg);
      return;
    }
  }
  toast.error("An unexpected network error occurred. Please try again.");
}

export default api;
