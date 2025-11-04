<template>
  <div class="chart-container">
    <svg ref="chartSvg" class="gauge-chart"></svg>
    <div v-if="!data" class="loading">加载中...</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
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
      value: 0,
      min: 0,
      max: 100,
      label: '指标'
    })
  }
})

const chartSvg = ref(null)
let containerWidth = 0
let containerHeight = 0

// 计算百分比
const percentage = computed(() => {
  const { value, min, max } = props.data
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
})

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
  if (!chartSvg.value || !props.data) {
    return
  }

  const svg = d3.select(chartSvg.value)
  const margin = { top: 40, right: 40, bottom: 40, left: 40 }
  const width = containerWidth - margin.left - margin.right
  const height = containerHeight - margin.top - margin.bottom
  const radius = Math.min(width, height) / 2
  const centerX = width / 2
  const centerY = height / 2

  // 清空SVG
  svg.selectAll('*').remove()

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // 默认颜色和范围
  const colors = props.config?.colors || ['#ef4444', '#f59e0b', '#10b981']
  const ranges = props.config?.ranges || [0, 50, 80, 100]

  // 创建比例尺
  const angleScale = d3.scaleLinear()
    .domain([0, 100])
    .range([Math.PI * 0.75, Math.PI * 2.25])
    .clamp(true)

  // 创建弧生成器
  const arc = d3.arc()
    .innerRadius(radius * 0.6)
    .outerRadius(radius)
    .startAngle(d => angleScale(d.start))
    .endAngle(d => angleScale(d.end))

  // 创建渐变
  const gradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', `gauge-gradient-${props.widgetId}`)
    .attr('gradientUnits', 'userSpaceOnUse')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '0%')

  colors.forEach((color, index) => {
    gradient.append('stop')
      .attr('offset', `${(index / (colors.length - 1)) * 100}%`)
      .attr('stop-color', color)
  })

  // 创建背景弧
  const backgroundArc = d3.arc()
    .innerRadius(radius * 0.6)
    .outerRadius(radius)
    .startAngle(Math.PI * 0.75)
    .endAngle(Math.PI * 2.25)

  g.append('path')
    .datum({})
    .attr('d', backgroundArc)
    .attr('fill', '#e5e7eb')
    .attr('transform', `translate(${centerX},${centerY})`)

  // 创建范围弧
  const rangeData = []
  for (let i = 0; i < ranges.length - 1; i++) {
    rangeData.push({
      start: ranges[i],
      end: ranges[i + 1],
      color: colors[i]
    })
  }

  g.selectAll('.range-arc')
    .data(rangeData)
    .enter()
    .append('path')
    .attr('class', 'range-arc')
    .attr('d', arc)
    .attr('fill', d => d.color)
    .attr('transform', `translate(${centerX},${centerY})`)

  // 创建进度弧
  const progressArc = d3.arc()
    .innerRadius(radius * 0.6)
    .outerRadius(radius)
    .startAngle(Math.PI * 0.75)
    .endAngle(Math.PI * 0.75)

  const progressPath = g.append('path')
    .datum({})
    .attr('d', progressArc)
    .attr('fill', `url(#gauge-gradient-${props.widgetId})`)
    .attr('transform', `translate(${centerX},${centerY})`)
    .attr('opacity', 0)

  // 动画效果
  if (props.config?.animation !== false) {
    progressPath
      .transition()
      .duration(1500)
      .attr('opacity', 1)
      .tween('progress', () => {
        const interpolate = d3.interpolate(0, percentage.value)
        return t => {
          const angle = angleScale(interpolate(t))
          progressPath.attr('d', d3.arc()
            .innerRadius(radius * 0.6)
            .outerRadius(radius)
            .startAngle(Math.PI * 0.75)
            .endAngle(angle)
          )
        }
      })
  } else {
    progressPath
      .attr('opacity', 1)
      .attr('d', d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius)
        .startAngle(Math.PI * 0.75)
        .endAngle(angleScale(percentage.value))
      )
  }

  // 创建指针
  const pointer = g.append('g')
    .attr('transform', `translate(${centerX},${centerY})`)
    .attr('opacity', 0)

  const pointerPath = pointer.append('path')
    .attr('d', `M-${radius * 0.1},0 L${radius * 0.1},0 L0,-${radius * 0.55} Z`)
    .attr('fill', '#374151')
    .attr('transform', `rotate(${((percentage.value - 50) / 50) * 135})`)

  // 指针动画
  if (props.config?.animation !== false) {
    pointer
      .transition()
      .duration(1500)
      .attr('opacity', 1)

    pointerPath
      .transition()
      .duration(1500)
      .attrTween('transform', () => {
        const interpolate = d3.interpolate(0, percentage.value)
        return t => {
          const angle = ((interpolate(t) - 50) / 50) * 135
          return `rotate(${angle})`
        }
      })
  } else {
    pointer.attr('opacity', 1)
  }

  // 添加中心圆
  g.append('circle')
    .attr('cx', centerX)
    .attr('cy', centerY)
    .attr('r', radius * 0.15)
    .attr('fill', '#374151')
    .attr('opacity', 0)
    .transition()
    .duration(props.config?.animation !== false ? 1000 : 0)
    .attr('opacity', 1)

  // 添加数值
  g.append('text')
    .attr('x', centerX)
    .attr('y', centerY)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .style('font-size', `${radius * 0.3}px`)
    .style('font-weight', 'bold')
    .style('fill', '#374151')
    .style('opacity', 0)
    .text(props.data.value)
    .transition()
    .duration(props.config?.animation !== false ? 1000 : 0)
    .attr('opacity', 1)

  // 添加单位或标签
  if (props.data.label) {
    g.append('text')
      .attr('x', centerX)
      .attr('y', centerY + radius * 0.25)
      .attr('text-anchor', 'middle')
      .style('font-size', `${radius * 0.1}px`)
      .style('fill', '#6b7280')
      .style('opacity', 0)
      .text(props.data.label)
      .transition()
      .duration(props.config?.animation !== false ? 1000 : 0)
      .attr('opacity', 1)
  }

  // 添加刻度
  const ticks = [0, 25, 50, 75, 100]
  const tickArc = d3.arc()
    .innerRadius(radius * 0.55)
    .outerRadius(radius * 0.65)
    .startAngle(d => angleScale(d))
    .endAngle(d => angleScale(d))

  g.selectAll('.tick')
    .data(ticks)
    .enter()
    .append('path')
    .attr('class', 'tick')
    .attr('d', tickArc)
    .attr('stroke', '#6b7280')
    .attr('stroke-width', 2)
    .attr('transform', `translate(${centerX},${centerY})`)

  // 添加刻度标签
  g.selectAll('.tick-label')
    .data(ticks)
    .enter()
    .append('text')
    .attr('class', 'tick-label')
    .attr('x', d => centerX + Math.cos(angleScale(d)) * (radius * 0.45))
    .attr('y', d => centerY + Math.sin(angleScale(d)) * (radius * 0.45))
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .style('font-size', '12px')
    .style('fill', '#6b7280')
    .text(d => d + '%')
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

.gauge-chart {
  width: 100%;
  height: 100%;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #64748b;
  font-size: 14px;
}
</style>