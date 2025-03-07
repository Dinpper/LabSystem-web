<template>
  <div class="chart-container">
    <!-- 个人签到时长统计 -->
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <span>本周签到时长统计</span>
          <el-button type="primary" @click="refreshData">刷新数据</el-button>
        </div>
      </template>

      <div class="chart-wrapper">
        <div ref="chartRef" class="chart"></div>
      </div>
    </el-card>

    <!-- 各组签到时长分布 -->
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <span>各组签到时长分布</span>
          <el-button type="primary" @click="refreshGroupData">刷新数据</el-button>
        </div>
      </template>

      <div class="chart-wrapper">
        <div ref="pieChartRef" class="chart"></div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import request from '@/utils/request'

const userStore = useUserStore()
const chartRef = ref(null)
const pieChartRef = ref(null)
let chart = null
let pieChart = null

// 获取签到数据
const getSignData = async () => {
  try {
    const response = await request.post('/record/querySignDurationWeek', {
      account: userStore.account
    })

    if (response.data.code === '200') {
      const data = response.data.data
      
      // 处理数据
      const dates = data.map(item => item.reportDate)
      const durations = data.map(item => item.signDuration)

      // 更新图表
      updateChart(dates, durations)
    }
  } catch (error) {
    console.error('获取签到数据失败:', error)
    ElMessage.error('获取数据失败')
  }
}

// 更新图表
const updateChart = (dates, durations) => {
  if (!chart) return

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const data = params[0]
        return `${data.name}<br/>签到时长: ${data.value} 小时`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLabel: {
        formatter: (value) => {
          const date = new Date(value)
          return `${date.getMonth() + 1}/${date.getDate()}`
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '签到时长(小时)',
      minInterval: 1
    },
    series: [
      {
        name: '签到时长',
        type: 'line',
        data: durations,
        smooth: true,
        itemStyle: {
          color: '#409EFF',
          borderWidth: 2
        },
        lineStyle: {
          width: 3,
          color: '#409EFF'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgba(64,158,255,0.2)'
            }, {
              offset: 1,
              color: 'rgba(64,158,255,0)'
            }]
          }
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c} h'
        }
      }
    ]
  }

  chart.setOption(option)
}

// 获取各组签到时长数据
const getGroupSignData = async () => {
  try {
    const response = await request.post('/record/queryGroupSignDuration')
    if (response.data.code === '200') {
      const data = response.data.data
      // 按签到时长降序排序
      const sortedData = data.sort((a, b) => b.signDuration - a.signDuration)

      // 设置图表配置
      const option = {
        title: {
          text: '各组签到时长分布',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: params => {
            const { name, value } = params[0]
            return `${name}<br/>签到时长: ${value.toFixed(1)}小时`
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: sortedData.map(item => item.groupName),
          axisLabel: {
            interval: 0,
            rotate: 45,
            textStyle: {
              fontSize: 12
            }
          }
        },
        yAxis: {
          type: 'value',
          name: '签到时长(小时)'
        },
        series: [
          {
            name: '签到时长',
            type: 'bar',
            data: sortedData.map(item => ({
              value: item.signDuration,
              itemStyle: {
                color: item.signDuration > 0 ? '#409EFF' : '#909399'
              }
            })),
            label: {
              show: true,
              position: 'top',
              formatter: '{c}h'
            },
            emphasis: {
              itemStyle: {
                color: '#66b1ff'
              }
            }
          }
        ]
      }

      // 更新图表
      pieChart.setOption(option, true)
    }
  } catch (error) {
    console.error('获取组签到数据失败:', error)
    ElMessage.error('获取组签到数据失败')
  }
}

// 刷新数据
const refreshData = () => {
  getSignData()
}

// 刷新组数据
const refreshGroupData = () => {
  getGroupSignData()
}

onMounted(() => {
  // 初始化柱状图
  chart = echarts.init(chartRef.value)
  getSignData()

  // 初始化饼图
  pieChart = echarts.init(pieChartRef.value)
  getGroupSignData()

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    chart?.resize()
    pieChart?.resize()
  })
})

onUnmounted(() => {
  // 销毁图表
  chart?.dispose()
  pieChart?.dispose()
  window.removeEventListener('resize', () => {
    chart?.resize()
    pieChart?.resize()
  })
})
</script>

<style scoped>
.chart-container {
  padding: 20px;
}

.chart-card {
  min-height: 500px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-wrapper {
  height: 400px;
  width: 100%;
}

.chart {
  height: 100%;
  width: 100%;
}
</style> 