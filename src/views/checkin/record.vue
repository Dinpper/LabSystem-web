<template>
  <div class="record-container">
    <el-card class="record-card">
      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="姓名">
            <el-input v-model="searchForm.userName" placeholder="请输入姓名" clearable />
          </el-form-item>
          <el-form-item label="小组">
            <el-select v-model="searchForm.groupName" placeholder="请选择小组" clearable>
              <el-option
                v-for="group in groupOptions"
                :key="group"
                :label="group"
                :value="group"
              />
            </el-select>
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
          <el-table-column prop="userName" label="姓名" min-width="120" />
          <el-table-column prop="groupName" label="小组" min-width="150" />
          <el-table-column prop="reportDate" label="日期" min-width="120" align="center" />
          <el-table-column prop="startDate" label="签到时间" min-width="180" align="center">
            <template #default="{ row }">
              {{ formatDate(row.startDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="endDate" label="签退时间" min-width="180" align="center">
            <template #default="{ row }">
              {{ formatDate(row.endDate) }}
            </template>
          </el-table-column>
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
import dayjs from 'dayjs'

// 搜索表单数据
const searchForm = reactive({
  userName: '',
  groupName: ''
})

// 表格数据
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const jumpPage = ref('')

// 小组选项
const groupOptions = ref([])

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 获取小组列表
const getGroups = async () => {
  try {
    const response = await request.post('/group/queryGroupsList')
    if (response.data.code === '200') {
      groupOptions.value = response.data.data
    }
  } catch (error) {
    console.error('获取小组列表失败:', error)
    ElMessage.error('获取小组列表失败')
  }
}

// 获取签到记录列表
const getRecordList = async () => {
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      userName: searchForm.userName,
      groupName: searchForm.groupName
    }
    const response = await request.post('/record/queryRecordByPage', params)
    if (response.data.code === '200') {
      tableData.value = response.data.data.list
      total.value = response.data.data.dataCount
      currentPage.value = response.data.data.page
      pageSize.value = response.data.data.size
    }
  } catch (error) {
    console.error('获取签到记录列表失败:', error)
    ElMessage.error('获取签到记录列表失败')
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  getRecordList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.userName = ''
  searchForm.groupName = ''
  handleSearch()
}

// 导出
const handleExport = async () => {
  try {
    const params = {
      userName: searchForm.userName,
      groupName: searchForm.groupName
    }
    
    const response = await fetch('/api/record/download', {
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
      : '签到记录.xlsx'
    
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
  getRecordList()
}

// 页码改变
const handleCurrentChange = (val) => {
  currentPage.value = val
  getRecordList()
}

// 处理页码跳转
const handleJumpPage = () => {
  const page = parseInt(jumpPage.value)
  if (page && page > 0 && page <= Math.ceil(total.value / pageSize.value)) {
    currentPage.value = page
    getRecordList()
  }
  jumpPage.value = ''
}

// 组件挂载时获取数据
onMounted(() => {
  getGroups()
  getRecordList()
})
</script>

<style scoped>
.record-container {
  padding: 20px;
}

.record-card {
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

/* 调整小组选择下拉框的宽度 */
:deep(.el-select) {
  width: 180px;
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
</style> 