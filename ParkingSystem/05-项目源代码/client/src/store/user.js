import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// 读取本地缓存用户信息，数据损坏时兜底为空对象防白屏
function loadCachedUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    localStorage.removeItem('user');
    return {};
  }
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '');
  const userInfo = ref(loadCachedUser());

  const isLoggedIn = computed(() => !!token.value);
  const role = computed(() => userInfo.value.role || 'employee');

  function setUser(info, tk) {
    userInfo.value = info;
    token.value = tk;
    localStorage.setItem('token', tk);
    localStorage.setItem('user', JSON.stringify(info));
  }

  function clearUser() {
    userInfo.value = {};
    token.value = '';
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  function hasRole(roles) {
    if (!roles || roles.length === 0) return true;
    return roles.includes(role.value);
  }

  return { token, userInfo, isLoggedIn, role, setUser, clearUser, hasRole };
});
