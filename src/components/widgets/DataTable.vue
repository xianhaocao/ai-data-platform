<template>
  <div class="table-container" ref="tableContainer">
    <div class="table-wrapper">
      <table
        class="data-table"
        :class="{
          'table-striped': config?.striped,
          'table-bordered': config?.bordered
        }"
      >
        <!-- 表头 -->
        <thead v-if="config?.showHeader !== false && data?.columns && data.columns.length > 0">
          <tr>
            <th v-for="(column, index) in data.columns" :key="index" class="table-header">
              {{ column }}
            </th>
          </tr>
        </thead>

        <!-- 表体 -->
        <tbody>
          <tr
            v-for="(row, rowIndex) in data?.rows || []"
            :key="rowIndex"
            class="table-row"
          >
            <td
              v-for="(cell, cellIndex) in row"
              :key="cellIndex"
              class="table-cell"
              @click="handleCellClick(cellIndex, cell)"
            >
              {{ cell }}
            </td>
          </tr>

          <!-- 空数据提示 -->
          <tr v-if="!(data?.rows && data.rows.length > 0)" class="empty-row">
            <td
              :colspan="data?.columns?.length || 1"
              class="empty-cell"
            >
              暂无数据
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!data" class="loading">加载中...</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useFilterStore } from '@/stores/filter'

const props = defineProps({
  widgetId: {
    type: String,
    required: true
  },
  config: {
    type: Object,
    default: () => ({
      showHeader: true,
      striped: true,
      bordered: false
    })
  },
  data: {
    type: Object,
    default: () => ({
      columns: [],
      rows: []
    })
  }
})

const emit = defineEmits(['filter'])
const $filterStore = useFilterStore()

const tableContainer = ref(null)
let containerWidth = 0

// 响应式调整表格大小
const handleResize = () => {
  if (tableContainer.value) {
    const newWidth = tableContainer.value.clientWidth
    
    if (newWidth !== containerWidth) {
      containerWidth = newWidth
      // 可以在这里添加表格列宽的自适应逻辑
    }
  }
}

// 处理单元格点击事件
const handleCellClick = (cellIndex, cellValue) => {
  // 触发过滤事件
  emit('filter', {
    field: props.data.columns[cellIndex],
    operator: 'equal',
    value: cellValue,
    chartId: props.widgetId
  })
}

onMounted(() => {
  // 初始化容器宽度
  if (tableContainer.value) {
    containerWidth = tableContainer.value.clientWidth
  }

  // 添加窗口大小调整监听
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 移除窗口大小调整监听
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.table-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

.table-wrapper {
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  color: #374151;
  background-color: white;
}

.table-header {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #111827;
  background-color: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.table-row {
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;
}

.table-row:hover {
  background-color: #f3f4f6;
}

.table-cell {
  padding: 0.75rem 1rem;
  white-space: nowrap;
  border-bottom: 1px solid #e5e7eb;
}

/* 条纹样式 */
.table-striped .table-row:nth-child(even) {
  background-color: #f9fafb;
}

.table-striped .table-row:nth-child(even):hover {
  background-color: #f3f4f6;
}

/* 边框样式 */
.table-bordered {
  border: 1px solid #e5e7eb;
}

.table-bordered .table-header {
  border-right: 1px solid #e5e7eb;
}

.table-bordered .table-cell {
  border-right: 1px solid #e5e7eb;
}

.table-bordered .table-header:last-child,
.table-bordered .table-cell:last-child {
  border-right: none;
}

/* 空数据提示 */
.empty-row .empty-cell {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-style: italic;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #64748b;
  font-size: 14px;
}

/* 滚动条样式 */
.table-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>