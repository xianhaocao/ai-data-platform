<template>
  <div class="chart-container">
    <svg ref="chartSvg" class="line-chart"></svg>
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
let chart = null
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
  const margin = { top: 20, right: 30, bottom: 40, left: 60 }
  const width = containerWidth - margin.left - margin.right
  const height = containerHeight - margin.top - margin.bottom

  // 清空SVG
  svg.selectAll('*').remove()

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // 创建比例尺
  const xScale = d3.scaleBand()
    .domain(props.data.labels)
    .range([0, width])
    .padding(0.1)

  const yScale = d3.scaleLinear()
    .domain([
      d3.min(props.data.datasets, d => d3.min(d.data)) * 0.9,
      d3.max(props.data.datasets, d => d3.max(d.data)) * 1.1
    ])
    .nice()
    .range([height, 0])

  // 创建坐标轴
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll('text')
    .style('font-size', '12px')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '.15em')
    .attr('transform', 'rotate(-45)')

  g.append('g')
    .call(d3.axisLeft(yScale).ticks(5))
    .selectAll('text')
    .style('font-size', '12px')

  // 添加网格线
  if (props.config?.showGrid !== false) {
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3.axisLeft(yScale)
          .ticks(5)
          .tickSize(-width)
          .tickFormat('')
      )
  }

  // 创建线条生成器
  const line = d3.line()
    .x(d => xScale(d.label) + xScale.bandwidth() / 2)
    .y(d => yScale(d.value))
    .curve(props.config?.smooth ? d3.curveMonotoneX : d3.curveLinear)

  // 创建区域生成器
  const area = d3.area()
    .x(d => xScale(d.label) + xScale.bandwidth() / 2)
    .y0(height)
    .y1(d => yScale(d.value))
    .curve(props.config?.smooth ? d3.curveMonotoneX : d3.curveLinear)

  // 添加区域和线条
  props.data.datasets.forEach((dataset, index) => {
    // 准备数据
    const chartData = props.data.labels.map((label, i) => ({
      label: label,
      value: dataset.data[i]
    }))

    // 添加区域
    if (dataset.fill !== false) {
      g.append('path')
        .datum(chartData)
        .attr('fill', dataset.backgroundColor || `rgba(59, 130, 246, 0.1)`)
        .attr('d', area)
        .attr('opacity', 0)
        .transition()
        .duration(props.config?.animation !== false ? 1000 : 0)
        .attr('opacity', 1)
    }

    // 添加线条
    const path = g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', dataset.borderColor || `hsl(${index * 60}, 70%, 50%)`)
      .attr('stroke-width', 2)
      .attr('d', line)

    // 动画效果
    if (props.config?.animation !== false) {
      const pathLength = path.node().getTotalLength()
      path
        .attr('stroke-dasharray', `${pathLength} ${pathLength}`)
        .attr('stroke-dashoffset', pathLength)
        .transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0)
    }

    // 添加数据点
    g.selectAll(`.dot-${index}`)
      .data(chartData)
      .enter()
      .append('circle')
      .attr('class', `dot-${index}`)
      .attr('cx', d => xScale(d.label) + xScale.bandwidth() / 2)
      .attr('cy', height)
      .attr('r', 0)
      .attr('fill', dataset.borderColor || `hsl(${index * 60}, 70%, 50%)`)
      .transition()
      .duration(props.config?.animation !== false ? 1000 : 0)
      .delay((d, i) => i * 50)
      .attr('cy', d => yScale(d.value))
      .attr('r', 4)

    // 添加交互效果
    g.selectAll(`.dot-${index}`)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 6)
          .attr('opacity', 0.8)

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
          .html(`${dataset.label}: ${d.value}`)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 4)
          .attr('opacity', 1)

        d3.selectAll('.d3-tooltip').remove()
      })
  })

  // 添加图例
  if (props.config?.showLegend !== false && props.data.datasets.length > 1) {
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 100}, 0)`)

    props.data.datasets.forEach((dataset, index) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${index * 20})`)

      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', dataset.borderColor || `hsl(${index * 60}, 70%, 50%)`)

      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 10)
        .attr('text-anchor', 'start')
        .style('font-size', '12px')
        .style('fill', '#333')
        .text(dataset.label)
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

.line-chart {
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

.grid line {
  stroke: #ccc;
  stroke-dasharray: 4,4;
}
</style>