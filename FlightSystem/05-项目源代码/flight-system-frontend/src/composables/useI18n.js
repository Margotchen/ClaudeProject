import { getCurrentInstance } from 'vue'
import { t, locale, setLocale } from '@/locales'

export function useI18n() {
  const instance = getCurrentInstance()
  if (!instance) {
    return { t, locale, setLocale }
  }
  return {
    t,
    locale,
    setLocale
  }
}

export default useI18n
