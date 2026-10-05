import axios from "axios";
import { getStoredTeamSession, storeTeamSession } from "./auth";

const baseURL =
  process.env.NODE_ENV === "production"
    ? "https://ilonggospeak.onrender.com/api"
    : process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getStoredTeamSession()?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      storeTeamSession(null);
    }
    return Promise.reject(error);
  }
);
