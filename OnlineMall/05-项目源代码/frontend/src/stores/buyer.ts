import { defineStore } from 'pinia'
import { ref } from 'vue'
import { buyerLoginAPI, getBuyerInfoAPI } from '@/apis/buyer'
import type { BuyerInfo, BuyerLoginParam } from '@/types/buyer'

export const useBuyerStore = defineStore(
  'buyer',
  () => {
    // 买家 token
    const token = ref('')
    // 买家信息
    const buyerInfo = ref<BuyerInfo>({})

    // 买家登录
    const buyerLogin = async (loginParam: BuyerLoginParam) => {
      const res = await buyerLoginAPI(loginParam)
      const tokenStr = res.data.tokenHead + res.data.token
      token.value = tokenStr
      await getBuyerInfo()
    }

    // 获取买家信息
    const getBuyerInfo = async () => {
      const res = await getBuyerInfoAPI()
      buyerInfo.value = res.data
    }

    // 买家登出
    const buyerLogout = () => {
      token.value = ''
      buyerInfo.value = {}
    }

    return {
      token,
      buyerInfo,
      buyerLogin,
      getBuyerInfo,
      buyerLogout,
    }
  },
  {
    persist: true,
  },
)

export default useBuyerStore
