/** 买家登录请求参数 */
export type BuyerLoginParam = {
  /** 用户名 */
  username: string
  /** 密码 */
  password: string
}

/** 买家注册请求参数 */
export type BuyerRegisterParam = {
  /** 用户名 */
  username: string
  /** 密码 */
  password: string
  /** 手机号 */
  telephone: string
  /** 验证码 */
  authCode: string
}

/** 买家登录返回结果 */
export type BuyerLoginResult = {
  /** token 前缀 */
  tokenHead: string
  /** token */
  token: string
}

/** 买家/会员信息 */
export type BuyerInfo = {
  /** ID */
  id?: number
  /** 用户名 */
  username?: string
  /** 昵称 */
  nickname?: string
  /** 手机号 */
  phone?: string
  /** 头像 */
  icon?: string
  /** 性别 */
  gender?: number
  /** 积分 */
  integration?: number
  /** 成长值 */
  growth?: number
  /** 状态 */
  status?: number
}
