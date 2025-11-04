<template>
  <div class="dashboard-app">
    <!-- 顶部工具栏 -->
    <header class="dashboard-header">
      <div class="header-left">
        <h1 class="app-title">智能数据可视化平台</h1>
      </div>
      <div class="header-right">
        <button @click="addWidget" class="btn btn-primary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          添加组件
        </button>
        <button @click="saveConfig" class="btn btn-success">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          保存配置
        </button>
        <button @click="exportConfig" class="btn btn-info">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          导出配置
        </button>
        <input
          ref="importInput"
          type="file"
          accept=".json"
          class="hidden"
          @change="importConfig"
        />
        <button @click="$refs.importInput.click()" class="btn btn-warning">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          导入配置
        </button>
        <button @click="toggleRefreshMode" class="btn btn-secondary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ refreshMode === 'websocket' ? 'WebSocket' : '轮询' }}
        </button>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="dashboard-main">
      <!-- 过滤面板和AI推荐面板 -->
      <div class="dashboard-panels">
        <FilterPanel />
        <AIRecommendationPanel />
      </div>
      <!-- 拖拽布局 -->
      <grid-layout
        :layout="dashboard.layout"
        :col-num="12"
        :row-height="100"
        :is-draggable="true"
        :is-resizable="true"
        :is-mirrored="false"
        :vertical-compact="true"
        :margin="[10, 10]"
        :use-css-transforms="true"
        @layout-changed="onLayoutChanged"
      >
        <grid-item
          v-for="item in dashboard.layout"
          :key="item.i"
          :x="item.x"
          :y="item.y"
          :w="item.w"
          :h="item.h"
          :i="item.i"
        >
          <div class="widget-container">
            <div class="widget-header">
              <span class="widget-title">{{ getWidgetConfig(item.i)?.title || '未命名组件' }}</span>
              <div class="widget-actions">
                <button
                  @click="configureWidget(item.i)"
                  class="action-btn"
                  title="配置"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  @click="removeWidget(item.i)"
                  class="action-btn delete"
                  title="删除"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="widget-content">
              <component
                :is="getWidgetComponent(item.i)"
                :widget-id="item.i"
                :config="getWidgetConfig(item.i)"
              />
            </div>
          </div>
        </grid-item>
      </grid-layout>
    </main>

    <!-- 组件配置面板 -->
    <div
      v-if="showConfigPanel && selectedWidget"
      class="config-panel-overlay"
      @click="closeConfigPanel"
    >
      <div class="config-panel" @click.stop>
        <div class="panel-header">
          <h3>组件配置</h3>
          <button @click="closeConfigPanel" class="close-btn">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <label>组件标题</label>
            <input
              v-model="editingConfig.title"
              type="text"
              class="form-input"
              placeholder="请输入组件标题"
            />
          </div>
          <div class="form-group">
            <label>组件类型</label>
            <select
              v-model="editingConfig.type"
              class="form-select"
              @change="updateWidgetType"
            >
              <option value="line-chart">折线图</option>
              <option value="bar-chart">柱状图</option>
              <option value="pie-chart">饼图</option>
              <option value="gauge-chart">仪表盘</option>
              <option value="table">表格</option>
            </select>
          </div>
          <div class="form-group">
            <label>数据源类型</label>
            <select
              v-model="editingConfig.dataSource.type"
              class="form-select"
            >
              <option value="api">API接口</option>
              <option value="mock">模拟数据</option>
            </select>
          </div>
          <div v-if="editingConfig.dataSource.type === 'api'" class="form-group">
            <label>API地址</label>
            <input
              v-model="editingConfig.dataSource.url"
              type="text"
              class="form-input"
              placeholder="https://api.example.com/data"
            />
          </div>
          <div class="form-group">
            <label>刷新频率 (秒)</label>
            <input
              v-model.number="editingConfig.refreshInterval"
              type="number"
              class="form-input"
              min="5"
              step="5"
            />
          </div>
        </div>
        <div class="panel-footer">
          <button @click="saveWidgetConfig" class="btn btn-primary">保存配置</button>
          <button @click="closeConfigPanel" class="btn btn-secondary">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useFilterStore } from '@/stores/filter'
import { useAIRecommendationStore } from '@/stores/aiRecommendation'
import { widgetComponents } from '@/components/widgets/index'
import FilterPanel from '@/components/FilterPanel.vue'
import AIRecommendationPanel from '@/components/AIRecommendationPanel.vue'

const dashboardStore = useDashboardStore()
const filterStore = useFilterStore()
const aiRecommendationStore = useAIRecommendationStore()
const dashboard = computed(() => dashboardStore.dashboard)

const showConfigPanel = ref(false)
const selectedWidget = ref(null)
const editingConfig = ref({})
const importInput = ref(null)

// 初始化仪表盘
const initDashboard = async () => {
  await dashboardStore.loadDashboard()
  dashboardStore.startDataRefresh()
}

// 添加组件
const addWidget = () => {
  dashboardStore.addWidget()
}

// 移除组件
const removeWidget = (widgetId) => {
  dashboardStore.removeWidget(widgetId)
}

// 配置组件
const configureWidget = (widgetId) => {
  selectedWidget.value = widgetId
  const config = dashboardStore.getWidgetConfig(widgetId)
  editingConfig.value = JSON.parse(JSON.stringify(config))
  showConfigPanel.value = true
}

// 关闭配置面板
const closeConfigPanel = () => {
  showConfigPanel.value = false
  selectedWidget.value = null
  editingConfig.value = {}
}

// 保存组件配置
const saveWidgetConfig = () => {
  if (selectedWidget.value) {
    dashboardStore.updateWidgetConfig(selectedWidget.value, editingConfig.value)
    closeConfigPanel()
  }
}

// 更新组件类型
const updateWidgetType = () => {
  // 根据组件类型设置默认配置
  editingConfig.value.data = dashboardStore.getDefaultData(editingConfig.value.type)
}

// 布局变化
const onLayoutChanged = (newLayout) => {
  dashboardStore.updateLayout(newLayout)
}

// 保存配置
const saveConfig = async () => {
  await dashboardStore.saveDashboard()
  alert('配置保存成功！')
}

// 导出配置
const exportConfig = () => {
  const config = JSON.stringify(dashboard.value, null, 2)
  const blob = new Blob([config], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dashboard-config-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 导入配置
const importConfig = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const config = JSON.parse(e.target.result)
      dashboardStore.loadDashboardFromConfig(config)
      alert('配置导入成功！')
    } catch (error) {
      alert('配置导入失败：JSON格式错误')
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

// 切换刷新模式
const toggleRefreshMode = () => {
  dashboardStore.toggleRefreshMode()
}

// 获取组件配置
const getWidgetConfig = (widgetId) => {
  return dashboardStore.getWidgetConfig(widgetId)
}

// 获取组件组件
const getWidgetComponent = (widgetId) => {
  const config = getWidgetConfig(widgetId)
  return widgetComponents[config?.type || 'line-chart'] || widgetComponents['line-chart']
}

// 初始化
initDashboard()
</script>

<style scoped>
.dashboard-app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dashboard-header {
  background: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
}

.dashboard-panels {
  padding: 1rem 2rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.header-left .app-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.header-right {
  display: flex;
  gap: 0.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-info {
  background: #3b82f6;
  color: white;
}

.btn-info:hover {
  background: #2563eb;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.dashboard-main {
  flex: 1;
  padding: 1rem 2rem;
  overflow: auto;
  background: #f5f7fa;
}

.widget-container {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.widget-header {
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
}

.widget-title {
  font-weight: 500;
  color: #2c3e50;
}

.widget-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e2e8f0;
  color: #2c3e50;
}

.action-btn.delete:hover {
  background: #fee2e2;
  color: #ef4444;
}

.widget-content {
  flex: 1;
  padding: 1rem;
  overflow: hidden;
}

.config-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.config-panel {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2c3e50;
}

.close-btn {
  padding: 0.25rem;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #64748b;
}

.close-btn:hover {
  color: #2c3e50;
}

.panel-body {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  ring: 2px ring #3b82f6 / 0.2;
}

.panel-footer {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.hidden {
  display: none;
}
</style>