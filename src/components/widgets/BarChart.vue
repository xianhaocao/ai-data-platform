<template>
  <div class="chart-container">
    <svg ref="chartSvg" class="bar-chart"></svg>
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
    .padding(0.2)

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(props.data.datasets, d => d3.max(d.data)) * 1.1])
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

  // 计算每个柱子的宽度
  const barWidth = xScale.bandwidth() / props.data.datasets.length

  // 添加柱状图
  props.data.datasets.forEach((dataset, datasetIndex) => {
    // 准备数据
    const chartData = props.data.labels.map((label, i) => ({
      label: label,
      value: dataset.data[i]
    }))

    // 添加柱子
    g.selectAll(`.bar-${datasetIndex}`)
      .data(chartData)
      .enter()
      .append('rect')
      .attr('class', `bar-${datasetIndex}`)
      .attr('x', d => xScale(d.label) + barWidth * datasetIndex)
      .attr('y', height)
      .attr('width', barWidth - 2)
      .attr('height', 0)
      .attr('fill', dataset.backgroundColor || `hsl(${datasetIndex * 60}, 70%, 50%)`)
      .transition()
      .duration(props.config?.animation !== false ? 800 : 0)
      .delay((d, i) => i * 50)
      .attr('y', d => yScale(d.value))
      .attr('height', d => height - yScale(d.value))

    // 添加交互效果
    g.selectAll(`.bar-${datasetIndex}`)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.7)

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
          .attr('opacity', 1)

        d3.selectAll('.d3-tooltip').remove()
      })

    // 添加数据标签
    if (props.config?.showLabels !== false) {
      g.selectAll(`.label-${datasetIndex}`)
        .data(chartData)
        .enter()
        .append('text')
        .attr('class', `label-${datasetIndex}`)
        .attr('x', d => xScale(d.label) + barWidth * datasetIndex + barWidth / 2)
        .attr('y', d => yScale(d.value) - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', '#333')
        .style('opacity', 0)
        .text(d => d.value)
        .transition()
        .duration(props.config?.animation !== false ? 800 : 0)
        .delay((d, i) => i * 50)
        .style('opacity', 1)
    }
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
        .attr('fill', dataset.backgroundColor || `hsl(${index * 60}, 70%, 50%)`)

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

.bar-chart {
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