import { useRouter } from 'vue-router'

export function useGoBack(fallbackRoute) {
  const router = useRouter()
  return () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.replace(fallbackRoute)
    }
  }
}
