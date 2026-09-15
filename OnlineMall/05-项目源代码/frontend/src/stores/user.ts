import { defineStore } from 'pinia'
import { getAdminInfoAPI, adminLoginAPI, adminLogoutAPI } from '@/apis/admin'
import { ref } from 'vue'
import type { LoginParam, UserInfo } from '@/types/admin'

export const useUserStore = defineStore(
  'user',
  () => {
    // 用户信息
    const userInfo = ref<UserInfo>({
      username: '',
      password: '',
      avatar: '',
      roles: [],
      token: '',
      menus: [],
      merchantId: undefined,
      shopId: undefined,
    })

    // 用户登录
    const userLogin = async (loginParam: LoginParam) => {
      const res = await adminLoginAPI(loginParam)
      const tokenStr = res.data.tokenHead + res.data.token
      userInfo.value.token = tokenStr
      userInfo.value.username = loginParam.username
      userInfo.value.password = loginParam.password
      await getUserInfo()
    }

    // 获取用户信息
    const getUserInfo = async () => {
      const res = await getAdminInfoAPI()
      if (res.data.roles && res.data.roles.length > 0) {
        // 验证返回的roles是否是一个非空数组
        userInfo.value.roles = res.data.roles
      } else {
        throw new Error('该用户暂未分配角色，请先分配角色！')
      }
      userInfo.value.menus = res.data.menus
      userInfo.value.avatar = res.data.icon
      userInfo.value.merchantId = res.data.merchantId
      userInfo.value.shopId = res.data.shopId
    }

    // 用户登出
    const userLogout = async () => {
      try {
        await adminLogoutAPI()
      } catch (e) {
        // 服务端退出接口失败时，仍要清空本地登录状态
        console.warn('调用服务端登出接口失败，已清空本地状态', e)
      }
      userInfo.value.token = ''
      userInfo.value.roles = []
      userInfo.value.username = ''
      userInfo.value.password = ''
      userInfo.value.avatar = ''
      userInfo.value.menus = []
      userInfo.value.merchantId = undefined
      userInfo.value.shopId = undefined
    }

    // 前端登出
    const fedLogout = () => {
      userInfo.value.token = ''
    }

    return {
      userInfo,
      userLogin,
      getUserInfo,
      userLogout,
      fedLogout,
    }
  },
  {
    // 持久化配置
    persist: true,
  },
)
