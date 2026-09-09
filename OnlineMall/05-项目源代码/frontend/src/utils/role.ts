import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

export function useCurrentRole() {
  const userStore = useUserStore()
  const { userInfo } = storeToRefs(userStore)

  const isPlatformAdmin = () => {
    return userInfo.value.shopId == null
  }

  const isMerchant = () => {
    return userInfo.value.shopId != null
  }

  const currentShopId = () => {
    return userInfo.value.shopId
  }

  return {
    isPlatformAdmin,
    isMerchant,
    currentShopId,
  }
}
