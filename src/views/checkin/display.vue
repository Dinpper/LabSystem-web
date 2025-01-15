<template>
  <div class="display-container">
    <el-card class="display-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">签到时长统计</span>
          <div class="header-actions">
            <el-button type="primary" @click="showMemberSelector">
              <el-icon><plus /></el-icon>选择人员
            </el-button>
          </div>
        </div>
      </template>
      <!-- 人员选择区域 -->
      <div class="selected-area" v-if="selectedMembers.length > 0">
        <div class="area-title">已选择人员：</div>
        <div class="selected-members">
          <el-tag
            v-for="name in selectedMembers"
            :key="name"
            closable
            type="info"
            effect="plain"
            @close="removeMember(name)"
          >
            {{ name }}
          </el-tag>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="chart-container" ref="chartRef"></div>

      <!-- 人员选择弹窗 -->
      <el-dialog
        v-model="participantDialogVisible"
        title="选择人员"
        width="800px"
        class="participant-dialog"
      >
        <div class="dialog-content">
          <div class="left-panel">
            <div class="search-box">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索人员"
                :prefix-icon="Search"
                clearable
              />
            </div>
            
            <div class="group-list">
              <div
                v-for="group in filteredGroups"
                :key="group.groupName"
                class="group-section"
              >
                <div 
                  class="group-header"
                  @click="toggleGroup(group.groupName)"
                >
                  <div class="group-left">
                    <el-checkbox
                      :model-value="isGroupSelected(group.userList)"
                      :indeterminate="isGroupIndeterminate(group.userList)"
                      @change="(val) => handleGroupSelect(val, group.userList)"
                      @click.stop
                    />
                    {{ group.groupName }}
                  </div>
                  <div class="group-right">
                    <span class="member-count">{{ group.userList.length }}人</span>
                    <el-icon 
                      class="expand-icon"
                      :class="{ 'is-active': activeGroups.includes(group.groupName) }"
                    >
                      <arrow-right />
                    </el-icon>
                  </div>
                </div>
                <div 
                  class="member-list"
                  v-show="activeGroups.includes(group.groupName)"
                >
                  <div
                    v-for="userName in group.userList"
                    :key="userName"
                    class="member-item"
                  >
                    <el-checkbox
                      :model-value="selectedMembers.includes(userName)"
                      @change="(val) => handleCheckboxChange(val, userName)"
                    >
                      <div class="member-info">
                        <span class="avatar">{{ userName[0] }}</span>
                        <span class="name">{{ userName }}</span>
                      </div>
                    </el-checkbox>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 右侧已选人员 -->
          <div class="right-panel">
            <div class="right-header">
              <div>已选择人员</div>
              <div>{{ selectedMembers.length }}人</div>
              <el-button link type="primary" @click="clearSelected">清空</el-button>
            </div>
            <div class="selected-list">
              <div v-if="selectedMembers.length === 0" class="no-data">
                <el-empty
                  description="未选择任何人员"
                />
              </div>
              <template v-else>
                <div
                  v-for="name in selectedMembers"
                  :key="name"
                  class="selected-item"
                >
                  <div class="user-info">
                    <span class="avatar">{{ name[0] }}</span>
                    <span class="name">{{ name }}</span>
                    <span class="group-name">{{ getGroupName(name) }}</span>
                  </div>
                  <el-button
                    type="danger"
                    link
                    @click="removeMember(name)"
                  >
                    移除
                  </el-button>
                </div>
              </template>
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
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, ArrowRight, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import * as echarts from 'echarts'

// 人员选择相关
const participantDialogVisible = ref(false)
const selectedMembers = ref([])
const groups = ref([])
const searchKeyword = ref('')
const activeGroups = ref([])  // 控制展开的小组

// 根据搜索文本过滤小组和成员
const filteredGroups = computed(() => {
  if (!searchKeyword.value) return groups.value
  
  return groups.value.map(group => ({
    ...group,
    userList: group.userList.filter(userName => 
      userName.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  })).filter(group => group.userList.length > 0)
})

// 切换成员选择状态
const toggleMember = (userName) => {
  const index = selectedMembers.value.indexOf(userName)
  if (index === -1) {
    selectedMembers.value.push(userName)
  } else {
    selectedMembers.value.splice(index, 1)
  }
}

// 图表相关
const chartRef = ref(null)
let chart = null

// 获取所有成员列表
const getAllMembers = async () => {
  try {
    const response = await request.post('/user/queryGroupUserAll')
    if (response.data.code === '200') {
      groups.value = response.data.data
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  }
}

// 显示人员选择对话框
const showMemberSelector = () => {
  participantDialogVisible.value = true
}

// 移除已选成员
const removeMember = (name) => {
  selectedMembers.value = selectedMembers.value.filter(item => item !== name)
  updateChart()
}

// 确认选择
const confirmParticipants = () => {
  participantDialogVisible.value = false
  updateChart()
}

// 获取签到数据并更新图表
const updateChart = async () => {
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }

  if (selectedMembers.value.length === 0) {
    // 显示空状态的图表
    chart.setOption({
      title: {
        text: '本周签到时长统计',
        left: 'center'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: [],
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        name: '时长(小时)',
        axisLabel: {
          formatter: '{value} h'
        }
      },
      graphic: {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
          text: '请选择要查看的人员',
          fontSize: 14,
          fill: '#909399'
        }
      }
    })
    return
  }

  try {
    const response = await request.post('/signDuration/queryWeek', {
      list: selectedMembers.value
    })

    if (response.data.code === '200') {
      const data = response.data.data
      renderChart(data)
    }
  } catch (error) {
    console.error('获取签到数据失败:', error)
    ElMessage.error('获取签到数据失败')
  }
}

// 渲染图表
const renderChart = (data) => {
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }

  const xAxisData = data[0].weekList.map(item => item.reportDate)
  const series = data.map(user => ({
    name: user.userName,
    type: 'line',
    data: user.weekList.map(item => item.signDuration),
    smooth: true,
    symbol: 'circle',
    symbolSize: 8,
    label: {
      show: true,
      formatter: '{c} h'
    }
  }))

  const option = {
    title: {
      text: '本周签到时长统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach(item => {
          result += `${item.seriesName}: ${item.value} 小时<br/>`
        })
        return result
      }
    },
    legend: {
      data: data.map(user => user.userName),
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: '时长(小时)',
      axisLabel: {
        formatter: '{value} h'
      }
    },
    series
  }

  chart.setOption(option)
}

// 组件挂载时初始化
onMounted(() => {
  getAllMembers()
  // 初始化空图表
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
  // 显示空状态的图表
  chart.setOption({
    title: {
      text: '本周签到时长统计',
      left: 'center'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: '时长(小时)',
      axisLabel: {
        formatter: '{value} h'
      }
    },
    graphic: {
      type: 'text',
      left: 'center',
      top: 'middle',
      style: {
        text: '请选择要查看的人员',
        fontSize: 14,
        fill: '#909399'
      }
    }
  })
})

// 组件卸载时清理图表实例
onUnmounted(() => {
  if (chart) {
    chart.dispose()
    chart = null
  }
})

// 监听窗口大小变化，调整图表大小
window.addEventListener('resize', () => {
  if (chart) {
    chart.resize()
  }
})

// 清空选择
const clearSelected = () => {
  selectedMembers.value = []
}

// 处理复选框变化
const handleCheckboxChange = (checked, userName) => {
  if (checked) {
    if (!selectedMembers.value.includes(userName)) {
      selectedMembers.value.push(userName)
    }
  } else {
    const index = selectedMembers.value.indexOf(userName)
    if (index > -1) {
      selectedMembers.value.splice(index, 1)
    }
  }
}

// 获取用户所属组名
const getGroupName = (userName) => {
  const group = groups.value.find(g => g.userList.includes(userName))
  return group ? group.groupName : ''
}

// 切换小组展开/收起
const toggleGroup = (groupName) => {
  const index = activeGroups.value.indexOf(groupName)
  if (index === -1) {
    activeGroups.value.push(groupName)
  } else {
    activeGroups.value.splice(index, 1)
  }
}

// 检查小组是否全部选中
const isGroupSelected = (userList) => {
  return userList.every(user => selectedMembers.value.includes(user))
}

// 检查小组是否部分选中
const isGroupIndeterminate = (userList) => {
  const selectedCount = userList.filter(user => selectedMembers.value.includes(user)).length
  return selectedCount > 0 && selectedCount < userList.length
}

// 处理小组全选/取消全选
const handleGroupSelect = (checked, userList) => {
  if (checked) {
    // 添加未选中的用户
    userList.forEach(user => {
      if (!selectedMembers.value.includes(user)) {
        selectedMembers.value.push(user)
      }
    })
  } else {
    // 移除所有该组用户
    selectedMembers.value = selectedMembers.value.filter(user => !userList.includes(user))
  }
}
</script>

<style scoped>
.display-container {
  padding: 20px;
}

.display-card {
  min-height: calc(100vh - 100px);
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #1f2f3d;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.selected-area {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.area-title {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.selected-members {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.chart-container {
  height: calc(100vh - 300px);
  min-height: 400px;
  margin-top: 20px;
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.dialog-content {
  display: flex;
  height: 500px;
  padding: 0;
}

.left-panel {
  width: 60%;
  border-right: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
}

.right-panel {
  width: 40%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-box {
  margin-bottom: 20px;
}

.group-list {
  flex: 1;
  overflow-y: scroll;
  height: calc(100% - 60px);
  padding: 0 10px;
}

.group-section {
  border-radius: 4px;
  margin-bottom: 8px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s;
}

.group-header:hover {
  background-color: #f5f7fa;
}

.group-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-checkbox__input) {
  vertical-align: middle;
}

:deep(.el-checkbox__label) {
  padding-left: 4px;
}

.group-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-count {
  font-size: 12px;
  color: #909399;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-top: none;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
}

.member-item:hover {
  background-color: #f5f7fa;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 24px;
  height: 24px;
  background-color: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.right-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}

.right-header > :nth-child(2) {
  margin-right: auto;
}

.selected-list {
  flex: 1;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 10px;
  overflow-y: scroll;
  height: calc(100% - 50px);
}

.selected-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-bottom: 1px solid #ebeef5;
}

.selected-item:last-child {
  border-bottom: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-name {
  color: #909399;
  font-size: 12px;
}

.no-data {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-dialog__body) {
  padding: 0;
}

:deep(.el-checkbox__label) {
  display: flex;
  align-items: center;
}

.group-list::-webkit-scrollbar,
.selected-list::-webkit-scrollbar {
  width: 6px;
}

.group-list::-webkit-scrollbar-thumb,
.selected-list::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.group-list::-webkit-scrollbar-track,
.selected-list::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}

.expand-icon {
  transition: transform 0.3s;
}

.expand-icon.is-active {
  transform: rotate(90deg);
}
</style> 