<template>
  <div class="page-container">
    <div class="report-container">
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
            width="60" 
            align="center"
            :index="indexMethod"
          />
          <el-table-column prop="userName" label="姓名" min-width="100" />
          <el-table-column prop="groupName" label="小组" min-width="100" />
          <el-table-column prop="reportDate" label="日期" min-width="100" align="center" />
          <el-table-column prop="workContent" label="工作内容" min-width="200" show-overflow-tooltip />
          <el-table-column prop="problems" label="遇到问题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="plan" label="计划" min-width="200" show-overflow-tooltip />
          <el-table-column label="附件" min-width="200">
            <template #default="{ row }">
              <div v-if="row.achievement" class="file-list">
                <el-tag
                  v-for="file in row.achievement.split('; ').filter(Boolean)"
                  :key="file"
                  size="small"
                  type="info"
                  class="file-tag"
                >
                  <el-icon><Document /></el-icon>
                  <span class="file-name">{{ file }}</span>
                </el-tag>
              </div>
              <span v-else class="no-files">无附件</span>
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
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { Document } from '@element-plus/icons-vue'

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
const loading = ref(false)

// 跳转页码
const jumpPage = ref('')

// 查询方法
const handleSearch = async () => {
  loading.value = true
  try {
    const params = {
      userName: searchForm.userName,
      groupName: searchForm.groupName,
      size: parseInt(pageSize.value),
      page: currentPage.value
    }

    // 添加日期范围参数
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      const [startDate, endDate] = searchForm.dateRange
      params.startDate = startDate
      params.endDate = endDate
    }

    const response = await request.post('/report/queryReportByPage', params)

    if (response.data.code === '200') {
      const { reportList, dataCount, page, size } = response.data.data
      tableData.value = reportList
      total.value = parseInt(dataCount)
      currentPage.value = parseInt(page)
      pageSize.value = parseInt(size)
    }
  } catch (error) {
    console.error('查询失败:', error)
    ElMessage.error('查询失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 导出报告
const handleExport = async () => {
  try {
    // 准备请求参数
    const params = {
      userName: searchForm.userName || '',
      groupName: searchForm.groupName || ''
    }
    
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }

    // 发送请求获取文件
    const response = await fetch('/api/report/download', {
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
      : '报告统计.xlsx'

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

// 分页方法
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  handleSearch()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  handleSearch()
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

// 序号计算方法
const indexMethod = (index) => {
  return (currentPage.value - 1) * parseInt(pageSize.value) + index + 1
}

// 组件挂载时获取数据
onMounted(() => {
  handleSearch()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 60px);
}

.report-container {
  min-width: 850px;
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
}

:deep(.el-card) {
  border: none;
  box-shadow: 0 1px 4px rgba(0,21,41,0.08) !important;
}

:deep(.el-table) {
  margin-top: 10px;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 500;
}

:deep(.el-input__inner) {
  background-color: #fafafa;
}

:deep(.el-input__inner:focus) {
  background-color: #fff;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  max-width: 200px;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-files {
  color: #909399;
  font-size: 13px;
}

:deep(.el-tag) {
  border-radius: 4px;
  background-color: #f4f4f5;
  border-color: #e9e9eb;
  color: #606266;
}

:deep(.el-tag .el-icon) {
  font-size: 14px;
}
</style> 