<template>
  <div class="meeting-container">
    <el-card class="meeting-card">
      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="会议名称">
            <el-input v-model="searchForm.meetingName" placeholder="请输入会议名称" clearable />
          </el-form-item>
          <el-form-item label="日期">
            <el-date-picker
              v-model="searchForm.date"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
            <el-button type="success" @click="handleExport">导出</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 表格区域 -->
      <div class="table-container">
        <el-table 
          :data="tableData" 
          border 
          style="width: 100%"
          max-height="calc(100vh - 280px)"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="meetingName" label="会议名称" min-width="150" />
          <el-table-column prop="organizerName" label="发起人" width="120" align="center" />
          <el-table-column prop="reportDate" label="日期" width="120" align="center" />
          <el-table-column label="会议时间" width="200" align="center">
            <template #default="{ row }">
              {{ row.startTime }} - {{ row.endTime }}
            </template>
          </el-table-column>
          <el-table-column prop="location" label="地点" width="120" align="center" />
          <el-table-column prop="membersName" label="参会人员" min-width="200" show-overflow-tooltip />
          <el-table-column prop="description" label="会议内容" min-width="200" show-overflow-tooltip />
        </el-table>
      </div>

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
          :page-size="Number(pageSize)"
          layout="prev, pager, next"
          :total="total"
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
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

// 搜索表单数据
const searchForm = reactive({
  meetingName: '',
  date: ''
})

// 表格数据
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const jumpPage = ref('')

// 获取会议记录列表
const getMeetingList = async () => {
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      meetingName: searchForm.meetingName,
      reportDate: searchForm.date
    }
    const response = await request.post('/meeting/queryMeetingByPage', params)
    if (response.data.code === '200') {
      tableData.value = response.data.data.MeetingsList
      total.value = response.data.data.dataCount
      currentPage.value = response.data.data.page
      pageSize.value = response.data.data.size
    }
  } catch (error) {
    console.error('获取会议记录失败:', error)
    ElMessage.error('获取会议记录失败')
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  getMeetingList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.meetingName = ''
  searchForm.date = ''
  handleSearch()
}

// 导出
const handleExport = async () => {
  try {
    const params = {
      meetingName: searchForm.meetingName,
      reportDate: searchForm.date
    }
    
    const response = await fetch('/api/meeting/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    // 获取文件名
    const contentDisposition = response.headers.get('content-disposition')
    const fileName = contentDisposition
      ? decodeURIComponent(contentDisposition.split("''")[1])
      : '会议记录.xlsx'
    
    // 获取二进制数据
    const blob = await response.blob()
    
    // 创建下载链接
    const url = window.URL.createObjectURL(
      new Blob([blob], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
    )
    
    // 创建一个临时链接并点击
    const link = document.createElement('a')
    link.style.display = 'none'
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    
    // 清理
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1  // 重置到第一页
  getMeetingList()
}

// 页码改变
const handleCurrentChange = (val) => {
  currentPage.value = val
  getMeetingList()
}

// 处理页码跳转
const handleJumpPage = () => {
  const page = parseInt(jumpPage.value)
  if (page && page > 0 && page <= Math.ceil(total.value / pageSize.value)) {
    currentPage.value = page
    getMeetingList()
  }
  jumpPage.value = ''
}

// 组件挂载时获取数据
onMounted(() => {
  getMeetingList()
})
</script>

<style scoped>
.meeting-container {
  padding: 20px;
}

.meeting-card {
  min-height: calc(100vh - 100px);
}

.search-area {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.page-size-select {
  width: 110px;
}

.jump-page-input {
  width: 50px;
}

/* 表格容器样式 */
.table-container {
  margin: 0 -20px;
}

/* 调整表格滚动条样式 */
:deep(.el-table__body-wrapper::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
  border-radius: 4px;
  background-color: #dcdfe6;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
  background-color: #ffffff;
}

/* 日期选择器样式 */
:deep(.el-date-editor) {
  width: 180px;
}
</style> 