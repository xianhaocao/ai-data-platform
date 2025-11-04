// 本地存储键名常量
const STORAGE_KEYS = {
  DASHBOARD_CONFIG: 'dashboard-config',
  USER_PREFERENCES: 'user-preferences',
  RECENT_DASHBOARDS: 'recent-dashboards',
  COMPONENT_TEMPLATES: 'component-templates'
}

// 保存数据到LocalStorage
export function saveToLocalStorage(key, data) {
  try {
    if (!key || data === undefined) return false
    
    const serializedData = JSON.stringify(data)
    localStorage.setItem(key, serializedData)
    return true
  } catch (error) {
    console.error('保存到LocalStorage失败:', error)
    return false
  }
}

// 从LocalStorage加载数据
export function loadFromLocalStorage(key) {
  try {
    if (!key) return null
    
    const serializedData = localStorage.getItem(key)
    if (serializedData === null) return null
    
    return JSON.parse(serializedData)
  } catch (error) {
    console.error('从LocalStorage加载失败:', error)
    return null
  }
}

// 从LocalStorage删除数据
export function removeFromLocalStorage(key) {
  try {
    if (!key) return false
    
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('从LocalStorage删除失败:', error)
    return false
  }
}

// 清空LocalStorage
export function clearLocalStorage() {
  try {
    localStorage.clear()
    return true
  } catch (error) {
    console.error('清空LocalStorage失败:', error)
    return false
  }
}

// 获取所有LocalStorage键名
export function getAllStorageKeys() {
  try {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i))
    }
    return keys
  } catch (error) {
    console.error('获取LocalStorage键名失败:', error)
    return []
  }
}

// 保存仪表盘配置
export function saveDashboardConfig(config) {
  return saveToLocalStorage(STORAGE_KEYS.DASHBOARD_CONFIG, config)
}

// 加载仪表盘配置
export function loadDashboardConfig() {
  return loadFromLocalStorage(STORAGE_KEYS.DASHBOARD_CONFIG)
}

// 删除仪表盘配置
export function removeDashboardConfig() {
  return removeFromLocalStorage(STORAGE_KEYS.DASHBOARD_CONFIG)
}

// 保存用户偏好设置
export function saveUserPreferences(prefs) {
  return saveToLocalStorage(STORAGE_KEYS.USER_PREFERENCES, prefs)
}

// 加载用户偏好设置
export function loadUserPreferences() {
  return loadFromLocalStorage(STORAGE_KEYS.USER_PREFERENCES)
}

// 保存最近使用的仪表盘
export function saveRecentDashboards(dashboards) {
  return saveToLocalStorage(STORAGE_KEYS.RECENT_DASHBOARDS, dashboards)
}

// 加载最近使用的仪表盘
export function loadRecentDashboards() {
  return loadFromLocalStorage(STORAGE_KEYS.RECENT_DASHBOARDS) || []
}

// 添加最近使用的仪表盘
export function addRecentDashboard(dashboard) {
  const recent = loadRecentDashboards()
  const existingIndex = recent.findIndex(d => d.id === dashboard.id)
  
  // 如果已经存在，移到最前面
  if (existingIndex !== -1) {
    recent.splice(existingIndex, 1)
  }
  
  // 添加到最前面
  recent.unshift(dashboard)
  
  // 只保留最近10个
  if (recent.length > 10) {
    recent.pop()
  }
  
  return saveRecentDashboards(recent)
}

// 保存组件模板
export function saveComponentTemplates(templates) {
  return saveToLocalStorage(STORAGE_KEYS.COMPONENT_TEMPLATES, templates)
}

// 加载组件模板
export function loadComponentTemplates() {
  return loadFromLocalStorage(STORAGE_KEYS.COMPONENT_TEMPLATES) || []
}

// 添加组件模板
export function addComponentTemplate(template) {
  const templates = loadComponentTemplates()
  const existingIndex = templates.findIndex(t => t.id === template.id)
  
  // 如果已经存在，替换
  if (existingIndex !== -1) {
    templates[existingIndex] = template
  } else {
    templates.push(template)
  }
  
  return saveComponentTemplates(templates)
}

// 删除组件模板
export function removeComponentTemplate(templateId) {
  const templates = loadComponentTemplates()
  const updatedTemplates = templates.filter(t => t.id !== templateId)
  return saveComponentTemplates(updatedTemplates)
}

// 检查LocalStorage是否可用
export function isLocalStorageAvailable() {
  try {
    const testKey = 'test'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch (error) {
    return false
  }
}

// 获取LocalStorage使用情况
export function getLocalStorageUsage() {
  try {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const value = localStorage.getItem(key)
      total += key.length + value.length
    }
    return total
  } catch (error) {
    console.error('获取LocalStorage使用情况失败:', error)
    return 0
  }
}

// 获取LocalStorage剩余空间
export function getLocalStorageRemainingSpace() {
  try {
    // 不同浏览器的LocalStorage容量限制不同，通常为5MB
    const MAX_SIZE = 5 * 1024 * 1024
    const used = getLocalStorageUsage()
    return MAX_SIZE - used
  } catch (error) {
    console.error('获取LocalStorage剩余空间失败:', error)
    return 0
  }
}