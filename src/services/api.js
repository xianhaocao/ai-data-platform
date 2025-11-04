import axios from 'axios'
import { useDashboardStore } from '@/stores/dashboard'

// 创建Axios实例
const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证信息
    const dashboardStore = useDashboardStore()
    // 如果有token，可以添加到请求头
    // const token = dashboardStore.token
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API请求错误:', error)
    
    // 错误处理
    if (error.response) {
      // 服务器返回错误状态码
      switch (error.response.status) {
        case 401:
          // 未授权
          console.error('未授权访问，请登录')
          break
        case 403:
          // 禁止访问
          console.error('禁止访问')
          break
        case 404:
          // 资源未找到
          console.error('请求的资源不存在')
          break
        case 500:
          // 服务器内部错误
          console.error('服务器内部错误')
          break
        default:
          console.error(`请求失败，状态码: ${error.response.status}`)
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('没有收到服务器响应，请检查网络连接')
    } else {
      // 请求配置错误
      console.error('请求配置错误:', error.message)
    }
    
    return Promise.reject(error)
  }
)

// 获取仪表盘配置
export async function getDashboardConfig() {
  try {
    return await apiClient.get('/dashboard/config')
  } catch (error) {
    console.error('获取仪表盘配置失败:', error)
    throw error
  }
}

// 保存仪表盘配置
export async function saveDashboardConfig(config) {
  try {
    return await apiClient.post('/dashboard/config', config)
  } catch (error) {
    console.error('保存仪表盘配置失败:', error)
    throw error
  }
}

// 获取组件数据
export async function getWidgetData(widgetId) {
  try {
    return await apiClient.get(`/data/${widgetId}`)
  } catch (error) {
    console.error(`获取组件 ${widgetId} 数据失败:`, error)
    throw error
  }
}

// 批量获取组件数据
export async function getMultipleWidgetData(widgetIds) {
  try {
    const requests = widgetIds.map(id => getWidgetData(id))
    return await Promise.all(requests)
  } catch (error) {
    console.error('批量获取组件数据失败:', error)
    throw error
  }
}

// 发送数据到后端
export async function postData(endpoint, data) {
  try {
    return await apiClient.post(endpoint, data)
  } catch (error) {
    console.error(`发送数据到 ${endpoint} 失败:`, error)
    throw error
  }
}

// 上传文件
export async function uploadFile(endpoint, file) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    return await axios.post(`http://localhost:3001/api${endpoint}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  } catch (error) {
    console.error(`上传文件到 ${endpoint} 失败:`, error)
    throw error
  }
}

// 获取数据统计
export async function getStatistics() {
  try {
    return await apiClient.get('/statistics')
  } catch (error) {
    console.error('获取数据统计失败:', error)
    throw error
  }
}

// 健康检查
export async function healthCheck() {
  try {
    return await apiClient.get('/health')
  } catch (error) {
    console.error('健康检查失败:', error)
    throw error
  }
}

// 模拟数据请求（用于测试）
export async function fetchMockData(widgetType) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const types = {
    'line-chart': {
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
    },
    'bar-chart': {
      labels: ['A', 'B', 'C', 'D', 'E', 'F'],
      datasets: [
        {
          label: '数据',
          data: [12, 19, 3, 5, 2, 3],
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
        }
      ]
    },
    'pie-chart': {
      labels: ['A', 'B', 'C', 'D'],
      datasets: [
        {
          data: [300, 50, 100, 150],
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
          hoverOffset: 4
        }
      ]
    },
    'gauge-chart': {
      value: 75,
      min: 0,
      max: 100,
      label: '完成率'
    },
    'table': {
      columns: ['姓名', '年龄', '职位', '部门'],
      rows: [
        ['张三', 28, '开发工程师', '技术部'],
        ['李四', 32, '产品经理', '产品部'],
        ['王五', 25, '设计师', '设计部'],
        ['赵六', 35, '架构师', '技术部']
      ]
    }
  }
  
  return types[widgetType] || {}
}