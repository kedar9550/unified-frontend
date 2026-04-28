import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});

// Global loading callbacks — set once by LoadingProvider
let _startLoading = () => { };
let _stopLoading = () => { };

export const registerLoadingHandlers = (start, stop) => {
  _startLoading = start;
  _stopLoading = stop;
};

API.interceptors.request.use((config) => {
  _startLoading();
  return config;
});

API.interceptors.response.use(
  (response) => {
    _stopLoading();
    return response;
  },
  (error) => {
    _stopLoading();
    return Promise.reject(error);
  }
);

export default API;