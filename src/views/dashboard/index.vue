<template>
  <div class="dashboard-container">
    <!-- 顶部个人信息区域 -->
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="user-info-card">
          <div class="user-info-section">
            <!-- 左侧头像和基本信息 -->
            <div class="avatar-info">
              <el-avatar :size="100" :src="defaultAvatar" class="user-avatar">
                {{ userInfo.name?.[0]?.toUpperCase() || 'U' }}
              </el-avatar>
              <div class="basic-info">
                <h2 class="user-name">{{ userInfo.name }}</h2>
                <p class="user-id">ID: {{ userInfo.account }}</p>
                <p class="user-group">第二事业部 · 项目开发部</p>
              </div>
            </div>
            <!-- 右侧统计信息 -->
            <div class="stats-info">
              <div class="stat-item">
                <div class="stat-value">542</div>
                <div class="stat-label">累计登录天数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">36</div>
                <div class="stat-label">本周使用时间(小时)</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 右侧日历区域 -->
      <el-col :span="8">
        <el-card class="calendar-card">
          <el-calendar v-model="currentDate" @select="handleDateSelect">
          </el-calendar>
        </el-card>
      </el-col>
    </el-row>

    <!-- 中间签到区域 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="checkin-card">
          <div class="checkin-section">
            <el-button 
              type="primary" 
              size="large" 
              @click="handleCheckInOut"
              class="checkin-button"
            >
              {{ statusType === 1 ? '签到' : '签退' }}
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部区域 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 左侧任务列表 -->
      <el-col :span="16">
        <el-card class="task-card">
          <template #header>
            <div class="card-header">
              <span>今日任务</span>
            </div>
          </template>
          <div v-if="selectedDateTasks.length > 0">
            <div v-for="task in selectedDateTasks" :key="task.id" class="task-item">
              <span>{{ task.time }}</span>
              <span>{{ task.content }}</span>
            </div>
          </div>
          <div v-else class="no-task">
            暂无任务
          </div>
        </el-card>
      </el-col>
      
      <!-- 右侧会议通知 -->
      <el-col :span="8">
        <el-card class="meeting-card">
          <template #header>
            <div class="card-header">
              <span>会议通知</span>
            </div>
          </template>
          <div v-if="meetings.length > 0">
            <div v-for="meeting in meetings" :key="meeting.id" class="meeting-item">
              <span>{{ meeting.time }}</span>
              <span>{{ meeting.title }}</span>
            </div>
          </div>
          <div v-else class="no-meeting">
            暂无会议
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const account = userStore.username
const statusType = ref(0)
const currentDate = ref(new Date())
const selectedDateTasks = ref([])
const meetings = ref([])
const userInfo = ref({})
const defaultAvatar = ref('')

// 获取签到状态
const getCheckInStatus = async () => {
  try {
    const response = await request.post('/record/queryStatusType', {
      account: account
    })
    statusType.value = response.data.statusType
  } catch (error) {
    console.error('获取签到状态失败:', error)
  }
}

// 签到/签退处理
const handleCheckInOut = async () => {
  const url = statusType.value === 1 ? '/record/checkIn' : '/record/checkOut'
  try {
    const response = await request.post(url, {
      account: account
    })
    ElMessage.success(statusType.value === 1 ? '签到成功' : '签退成功')
    statusType.value = statusType.value === 1 ? 0 : 1
    await getCheckInStatus()
  } catch (error) {
    console.error('操作失败:', error)
  }
}

// 日期选择处理
const handleDateSelect = (date) => {
  // 这里可以根据选择的日期获取对应的任务
  selectedDateTasks.value = [
    { id: 1, time: '09:00', content: '项目周会' },
    { id: 2, time: '14:30', content: '代码评审' }
  ]
}

// 获取用户信息
const getUserInfo = async () => {
  try {
    const response = await request.post('/user/queryUserMessage', {
      account: account
    })
    userInfo.value = response.data
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

onMounted(() => {
  getCheckInStatus()
  getUserInfo()
  // 模拟一些会议数据
  meetings.value = [
    { id: 1, time: '今天 14:00', title: '项目进度汇报' },
    { id: 2, time: '明天 10:00', title: '技术分享会' }
  ]
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f0f2f5;
}

.user-info-card {
  height: 100%;
}

.user-info-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.basic-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-name {
  font-size: 24px;
  margin: 0;
}

.user-id, .user-group {
  color: #666;
  margin: 0;
}

.stats-info {
  display: flex;
  gap: 40px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  color: #409EFF;
  font-weight: bold;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.calendar-card {
  height: 100%;
}

.checkin-section {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.checkin-button {
  padding: 20px 60px;
  font-size: 18px;
}

.task-item, .meeting-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.no-task, .no-meeting {
  text-align: center;
  color: #999;
  padding: 20px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>