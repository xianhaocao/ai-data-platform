import LineChart from './LineChart.vue'
import BarChart from './BarChart.vue'
import PieChart from './PieChart.vue'
import GaugeChart from './GaugeChart.vue'
import DataTable from './DataTable.vue'

// 组件映射表
export const widgetComponents = {
  'line-chart': LineChart,
  'bar-chart': BarChart,
  'pie-chart': PieChart,
  'gauge-chart': GaugeChart,
  'table': DataTable
}

// 组件类型列表
export const widgetTypes = [
  { value: 'line-chart', label: '折线图', icon: '📈' },
  { value: 'bar-chart', label: '柱状图', icon: '📊' },
  { value: 'pie-chart', label: '饼图', icon: '🥧' },
  { value: 'gauge-chart', label: '仪表盘', icon: '⏱️' },
  { value: 'table', label: '表格', icon: '📋' }
]

// 注册所有组件到Vue应用
export const registerWidgetComponents = (app) => {
  Object.entries(widgetComponents).forEach(([name, component]) => {
    app.component(name, component)
  })
}