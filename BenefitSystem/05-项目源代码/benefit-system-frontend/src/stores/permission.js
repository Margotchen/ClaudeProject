import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useUserStore } from './user'

export const usePermissionStore = defineStore('permission', () => {
  const userStore = useUserStore()

  const menus = computed(() => {
    const role = userStore.roleCode
    const base = []

    if (role === 'employee') {
      base.push(
        { path: '/employee/hall', title: '活动大厅', icon: 'Present' },
        { path: '/employee/my-apply', title: '我的申领', icon: 'Document' },
        { path: '/employee/address', title: '地址管理', icon: 'Location' }
      )
    }

    if (role === 'hr' || role === 'admin') {
      base.push(
        { path: '/hr/dashboard', title: '数据看板', icon: 'DataLine' },
        { path: '/hr/activity', title: '活动管理', icon: 'Calendar' },
        { path: '/hr/gift', title: '礼品库', icon: 'Goods' },
        { path: '/hr/apply', title: '申领管理', icon: 'List' },
        { path: '/hr/export', title: '导出中心', icon: 'Download' }
      )
    }

    if (role === 'admin') {
      base.push(
        { path: '/admin/user', title: '用户管理', icon: 'User' },
        { path: '/admin/role', title: '角色管理', icon: 'Lock' }
      )
    }

    return base
  })

  return { menus }
})
