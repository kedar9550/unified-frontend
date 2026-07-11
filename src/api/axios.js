import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:9000",
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
  const isUpload = config.data instanceof FormData || 
                   /multipart\/form-data/i.test(config.headers?.['Content-Type'] || config.headers?.['content-type'] || '');

  if (isUpload) {
    config.skipGlobalLoader = true;
  }

  if (!config.skipGlobalLoader) {
    _startLoading();
  }
  return config;
});

API.interceptors.response.use(
  (response) => {
    if (!response.config?.skipGlobalLoader) {
      _stopLoading();
    }
    return response;
  },
  (error) => {
    if (!error.config?.skipGlobalLoader) {
      _stopLoading();
    }
    return Promise.reject(error);
  }
);

export default API;