import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import fs from 'fs'
import path from 'path'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

// 配置文件路径
const CONFIG_FILE = path.join(process.cwd(), 'dashboard-config.json')

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// API端点：获取仪表盘配置
app.get('/api/dashboard/config', (req, res) => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = fs.readFileSync(CONFIG_FILE, 'utf8')
      res.json(JSON.parse(config))
    } else {
      res.status(404).json({ message: '配置文件不存在' })
    }
  } catch (error) {
    console.error('读取配置文件失败:', error)
    res.status(500).json({ message: '读取配置文件失败' })
  }
})

// API端点：保存仪表盘配置
app.post('/api/dashboard/config', (req, res) => {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(req.body, null, 2))
    res.json({ message: '配置保存成功' })
    
    // 广播配置更新到所有连接的客户端
    io.emit('data-update', {
      dashboardId: req.body.id,
      layout: req.body.layout,
      widgets: req.body.widgets
    })
  } catch (error) {
    console.error('保存配置文件失败:', error)
    res.status(500).json({ message: '保存配置文件失败' })
  }
})

// API端点：获取组件数据
app.get('/api/data/:widgetId', (req, res) => {
  try {
    const widgetId = req.params.widgetId
    // 这里可以根据widgetId从数据库或其他数据源获取数据
    // 目前返回模拟数据
    const mockData = generateMockData()
    res.json(mockData)
  } catch (error) {
    console.error('获取组件数据失败:', error)
    res.status(500).json({ message: '获取组件数据失败' })
  }
})

// WebSocket连接管理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id)
  
  // 监听客户端加入仪表盘房间
  socket.on('join-dashboard', (dashboardId) => {
    socket.join(dashboardId)
    console.log(`用户 ${socket.id} 加入仪表盘房间: ${dashboardId}`)
  })
  
  // 监听客户端离开仪表盘房间
  socket.on('leave-dashboard', (dashboardId) => {
    socket.leave(dashboardId)
    console.log(`用户 ${socket.id} 离开仪表盘房间: ${dashboardId}`)
  })
  
  // 监听客户端数据请求
  socket.on('request-data', (widgetId) => {
    // 这里可以根据widgetId从数据库或其他数据源获取数据
    // 目前返回模拟数据
    const mockData = generateMockData()
    socket.emit('data-update', {
      widgetId: widgetId,
      data: mockData
    })
  })
  
  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id)
  })
})

// 定时推送模拟数据更新（每30秒）
setInterval(() => {
  console.log('推送数据更新到所有客户端')
  io.emit('data-update', {
    type: 'global',
    timestamp: new Date().toISOString(),
    data: generateMockData()
  })
}, 30000)

// 生成模拟数据
function generateMockData() {
  const types = ['line-chart', 'bar-chart', 'pie-chart', 'gauge-chart', 'table']
  const randomType = types[Math.floor(Math.random() * types.length)]
  
  switch (randomType) {
    case 'line-chart':
      return {
        labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        datasets: [
          {
            label: '数据1',
            data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 20) + 1),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true
          },
          {
            label: '数据2',
            data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 20) + 1),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true
          }
        ]
      }
    case 'bar-chart':
      return {
        labels: ['A', 'B', 'C', 'D', 'E', 'F'],
        datasets: [
          {
            label: '数据',
            data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 20) + 1),
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
          }
        ]
      }
    case 'pie-chart':
      return {
        labels: ['A', 'B', 'C', 'D'],
        datasets: [
          {
            data: Array.from({ length: 4 }, () => Math.floor(Math.random() * 100) + 1),
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
            hoverOffset: 4
          }
        ]
      }
    case 'gauge-chart':
      return {
        value: Math.floor(Math.random() * 100),
        min: 0,
        max: 100,
        label: '完成率'
      }
    case 'table':
      return {
        columns: ['姓名', '年龄', '职位', '部门'],
        rows: Array.from({ length: 5 }, () => [
          `用户${Math.floor(Math.random() * 1000)}`,
          Math.floor(Math.random() * 30) + 20,
          ['开发工程师', '产品经理', '设计师', '架构师'][Math.floor(Math.random() * 4)],
          ['技术部', '产品部', '设计部', '市场部'][Math.floor(Math.random() * 4)]
        ])
      }
    default:
      return {}
  }
}

// 启动服务器
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
  console.log(`WebSocket 服务器运行在 ws://localhost:${PORT}`)
})