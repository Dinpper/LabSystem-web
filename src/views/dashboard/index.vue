<template>
  <div class="dashboard-container">
    <!-- 顶部个人信息区域 -->
    <el-row :gutter="20">
      <!-- 左侧内容 -->
      <el-col :span="14">
        <!-- 个人信息卡片 -->
        <el-card class="user-info-card" shadow="never">
          <div class="user-info-section">
            <!-- 左侧头像和基本信息 -->
            <div class="avatar-info">
              <el-avatar :size="100" :src="defaultAvatar" class="user-avatar">
                {{ userInfo.userName?.[0]?.toUpperCase() || 'U' }}
              </el-avatar>
              <div class="basic-info">
                <h2 class="user-name">{{ userInfo.userName }}</h2>
                <p class="user-id">ID: {{ userInfo.account }}</p>
                <p class="user-group">{{ userInfo.groupName }}</p>
              </div>
            </div>
            <!-- 右侧统计信息和签到 -->
            <div class="stats-info">
              <div class="stat-item">
                <div class="stat-value">1</div>
                <div class="stat-label">累计登录天数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">36</div>
                <div class="stat-label">本周使用时间(小时)</div>
              </div>
              <div class="stat-item checkin-wrapper">
                <el-button 
                  type="primary" 
                  class="check-button"
                  @click="handleCheckInOut"
                >
                  {{ statusType === 1 ? '签到' : '签退' }}
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
        
        <!-- 最新会议通知 -->
        <el-card class="meeting-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>最新会议通知</span>
            </div>
          </template>
          <div v-if="latestMeeting" class="meeting-content">
            <div class="meeting-item">
              <div class="content-column">
                <div class="meeting-title">{{ latestMeeting.meetingName }}</div>
                <div class="info-list">
                  <div class="info-item">
                    <el-icon><Timer /></el-icon>
                    {{ latestMeeting.reportDate }} {{ latestMeeting.startTime }}
                  </div>
                  <div class="info-item">
                    <el-icon><Location /></el-icon>
                    {{ latestMeeting.location }}
                  </div>
                  <div class="info-item">
                    <el-icon><User /></el-icon>
                    主持人：{{ latestMeeting.organizerName }}
                  </div>
                  <div class="info-item">
                    <el-icon><UserFilled /></el-icon>
                    参会人员：{{ latestMeeting.membersName }}
                  </div>
                  <div class="info-item">
                    <el-icon><Document /></el-icon>
                    {{ latestMeeting.description }}
                  </div>
                </div>
                <div class="meeting-actions">
                  <template v-if="latestMeeting.status === 0">
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click="handleAcceptMeeting(latestMeeting.meetingId)"
                    >
                      接受
                    </el-button>
                    <el-button 
                      type="danger" 
                      size="small" 
                      @click="openRefuseDialog(latestMeeting.meetingId)"
                    >
                      拒绝
                    </el-button>
                  </template>
                  <template v-else-if="latestMeeting.status === 1">
                    <el-tag type="success">已接受</el-tag>
                    <template v-if="canCheckIn">
                      <el-button
                        v-if="!latestMeeting.checkInTime"
                        type="primary"
                        size="small"
                        @click="handleCheckIn(latestMeeting.meetingId)"
                      >
                        签到
                      </el-button>
                      <el-tag v-else type="success">
                        已签到 {{ formatCheckInTime(latestMeeting.checkInTime) }}
                      </el-tag>
                    </template>
                  </template>
                  <el-tag v-else type="danger">已拒绝</el-tag>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无会议通知" />
        </el-card>
      </el-col>
      
      <!-- 右侧日历和会议列表 -->
      <el-col :span="10">
        <el-card class="calendar-card" shadow="never">
          <div class="calendar-wrapper">
            <!-- 日历头部 -->
            <div class="calendar-header">
              <div class="calendar-header-content">
                <span class="current-date">{{ currentMonth }}</span>
                <div class="calendar-nav-buttons">
                  <el-button text @click="changeMonth(-1)">
                    <el-icon><ArrowLeft /></el-icon>上月
                  </el-button>
                  <el-button type="primary" text @click="goToday">今日</el-button>
                  <el-button text @click="changeMonth(1)">
                    下月<el-icon><ArrowRight /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 日历主体 -->
            <el-calendar 
              v-model="selectedDate"
              @select="handleDateSelect"
            >
              <template #header>
                <span></span>
              </template>
              <template #date-cell="{ data }">
                <div class="calendar-cell">
                  <div class="date-wrapper">
                    <span class="date-text">{{ data.day.split('-')[2] }}</span>
                    <div v-if="isToday(data.day)" class="today-dot"></div>
                  </div>
                </div>
              </template>
            </el-calendar>
          </div>

          <!-- 会议列表容器 -->
          <div class="meetings-container">
            <!-- 日期显示 -->
            <div class="list-header">
              <div class="selected-date">
                {{ formatSelectedDate }}
              </div>
            </div>
            <!-- 会议列表 -->
            <div class="meeting-list" v-if="dayMeetings.length > 0">
              <div v-for="meeting in dayMeetings" 
                   :key="meeting.meetingId" 
                   class="meeting-item"
              >
                <div class="meeting-info">
                  <div class="meeting-name">{{ meeting.meetingName }}</div>
                  <div class="meeting-time">{{ meeting.startTime }}</div>
                </div>
                <el-button 
                  link 
                  type="primary" 
                  @click="showMeetingDetail(meeting)"
                >
                  <el-icon><More /></el-icon>
                </el-button>
              </div>
            </div>
            <el-empty v-else description="暂无会议" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 会议详情弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="会议详情"
      width="500px"
    >
      <div v-if="selectedMeeting" class="meeting-detail">
        <div class="detail-item">
          <el-icon><Timer /></el-icon>
          <span>{{ selectedMeeting.reportDate }} {{ selectedMeeting.startTime }}</span>
        </div>
        <div class="detail-item">
          <el-icon><Location /></el-icon>
          <span>{{ selectedMeeting.location }}</span>
        </div>
        <div class="detail-item">
          <el-icon><User /></el-icon>
          <span>主持人：{{ selectedMeeting.organizerName }}</span>
        </div>
        <div class="detail-item">
          <el-icon><UserFilled /></el-icon>
          <span>参会人员：{{ selectedMeeting.membersName }}</span>
        </div>
        <div class="detail-item">
          <el-icon><Document /></el-icon>
          <span>{{ selectedMeeting.description }}</span>
        </div>
      </div>
    </el-dialog>

    <!-- 拒绝原因对话框 -->
    <el-dialog
      v-model="refuseDialogVisible"
      title="拒绝原因"
      width="400px"
    >
      <el-form :model="refuseForm">
        <el-form-item>
          <el-input
            v-model="refuseForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="refuseDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleRefuseMeeting">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { ArrowLeft, ArrowRight, Location, More, Plus, Bell, Calendar, Document, User, UserFilled, Timer } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const userStore = useUserStore()
const account = userStore.username
const statusType = ref(0)
const currentDate = ref(new Date())
const selectedDateTasks = ref([])
const meetings = ref([])
const userInfo = ref({
  userName: '',
  groupName: ''
})
const defaultAvatar = ref('')
const events = ref({}) // 用于存储日期事件
const latestMeeting = ref(null)
const dayMeetings = ref([])
const dialogVisible = ref(false)
const selectedMeeting = ref(null)
const refuseDialogVisible = ref(false)
const refuseForm = ref({
  reason: '',
  meetingId: null
})

// 获取当前本地日期的函数
const getLocalDate = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// 获取当前本地日期的字符串格式
const getLocalDateString = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// 修改初始化选中日期
const selectedDate = ref(new Date())

// 计算当前月份显示
const currentMonth = computed(() => {
  return dayjs(selectedDate.value).format('YYYY年 M月')
})

// 切换月份
const changeMonth = (offset) => {
  const newDate = dayjs(selectedDate.value).add(offset, 'month').toDate()
  selectedDate.value = newDate
}

// 获取签到状态
const getCheckInStatus = async () => {
  try {
    const account = userStore.getAccount
    if (!account) {
      throw new Error('未获取到用户账号')
    }

    const response = await request.post('/record/queryStatusType', {
      account: account
    })

    if (response.data.code === '200') {
      statusType.value = response.data.data.statusType
    }
  } catch (error) {
    console.error('获取状态失败:', error)
  }
}

// 签到/签退处理
const handleCheckInOut = async () => {
  try {
    const account = userStore.getAccount
    if (!account) {
      throw new Error('未获取到用户账号')
    }

    // 修改判断逻辑
    const url = statusType.value === 1 ? '/record/checkIn' : '/record/checkOut'
    const response = await request.post(url, {
      account: account
    })
    
    // 修改提示消息
    ElMessage.success(statusType.value === 1 ? '签到成功' : '签退成功')
    // 更新状态
    await getCheckInStatus()
  } catch (error) {
    console.error('操作失败:', error)
  }
}

// 处理日期选择
const handleDateSelect = async (date) => {
  const formattedDate = dayjs(date).format('YYYY-MM-DD')
  try {
    const response = await request.post('/meeting/queryMeetingByDate', {
      account: localStorage.getItem('account'),
      queryDate: formattedDate
    })
    
    if (response.data.code === '200') {
      dayMeetings.value = response.data.data
    }
  } catch (error) {
    console.error('获取会议列表失败:', error)
    dayMeetings.value = []
  }
}

// 监听选中日期变化
watch(selectedDate, (newDate) => {
  handleDateSelect(newDate)
})

// 获取用户信息
const getUserInfo = async () => {
  try {
    const account = userStore.getAccount
    const response = await request.post('/user/queryUserMessage', {
      account,
      userName: ''
    })
    
    if (response.data.code === '200') {
      userInfo.value = response.data.data
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }
}

// 格式化日历头部
const formatCalendarHeader = (date) => {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
}

// 格式化日期显示
const formatDay = (day) => {
  return new Date(day).getDate()
}

// 判断是否是选中日期
const isSelectedDate = (day) => {
  if (!selectedDate.value) return false
  return day === selectedDate.value
}

// 判断是否是当前月份
const isSameMonth = (day) => {
  const date = new Date(currentDate.value)
  const compareDate = new Date(day)
  return date.getMonth() === compareDate.getMonth()
}

// 点击日期处理
const handleDateClick = (data) => {
  selectedDate.value = data.day
  handleDateSelect(new Date(data.day))
}

// 检查日期是否有事件
const hasEvent = (date) => {
  // 这里可以根据实际需求判断该日期是否有事件
  return selectedDateTasks.value.some(task => {
    const taskDate = new Date(task.time).toDateString()
    return new Date(date).toDateString() === taskDate
  })
}

// 判断是否为今天
const isToday = (date) => {
  return date === dayjs().format('YYYY-MM-DD')
}

// 修改返回今日方法
const goToday = () => {
  const today = getLocalDate()
  currentDate.value = today
  selectedDate.value = getLocalDateString()
  handleDateSelect(today)
}

// 获取最新会议通知
const getLatestMeeting = async () => {
  try {
    const response = await request.post('/meeting/queryMeetingNew', {
      account: localStorage.getItem('account')
    })
    
    if (response.data.code === '200') {
      latestMeeting.value = response.data.data
    }
  } catch (error) {
    console.error('获取最新会议通知失败:', error)
  }
}

// 格式化日期和时间
const formatDateTime = (date, time) => {
  return `${date} ${time}`
}

// 显示会议详情
const showMeetingDetail = (meeting) => {
  selectedMeeting.value = meeting
  dialogVisible.value = true
}

// 获取日期单元格的类名
const getCellClass = (data) => {
  const classes = ['calendar-day']
  const today = dayjs().format('YYYY-MM-DD')
  const cellDate = data.day
  
  if (cellDate === today) {
    classes.push('is-today')
  }
  if (cellDate === dayjs(selectedDate.value).format('YYYY-MM-DD')) {
    classes.push('is-selected')
  }
  if (data.type === 'prev' || data.type === 'next') {
    classes.push('is-other-month')
  }
  return classes
}

// 格式化选中日期显示
const formatSelectedDate = computed(() => {
  return dayjs(selectedDate.value).format('MM月DD日')
})

// 接受会议
const handleAcceptMeeting = async (meetingId) => {
  try {
    const response = await request.post('/userMeeting/acceptMeeting', {
      account: userStore.account,
      meetingId: meetingId
    })
    
    if (response.data.code === '200') {
      ElMessage.success('已接受会议')
      getLatestMeeting()  // 刷新数据
    }
  } catch (error) {
    console.error('接受会议失败:', error)
    ElMessage.error('操作失败')
  }
}

// 打开拒绝对话框
const openRefuseDialog = (meetingId) => {
  refuseForm.value.meetingId = meetingId
  refuseForm.value.reason = ''
  refuseDialogVisible.value = true
}

// 拒绝会议
const handleRefuseMeeting = async () => {
  if (!refuseForm.value.reason.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }

  try {
    const response = await request.post('/userMeeting/refuseMeeting', {
      reason: refuseForm.value.reason.trim(),
      account: userStore.account,
      meetingId: refuseForm.value.meetingId
    })
    
    if (response.data.code === '200') {
      ElMessage.success('已拒绝会议')
      refuseDialogVisible.value = false
      getLatestMeeting()  // 刷新数据
    }
  } catch (error) {
    console.error('拒绝会议失败:', error)
    ElMessage.error('操作失败')
  }
}

// 判断是否可以签到
const canCheckIn = computed(() => {
  if (!latestMeeting.value) return false
  
  const now = dayjs()
  const meetingTime = dayjs(
    `${latestMeeting.value.reportDate} ${latestMeeting.value.startTime}`,
    'YYYY-MM-DD HH:mm:ss'
  )
  
  return now.isAfter(meetingTime)
})

// 格式化签到时间
const formatCheckInTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('HH:mm:ss')
}

// 会议签到
const handleCheckIn = async (meetingId) => {
  try {
    const response = await request.post('/userMeeting/checkInMeeting', {
      meetingId: meetingId,
      account: userStore.account
    })
    
    if (response.data.code === '200') {
      ElMessage.success('签到成功')
      getLatestMeeting()  // 刷新数据以获取最新的签到时间
    }
  } catch (error) {
    console.error('签到失败:', error)
    ElMessage.error('签到失败')
  }
}

onMounted(() => {
  getCheckInStatus()
  getUserInfo()
  // 模拟一些会议数据
  meetings.value = [
    {
      id: 1,
      time: '',
      location: '',
      content: '',
      members: ''
    }
  ]
  
  // 添加一个延时以确保日历已经渲染
  setTimeout(() => {
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const headers = document.querySelectorAll('.el-calendar-table th')
    headers.forEach((th, index) => {
      th.setAttribute('data-week', weekDays[index])
    })
  }, 100)
  
  // 初始化时获取今天的任务
  handleDateSelect(getLocalDate())
  getLatestMeeting()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f0f2f5;
}

.user-info-card {
  height: calc(50% - 10px); /* 减去间距的一半 */
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
  align-items: center;
  gap: 40px;
}

.stat-item {
  text-align: center;
  padding: 0 20px;
  position: relative;
}

.stat-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  height: 30px;
  width: 1px;
  background-color: var(--el-border-color-lighter);
}

.checkin-wrapper {
  padding-left: 20px;
}

.checkin-button {
  padding: 12px 24px;
  font-size: 14px;
  border-radius: 6px;
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
  margin-bottom: 20px;
}

.calendar-wrapper {
  background-color: var(--el-bg-color);
}

.calendar-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.calendar-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-date {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.calendar-nav-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 自定义日历样式 */
:deep(.el-calendar) {
  --el-calendar-border: none;
  background-color: transparent;
}

:deep(.el-calendar__header) {
  display: none;
}

:deep(.el-calendar__body) {
  padding: 4px 12px;
}

:deep(.el-calendar-table) {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

:deep(.el-calendar-table th) {
  text-align: center;
  padding: 8px 0;
  font-weight: 500;
  color: var(--el-text-color-regular);
  font-size: 13px;
}

:deep(.el-calendar-table td) {
  border: none;
  padding: 2px;
  text-align: center;
  height: 40px;
}

.calendar-cell {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.date-text {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
  color: var(--el-text-color-regular);
  transition: all 0.2s ease;
}

.today-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
}

:deep(.el-calendar-table .prev),
:deep(.el-calendar-table .next) {
  .date-text {
    color: var(--el-text-color-placeholder);
  }
}

/* 选中日期的样式 */
:deep(.el-calendar-table td.is-selected) .date-text {
  background-color: var(--el-color-primary);
  color: white;
}

/* 今天的样式 - 移除蓝色文字 */
:deep(.el-calendar-table td.is-today .el-calendar-day) {
  color: var(--el-color-primary);
  font-weight: bold;
}

/* 悬停效果 */
:deep(.el-calendar-table td:not(.prev):not(.next)) .date-text:hover {
  background-color: var(--el-color-primary-light-9);
  cursor: pointer;
}

/* 确保选中状态的优先级高于悬停状态 */
:deep(.el-calendar-table td.is-selected) .date-text:hover {
  background-color: var(--el-color-primary);
  color: white;
}

/* 会议列表相关样式 */
.meetings-container {
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: 8px;
  height: 300px;
  display: flex;
  flex-direction: column;
}

.list-header {
  padding: 12px 16px;
  margin-bottom: 8px;
}

.meeting-list {
  flex: 1;
  overflow-y: auto;
}

.meeting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.meeting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meeting-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.meeting-time {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 自定义滚动条样式 */
.meeting-list::-webkit-scrollbar {
  width: 4px;
}

.meeting-list::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color);
  border-radius: 2px;
}

.meeting-list::-webkit-scrollbar-track {
  background-color: transparent;
}

/* Empty 组件样式调整 */
:deep(.el-empty) {
  padding: 24px 0;
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

.custom-calendar {
  position: relative;
}

.calendar-header {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  padding: 12px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.el-calendar__header) {
  display: none;
}

/* 完全隐藏英文星期显示 */
:deep(.el-calendar-table thead th) {
  font-size: 0 !important;
  padding: 8px 0;
  position: relative;
  height: 32px;
}

:deep(.el-calendar-table thead th > div),
:deep(.el-calendar-table thead th > span),
:deep(.el-calendar-table thead th > *) {
  display: none !important;
  font-size: 0 !important;
  opacity: 0 !important;
  visibility: hidden !important;
}

:deep(.el-calendar-table thead th)::after {
  content: attr(data-week);
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px !important;
  color: var(--el-text-color-regular);
  font-weight: 600;
}

:deep(.el-calendar-table thead th:nth-child(1))::after { content: '日'; }
:deep(.el-calendar-table thead th:nth-child(2))::after { content: '一'; }
:deep(.el-calendar-table thead th:nth-child(3))::after { content: '二'; }
:deep(.el-calendar-table thead th:nth-child(4))::after { content: '三'; }
:deep(.el-calendar-table thead th:nth-child(5))::after { content: '四'; }
:deep(.el-calendar-table thead th:nth-child(6))::after { content: '五'; }
:deep(.el-calendar-table thead th:nth-child(7))::after { content: '六'; }

/* 自定义日期选择器下拉面板样式 */
:global(.custom-month-picker) {
  border-radius: 8px !important;
  padding: 0 !important;
  box-shadow: var(--el-box-shadow-light) !important;
}

:global(.custom-month-picker .el-picker-panel__sidebar) {
  background-color: var(--el-bg-color-page);
  border-right: 1px solid var(--el-border-color-lighter);
  padding: 12px 0;
}

:global(.custom-month-picker .el-picker-panel__shortcut) {
  color: var(--el-text-color-regular);
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 0;
  margin: 0;
  transition: all 0.3s;
}

:global(.custom-month-picker .el-picker-panel__shortcut:hover) {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

/* 日期选择器头部按钮样式 */
:global(.custom-month-picker .el-date-picker__header-label) {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

:global(.custom-month-picker .el-picker-panel__icon-btn) {
  color: var(--el-text-color-regular);
}

:global(.custom-month-picker .el-picker-panel__icon-btn:hover) {
  color: var(--el-color-primary);
}

/* 移除其他可能冲突的样式 */
:deep(.el-calendar-table) {
  th * {
    display: none !important;
  }
}

/* 移除快捷选项相关样式 */
:global(.custom-month-picker .el-picker-panel__sidebar) {
  display: none; /* 隐藏快捷选项侧边栏 */
}

:global(.custom-month-picker .el-picker-panel__body) {
  margin-left: 0 !important; /* 确保内容区域占满宽度 */
}

/* 修改卡片样式 */
:deep(.el-card) {
  border: none;
  background-color: var(--el-bg-color-overlay);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
  border-radius: 12px;
  overflow: hidden;
}

/* 修改统计信息和签到按钮样式 */
.stats-info {
  display: flex;
  align-items: center;
  gap: 40px;
}

.stat-item {
  text-align: center;
  padding: 0 20px;
  position: relative;
}

.stat-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  height: 30px;
  width: 1px;
  background-color: var(--el-border-color-lighter);
}

.checkin-wrapper {
  padding-left: 20px;
}

.checkin-button {
  padding: 12px 24px;
  font-size: 14px;
  border-radius: 6px;
}

/* 修改卡片头部样式 */
.card-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

/* 修改任务和会议列表样式 */
.task-item, .meeting-item {
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 6px;
  background-color: var(--el-fill-color-blank);
  border: none;
}

.task-item:hover, .meeting-item:hover {
  background-color: var(--el-fill-color-light);
}

/* 修改任务列表样式 */
.task-list-wrapper {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

.task-list-wrapper::-webkit-scrollbar {
  width: 6px;
}

.task-list-wrapper::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color-lighter);
  border-radius: 3px;
}

.task-list-wrapper::-webkit-scrollbar-track {
  background-color: transparent;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background-color: var(--el-fill-color-blank);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.task-item:hover {
  background-color: var(--el-fill-color-light);
  transform: translateX(4px);
}

.task-time {
  min-width: 80px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.task-content {
  flex: 1;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.no-task {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 40px 0;
  font-size: 14px;
}

/* 日历卡片样式 */
.calendar-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.calendar-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.calendar-date {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}

/* 日历单元格样式 */
.custom-calendar-cell {
  height: 100%;
  padding: 4px;
  cursor: pointer;
}

.date-content {
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 0 auto;
  border-radius: 50%;
}

.event-marker {
  position: absolute;
  bottom: 2px;
  width: 4px;
  height: 4px;
  background-color: var(--el-color-primary);
  border-radius: 50%;
}

/* 任务列表样式 */
.task-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--el-border-color-lighter);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.selected-date {
  font-size: 16px;
  font-weight: 500;
}

.task-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.task-content {
  flex: 1;
}

.task-title {
  font-size: 14px;
  margin-bottom: 4px;
}

.task-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.add-task {
  padding: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.add-btn {
  width: 100%;
  justify-content: center;
}

/* 调整卡片高度 */
.user-info-card {
  height: calc(50% - 10px); /* 减去间距的一半 */
}

.meeting-card {
  height: calc(50% - 10px); /* 减去间距的一半 */
}

.calendar-card {
  height: 100%;
}

/* 会议列表样式优化 */
.meeting-list {
  margin-top: 16px;
  padding: 0 16px;
  max-height: calc(100vh - 500px);  /* 限制列表最大高度 */
  overflow-y: auto;
}

.meeting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.meeting-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meeting-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.meeting-time {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.no-meeting {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 40px 0;
  font-size: 14px;
}

/* 会议通知样式 */
.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 500;
}

.meeting-list {
  padding: 16px;
}

.meeting-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-regular);
}

.info-label {
  color: var(--el-text-color-secondary);
  min-width: 70px;
}

.info-content {
  color: var(--el-text-color-primary);
  flex: 1;
}

:deep(.el-icon) {
  font-size: 16px;
  color: var(--el-color-primary);
}

/* 调整卡片样式 */
.meeting-card {
  height: calc(50% - 10px);
}

.card-header {
  margin-bottom: 0;
  padding-bottom: 12px;
}

.meeting-content {
  padding: 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.meeting-item {
  display: flex;
  gap: 16px;
}

.meeting-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
  padding-right: 16px;
  border-right: 1px solid var(--el-border-color-lighter);
}

.meeting-time .time {
  font-size: 18px;
  font-weight: 500;
  color: var(--el-color-primary);
  line-height: 1.2;
}

.meeting-time .date {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.meeting-details {
  flex: 1;
}

.meeting-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
}

.meeting-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.info-item .el-icon {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
}

.description {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.description span {
  flex: 1;
  word-break: break-all;
}

.meeting-content {
  padding: 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.meeting-item {
  display: flex;
  gap: 20px;
}

/* 左侧时间列样式 */
.time-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.time {
  font-size: 20px;
  color: var(--el-color-primary);
  font-weight: 500;
}

.date {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

/* 右侧内容列样式 */
.content-column {
  flex: 1;
}

.meeting-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.info-item .el-icon {
  color: var(--el-text-color-secondary);
}

.meetings-list {
  margin-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.list-header {
  padding: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.meeting-items {
  max-height: 300px;
  overflow-y: auto;
}

.meeting-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.meeting-brief {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meeting-time {
  color: var(--el-color-primary);
  font-weight: 500;
  font-size: 14px;
}

.meeting-name {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.meeting-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1.5;
}

.detail-item .el-icon {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

/* 让长文本可以换行 */
.detail-item span {
  flex: 1;
  word-break: break-all;
}

/* 添加滚动条样式 */
.meeting-list::-webkit-scrollbar {
  width: 4px;
}

.meeting-list::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color);
  border-radius: 2px;
}

.meeting-list::-webkit-scrollbar-track {
  background-color: transparent;
}

.meeting-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  align-items: center;  /* 确保按钮和标签垂直对齐 */
}

.el-tag {
  padding: 0 12px;
  height: 24px;
  line-height: 22px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>