<template>
  <div class="page-container">
    <el-card class="schedule-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">会议时间安排</span>
          <el-button type="primary" @click="handlePublish" :disabled="!selectedSlot">发布会议</el-button>
        </div>
      </template>

      <!-- 参会人员选择 -->
      <div class="form-section">
        <el-form :model="formData" label-width="100px">
          <el-form-item label="参会人员">
            <div class="participants-input" @click="showParticipantDialog">
              <div v-if="formData.participants.length === 0" class="placeholder">
                请选择参会人员
              </div>
              <div v-else class="selected-avatars">
                <el-avatar
                  v-for="user in selectedParticipants"
                  :key="user.value"
                  :size="32"
                  class="user-avatar"
                >
                  {{ user.label.substring(0, 1) }}
                </el-avatar>
                <span class="user-count" v-if="formData.participants.length > 0">
                  共 {{ formData.participants.length }} 人
                </span>
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 人员选择弹窗 -->
      <el-dialog
        v-model="participantDialogVisible"
        title="选择参会人员"
        width="800px"
        class="participant-dialog"
      >
        <div class="dialog-content">
          <!-- 左侧分组和人员列表 -->
          <div class="group-list">
            <div class="search-box">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索人员"
                :prefix-icon="Search"
                clearable
              />
            </div>
            
            <div class="groups-container">
              <el-collapse v-model="activeGroups">
                <el-collapse-item
                  v-for="group in departments"
                  :key="group.id"
                  :name="group.id"
                >
                  <template #title>
                    <div class="group-title">
                      <span>{{ group.name }}</span>
                      <span class="group-count">{{ getDeptUserCount(group.id) }}人</span>
                    </div>
                  </template>
                  <div class="group-users">
                    <div
                      v-for="user in getUsersByGroup(group.id)"
                      :key="user.value"
                      class="user-item"
                    >
                      <el-checkbox
                        v-model="tempSelectedUsers"
                        :label="user.value"
                        @change="handleUserSelect(user)"
                      >
                        <div class="user-info">
                          <el-avatar :size="28" class="user-avatar">
                            {{ user.label.substring(0, 1) }}
                          </el-avatar>
                          <span class="user-name">{{ user.label }}</span>
                        </div>
                      </el-checkbox>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>

          <!-- 右侧已选人员 -->
          <div class="selected-panel">
            <div class="panel-header">
              <span class="header-title">已选择人员</span>
              <div class="header-actions">
                <span class="selected-count">{{ tempSelectedUsers.length }}人</span>
                <el-button
                  type="primary"
                  link
                  @click="tempSelectedUsers = []"
                  :disabled="tempSelectedUsers.length === 0"
                >
                  清空
                </el-button>
              </div>
            </div>
            <div class="selected-users">
              <el-empty
                v-if="tempSelectedUsers.length === 0"
                description="未选择任何人员"
              />
              <div
                v-else
                v-for="userId in tempSelectedUsers"
                :key="userId"
                class="selected-user-item"
              >
                <div class="user-info">
                  <el-avatar :size="28" class="user-avatar">
                    {{ getUserLabel(userId).substring(0, 1) }}
                  </el-avatar>
                  <div class="user-details">
                    <span class="user-name">{{ getUserLabel(userId) }}</span>
                    <span class="user-dept">{{ getUserDept(userId) }}</span>
                  </div>
                </div>
                <el-button
                  type="danger"
                  link
                  class="remove-button"
                  @click="removeUser(userId)"
                >
                  移除
                </el-button>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="participantDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="confirmParticipants">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 周视图日历 -->
      <div class="calendar-view" v-if="formData.participants.length > 0">
        <div class="calendar-header">
          <el-button @click="prevWeek">上一周</el-button>
          <span class="week-range">{{ weekRange }}</span>
          <el-button @click="nextWeek">下一周</el-button>
        </div>
        
        <div class="calendar-grid">
          <!-- 时间列 -->
          <div class="time-column">
            <div class="time-header">时间</div>
            <div class="time-slot" v-for="time in timeSlots" :key="time">
              {{ time }}
            </div>
          </div>
          
          <!-- 每天的时间格子 -->
          <div class="day-column" v-for="day in weekDays" :key="day.date">
            <div class="day-header">
              {{ day.dayOfWeek }}<br>{{ day.date }}
            </div>
            <div
              v-for="time in timeSlots"
              :key="time"
              class="time-cell"
              :class="{
                'available': isTimeSlotAvailable(day.date, time),
                'selected': isTimeSlotSelected(day.date, time)
              }"
              @click="handleTimeSlotClick(day.date, time)"
            >
              <span v-if="isTimeSlotAvailable(day.date, time)" class="available-count">
                {{ getAvailableCount(day.date, time) }}人可用
              </span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 发布会议对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="发布会议"
      width="500px"
    >
      <el-form :model="meetingForm" label-width="100px">
        <el-form-item label="会议主题" required>
          <el-input v-model="meetingForm.title" placeholder="请输入会议主题"/>
        </el-form-item>
        <el-form-item label="会议时间">
          <div class="selected-time">
            {{ formatDate(selectedSlot?.date) }} {{ selectedSlot?.time }}
          </div>
        </el-form-item>
        <el-form-item label="参会人员">
          <div class="selected-participants">
            <el-tag v-for="user in selectedParticipants" :key="user.value">
              {{ user.label }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="会议说明">
          <el-input
            v-model="meetingForm.description"
            type="textarea"
            rows="3"
            placeholder="请输入会议说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmPublish">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Close } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 表单数据
const formData = reactive({
  participants: []
})

// 会议表单
const meetingForm = reactive({
  title: '',
  description: ''
})

// 用户选项
const userOptions = ref([])
// 当前周的开始日期
const currentWeekStart = ref(new Date())
// 选中的时间槽
const selectedSlot = ref(null)
// 对话框显示
const dialogVisible = ref(false)
// 可用时间数据
const availableTimeData = ref([])

// 时间槽列表
const timeSlots = [
  '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
  '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
]

// 新增的响应式数据
const participantDialogVisible = ref(false)
const departments = ref([])
const selectedDept = ref(null)
const searchKeyword = ref('')
const tempSelectedUsers = ref([]) // 临时存储选中的用户
const activeGroups = ref([]) // 当前展开的分组

// 计算周范围显示
const weekRange = computed(() => {
  const start = new Date(currentWeekStart.value)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${formatDate(start)} 至 ${formatDate(end)}`
})

// 计算周视图数据
const weekDays = computed(() => {
  const days = []
  const start = new Date(currentWeekStart.value)
  const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(date.getDate() + i)
    days.push({
      date: formatDate(date),
      dayOfWeek: weekDayNames[date.getDay()]
    })
  }
  return days
})

// 计算选中的参会人员
const selectedParticipants = computed(() => {
  return userOptions.value.filter(user => formData.participants.includes(user.value))
})

// 获取用户列表
const getUserList = async () => {
  try {
    const response = await request.post('/user/queryGroupUserAll')
    if (response.data.code === '200') {
      // 设置部门列表
      departments.value = response.data.data.map(group => ({
        id: group.groupName,
        name: group.groupName
      }))
      
      // 设置用户列表
      const users = []
      response.data.data.forEach(group => {
        group.userList.forEach(userName => {
          users.push({
            label: userName,
            value: userName, // 使用用户名作为value
            department: group.groupName,
            departmentId: group.groupName // 使用组名作为departmentId
          })
        })
      })
      userOptions.value = users

      // 默认选中第一个部门
      if (departments.value.length > 0) {
        selectedDept.value = departments.value[0].id
      }
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  }
}

// 获取可用时间数据
const fetchAvailableTimeSlots = async () => {
  try {
    const response = await request.post('/meeting/available-slots', {
      startDate: formatDate(currentWeekStart.value),
      endDate: formatDate(new Date(currentWeekStart.value.getTime() + 6 * 24 * 60 * 60 * 1000)),
      participants: formData.participants
    })
    
    if (response.data.code === '200') {
      availableTimeData.value = response.data.data
    }
  } catch (error) {
    console.error('获取可用时间段失败:', error)
    ElMessage.error('获取可用时间段失败')
  }
}

// 检查时间槽是否可用
const isTimeSlotAvailable = (date, time) => {
  const slot = availableTimeData.value.find(
    s => s.date === date && s.time === time
  )
  return slot && slot.availableCount > 0
}

// 获取可用人数
const getAvailableCount = (date, time) => {
  const slot = availableTimeData.value.find(
    s => s.date === date && s.time === time
  )
  return slot ? slot.availableCount : 0
}

// 检查时间槽是否被选中
const isTimeSlotSelected = (date, time) => {
  return selectedSlot.value &&
    selectedSlot.value.date === date &&
    selectedSlot.value.time === time
}

// 处理时间槽点击
const handleTimeSlotClick = (date, time) => {
  if (isTimeSlotAvailable(date, time)) {
    selectedSlot.value = { date, time }
  }
}

// 处理参会人员变更
const handleParticipantsChange = () => {
  selectedSlot.value = null
  if (formData.participants.length > 0) {
    fetchAvailableTimeSlots()
  }
}

// 上一周
const prevWeek = () => {
  const date = new Date(currentWeekStart.value)
  date.setDate(date.getDate() - 7)
  currentWeekStart.value = date
  fetchAvailableTimeSlots()
}

// 下一周
const nextWeek = () => {
  const date = new Date(currentWeekStart.value)
  date.setDate(date.getDate() + 7)
  currentWeekStart.value = date
  fetchAvailableTimeSlots()
}

// 处理发布按钮点击
const handlePublish = () => {
  meetingForm.title = ''
  meetingForm.description = ''
  dialogVisible.value = true
}

// 确认发布会议
const confirmPublish = async () => {
  if (!meetingForm.title.trim()) {
    ElMessage.warning('请输入会议主题')
    return
  }

  try {
    const response = await request.post('/meeting/schedule', {
      title: meetingForm.title,
      description: meetingForm.description,
      date: selectedSlot.value.date,
      time: selectedSlot.value.time,
      participants: formData.participants
    })
    
    if (response.data.code === '200') {
      ElMessage.success('会议发布成功')
      dialogVisible.value = false
      // 重置数据
      selectedSlot.value = null
      meetingForm.title = ''
      meetingForm.description = ''
    }
  } catch (error) {
    console.error('发布会议失败:', error)
    ElMessage.error('发布会议失败')
  }
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 获取部门下的用户数量
const getDeptUserCount = (deptId) => {
  return userOptions.value.filter(user => user.departmentId === deptId).length
}

// 处理部门点击
const handleDeptClick = (dept) => {
  selectedDept.value = dept.id
}

// 过滤后的用户列表
const filteredUsers = computed(() => {
  let users = userOptions.value
  
  // 按部门筛选
  if (selectedDept.value) {
    users = users.filter(user => user.departmentId === selectedDept.value)
  }
  
  // 按关键字搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    users = users.filter(user => 
      user.label.toLowerCase().includes(keyword) ||
      user.department.toLowerCase().includes(keyword)
    )
  }
  
  return users
})

// 检查用户是否被选中
const isUserSelected = (userId) => {
  return tempSelectedUsers.value.includes(userId)
}

// 切换用户选中状态
const toggleUser = (user) => {
  const index = tempSelectedUsers.value.indexOf(user.value)
  if (index === -1) {
    tempSelectedUsers.value.push(user.value)
  } else {
    tempSelectedUsers.value.splice(index, 1)
  }
}

// 显示参会人员选择弹窗
const showParticipantDialog = () => {
  tempSelectedUsers.value = [...formData.participants]
  // 默认展开所有分组
  activeGroups.value = departments.value.map(dept => dept.id)
  participantDialogVisible.value = true
}

// 确认参会人员选择
const confirmParticipants = () => {
  formData.participants = [...tempSelectedUsers.value]
  participantDialogVisible.value = false
  handleParticipantsChange()
}

// 组件挂载时获取数据
onMounted(() => {
  getUserList() // 只需要调用一次，就能同时获取部门和用户数据
  
  // 设置当前周的开始日期为本周日
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day
  currentWeekStart.value = new Date(today.setDate(diff))
})

// 添加新的方法
const getUsersByGroup = (groupId) => {
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    return userOptions.value.filter(user => 
      user.departmentId === groupId && 
      (user.label.toLowerCase().includes(keyword) || user.department.toLowerCase().includes(keyword))
    )
  }
  return userOptions.value.filter(user => user.departmentId === groupId)
}

const getUserLabel = (userId) => {
  const user = userOptions.value.find(u => u.value === userId)
  return user ? user.label : ''
}

const getUserDept = (userId) => {
  const user = userOptions.value.find(u => u.value === userId)
  return user ? user.department : ''
}

const handleUserSelect = (user) => {
  // 可以在这里添加选择用户时的额外逻辑
}

const removeUser = (userId) => {
  const index = tempSelectedUsers.value.indexOf(userId)
  if (index > -1) {
    tempSelectedUsers.value.splice(index, 1)
  }
}
</script>

<style scoped>
.page-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 60px);
}

.schedule-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
}

.form-section {
  max-width: 600px;
  margin-bottom: 30px;
}

.calendar-view {
  margin-top: 20px;
}

.calendar-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.week-range {
  font-size: 16px;
  font-weight: 500;
}

.calendar-grid {
  display: flex;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.time-column {
  width: 100px;
  flex-shrink: 0;
  border-right: 1px solid #dcdfe6;
}

.day-column {
  flex: 1;
  min-width: 120px;
  border-right: 1px solid #dcdfe6;
}

.day-column:last-child {
  border-right: none;
}

.time-header,
.day-header {
  height: 60px;
  padding: 8px;
  text-align: center;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  font-weight: 500;
}

.time-slot {
  height: 60px;
  padding: 8px;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-cell {
  height: 60px;
  padding: 8px;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

.time-cell.available {
  background-color: #f0f9eb;
  cursor: pointer;
}

.time-cell.available:hover {
  background-color: #e1f3d8;
}

.time-cell.selected {
  background-color: #409eff;
  color: white;
}

.available-count {
  font-size: 12px;
}

.selected-time {
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.selected-participants {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.el-form-item) {
  margin-bottom: 22px;
}

:deep(.el-select) {
  width: 100%;
}

.participants-input {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 4px 12px;
  min-height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.participants-input:hover {
  border-color: #409eff;
}

.placeholder {
  color: #909399;
}

.selected-avatars {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.user-avatar {
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-count {
  margin-left: 8px;
  color: #606266;
  font-size: 14px;
}

.participant-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.dialog-content {
  display: flex;
  height: 500px;
  gap: 24px;
  padding: 20px;
}

.group-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* 防止flex子项溢出 */
}

.search-box {
  margin-bottom: 16px;
  padding: 0 4px;
}

.groups-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 4px;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.group-count {
  color: #909399;
  font-size: 12px;
}

:deep(.el-collapse-item__header) {
  font-size: 15px;
  font-weight: 500;
  padding: 12px 16px;
  border-radius: 4px;
}

:deep(.el-collapse-item__header:hover) {
  background-color: #f5f7fa;
}

:deep(.el-collapse-item__content) {
  padding: 8px 16px;
}

.group-users {
  padding: 4px 0;
}

.user-item {
  padding: 8px 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  background-color: var(--el-color-primary);
  color: white;
}

.selected-panel {
  width: 280px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--el-border-color-lighter);
  padding-left: 24px;
}

.panel-header {
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.header-actions {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-count {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.selected-users {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.selected-user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.selected-user-item:last-child {
  border-bottom: none;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.user-dept {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.remove-button {
  padding: 4px 8px;
}

:deep(.el-checkbox) {
  width: 100%;
  margin-right: 0;
}

:deep(.el-checkbox__label) {
  flex: 1;
}

/* 自定义滚动条样式 */
.groups-container::-webkit-scrollbar,
.selected-users::-webkit-scrollbar {
  width: 6px;
}

.groups-container::-webkit-scrollbar-thumb,
.selected-users::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.groups-container::-webkit-scrollbar-track,
.selected-users::-webkit-scrollbar-track {
  background-color: #f5f7fa;
  border-radius: 3px;
}
</style> 