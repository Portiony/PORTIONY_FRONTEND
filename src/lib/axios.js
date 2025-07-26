import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8080',
  //baseURL: 'https://port-0-portiony-backend-md4272k5c4648749.sel5.cloudtype.app',
  withCredentials: true,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshingToken = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('리프레시 토큰 없음');

  // axios 대신 instance 사용
  const response = await instance.get('/api/auth/refresh', {
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  const { accessToken, refreshToken: newRefreshToken } = response.data;
  localStorage.setItem('access_token', accessToken);
  if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);
  return accessToken;
};

// 요청 인터셉터
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 응답 인터셉터
instance.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (
      err.response?.status === 401 &&
      !original._retry
    ) {
      if (isRefreshingToken) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
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
        localStorage.clear(); // 로그아웃 처리
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshingToken = false;
      }
    }

    return Promise.reject(err);
  }
);

export default instance;
