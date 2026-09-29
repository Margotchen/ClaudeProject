export const ACTIVITY_STATUS = {
  0: { label: '未开始', type: 'info' },
  1: { label: '进行中', type: 'success' },
  2: { label: '已结束', type: 'warning' },
  3: { label: '已停用', type: 'danger' }
}

export const APPLY_STATUS = {
  1: { label: '待发货', type: 'info' },
  2: { label: '已发货', type: 'warning' },
  3: { label: '已签收', type: 'success' },
  4: { label: '已取消', type: 'danger' }
}

export const ACTIVITY_TYPES = [
  { label: '春节', value: '春节' },
  { label: '中秋', value: '中秋' },
  { label: '生日', value: '生日' },
  { label: '其他', value: '其他' }
]

export const ROLES = {
  employee: '普通员工',
  hr: 'HR 管理员',
  admin: '系统管理员'
}
