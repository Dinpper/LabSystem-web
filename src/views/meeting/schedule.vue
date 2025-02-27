<template>
  <div class="page-container">
    <el-card class="schedule-card">
      <div class="schedule-layout">
        <!-- 左侧发布会议表单 -->
        <div class="meeting-form-section">
          <h3 class="section-title">发布会议</h3>
          <el-form 
            ref="meetingFormRef"
            :model="meetingForm" 
            :rules="meetingRules"
            label-width="80px"
          >
            <el-form-item label="主题" required>
              <el-input v-model="meetingForm.title" placeholder="请输入会议主题"/>
            </el-form-item>
            
            <el-form-item label="地点" required>
              <el-input v-model="meetingForm.location" placeholder="请输入会议地点"/>
            </el-form-item>

            <el-form-item label="参会人员">
              <div class="participants-display" @click="showParticipantDialog">
                <template v-if="formData.participants.length === 0">
                  <el-button link type="primary">
                    <el-icon><Plus /></el-icon>
                    选择参会人员
                  </el-button>
                </template>
                <template v-else>
                  <div class="selected-participants">
                    <el-avatar-group :size="32" :max="3">
                      <el-avatar
                        v-for="user in selectedParticipants"
                        :key="user.value"
                      >
                        {{ user.label.substring(0, 1) }}
                      </el-avatar>
                    </el-avatar-group>
                    <span class="participant-count">
                      共 {{ formData.participants.length }} 人
                    </span>
                    <el-button link type="primary" class="edit-btn">
                      编辑
                    </el-button>
                  </div>
                </template>
              </div>
            </el-form-item>

            <el-form-item label="会议时间" required>
              <el-date-picker
                v-model="meetingForm.meetingTime"
                type="datetime"
                placeholder="请选择会议时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm"
                :disabled-date="disabledDate"
                :disabled-hours="disabledHours"
              />
            </el-form-item>

            <el-form-item label="会议内容" required>
              <el-input
                v-model="meetingForm.description"
                type="textarea"
                :rows="6"
                placeholder="请输入会议内容描述"
              />
            </el-form-item>

            <el-form-item>
              <el-button 
                type="primary" 
                @click="submitMeeting"
                :loading="loading"
              >
                发布会议
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 右侧课表 -->
        <div class="timetable-section">
          <h3 class="section-title">会议时间选择</h3>
          <div class="calendar-grid">
            <!-- 时间列 -->
            <div class="time-column">
              <div class="time-header">时间</div>
              <div class="time-slot" v-for="(time, index) in timeSlots" :key="time">
                {{ index + 1 }}
              </div>
            </div>
            
            <!-- 每天的时间格子 -->
            <div class="day-column" v-for="day in weekDays" :key="day.date">
              <div class="day-header">
                {{ day.dayOfWeek }}
              </div>
              <div
                v-for="(time, index) in timeSlots"
                :key="time"
                class="time-cell"
                :class="{
                  'available': isTimeSlotAvailable(day.date, time),
                  'selected': isTimeSlotSelected(day.date, time)
                }"
                @click.prevent="handleTimeSlotClick(day.date, time)"
              >
                <span v-if="getTimeSlotInfo(day.date, time)?.courses?.length > 0" class="course-info">
                  <div v-for="course in getTimeSlotInfo(day.date, time).courses" 
                       :key="course" 
                       class="course-item"
                  >
                    {{ course }}
                  </div>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Close, Plus, Timer } from '@element-plus/icons-vue'
import request from '@/utils/request'
import dayjs from 'dayjs'

// 表单数据
const formData = reactive({
  participants: []
})

// 会议表单
const meetingForm = reactive({
  title: '',
  location: '',
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

// 修改时间槽列表
const timeSlots = ref([
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12'
])

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

// 修改时间槽映射
const timeSlotMap = {
  1: 'courseFirst',
  2: 'courseSecond',
  3: 'courseThird',
  4: 'courseFourth',
  5: 'courseFifth',
  6: 'courseSixth',
  7: 'courseSeventh',
  8: 'courseEighth',
  9: 'courseNinth',
  10: 'courseTenth',
  11: 'courseEleventh',
  12: 'courseTwelfth'
}

// 获取星期几（1-5）
const getWeekDay = (dateStr) => {
  const date = new Date(dateStr)
  return date.getDay()
}

// 检查时间槽是否可用
const isTimeSlotAvailable = (date, time) => {
  const info = getTimeSlotInfo(date, time)
  return !info || info.courses.length === 0
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
    // 将选中的时间同步到 meetingForm
    const timeStr = `${time}:00`  // 假设每节课开始于整点
    meetingForm.meetingTime = `${date} ${timeStr}`
  }
}

// 处理参会人员变更
const handleParticipantsChange = async () => {
  selectedSlot.value = null
  if (formData.participants.length > 0) {
    // 获取选中用户的名字列表
    const userNames = formData.participants.map(userId => {
      const user = userOptions.value.find(u => u.value === userId)
      return user ? user.label : ''
    }).filter(name => name)

    try {
      // 获取课表数据
      const response = await request.post('/course/queryCourseByUserList', {
        list: userNames
      })
      
      if (response.data.code === '200') {
        const courseData = response.data.data
        if (!courseData || courseData.length === 0) {
          ElMessage.warning('所选人员暂无课程数据')
          return
        }
        // 初始化时间槽可用状态
        availableTimeData.value = weekDays.value.map(day => {
          const dayOfWeek = ['周一', '周二', '周三', '周四', '周五'].indexOf(day.dayOfWeek) + 1
          const dayCourses = courseData.filter(course => course.week === dayOfWeek)
          
          return {
            date: day.date,
            courses: dayCourses.reduce((acc, course) => {
              // 遍历每个时间段
              for (let i = 1; i <= 12; i++) {
                const courseKey = timeSlotMap[i]
                if (course[courseKey] && course[courseKey].trim() !== '') {
                  if (!acc[courseKey]) {
                    acc[courseKey] = []
                  }
                  acc[courseKey].push(course[courseKey])
                }
              }
              return acc
            }, {}),
            available: true
          }
        })
      }
    } catch (error) {
      console.error('获取课表失败:', error)
      ElMessage.error('获取课表失败')
    }
  } else {
    availableTimeData.value = []
  }
}

// 上一周
const prevWeek = () => {
  const date = new Date(currentWeekStart.value)
  date.setDate(date.getDate() - 7)
  currentWeekStart.value = date
}

// 下一周
const nextWeek = () => {
  const date = new Date(currentWeekStart.value)
  date.setDate(date.getDate() + 7)
  currentWeekStart.value = date
}

// 新的提交方法
const submitMeeting = async () => {
  if (!meetingFormRef.value) return
  
  await meetingFormRef.value.validate(async (valid) => {
    if (valid) {
      if (!meetingForm.meetingTime) {
        ElMessage.warning('请选择会议时间')
        return
      }
      
      if (formData.participants.length === 0) {
        ElMessage.warning('请选择参会人员')
        return
      }
      
      loading.value = true
      try {
        // 获取选中用户的名字列表
        const memberList = formData.participants.map(userId => {
          const user = userOptions.value.find(u => u.value === userId)
          return user ? user.label : ''
        }).filter(Boolean)

        // 格式化开始时间
        const startTime = meetingForm.meetingTime
          ? dayjs(meetingForm.meetingTime).format('YYYY-MM-DD HH:mm:ss')
          : ''

        const response = await request.post('/meeting/addMeeting', {
          meetingName: meetingForm.title,
          description: meetingForm.description,
          startTime: startTime,
          location: meetingForm.location,
          memberList: memberList,
          organizerAccount: localStorage.getItem('account')
        })
        
        if (response.data.code === '200') {
          ElMessage.success('会议发布成功')
          // 重置表单
          meetingForm.title = ''
          meetingForm.location = ''
          meetingForm.description = ''
          meetingForm.meetingTime = ''
          formData.participants = []
          selectedSlot.value = null
          meetingFormRef.value.resetFields()
        }
      } catch (error) {
        console.error('发布会议失败:', error)
        ElMessage.error('发布会议失败')
      } finally {
        loading.value = false
      }
    }
  })
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
  handleParticipantsChange() // 只在这里调用一次
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

// 新增的计算属性
const canPublish = computed(() => {
  return meetingForm.title && 
         meetingForm.location && 
         selectedSlot && 
         formData.participants.length > 0 &&
         meetingForm.description
})

// 新增的方法
const scrollToTimeTable = () => {
  // 实现滚动到时间表的逻辑
  const timeTable = document.querySelector('.timetable-section')
  if (timeTable) {
    timeTable.scrollIntoView({ behavior: 'smooth' })
  }
}

// 获取时间槽信息
const getTimeSlotInfo = (date, time) => {
  const daySchedule = availableTimeData.value.find(day => day.date === date)
  if (!daySchedule) return null
  
  const timeIndex = parseInt(time)
  const courseKey = timeSlotMap[timeIndex]
  
  return {
    courses: daySchedule.courses[courseKey] || []
  }
}

// 禁用的日期（可选）
const disabledDate = (date) => {
  return date.getTime() < Date.now() - 8.64e7 // 禁用过去的日期
}

// 禁用的小时（根据需要设置）
const disabledHours = () => {
  return [0, 1, 2, 3, 4, 5, 6, 7, 20, 21, 22, 23] // 禁用非工作时间
}

const meetingFormRef = ref(null)
const loading = ref(false)

// 表单验证规则
const meetingRules = {
  title: [{ required: true, message: '请输入会议主题', trigger: 'blur' }],
  location: [{ required: true, message: '请输入会议地点', trigger: 'blur' }],
  description: [{ required: true, message: '请输入会议说明', trigger: 'blur' }]
}

// 在日期选择器变更时同步到课表选中状态
watch(() => meetingForm.meetingTime, (newVal) => {
  if (newVal) {
    const [date, time] = newVal.split(' ')
    const hour = time.split(':')[0]
    selectedSlot.value = { date, time: hour }
  } else {
    selectedSlot.value = null
  }
})
</script>

<style scoped>
.page-container {
  padding: 8px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 60px);
  display: flex;
  justify-content: center;
}

.schedule-card {
  width: 1400px;
  margin: 0 auto;
  padding: 12px;
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
  display: none;
}

.calendar-grid {
  display: flex;
  width: fit-content;
  margin: 0 auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.time-column {
  width: 85px;
  flex-shrink: 0;
  border-right: 1px solid #dcdfe6;
  background-color: #f5f7fa;
}

.day-column {
  width: 85px;
  flex: none;
  border-right: 1px solid #dcdfe6;
}

.day-column:first-of-type {
  width: 85px;
}

.day-column:last-child {
  border-right: none;
}

.time-header,
.day-header {
  height: 36px;
  padding: 6px;
  text-align: center;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  background-color: #f5f7fa;
  font-weight: 500;
  color: #606266;
  border-bottom: 1px solid #dcdfe6;
}

.time-slot {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  color: #606266;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: #f5f7fa;
}

.time-cell {
  height: 50px;
  padding: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
  overflow-y: auto;
  background-color: #fff;
}

.course-info {
  font-size: 10px;
  color: #666;
  text-align: center;
  line-height: 1.2;
  width: 100%;
  padding: 2px;
}

.course-item {
  padding: 2px 4px;
  margin: 2px 0;
  background-color: #f5f7fa;
  border-radius: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  color: #606266;
}

.time-cell.available {
  background-color: #f0f9eb;
}

.time-cell.available:hover {
  background-color: #e1f3d8;
}

.time-cell.selected {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;
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
  margin-bottom: 24px;
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

.schedule-layout {
  display: flex;
  gap: 48px;
  justify-content: center;
}

.meeting-form-section {
  flex: none;
  width: 380px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.timetable-section {
  flex: none;
  width: 800px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  overflow-x: auto;
}

.section-title {
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.participants-display {
  padding: 8px;
  border: 1px dashed var(--el-border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.participants-display:hover {
  border-color: var(--el-color-primary);
}

.selected-participants {
  display: flex;
  align-items: center;
  gap: 12px;
}

.participant-count {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.selected-time-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
}

.calendar-grid {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}

.time-cell {
  height: 50px;
  padding: 4px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
  overflow-y: auto;
  text-overflow: ellipsis;
  text-align: center;
}

.time-cell.available {
  background-color: var(--el-color-success-light-9);
}

.time-cell.available:hover {
  background-color: var(--el-color-success-light-8);
}

.time-cell.selected {
  background-color: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
}

.course-info {
  font-size: 10px;
  color: #666;
  text-align: center;
  line-height: 1.2;
  width: 100%;
}

.course-info small {
  color: #999;
}

/* 自定义滚动条样式 */
.time-cell::-webkit-scrollbar {
  width: 4px;
}

.time-cell::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color-lighter);
  border-radius: 2px;
}

.time-cell::-webkit-scrollbar-track {
  background-color: transparent;
}

/* 添加悬停效果 */
.time-cell:hover {
  box-shadow: inset 0 0 0 1px var(--el-border-color);
}

/* 添加课程项目悬停效果 */
.course-item:hover {
  background-color: #ebeef5;
}
</style> 