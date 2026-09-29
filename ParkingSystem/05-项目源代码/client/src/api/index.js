import axios from 'axios';
import { ElMessage } from 'element-plus';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error.response?.data || error);
    }
    // 网络层错误（无响应）统一提示；业务错误由各页面 catch 自行提示，避免重复弹窗
    if (!error.response) {
      ElMessage.error(error.message?.includes('timeout') ? '请求超时，请稍后重试' : '网络异常，请检查连接');
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
