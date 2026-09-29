/**
 * WebRTC 推拉流工具（SRS WHIP/WHEP 协议）
 * SRS WHIP 要求 SDP 携带完整 ICE candidates（不支持 trickle），
 * 因此 POST 前需等待 ICE gathering 完成。
 */

/** 等待 ICE gathering 完成（超时兜底 3s） */
function waitIceComplete(pc) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, 3000)
    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timer)
        resolve()
      }
    })
  })
}

async function exchangeSdp(pc, url) {
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  await waitIceComplete(pc)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp' },
    body: pc.localDescription.sdp
  })
  if (!res.ok) {
    throw new Error(`SRS 信令交换失败：HTTP ${res.status}`)
  }
  const answer = await res.text()
  await pc.setRemoteDescription({ type: 'answer', sdp: answer })
}

/**
 * WHIP 推流器（讲师端）：摄像头+麦克风 / 屏幕共享
 */
export class WhipPublisher {
  constructor(whipUrl) {
    this.whipUrl = whipUrl
    this.pc = null
    this.stream = null
    this.cameraStream = null
    this.mode = 'camera' // camera | screen
    this.onScreenEnd = null
  }

  /** 开始摄像头推流 */
  async startCamera() {
    this.cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: true
    })
    this.mode = 'camera'
    await this._publish(this.cameraStream)
    return this.cameraStream
  }

  /** 切换屏幕共享（保留摄像头流的音轨） */
  async startScreen() {
    const display = await navigator.mediaDevices.getDisplayMedia({ video: true })
    this.mode = 'screen'
    const tracks = [...display.getVideoTracks()]
    const audioTrack = this.cameraStream?.getAudioTracks()[0]
    if (audioTrack) tracks.push(audioTrack)
    const screenStream = new MediaStream(tracks)
    // 用户通过浏览器控件停止共享时回调（用于恢复摄像头）
    display.getVideoTracks()[0].onended = () => this.onScreenEnd?.()
    await this._publish(screenStream)
    return screenStream
  }

  /** 返回摄像头推流 */
  async backToCamera() {
    this.mode = 'camera'
    await this._publish(this.cameraStream)
    return this.cameraStream
  }

  toggleAudio(enabled) {
    this.stream?.getAudioTracks().forEach((t) => (t.enabled = enabled))
  }

  toggleVideo(enabled) {
    this.stream?.getVideoTracks().forEach((t) => (t.enabled = enabled))
  }

  async _publish(stream) {
    this._closePc()
    this.stream = stream
    const pc = new RTCPeerConnection()
    this.pc = pc
    pc.addTransceiver('audio', { direction: 'sendonly' })
    pc.addTransceiver('video', { direction: 'sendonly' })
    stream.getTracks().forEach((track) => pc.addTrack(track, stream))
    await exchangeSdp(pc, this.whipUrl)
  }

  _closePc() {
    if (this.pc) {
      this.pc.close()
      this.pc = null
    }
  }

  stop() {
    this._closePc()
    this.stream?.getTracks().forEach((t) => t.stop())
    this.cameraStream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    this.cameraStream = null
  }
}

/**
 * WHEP 拉流播放器（学生端/监督端）
 */
export class WhepPlayer {
  constructor(whepUrl, videoEl) {
    this.whepUrl = whepUrl
    this.videoEl = videoEl
    this.pc = null
    this.playing = false
    this.onStateChange = null // 'playing' | 'failed'
  }

  async start() {
    this.stop()
    const pc = new RTCPeerConnection()
    this.pc = pc
    pc.addTransceiver('audio', { direction: 'recvonly' })
    pc.addTransceiver('video', { direction: 'recvonly' })
    pc.ontrack = (e) => {
      if (this.videoEl) {
        this.videoEl.srcObject = e.streams[0]
        this.videoEl.play().catch(() => {})
      }
      this.playing = true
      this.onStateChange?.('playing')
    }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        this.onStateChange?.('failed')
      }
    }
    await exchangeSdp(pc, this.whepUrl)
  }

  stop() {
    if (this.pc) {
      this.pc.close()
      this.pc = null
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null
    }
    this.playing = false
  }
}
