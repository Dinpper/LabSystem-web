<template>
  <div class="dashboard-container">
    <!-- 顶部个人信息区域 -->
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="user-info-card" shadow="never">
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
            <!-- 右侧统计信息和签到 -->
            <div class="stats-info">
              <div class="stat-item">
                <div class="stat-value">542</div>
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
        
        <!-- 会议通知移到左下方 -->
        <el-card class="meeting-card" shadow="never" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon><Bell /></el-icon>
                <span>最新会议通知</span>
              </div>
            </div>
          </template>
          <div class="meeting-list">
            <div class="meeting-info">
              <div class="info-item">
                <el-icon><Calendar /></el-icon>
                <span class="info-label">会议时间：</span>
                <span class="info-content">{{ meetings[0]?.time || '暂无' }}</span>
              </div>
              <div class="info-item">
                <el-icon><Location /></el-icon>
                <span class="info-label">会议地点：</span>
                <span class="info-content">{{ meetings[0]?.location || '暂无' }}</span>
              </div>
              <div class="info-item">
                <el-icon><Document /></el-icon>
                <span class="info-label">会议内容：</span>
                <span class="info-content">{{ meetings[0]?.content || '暂无' }}</span>
              </div>
              <div class="info-item">
                <el-icon><User /></el-icon>
                <span class="info-label">会议成员：</span>
                <span class="info-content">{{ meetings[0]?.members || '暂无' }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 右侧日历区域 -->
      <el-col :span="8">
        <el-card class="calendar-card" shadow="never">
          <div class="calendar-wrapper">
            <!-- 日历标题部分 -->
            <div class="calendar-header">
              <div class="calendar-header-content">
                <el-date-picker
                  v-model="currentDate"
                  type="month"
                  format="YYYY年MM月"
                  :clearable="false"
                  :popper-class="'custom-month-picker'"
                  style="width: 140px"
                />
                <div class="calendar-nav-buttons">
                  <el-button-group>
                    <el-button 
                      size="small" 
                      @click="changeMonth(-1)"
                      :icon="ArrowLeft"
                    >
                      上月
                    </el-button>
                    <el-button 
                      size="small" 
                      @click="goToday"
                    >
                      今日
                    </el-button>
                    <el-button 
                      size="small" 
                      @click="changeMonth(1)"
                      :icon="ArrowRight"
                      class="icon-right"
                    >
                      下月
                    </el-button>
                  </el-button-group>
                </div>
              </div>
            </div>

            <!-- 日历主体 -->
            <el-calendar v-model="currentDate">
              <template #date-cell="{ data }">
                <div 
                  class="calendar-cell" 
                  @click="handleDateClick(data)"
                  :class="{
                    'is-selected': isSelectedDate(data.day),
                    'is-today': isToday(data.day),
                    'other-month': !isSameMonth(data.day)
                  }"
                >
                  <div class="date-content">
                    {{ formatDay(data.day) }}
                    <span v-if="hasEvent(data.day)" class="event-dot"></span>
                  </div>
                </div>
              </template>
            </el-calendar>

            <!-- 任务列表部分 -->
            <div class="task-section">
              <div class="task-header">
                <span class="selected-date">{{ formatSelectedDate }}</span>
                <el-switch
                  v-model="showCompleted"
                  active-text="显示已完成"
                />
              </div>
              <div class="task-list">
                <div v-for="task in selectedDateTasks" :key="task.id" class="task-item">
                  <el-checkbox v-model="task.completed" />
                  <div class="task-content">
                    <div class="task-title">{{ task.content }}</div>
                    <div class="task-time">{{ task.time }}</div>
                  </div>
                  <el-button 
                    v-if="task.location"
                    text
                    class="location-btn"
                    @click="showLocation(task)"
                  >
                    <el-icon><Location /></el-icon>
                  </el-button>
                  <el-dropdown>
                    <el-button text>
                      <el-icon><More /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item>编辑</el-dropdown-item>
                        <el-dropdown-item>删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
              <div class="add-task">
                <el-button text class="add-btn" @click="showAddTask">
                  <el-icon><Plus /></el-icon>
                  添加新待办
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { ArrowLeft, ArrowRight, Location, More, Plus, Bell, Calendar, Document, User } from '@element-plus/icons-vue'

const userStore = useUserStore()
const account = userStore.username
const statusType = ref(0)
const currentDate = ref(new Date())
const selectedDateTasks = ref([])
const meetings = ref([])
const userInfo = ref({})
const defaultAvatar = ref('')
const events = ref({}) // 用于存储日期事件

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
const selectedDate = ref(getLocalDateString())

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
      console.log('当前状态:', statusType.value)
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

// 日期选择处理
const handleDateSelect = async (date) => {
  try {
    // 这里替换为实际的后端接口调用
    // const response = await request.post('/task/queryTasksByDate', {
    //   account: account,
    //   date: date.toISOString().split('T')[0]
    // })
    // selectedDateTasks.value = response.data

    // 临时使用模拟数据
    selectedDateTasks.value = [
      { id: 1, time: '09:00', content: '项目周会' },
      { id: 2, time: '10:30', content: '需求评审' },
      { id: 3, time: '14:30', content: '代码评审' },
      { id: 4, time: '16:00', content: '团队建设' }
    ]
  } catch (error) {
    console.error('获取任务列表失败:', error)
    selectedDateTasks.value = []
  }
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

// 修改判断是否是今天的方法
const isToday = (day) => {
  const today = getLocalDateString()
  return day === today
}

// 修改返回今日方法
const goToday = () => {
  const today = getLocalDate()
  currentDate.value = today
  selectedDate.value = getLocalDateString()
  handleDateSelect(today)
}

// 添加月份切换方法
const changeMonth = (offset) => {
  const date = new Date(currentDate.value)
  date.setMonth(date.getMonth() + offset)
  currentDate.value = date
}

// 添加格式化选中日期的计算属性
const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return '今日'
  const today = getLocalDateString()
  if (selectedDate.value === today) return '今日'
  return new Date(selectedDate.value).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
})

onMounted(() => {
  getCheckInStatus()
  getUserInfo()
  // 模拟一些会议数据
  meetings.value = [
    {
      id: 1,
      time: '今天 14:00',
      location: '华南工程大酒店3楼',
      content: '网络协同办公系统升级改造培训会议',
      members: '张三、李四、王五等'
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
  height: 100%;
}

.calendar-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color);
}

.calendar-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-nav-buttons {
  display: flex;
  gap: 8px;
}

/* 修改日期选择器样式 */
:deep(.el-input__wrapper) {
  background-color: transparent;
  box-shadow: none !important;
  padding: 0;
}

:deep(.el-input__inner) {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-align: left;
  cursor: pointer;
  padding: 0;
}

/* 按钮组样式 */
:deep(.el-button-group .el-button) {
  font-size: 12px;
  padding: 6px 12px;
}

:deep(.el-button-group .icon-right [class*='el-icon']) {
  margin-left: 4px;
  margin-right: 0;
}

.calendar-cell {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.date-content {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 50%;
  font-size: 14px;
}

.calendar-cell:hover .date-content {
  background-color: var(--el-fill-color-light);
}

.calendar-cell.is-selected .date-content {
  background-color: var(--el-color-primary);
  color: white;
}

.calendar-cell.is-today .date-content {
  border: 1px solid var(--el-color-primary);
  color: var(--el-color-primary);
}

.calendar-cell.is-selected.is-today .date-content {
  background-color: var(--el-color-primary);
  border: none;
  color: white;
}

.calendar-cell.other-month {
  color: var(--el-text-color-placeholder);
}

.event-dot {
  position: absolute;
  bottom: -2px;
  width: 4px;
  height: 4px;
  background-color: var(--el-color-danger);
  border-radius: 50%;
}

/* 深度选择器样式优化 */
:deep(.el-calendar) {
  --el-calendar-cell-width: 40px;
  background-color: transparent;
}

:deep(.el-calendar__header) {
  padding: 12px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.el-calendar-table thead th) {
  text-align: center;
  padding: 8px 0;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

:deep(.el-calendar-table td) {
  border: none;
  padding: 4px;
  height: 48px;
}

:deep(.el-calendar__button-group) {
  display: none;
}

:deep(.el-calendar-table tr td.prev),
:deep(.el-calendar-table tr td.next) {
  color: var(--el-text-color-placeholder);
}

:deep(.el-calendar-table .el-calendar-day) {
  padding: 0;
  height: 100%;
}

/* 完全隐藏原始表头并显示中文 */
:deep(.el-calendar-table thead th) {
  position: relative;
  padding: 8px 0;
  font-size: 14px;
  font-weight: 600;
}

:deep(.el-calendar-table thead th > div) {
  display: none;  /* 完全隐藏原始内容 */
}

:deep(.el-calendar-table thead th)::after {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: var(--el-text-color-regular);
}

:deep(.el-calendar-table thead th:nth-child(1))::after { content: '日'; }
:deep(.el-calendar-table thead th:nth-child(2))::after { content: '一'; }
:deep(.el-calendar-table thead th:nth-child(3))::after { content: '二'; }
:deep(.el-calendar-table thead th:nth-child(4))::after { content: '三'; }
:deep(.el-calendar-table thead th:nth-child(5))::after { content: '四'; }
:deep(.el-calendar-table thead th:nth-child(6))::after { content: '五'; }
:deep(.el-calendar-table thead th:nth-child(7))::after { content: '六'; }

/* 移除其他可能冲突的样式 */
:deep(.el-calendar-table th *) {
  display: none !important;
}

/* 确保日期选择器的下拉图标居中 */
:deep(.el-input__suffix) {
  display: flex;
  align-items: center;
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
  height: calc(100% - 60px); /* 减去头部高度 */
  overflow-y: auto;
}

.meeting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 6px;
  background-color: var(--el-fill-color-blank);
  transition: all 0.3s ease;
}

.meeting-item:hover {
  background-color: var(--el-fill-color-light);
  transform: translateX(4px);
}

.meeting-time {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  min-width: 100px;
}

.meeting-title {
  flex: 1;
  color: var(--el-text-color-primary);
  font-size: 14px;
  margin-left: 16px;
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
</style>