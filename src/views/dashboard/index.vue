<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="checkin-card">
          <template #header>
            <div class="card-header">
              <span>签到状态</span>
            </div>
          </template>
          <div class="checkin-info">
            <el-button 
              type="primary" 
              size="large" 
              @click="handleCheckInOut"
            >
              {{ statusType === 1 ? '签到' : '签退' }}
            </el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="notification-card">
          <template #header>
            <div class="card-header">
              <span>通知</span>
            </div>
          </template>
          <div class="notification-content">
            <p>这里是通知内容...</p>
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

onMounted(() => {
  getCheckInStatus()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f0f2f5;
}

.checkin-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checkin-info {
  text-align: center;
  margin-top: 20px;
}
</style> 