import { defineStore } from 'pinia'

// 定义过滤条件类型
const FilterType = {
  EQUAL: 'equal',
  NOT_EQUAL: 'not_equal',
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than',
  RANGE: 'range',
  IN: 'in',
  CONTAINS: 'contains'
}

export const useFilterStore = defineStore('filter', {
  state: () => ({
    // 所有激活的过滤条件
    activeFilters: {},
    // 过滤历史记录
    history: [],
    // 当前历史记录索引
    historyIndex: -1,
    // 事件总线回调函数
    eventBus: new Map()
  }),

  getters: {
    // 获取所有激活的过滤条件
    getAllFilters: (state) => state.activeFilters,
    // 获取特定图表的过滤条件
    getFilterByChart: (state) => (chartId) => state.activeFilters[chartId] || [],
    // 检查是否可以撤销
    canUndo: (state) => state.historyIndex > 0,
    // 检查是否可以重做
    canRedo: (state) => state.historyIndex < state.history.length - 1
  },

  actions: {
    // 注册事件监听
    on(event, callback) {
      if (!this.eventBus.has(event)) {
        this.eventBus.set(event, [])
      }
      this.eventBus.get(event).push(callback)
    },

    // 取消事件监听
    off(event, callback) {
      if (this.eventBus.has(event)) {
        const callbacks = this.eventBus.get(event)
        this.eventBus.set(event, callbacks.filter(cb => cb !== callback))
      }
    },

    // 触发事件
    emit(event, data) {
      if (this.eventBus.has(event)) {
        this.eventBus.get(event).forEach(callback => callback(data))
      }
    },

    // 添加过滤条件
    addFilter(chartId, filter) {
      // 创建新的过滤条件对象
      const newFilter = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        chartId,
        ...filter
      }

      // 如果图表没有过滤条件，则创建一个新数组
      if (!this.activeFilters[chartId]) {
        this.activeFilters[chartId] = []
      }

      // 添加新的过滤条件
      this.activeFilters[chartId].push(newFilter)

      // 保存到历史记录
      this.saveToHistory()

      // 触发过滤事件
      this.emit('filter-changed', this.activeFilters)
    },

    // 移除过滤条件
    removeFilter(chartId, filterId) {
      if (this.activeFilters[chartId]) {
        this.activeFilters[chartId] = this.activeFilters[chartId].filter(filter => filter.id !== filterId)

        // 如果图表的过滤条件为空，则移除该图表的过滤条件
        if (this.activeFilters[chartId].length === 0) {
          delete this.activeFilters[chartId]
        }

        // 保存到历史记录
        this.saveToHistory()

        // 触发过滤事件
        this.emit('filter-changed', this.activeFilters)
      }
    },

    // 清除所有过滤条件
    clearFilters() {
      this.activeFilters = {}

      // 保存到历史记录
      this.saveToHistory()

      // 触发过滤事件
      this.emit('filter-changed', this.activeFilters)
    },

    // 保存到历史记录
    saveToHistory() {
      // 如果当前索引不是在历史记录的末尾，则删除后面的历史记录
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1)
      }

      // 添加新的历史记录
      this.history.push(JSON.parse(JSON.stringify(this.activeFilters)))

      // 更新历史记录索引
      this.historyIndex = this.history.length - 1

      // 限制历史记录的数量
      if (this.history.length > 50) {
        this.history.shift()
        this.historyIndex--
      }
    },

    // 撤销操作
    undo() {
      if (this.canUndo) {
        this.historyIndex--
        this.activeFilters = JSON.parse(JSON.stringify(this.history[this.historyIndex]))

        // 触发过滤事件
        this.emit('filter-changed', this.activeFilters)
      }
    },

    // 重做操作
    redo() {
      if (this.canRedo) {
        this.historyIndex++
        this.activeFilters = JSON.parse(JSON.stringify(this.history[this.historyIndex]))

        // 触发过滤事件
        this.emit('filter-changed', this.activeFilters)
      }
    },

    // 应用过滤条件到数据
    applyFilters(data, filters) {
      if (!filters || Object.keys(filters).length === 0) {
        return data
      }

      // 合并所有过滤条件
      const allFilters = Object.values(filters).flat()

      // 应用过滤条件
      return data.filter(item => {
        return allFilters.every(filter => {
          const { field, operator, value } = filter

          switch (operator) {
            case FilterType.EQUAL:
              return item[field] === value
            case FilterType.NOT_EQUAL:
              return item[field] !== value
            case FilterType.GREATER_THAN:
              return item[field] > value
            case FilterType.LESS_THAN:
              return item[field] < value
            case FilterType.RANGE:
              return item[field] >= value.min && item[field] <= value.max
            case FilterType.IN:
              return value.includes(item[field])
            case FilterType.CONTAINS:
              return item[field].toString().includes(value.toString())
            default:
              return true
          }
        })
      })
    }
  }
})

export { FilterType }