import { defineStore } from 'pinia'
import { generateUniqueId } from '@/utils/helpers'
import { saveToLocalStorage, loadFromLocalStorage } from '@/utils/storage'
import { fetchData } from '@/services/api'
import { io } from 'socket.io-client'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    dashboard: {
      id: 'default-dashboard',
      name: '默认仪表盘',
      layout: [],
      widgets: {},
      settings: {
        refreshMode: 'polling', // 'polling' or 'websocket'
        refreshInterval: 30000, // 默认30秒
        theme: 'light'
      }
    },
    refreshIntervals: {},
    socket: null,
    isConnected: false
  }),

  getters: {
    getWidgetConfig: (state) => (widgetId) => {
      return state.dashboard.widgets[widgetId]
    }
  },

  actions: {
    // 初始化仪表盘
    async loadDashboard() {
      // 先从LocalStorage加载
      const localConfig = loadFromLocalStorage('dashboard-config')
      
      if (localConfig) {
        this.dashboard = localConfig
      } else {
        // 使用默认配置
        this.dashboard = {
          id: 'default-dashboard',
          name: '默认仪表盘',
          layout: [],
          widgets: {},
          settings: {
            refreshMode: 'polling',
            refreshInterval: 30000,
            theme: 'light'
          }
        }
      }

      // 尝试从后端加载最新配置
      try {
        const response = await fetch('/api/dashboard/config')
        if (response.ok) {
          const backendConfig = await response.json()
          this.dashboard = backendConfig
          this.saveToLocalStorage()
        }
      } catch (error) {
        console.log('从后端加载配置失败，使用本地配置:', error)
      }
    },

    // 从配置加载仪表盘
    loadDashboardFromConfig(config) {
      if (config) {
        this.dashboard = config
        this.saveToLocalStorage()
        this.restartDataRefresh()
      }
    },

    // 保存仪表盘配置
    async saveDashboard() {
      try {
        // 保存到后端
        const response = await fetch('/api/dashboard/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.dashboard)
        })

        if (response.ok) {
          console.log('配置保存到后端成功')
        }
      } catch (error) {
        console.log('配置保存到后端失败:', error)
      }

      // 保存到LocalStorage
      this.saveToLocalStorage()
    },

    // 保存到LocalStorage
    saveToLocalStorage() {
      saveToLocalStorage('dashboard-config', this.dashboard)
    },

    // 添加组件
    addWidget(type = 'line-chart') {
      const widgetId = generateUniqueId()
      const newWidget = {
        id: widgetId,
        title: `${this.getWidgetTypeLabel(type)} ${Object.keys(this.dashboard.widgets).length + 1}`,
        type: type,
        dataSource: {
          type: 'mock',
          url: ''
        },
        data: this.getDefaultData(type),
        refreshInterval: this.dashboard.settings.refreshInterval,
        config: this.getDefaultWidgetConfig(type),
        lastUpdated: Date.now()
      }

      // 添加到布局
      const layoutItem = {
        i: widgetId,
        x: 0,
        y: Infinity,
        w: 6,
        h: 4
      }

      this.dashboard.layout.push(layoutItem)
      this.dashboard.widgets[widgetId] = newWidget

      // 启动数据刷新
      this.startWidgetRefresh(widgetId)

      // 保存配置
      this.saveToLocalStorage()

      return widgetId
    },

    // 移除组件
    removeWidget(widgetId) {
      // 停止数据刷新
      this.stopWidgetRefresh(widgetId)

      // 从布局中移除
      this.dashboard.layout = this.dashboard.layout.filter(item => item.i !== widgetId)

      // 从widgets中移除
      delete this.dashboard.widgets[widgetId]

      // 保存配置
      this.saveToLocalStorage()
    },

    // 更新组件配置
    updateWidgetConfig(widgetId, config) {
      if (this.dashboard.widgets[widgetId]) {
        this.dashboard.widgets[widgetId] = { ...this.dashboard.widgets[widgetId], ...config }
        this.saveToLocalStorage()

        // 重启数据刷新
        this.restartWidgetRefresh(widgetId)
      }
    },

    // 更新布局
    updateLayout(newLayout) {
      this.dashboard.layout = newLayout
      this.saveToLocalStorage()
    },

    // 更新仪表盘设置
    updateSettings(settings) {
      this.dashboard.settings = { ...this.dashboard.settings, ...settings }
      this.saveToLocalStorage()

      // 如果刷新模式或间隔改变，重启所有数据刷新
      if (settings.refreshMode || settings.refreshInterval) {
        this.restartDataRefresh()
      }
    },

    // 切换刷新模式
    toggleRefreshMode() {
      const newMode = this.dashboard.settings.refreshMode === 'polling' ? 'websocket' : 'polling'
      this.updateSettings({ refreshMode: newMode })
    },

    // 获取组件类型标签
    getWidgetTypeLabel(type) {
      const labels = {
        'line-chart': '折线图',
        'bar-chart': '柱状图',
        'pie-chart': '饼图',
        'gauge-chart': '仪表盘',
        'table': '表格'
      }
      return labels[type] || type
    },

    // 获取默认数据
    getDefaultData(type) {
      switch (type) {
        case 'line-chart':
          return {
            labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            datasets: [
              {
                label: '数据1',
                data: [12, 19, 3, 5, 2, 3, 7],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true
              },
              {
                label: '数据2',
                data: [7, 11, 5, 8, 3, 7, 12],
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
                data: [12, 19, 3, 5, 2, 3],
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
              }
            ]
          }
        case 'pie-chart':
          return {
            labels: ['A', 'B', 'C', 'D'],
            datasets: [
              {
                data: [300, 50, 100, 150],
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                hoverOffset: 4
              }
            ]
          }
        case 'gauge-chart':
          return {
            value: 75,
            min: 0,
            max: 100,
            label: '完成率'
          }
        case 'table':
          return {
            columns: ['姓名', '年龄', '职位', '部门'],
            rows: [
              ['张三', 28, '开发工程师', '技术部'],
              ['李四', 32, '产品经理', '产品部'],
              ['王五', 25, '设计师', '设计部'],
              ['赵六', 35, '架构师', '技术部']
            ]
          }
        default:
          return {}
      }
    },

    // 获取默认组件配置
    getDefaultWidgetConfig(type) {
      switch (type) {
        case 'line-chart':
          return {
            showLegend: true,
            showGrid: true,
            smooth: true,
            animation: true
          }
        case 'bar-chart':
          return {
            showLegend: true,
            showGrid: true,
            animation: true
          }
        case 'pie-chart':
          return {
            showLegend: true,
            animation: true
          }
        case 'gauge-chart':
          return {
            colors: ['#ef4444', '#f59e0b', '#10b981'],
            ranges: [0, 50, 80, 100],
            animation: true
          }
        case 'table':
          return {
            showHeader: true,
            striped: true,
            bordered: false
          }
        default:
          return {}
      }
    },

    // 刷新组件数据
    async refreshWidgetData(widgetId) {
      const widget = this.dashboard.widgets[widgetId]
      if (!widget) return

      try {
        let data

        if (widget.dataSource.type === 'api' && widget.dataSource.url) {
          // 从API获取数据
          data = await fetchData(widget.dataSource.url)
        } else {
          // 生成模拟数据
          data = this.generateMockData(widget.type)
        }

        // 更新组件数据
        this.dashboard.widgets[widgetId] = {
          ...widget,
          data: data,
          lastUpdated: Date.now()
        }

        return data
      } catch (error) {
        console.error(`刷新组件 ${widgetId} 数据失败:`, error)
        return null
      }
    },

    // 生成模拟数据
    generateMockData(type) {
      const baseData = this.getDefaultData(type)

      // 随机化数据
      if (type === 'line-chart' || type === 'bar-chart') {
        return {
          ...baseData,
          datasets: baseData.datasets.map(dataset => ({
            ...dataset,
            data: dataset.data.map(() => Math.floor(Math.random() * 20) + 1)
          }))
        }
      } else if (type === 'pie-chart') {
        return {
          ...baseData,
          datasets: baseData.datasets.map(dataset => ({
            ...dataset,
            data: dataset.data.map(() => Math.floor(Math.random() * 100) + 1)
          }))
        }
      } else if (type === 'gauge-chart') {
        return {
          ...baseData,
          value: Math.floor(Math.random() * 100)
        }
      } else if (type === 'table') {
        return baseData
      }

      return baseData
    },

    // 启动组件数据刷新
    startWidgetRefresh(widgetId) {
      // 停止已有刷新
      this.stopWidgetRefresh(widgetId)

      const widget = this.dashboard.widgets[widgetId]
      if (!widget) return

      // 根据刷新模式启动
      if (this.dashboard.settings.refreshMode === 'polling') {
        // 定时轮询
        const interval = setInterval(() => {
          this.refreshWidgetData(widgetId)
        }, widget.refreshInterval || this.dashboard.settings.refreshInterval)

        this.refreshIntervals[widgetId] = interval
      } else if (this.dashboard.settings.refreshMode === 'websocket') {
        // WebSocket推送
        this.initWebSocket()
      }
    },

    // 停止组件数据刷新
    stopWidgetRefresh(widgetId) {
      if (this.refreshIntervals[widgetId]) {
        clearInterval(this.refreshIntervals[widgetId])
        delete this.refreshIntervals[widgetId]
      }
    },

    // 启动所有组件数据刷新
    startDataRefresh() {
      Object.keys(this.dashboard.widgets).forEach(widgetId => {
        this.startWidgetRefresh(widgetId)
      })
    },

    // 停止所有组件数据刷新
    stopDataRefresh() {
      Object.keys(this.refreshIntervals).forEach(widgetId => {
        this.stopWidgetRefresh(widgetId)
      })

      // 关闭WebSocket连接
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
        this.isConnected = false
      }
    },

    // 重启所有组件数据刷新
    restartDataRefresh() {
      this.stopDataRefresh()
      this.startDataRefresh()
    },

    // 重启组件数据刷新
    restartWidgetRefresh(widgetId) {
      this.stopWidgetRefresh(widgetId)
      this.startWidgetRefresh(widgetId)
    },

    // 初始化WebSocket连接
    initWebSocket() {
      if (this.socket && this.isConnected) return

      try {
        // 连接到WebSocket服务器
        this.socket = io('ws://localhost:3001')

        this.socket.on('connect', () => {
          console.log('WebSocket连接成功')
          this.isConnected = true
        })

        this.socket.on('disconnect', () => {
          console.log('WebSocket连接断开')
          this.isConnected = false
        })

        // 监听数据更新
        this.socket.on('data-update', (data) => {
          console.log('收到数据更新:', data)
          if (data.widgetId && this.dashboard.widgets[data.widgetId]) {
            // 更新指定组件的数据
            this.dashboard.widgets[data.widgetId] = {
              ...this.dashboard.widgets[data.widgetId],
              data: data.data,
              lastUpdated: Date.now()
            }
          } else if (data.dashboardId === this.dashboard.id) {
            // 更新整个仪表盘数据
            if (data.layout) this.dashboard.layout = data.layout
            if (data.widgets) this.dashboard.widgets = data.widgets
          }
        })

        this.socket.on('error', (error) => {
          console.error('WebSocket错误:', error)
        })
      } catch (error) {
        console.error('初始化WebSocket失败:', error)
      }
    }
  }
})