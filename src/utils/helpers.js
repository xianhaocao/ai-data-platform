// 生成唯一ID
export function generateUniqueId(prefix = 'widget') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 格式化日期
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

// 格式化数字
export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined) return '0'
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 深拷贝
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = { ...obj }
    for (const key in clonedObj) {
      if (clonedObj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(clonedObj[key])
      }
    }
    return clonedObj
  }
}

// 防抖函数
export function debounce(func, wait = 300) {
  let timeout
  return function(...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

// 节流函数
export function throttle(func, limit = 300) {
  let inThrottle = false
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 生成随机颜色
export function getRandomColor() {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

// 生成渐变颜色
export function getGradientColors(startColor, endColor, steps) {
  const parseHex = hex => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null
  }

  const start = parseHex(startColor)
  const end = parseHex(endColor)

  if (!start || !end) return []

  const colors = []
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps
    const r = Math.round(start.r + (end.r - start.r) * ratio)
    const g = Math.round(start.g + (end.g - start.g) * ratio)
    const b = Math.round(start.b + (end.b - start.b) * ratio)
    colors.push(`rgb(${r}, ${g}, ${b})`)
  }
  return colors
}

// 验证URL格式
export function isValidUrl(url) {
  try {
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}

// 获取浏览器本地时间
export function getLocalTime() {
  return new Date().toLocaleString('zh-CN')
}

// 计算数组平均值
export function average(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0
  const sum = arr.reduce((acc, val) => acc + val, 0)
  return sum / arr.length
}

// 计算数组总和
export function sum(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0
  return arr.reduce((acc, val) => acc + val, 0)
}

// 计算数组最大值
export function max(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0
  return Math.max(...arr)
}

// 计算数组最小值
export function min(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0
  return Math.min(...arr)
}

// 生成模拟数据
export function generateMockData(type, count = 10) {
  const types = {
    number: () => Math.floor(Math.random() * 1000),
    string: () => `随机字符串${Math.floor(Math.random() * 100)}`,
    date: () => new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000).toLocaleDateString(),
    boolean: () => Math.random() > 0.5,
    email: () => `user${Math.floor(Math.random() * 1000)}@example.com`,
    phone: () => `1${['3', '4', '5', '6', '7', '8', '9'][Math.floor(Math.random() * 7)]}${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`
  }

  const data = []
  for (let i = 0; i < count; i++) {
    data.push(types[type] ? types[type]() : null)
  }
  return data
}

// 格式化字节大小
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// 获取UUID
export function getUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// 数组去重
export function uniqueArray(arr, key) {
  if (!Array.isArray(arr)) return []
  if (!key) return [...new Set(arr)]
  
  const seen = new Set()
  return arr.filter(item => {
    const value = item[key]
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}