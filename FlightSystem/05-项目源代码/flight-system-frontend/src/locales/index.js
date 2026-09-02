import { ref, computed } from 'vue'
import enUS from './en-US.js'
import zhCN from './zh-CN.js'

export const messages = {
  'en-US': enUS,
  'zh-CN': zhCN
}

const STORAGE_KEY = 'app-locale'

const currentLocale = ref(localStorage.getItem(STORAGE_KEY) || 'zh-CN')

function getValueByPath(obj, path) {
  const keys = path.split('.')
  let value = obj
  for (const key of keys) {
    if (value == null || typeof value !== 'object') return undefined
    value = value[key]
  }
  return value
}

function translate(locale, key, args = {}) {
  const localeMessages = messages[locale] || messages['en-US']
  let value = getValueByPath(localeMessages, key)
  if (value === undefined) {
    const fallback = messages['en-US']
    value = getValueByPath(fallback, key)
  }
  if (value === undefined) {
    console.warn(`[i18n] Missing key: ${key}`)
    return key
  }
  if (typeof value !== 'string') {
    return key
  }
  return value.replace(/\{(\w+)\}/g, (_, name) => {
    return args[name] !== undefined ? String(args[name]) : `{${name}}`
  })
}

export const locale = computed({
  get: () => currentLocale.value,
  set: (val) => {
    currentLocale.value = val
    localStorage.setItem(STORAGE_KEY, val)
  }
})

export function t(key, args) {
  return translate(currentLocale.value, key, args)
}

export function setLocale(val) {
  locale.value = val
}

export function install(app) {
  app.config.globalProperties.$t = t
  app.config.globalProperties.$locale = locale
  app.config.globalProperties.$setLocale = setLocale
}

export default {
  install,
  locale,
  t,
  setLocale,
  messages
}
