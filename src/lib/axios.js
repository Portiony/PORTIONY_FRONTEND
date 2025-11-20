import axios from "axios";

const instance = axios.create({
  baseURL: "https://port-0-portiony-be-md4272k5c4648749.sel5.cloudtype.app",
  timeout: 5000,
  headers: {
  },
});

const PUBLIC_URLS = [
  "/api/users/signup/check-id",
  "/api/users/signup/check-phone",
  "/api/users/signup",
  "/api/users/login",
];

let isRefreshingToken = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) throw new Error("리프레시 토큰 없음");

  const response = await instance.get("/api/auth/refresh", {
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  const { accessToken, refreshToken: newRefreshToken } = response.data;
  localStorage.setItem("access_token", accessToken);
  if (newRefreshToken) localStorage.setItem("refresh_token", newRefreshToken);
  return accessToken;
};

instance.interceptors.request.use((config) => {
  if (PUBLIC_URLS.some((url) => config.url?.startsWith(url))) {
    return config;
  }

  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshingToken) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return instance(original);
        });
      }

      original._retry = true;
      isRefreshingToken = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return instance(original);
      } catch (error) {
        processQueue(error, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      } finally {
        isRefreshingToken = false;
      }
    }

    return Promise.reject(err);
  }
);

export default instance;
