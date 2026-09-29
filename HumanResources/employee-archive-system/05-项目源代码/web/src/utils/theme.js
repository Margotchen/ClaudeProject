import { reactive } from 'vue';

// 主题状态（模块单例，无 Pinia 依赖）
export const themeState = reactive({
  theme: localStorage.getItem('theme') || 'light'
});

export function applyTheme(value) {
  themeState.theme = value;
  document.documentElement.setAttribute('data-theme', value);
  document.documentElement.classList.toggle('dark', value === 'dark');
  localStorage.setItem('theme', value);
}

export function initTheme() {
  applyTheme(themeState.theme);
}

export function toggleTheme() {
  applyTheme(themeState.theme === 'light' ? 'dark' : 'light');
}
