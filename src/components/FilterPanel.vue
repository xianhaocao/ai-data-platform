<template>
  <div class="filter-panel">
    <div class="filter-panel-header">
      <h3>过滤条件</h3>
      <div class="filter-panel-actions">
        <button 
          class="btn btn-secondary" 
          @click="$filterStore.undo" 
          :disabled="!$filterStore.canUndo"
        >
          撤销
        </button>
        <button 
          class="btn btn-secondary" 
          @click="$filterStore.redo" 
          :disabled="!$filterStore.canRedo"
        >
          重做
        </button>
        <button 
          class="btn btn-danger" 
          @click="$filterStore.clearFilters" 
          :disabled="Object.keys($filterStore.getAllFilters).length === 0"
        >
          清除所有
        </button>
      </div>
    </div>
    <div class="filter-panel-content">
      <div v-if="Object.keys($filterStore.getAllFilters).length === 0" class="no-filters">
        暂无过滤条件
      </div>
      <div v-else>
        <div 
          v-for="(filters, chartId) in $filterStore.getAllFilters" 
          :key="chartId" 
          class="chart-filters"
        >
          <h4>图表 {{ chartId }}</h4>
          <div class="filter-list">
            <div 
              v-for="filter in filters" 
              :key="filter.id" 
              class="filter-item"
            >
              <div class="filter-info">
                <span class="filter-field">{{ filter.field }}</span>
                <span class="filter-operator">{{ getOperatorText(filter.operator) }}</span>
                <span class="filter-value">{{ getValueText(filter.value) }}</span>
              </div>
              <button 
                class="btn btn-remove" 
                @click="$filterStore.removeFilter(chartId, filter.id)"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFilterStore } from '@/stores/filter'
import { FilterType } from '@/stores/filter'

// 注册过滤 store
const $filterStore = useFilterStore()

// 获取操作符文本
const getOperatorText = (operator) => {
  switch (operator) {
    case FilterType.EQUAL:
      return '等于'
    case FilterType.NOT_EQUAL:
      return '不等于'
    case FilterType.GREATER_THAN:
      return '大于'
    case FilterType.LESS_THAN:
      return '小于'
    case FilterType.RANGE:
      return '在范围内'
    case FilterType.IN:
      return '包含'
    case FilterType.CONTAINS:
      return '包含'
    default:
      return operator
  }
}

// 获取值文本
const getValueText = (value) => {
  if (Array.isArray(value)) {
    return value.join(', ')
  } else if (typeof value === 'object' && value !== null && 'min' in value && 'max' in value) {
    return `${value.min} - ${value.max}`
  } else {
    return value.toString()
  }
}
</script>

<style scoped>
.filter-panel {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
}

.filter-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filter-panel-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.filter-panel-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn-secondary {
  background-color: #e0e0e0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #bdbdbd;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-remove {
  background-color: #f472b6;
  color: white;
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 50%;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove:hover {
  background-color: #ec4899;
}

.filter-panel-content {
  min-height: 50px;
}

.no-filters {
  color: #64748b;
  text-align: center;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 4px;
}

.chart-filters {
  margin-bottom: 1rem;
}

.chart-filters h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #475569;
}

.filter-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f1f5f9;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.filter-field {
  font-weight: 600;
  color: #334155;
}

.filter-operator {
  color: #64748b;
}

.filter-value {
  color: #1e293b;
  font-weight: 500;
}
</style>