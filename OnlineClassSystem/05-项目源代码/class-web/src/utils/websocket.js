import { getToken } from './auth'

/**
 * 直播间 WebSocket 客户端
 * - 自动重连（最多 5 次，指数退避）
 * - 按消息 type 分发到注册的处理器
 */
export class LiveSocket {
  constructor(scheduleId) {
    this.scheduleId = scheduleId
    this.handlers = new Map()
    this.ws = null
    this.retries = 0
    this.maxRetries = 5
    this.closedByUser = false
  }

  connect() {
    this.closedByUser = false
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    const url = `${protocol}://${location.host}/ws/live/${this.scheduleId}?token=${getToken()}`
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.retries = 0
      this.emitLocal('open')
    }
    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        const handler = this.handlers.get(msg.type)
        if (handler) handler(msg.data, msg)
        const anyHandler = this.handlers.get('*')
        if (anyHandler) anyHandler(msg)
      } catch (e) {
        console.error('WS 消息解析失败', e)
      }
    }
    this.ws.onclose = () => {
      this.emitLocal('close')
      if (!this.closedByUser && this.retries < this.maxRetries) {
        this.retries++
        setTimeout(() => this.connect(), 1000 * 2 ** this.retries)
      }
    }
    this.ws.onerror = () => this.emitLocal('error')
  }

  /** 注册消息处理器；type 传 '*' 接收全部消息 */
  on(type, handler) {
    this.handlers.set(type, handler)
    return this
  }

  /** 发送消息对象（自动 JSON 序列化） */
  send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj))
      return true
    }
    return false
  }

  get connected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }

  close() {
    this.closedByUser = true
    if (this.ws) this.ws.close()
  }

  emitLocal(type) {
    const handler = this.handlers.get(`__${type}`)
    if (handler) handler()
  }
}
