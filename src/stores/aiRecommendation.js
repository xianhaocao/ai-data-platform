import { defineStore } from 'pinia'

// 定义数据类型
const DataType = {
  TIME_SERIES: 'time_series',
  CATEGORICAL: 'categorical',
  NUMERICAL: 'numerical',
  RELATIONAL: 'relational'
}

// 定义图表类型
const ChartType = {
  LINE: 'line-chart',
  BAR: 'bar-chart',
  PIE: 'pie-chart',
  SCATTER: 'scatter-chart',
  RELATION: 'relation-graph'
}

export const useAIRecommendationStore = defineStore('aiRecommendation', {
  state: () => ({
    // 历史推荐记录
    recommendationHistory: [],
    // 用户反馈记录
    feedbackHistory: [],
    // 推荐模型参数
    modelParams: {
      // 基于历史选择的权重
      weights: {
        line: 1.0,
        bar: 1.0,
        pie: 1.0,
        scatter: 1.0,
        relation: 1.0
      }
    }
  }),

  getters: {
    // 获取历史推荐记录
    getRecommendationHistory: (state) => state.recommendationHistory,
    // 获取用户反馈记录
    getFeedbackHistory: (state) => state.feedbackHistory
  },

  actions: {
    // 分析数据结构
    analyzeDataStructure(data) {
      if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
        return { type: DataType.CATEGORICAL, fields: [] }
      }

      const fields = []
      let hasTimeSeries = false
      let hasNumerical = false
      let hasCategorical = false

      // 检查标签类型
      const labelType = this.detectDataType(data.labels[0])
      if (labelType === DataType.TIME_SERIES) {
        hasTimeSeries = true
      } else if (labelType === DataType.CATEGORICAL) {
        hasCategorical = true
      }

      // 检查数据集类型
      data.datasets.forEach(dataset => {
        const dataType = this.detectDataType(dataset.data[0])
        if (dataType === DataType.NUMERICAL) {
          hasNumerical = true
        } else if (dataType === DataType.CATEGORICAL) {
          hasCategorical = true
        }

        fields.push({
          name: dataset.label,
          type: dataType
        })
      })

      // 确定数据结构类型
      let dataStructureType = DataType.CATEGORICAL
      if (hasTimeSeries) {
        dataStructureType = DataType.TIME_SERIES
      } else if (hasNumerical && hasCategorical) {
        dataStructureType = DataType.NUMERICAL
      } else if (hasCategorical) {
        dataStructureType = DataType.CATEGORICAL
      } else if (hasNumerical) {
        dataStructureType = DataType.NUMERICAL
      }

      return { type: dataStructureType, fields }
    },

    // 检测数据类型
    detectDataType(value) {
      if (value instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{2}:\d{2}:\d{2}/.test(value)) {
        return DataType.TIME_SERIES
      } else if (typeof value === 'number') {
        return DataType.NUMERICAL
      } else {
        return DataType.CATEGORICAL
      }
    },

    // 生成图表推荐
    generateRecommendations(data) {
      const dataStructure = this.analyzeDataStructure(data)
      const recommendations = []

      // 基于数据结构生成推荐规则
      switch (dataStructure.type) {
        case DataType.TIME_SERIES:
          recommendations.push({
            chartType: ChartType.LINE,
            score: 0.9 * this.modelParams.weights.line,
            reason: '时间序列数据适合使用折线图展示趋势变化'
          })
          recommendations.push({
            chartType: ChartType.BAR,
            score: 0.7 * this.modelParams.weights.bar,
            reason: '柱状图也可以用于展示时间序列数据的变化'
          })
          break

        case DataType.CATEGORICAL:
          if (data.datasets.length === 1 && data.labels.length < 10) {
            recommendations.push({
              chartType: ChartType.PIE,
              score: 0.8 * this.modelParams.weights.pie,
              reason: '单一分类数据适合使用饼图展示占比'
            })
          }
          recommendations.push({
            chartType: ChartType.BAR,
            score: 0.9 * this.modelParams.weights.bar,
            reason: '分类数据适合使用柱状图展示比较'
          })
          break

        case DataType.NUMERICAL:
          if (data.datasets.length >= 2) {
            recommendations.push({
              chartType: ChartType.SCATTER,
              score: 0.8 * this.modelParams.weights.scatter,
              reason: '多组数值数据适合使用散点图展示相关性'
            })
          }
          recommendations.push({
            chartType: ChartType.LINE,
            score: 0.7 * this.modelParams.weights.line,
            reason: '数值数据适合使用折线图展示趋势'
          })
          recommendations.push({
            chartType: ChartType.BAR,
            score: 0.8 * this.modelParams.weights.bar,
            reason: '数值数据适合使用柱状图展示比较'
          })
          break

        case DataType.RELATIONAL:
          recommendations.push({
            chartType: ChartType.RELATION,
            score: 0.9 * this.modelParams.weights.relation,
            reason: '关系数据适合使用关系图展示关联'
          })
          break

        default:
          recommendations.push({
            chartType: ChartType.BAR,
            score: 0.5 * this.modelParams.weights.bar,
            reason: '默认推荐使用柱状图'
          })
      }

      // 按分数排序
      recommendations.sort((a, b) => b.score - a.score)

      // 保存推荐记录
      const recommendationRecord = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        dataStructure,
        recommendations,
        selectedChart: null
      }

      this.recommendationHistory.push(recommendationRecord)

      return recommendations
    },

    // 记录用户选择
    recordUserSelection(recommendationId, chartType) {
      // 更新推荐记录
      const recommendation = this.recommendationHistory.find(r => r.id === recommendationId)
      if (recommendation) {
        recommendation.selectedChart = chartType
      }

      // 更新模型权重
      this.updateModelWeights(chartType)
    },

    // 更新模型权重
    updateModelWeights(chartType) {
      const chartTypeKey = chartType.replace('-chart', '')
      if (this.modelParams.weights[chartTypeKey]) {
        this.modelParams.weights[chartTypeKey] += 0.1
        // 归一化权重
        const totalWeight = Object.values(this.modelParams.weights).reduce((sum, weight) => sum + weight, 0)
        Object.keys(this.modelParams.weights).forEach(key => {
          this.modelParams.weights[key] /= totalWeight
        })
      }
    },

    // 提交用户反馈
    submitFeedback(recommendationId, rating, comment) {
      const feedback = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        recommendationId,
        rating,
        comment,
        timestamp: new Date()
      }

      this.feedbackHistory.push(feedback)

      // 根据反馈调整模型权重
      const recommendation = this.recommendationHistory.find(r => r.id === recommendationId)
      if (recommendation && recommendation.selectedChart) {
        const chartTypeKey = recommendation.selectedChart.replace('-chart', '')
        if (this.modelParams.weights[chartTypeKey]) {
          if (rating >= 4) {
            this.modelParams.weights[chartTypeKey] += 0.2
          } else if (rating <= 2) {
            this.modelParams.weights[chartTypeKey] -= 0.1
          }

          // 确保权重为正数
          this.modelParams.weights[chartTypeKey] = Math.max(0.1, this.modelParams.weights[chartTypeKey])

          // 归一化权重
          const totalWeight = Object.values(this.modelParams.weights).reduce((sum, weight) => sum + weight, 0)
          Object.keys(this.modelParams.weights).forEach(key => {
            this.modelParams.weights[key] /= totalWeight
          })
        }
      }
    }
  }
})

export { DataType, ChartType }