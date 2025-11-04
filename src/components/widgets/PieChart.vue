<template>
  <div class="chart-container">
    <svg ref="chartSvg" class="pie-chart"></svg>
    <div v-if="!data" class="loading">加载中...</div>
    <div v-else-if="data.datasets.length === 0" class="no-data">无数据可用</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  widgetId: {
    type: String,
    required: true
  },
  config: {
    type: Object,
    default: () => ({})
  },
  data: {
    type: Object,
    default: () => ({
      labels: [],
      datasets: []
    })
  }
})

const chartSvg = ref(null)
let containerWidth = 0
let containerHeight = 0

// 响应式调整图表大小
const handleResize = () => {
  if (chartSvg.value) {
    const newWidth = chartSvg.value.clientWidth
    const newHeight = chartSvg.value.clientHeight
    
    if (newWidth !== containerWidth || newHeight !== containerHeight) {
      containerWidth = newWidth
      containerHeight = newHeight
      renderChart()
    }
  }
}

// 渲染图表
const renderChart = () => {
  if (!chartSvg.value || !props.data || !props.data.labels || props.data.labels.length === 0) {
    return
  }

  const svg = d3.select(chartSvg.value)
  const margin = { top: 20, right: 20, bottom: 20, left: 20 }
  const width = containerWidth - margin.left - margin.right
  const height = containerHeight - margin.top - margin.bottom
  const radius = Math.min(width, height) / 2

  // 清空SVG
  svg.selectAll('*').remove()

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left + width / 2},${margin.top + height / 2})`)

  // 获取数据集
  const dataset = props.data.datasets[0] || {}
  const pieData = dataset.data || []
  const colors = dataset.backgroundColor || d3.schemeCategory10

  // 创建饼图生成器
  const pie = d3.pie()
    .sort(null)
    .value(d => d)

  // 创建弧生成器
  const arc = d3.arc()
    .innerRadius(radius * 0.4) // 环形图
    .outerRadius(radius)

  // 创建弧生成器（用于动画）
  const outerArc = d3.arc()
    .innerRadius(radius * 0.9)
    .outerRadius(radius * 0.9)

  // 创建路径
  const arcs = g.selectAll('.arc')
    .data(pie(pieData))
    .enter()
    .append('g')
    .attr('class', 'arc')

  // 添加扇区
  arcs.append('path')
    .attr('d', arc)
    .attr('fill', (d, i) => colors[i % colors.length])
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .attr('opacity', 0)
    .transition()
    .duration(props.config?.animation !== false ? 1000 : 0)
    .attr('opacity', 1)

  // 添加动画效果
  if (props.config?.animation !== false) {
    const path = arcs.selectAll('path')
    path
      .attr('stroke-dasharray', `${2 * Math.PI * radius} ${2 * Math.PI * radius}`)
      .attr('stroke-dashoffset', 2 * Math.PI * radius)
      .transition()
      .duration(1500)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0)
  }

  // 添加交互效果
  arcs.selectAll('path')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 0.7)
        .attr('transform', 'scale(1.05)')

      // 添加 tooltip
      const tooltip = d3.select('body').append('div')
        .attr('class', 'd3-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '10000')
        .html(`${props.data.labels[d.index]}: ${d.value} (${((d.value / d3.sum(pieData)) * 100).toFixed(1)}%)`)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 10}px`)
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 1)
        .attr('transform', 'scale(1)')

      d3.selectAll('.d3-tooltip').remove()
    })

  // 添加图例
  if (props.config?.showLegend !== false) {
    const legendWidth = width / 3
    const legendHeight = height
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${margin.left + width - legendWidth}, ${margin.top})`)

    const legendItemHeight = 20
    const legendItemsPerColumn = Math.ceil(pieData.length / 2)

    pieData.forEach((value, index) => {
      const column = Math.floor(index / legendItemsPerColumn)
      const row = index % legendItemsPerColumn

      const legendRow = legend.append('g')
        .attr('transform', `translate(${column * legendWidth / 2}, ${row * legendItemHeight})`)

      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', colors[index % colors.length])

      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 10)
        .attr('text-anchor', 'start')
        .style('font-size', '12px')
        .style('fill', '#333')
        .text(`${props.data.labels[index]}: ${value} (${((value / d3.sum(pieData)) * 100).toFixed(1)}%)`)
    })
  }
}

// 监听数据变化
watch(() => props.data, () => {
  renderChart()
}, { deep: true })

// 监听配置变化
watch(() => props.config, () => {
  renderChart()
}, { deep: true })

onMounted(() => {
  // 初始化图表大小
  if (chartSvg.value) {
    containerWidth = chartSvg.value.clientWidth
    containerHeight = chartSvg.value.clientHeight
  }

  // 渲染图表
  renderChart()

  // 添加窗口大小调整监听
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 移除窗口大小调整监听
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pie-chart {
  width: 100%;
  height: 100%;
}

.loading,
.no-data {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #64748b;
  font-size: 14px;
}
</style>