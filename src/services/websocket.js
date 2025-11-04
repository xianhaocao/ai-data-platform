import { io } from 'socket.io-client'
import { useDashboardStore } from '@/stores/dashboard'

class WebSocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.subscriptions = new Map() // 存储组件订阅
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000 // 1秒
    this.baseUrl = 'http://localhost:3001'
  }

  // 建立WebSocket连接
  connect() {
    try {
      this.socket = io(this.baseUrl, {
        transports: ['websocket'],
        timeout: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      })

      this.socket.on('connect', () => {
        console.log('WebSocket连接已建立')
        this.isConnected = true
        this.reconnectAttempts = 0
        
        // 连接成功后重新订阅所有组件
        this.resubscribe()
      })

      this.socket.on('disconnect', () => {
        console.log('WebSocket连接已断开')
        this.isConnected = false
      })

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`WebSocket重新连接成功，尝试次数: ${attemptNumber}`)
        this.isConnected = true
      })

      this.socket.on('reconnect_failed', () => {
        console.error('WebSocket重新连接失败')
        this.isConnected = false
      })

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket连接错误:', error.message)
      })

      // 监听数据更新
      this.socket.on('dataUpdate', (data) => {
        this.handleDataUpdate(data)
      })

      // 监听批量数据更新
      this.socket.on('batchDataUpdate', (data) => {
        this.handleBatchDataUpdate(data)
      })

    } catch (error) {
      console.error('建立WebSocket连接失败:', error)
    }
  }

  // 断开WebSocket连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.subscriptions.clear()
      console.log('WebSocket连接已手动断开')
    }
  }

  // 重新连接
  reconnect() {
    if (!this.isConnected && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`尝试重新连接WebSocket，次数: ${this.reconnectAttempts}`)
      this.connect()
    }
  }

  // 订阅组件数据
  subscribe(widgetId, callback) {
    if (!this.socket) {
      console.error('WebSocket未连接，无法订阅')
      return false
    }

    if (!widgetId || !callback) {
      console.error('widgetId和callback不能为空')
      return false
    }

    // 如果已经订阅，先取消
    if (this.subscriptions.has(widgetId)) {
      this.unsubscribe(widgetId)
    }

    // 发送订阅请求到服务器
    this.socket.emit('subscribe', widgetId)
    
    // 存储订阅回调
    this.subscriptions.set(widgetId, callback)
    console.log(`已订阅组件: ${widgetId}`)
    return true
  }

  // 取消订阅组件数据
  unsubscribe(widgetId) {
    if (!this.socket) {
      console.error('WebSocket未连接，无法取消订阅')
      return false
    }

    if (!widgetId) {
      console.error('widgetId不能为空')
      return false
    }

    // 发送取消订阅请求到服务器
    this.socket.emit('unsubscribe', widgetId)
    
    // 移除订阅回调
    const removed = this.subscriptions.delete(widgetId)
    if (removed) {
      console.log(`已取消订阅组件: ${widgetId}`)
    }
    return removed
  }

  // 发送消息到服务器
  sendMessage(data) {
    if (!this.socket || !this.isConnected) {
      console.error('WebSocket未连接，无法发送消息')
      return false
    }

    if (!data) {
      console.error('消息数据不能为空')
      return false
    }

    try {
      this.socket.emit('message', data)
      return true
    } catch (error) {
      console.error('发送消息失败:', error)
      return false
    }
  }

  // 监听所有消息
  onMessage(callback) {
    if (!this.socket) {
      console.error('WebSocket未连接，无法监听消息')
      return false
    }

    if (!callback) {
      console.error('callback不能为空')
      return false
    }

    this.socket.on('message', callback)
    return true
  }

  // 取消监听所有消息
  offMessage(callback) {
    if (!this.socket) {
      console.error('WebSocket未连接，无法取消监听消息')
      return false
    }

    if (!callback) {
      console.error('callback不能为空')
      return false
    }

    this.socket.off('message', callback)
    return true
  }

  // 处理数据更新
  handleDataUpdate(data) {
    if (!data || !data.widgetId) {
      console.error('无效的数据更新格式')
      return
    }

    const { widgetId, payload } = data
    
    // 调用对应的订阅回调
    if (this.subscriptions.has(widgetId)) {
      try {
        this.subscriptions.get(widgetId)(payload)
      } catch (error) {
        console.error(`处理组件 ${widgetId} 数据更新失败:`, error)
      }
    }
  }

  // 处理批量数据更新
  handleBatchDataUpdate(data) {
    if (!data || !Array.isArray(data.updates)) {
      console.error('无效的批量数据更新格式')
      return
    }

    data.updates.forEach(update => {
      this.handleDataUpdate(update)
    })
  }

  // 重新订阅所有组件
  resubscribe() {
    if (!this.socket || !this.isConnected) {
      console.error('WebSocket未连接，无法重新订阅')
      return
    }

    console.log('开始重新订阅所有组件...')
    
    // 重新订阅所有组件
    this.subscriptions.forEach((_, widgetId) => {
      this.socket.emit('subscribe', widgetId)
      console.log(`已重新订阅组件: ${widgetId}`)
    })
  }

  // 获取连接状态
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    }
  }

  // 获取当前订阅的组件列表
  getSubscriptions() {
    return Array.from(this.subscriptions.keys())
  }

  // 批量订阅组件
  batchSubscribe(widgetIds, callback) {
    if (!Array.isArray(widgetIds)) {
      console.error('widgetIds必须是数组')
      return false
    }

    let successCount = 0
    widgetIds.forEach(widgetId => {
      if (this.subscribe(widgetId, callback)) {
        successCount++
      }
    })

    console.log(`批量订阅成功: ${successCount}/${widgetIds.length} 个组件`)
    return successCount === widgetIds.length
  }

  // 批量取消订阅组件
  batchUnsubscribe(widgetIds) {
    if (!Array.isArray(widgetIds)) {
      console.error('widgetIds必须是数组')
      return false
    }

    let successCount = 0
    widgetIds.forEach(widgetId => {
      if (this.unsubscribe(widgetId)) {
        successCount++
      }
    })

    console.log(`批量取消订阅成功: ${successCount}/${widgetIds.length} 个组件`)
    return successCount === widgetIds.length
  }

  // 发送心跳包
  sendPing() {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping')
    }
  }

  // 监听心跳响应
  onPong(callback) {
    if (this.socket) {
      this.socket.on('pong', callback)
    }
  }
}

// 创建单例实例
const webSocketService = new WebSocketService()

// 导出单例
export default webSocketService