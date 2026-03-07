import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "";

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30s timeout — gateway has up to 5s latency x3 retries
});

// Response interceptor — unwrap TransformInterceptor envelope + standardize errors
// Backend wraps all success responses as: { success: true, data: T, timestamp: string }
apiClient.interceptors.response.use(
  (response) => {
    // If the response has the envelope shape, transparently unwrap it
    // so all service callers get the raw data directly via response.data
    const body = response.data;
    if (
      body &&
      typeof body === "object" &&
      "success" in body &&
      "data" in body
    ) {
      response.data = body.data;
    }
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
