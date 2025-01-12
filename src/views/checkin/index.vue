<template>
  <!-- 添加一个外层容器来控制滚动 -->
  <div class="page-container">
    <div class="checkin-container">
      <!-- 顶部统计卡片 -->
      <el-row :gutter="20" class="stat-row">
        <el-col :span="8">
          <el-card shadow="never" class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ formatDuration(todayHours) }}小时</div>
              <div class="stat-label">今日工作时长</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never" class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ formatDuration(weekHours) }}小时</div>
              <div class="stat-label">本周工作时长</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never" class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ formatDuration(monthHours) }}小时</div>
              <div class="stat-label">本月工作时长</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 搜索区域 -->
      <el-card shadow="never" class="search-card">
        <div class="search-form">
          <div class="form-item">
            <span class="label">名字</span>
            <el-input v-model="searchForm.userName" placeholder="请输入名字" clearable />
          </div>
          <div class="form-item">
            <span class="label">组名</span>
            <el-input v-model="searchForm.groupName" placeholder="请输入组名" clearable />
          </div>
          <div class="form-item">
            <span class="label">日期</span>
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              format="YYYY-MM-DD"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :locale="zhCn"
              :popper-class="'custom-date-picker'"
              class="date-picker"
            />
          </div>
          <div class="form-buttons">
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button type="primary" @click="handleExport">导出</el-button>
          </div>
        </div>
      </el-card>

      <!-- 表格区域 -->
      <el-card shadow="never" class="table-card">
        <el-table 
          v-loading="loading" 
          :data="tableData" 
          style="width: 100%" 
          border
        >
          <el-table-column 
            type="index" 
            label="序号" 
            width="80" 
            align="center"
            :index="indexMethod"
          />
          <el-table-column prop="name" label="姓名" min-width="120" />
          <el-table-column prop="groupName" label="小组" min-width="120" />
          <el-table-column prop="reportDate" label="日期" min-width="120" align="center" />
          <el-table-column 
            prop="signDuration" 
            label="签到时长(h)" 
            min-width="120" 
            align="right"
          >
            <template #default="{ row }">
              {{ formatDuration(row.signDuration) }}h
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
          <span>共 {{ total }} 条</span>
          <el-select v-model="pageSize" class="page-size-select" @change="handleSizeChange">
            <el-option label="10条/页" :value="10" />
            <el-option label="20条/页" :value="20" />
            <el-option label="30条/页" :value="30" />
            <el-option label="50条/页" :value="50" />
            <el-option label="100条/页" :value="100" />
          </el-select>
          <el-pagination
            v-model:current-page="currentPage"
            :total="total"
            :page-size="Number(pageSize)"
            layout="prev, pager, next"
            @current-change="handleCurrentChange"
          />
          <span>前往</span>
          <el-input
            v-model="jumpPage"
            class="jump-page-input"
            @keyup.enter="handleJumpPage"
          />
          <span>页</span>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const userStore = useUserStore()

// 搜索表单数据
const searchForm = reactive({
  userName: '',
  groupName: '',
  dateRange: []
})

// 表格数据
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 添加统计数据
const todayHours = ref(0)
const weekHours = ref(0)
const monthHours = ref(0)

// 添加跳转页码
const jumpPage = ref('')

// 定义缺失的属性
const showCompleted = ref(false)
const showAddTask = ref(false)

// 获取统计数据
const getStatistics = async () => {
  try {
    // 添加调试日志
    console.log('Store state:', userStore.$state)
    console.log('Store account:', userStore.account)
    console.log('Store getAccount:', userStore.getAccount)
    console.log('LocalStorage account:', localStorage.getItem('account'))

    const account = userStore.getAccount
    if (!account) {
      throw new Error('未获取到用户账号')
    }

    const response = await request.post('/signDuration/queryTodayWeekMonth', {
      account: account
    })

    if (response.data.code === '200') {
      const { signDurationToday, signDurationWeek, signDurationMonth } = response.data.data
      todayHours.value = signDurationToday
      weekHours.value = signDurationWeek
      monthHours.value = signDurationMonth
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败：' + error.message)
  }
}

// 在组件挂载时获取统计数据
onMounted(() => {
  const savedPageSize = localStorage.getItem('checkinPageSize')
  if (savedPageSize) {
    pageSize.value = parseInt(savedPageSize)
  }
  getStatistics()
  handleSearch()
})

// 查询方法
const handleSearch = async () => {
  console.log('开始查询...')
  try {
    const params = {
      userName: searchForm.userName,
      groupName: searchForm.groupName,
      size: parseInt(pageSize.value),
      page: currentPage.value
    }

    console.log('发送请求前的参数:', params)

    const response = await request.post('/signDuration/querySignDurationByPage', params)
    console.log('原始响应:', response)

    // 检查响应状态
    if (!response || !response.data) {
      throw new Error('响应数据为空')
    }

    // 检查响应数据结构
    if (!response.data.data || !Array.isArray(response.data.data.list)) {
      throw new Error('响应数据格式不正确')
    }

    const { list, dataCount, page, size } = response.data.data
    console.log('解析的数据:', { list, dataCount, page, size })

    // 更新表格数据
    tableData.value = [...list] // 使用展开运算符创建新数组
    console.log('更新后的表格数据:', tableData.value)

    // 更新分页信息
    total.value = parseInt(dataCount)
    currentPage.value = parseInt(page)
    pageSize.value = parseInt(size)

  } catch (error) {
    console.error('查询失败:', error)
    ElMessage.error(`查询失败: ${error.message}`)
  }
}

// 导出方法
const handleExport = async () => {
  try {
    const [startDate, endDate] = searchForm.dateRange || []
    const params = {
      userName: searchForm.userName,
      groupName: searchForm.groupName,
      startDate: startDate,
      endDate: endDate
    }
    
    // 创建一个隐藏的 a 标签用于下载
    const link = document.createElement('a')
    link.style.display = 'none'
    link.href = `http://127.0.0.1:8880/signDuration/download?${new URLSearchParams(params)}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 分页方法
const handleSizeChange = (val) => {
  pageSize.value = val
  localStorage.setItem('checkinPageSize', val) // 保存到本地存储
  currentPage.value = 1 // 重置为第一页
  handleSearch() // 重新查询数据
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  handleSearch()
}

// 修改时长格式化方法
const formatDuration = (hours) => {
  if (hours === null || hours === undefined) return '0.0'
  return Number(hours).toFixed(1)
}

// 处理页码跳转
const handleJumpPage = () => {
  const page = parseInt(jumpPage.value)
  if (page && page > 0 && page <= Math.ceil(total.value / pageSize.value)) {
    currentPage.value = page
    handleSearch()
  }
  jumpPage.value = ''
}

// 添加序号计算方法
const indexMethod = (index) => {
  return (currentPage.value - 1) * parseInt(pageSize.value) + index + 1
}
</script>

<style scoped>
/* 添加页面容器样式 */
.page-container {
  height: 100vh;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
  background-color: #f0f2f5;
}

/* 修改现有容器样式 */
.checkin-container {
  min-width: 850px; /* 设置最小宽度，防止内容挤压 */
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: fit-content;
}

.label {
  white-space: nowrap;
  color: var(--el-text-color-regular);
}

.date-picker {
  width: 360px;
}

.form-buttons {
  display: flex;
  gap: 12px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}

.page-size-select {
  width: 110px;
}

.jump-page-input {
  width: 50px;
  :deep(.el-input__inner) {
    padding: 0 8px;
    text-align: center;
  }
}

:deep(.el-pagination) {
  margin: 0;
  padding: 0;
  justify-content: center;
  padding: 15px 0;
}

:deep(.el-pagination .el-pager) {
  margin: 0 8px;
}

:deep(.el-select .el-input__inner) {
  padding-right: 25px;
}

:deep(.el-card) {
  border-radius: 4px;
}

:deep(.el-input) {
  width: 200px;
}

/* 添加统计卡片样式 */
.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 100%;
}

.stat-content {
  text-align: center;
  padding: 20px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-color-primary);
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

:deep(.el-date-editor .el-range-separator) {
  padding: 0 8px;
}

:deep(.el-date-editor .el-range__icon) {
  margin: 0 4px;
}

:deep(.el-date-editor .el-range-input) {
  width: 40%;
}

/* 自定义日期选择器样式 */
:deep(.custom-date-picker) {
  .el-date-picker__header-label {
    font-size: 16px;
    font-weight: 500;
  }

  .el-picker-panel__content {
    margin: 0;
    padding: 8px;
  }

  .el-date-table th {
    color: var(--el-text-color-regular);
    font-weight: 400;
  }

  .el-date-table td.current:not(.disabled) .el-date-table-cell__text {
    background-color: var(--el-color-primary);
    color: white;
    border-radius: 4px;
  }

  .el-picker-panel__sidebar {
    display: none;
  }

  .el-picker-panel__body {
    margin-left: 0 !important;
  }
}

/* 修改表格样式 */
:deep(.el-table) {
  margin-top: 10px;
  overflow-x: auto;
}

:deep(.el-table th) {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-weight: 500;
}

:deep(.el-table td) {
  padding: 8px 0;
}

/* 调整表格内容的对齐方式 */
:deep(.el-table .cell) {
  padding: 0 12px;
}

/* 优化滚动条样式 */
.page-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.page-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.page-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}
</style> 