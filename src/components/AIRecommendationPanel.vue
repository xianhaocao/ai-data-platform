<template>
  <div class="ai-recommendation-panel">
    <div class="ai-recommendation-header">
      <h3>AI 图表推荐</h3>
      <button 
        class="btn btn-primary" 
        @click="generateRecommendations"
      >
        重新推荐
      </button>
    </div>
    <div class="ai-recommendation-content">
      <div v-if="!recommendations || recommendations.length === 0" class="no-recommendations">
        点击"重新推荐"按钮生成图表推荐
      </div>
      <div v-else>
        <div class="recommendation-list">
          <div 
            v-for="(recommendation, index) in recommendations" 
            :key="index" 
            class="recommendation-item"
            :class="{ 'active': selectedChart === recommendation.chartType }"
            @click="selectChart(recommendation.chartType)"
          >
            <div class="recommendation-icon">
              {{ getChartIcon(recommendation.chartType) }}
            </div>
            <div class="recommendation-info">
              <h4>{{ getChartName(recommendation.chartType) }}</h4>
              <p class="recommendation-reason">{{ recommendation.reason }}</p>
              <div class="recommendation-score">
                匹配度: {{ (recommendation.score * 100).toFixed(0) }}%
              </div>
            </div>
            <div class="recommendation-rating">
              <button 
                class="btn-rating" 
                :class="{ 'active': rating === 1 }"
                @click.stop="rateRecommendation(1)"
              >
                👎
              </button>
              <button 
                class="btn-rating" 
                :class="{ 'active': rating === 2 }"
                @click.stop="rateRecommendation(2)"
              >
                👍
              </button>
            </div>
          </div>
        </div>
        <div v-if="selectedChart" class="feedback-section">
          <h4>反馈</h4>
          <textarea 
            v-model="feedbackComment" 
            placeholder="请输入您的反馈..." 
            class="feedback-textarea"
          ></textarea>
          <button 
            class="btn btn-primary" 
            @click="submitFeedback"
          >
            提交反馈
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAIRecommendationStore } from '@/stores/aiRecommendation'
import { ChartType } from '@/stores/aiRecommendation'

// 注册 AI 推荐 store
const $aiRecommendationStore = useAIRecommendationStore()

// 定义 props
const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  widgetId: {
    type: String,
    required: true
  }
})

// 定义响应式变量
const recommendations = ref([])
const selectedChart = ref(null)
const rating = ref(null)
const feedbackComment = ref('')
const recommendationId = ref(null)

// 生成推荐
const generateRecommendations = () => {
  const result = $aiRecommendationStore.generateRecommendations(props.data)
  recommendations.value = result
  if (result.length > 0) {
    selectedChart.value = result[0].chartType
  }
  // 获取推荐 ID
  const history = $aiRecommendationStore.getRecommendationHistory
  if (history.length > 0) {
    recommendationId.value = history[history.length - 1].id
  }
}

// 选择图表
const selectChart = (chartType) => {
  selectedChart.value = chartType
  // 记录用户选择
  if (recommendationId.value) {
    $aiRecommendationStore.recordUserSelection(recommendationId.value, chartType)
  }
  // 触发图表类型变化事件
  emit('chart-type-changed', chartType)
}

// 获取图表名称
const getChartName = (chartType) => {
  switch (chartType) {
    case ChartType.LINE:
      return '折线图'
    case ChartType.BAR:
      return '柱状图'
    case ChartType.PIE:
      return '饼图'
    case ChartType.SCATTER:
      return '散点图'
    case ChartType.RELATION:
      return '关系图'
    default:
      return chartType
  }
}

// 获取图表图标
const getChartIcon = (chartType) => {
  switch (chartType) {
    case ChartType.LINE:
      return '📈'
    case ChartType.BAR:
      return '📊'
    case ChartType.PIE:
      return '🥧'
    case ChartType.SCATTER:
      return '🔴'
    case ChartType.RELATION:
      return '🔗'
    default:
      return '📊'
  }
}

// 评分推荐
const rateRecommendation = (newRating) => {
  rating.value = newRating
}

// 提交反馈
const submitFeedback = () => {
  if (recommendationId.value && rating.value) {
    $aiRecommendationStore.submitFeedback(recommendationId.value, rating.value, feedbackComment.value)
    // 重置反馈
    rating.value = null
    feedbackComment.value = ''
    alert('反馈已提交，谢谢！')
  } else {
    alert('请先选择评分！')
  }
}

// 定义 emit
const emit = defineEmits(['chart-type-changed'])

// 监听数据变化，自动生成推荐
watch(() => props.data, () => {
  generateRecommendations()
}, { deep: true })

// 初始化生成推荐
onMounted(() => {
  generateRecommendations()
})
</script>

<style scoped>
.ai-recommendation-panel {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
}

.ai-recommendation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.ai-recommendation-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
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

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.ai-recommendation-content {
  min-height: 50px;
}

.no-recommendations {
  color: #64748b;
  text-align: center;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 4px;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recommendation-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: #f1f5f9;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.recommendation-item:hover {
  background-color: #e2e8f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.recommendation-item.active {
  background-color: #dbeafe;
  border-color: #3b82f6;
}

.recommendation-icon {
  font-size: 2rem;
}

.recommendation-info {
  flex: 1;
}

.recommendation-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #334155;
}

.recommendation-reason {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.4;
}

.recommendation-score {
  font-size: 0.8rem;
  color: #10b981;
  font-weight: 600;
}

.recommendation-rating {
  display: flex;
  gap: 0.5rem;
}

.btn-rating {
  background-color: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  transition: transform 0.3s;
}

.btn-rating:hover {
  transform: scale(1.2);
}

.btn-rating.active {
  transform: scale(1.3);
}

.feedback-section {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
}

.feedback-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #333;
}

.feedback-textarea {
  width: 100%;
  min-height: 80px;
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  resize: vertical;
}

.feedback-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>