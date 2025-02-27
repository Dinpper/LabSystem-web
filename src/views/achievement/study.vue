<template>
  <div class="achievement-container">
    <el-card class="achievement-card">
      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="用户名称">
            <el-input v-model="searchForm.userName" placeholder="请输入用户名称" clearable />
          </el-form-item>
          <el-form-item label="提交日期">
            <el-date-picker
              v-model="searchForm.reportDate"
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
          <el-table-column prop="fileName" label="成果名称" min-width="150" />
          <el-table-column prop="userName" label="用户名称" width="120" align="center" />
          <el-table-column prop="reportDate" label="提交日期" width="120" align="center">
            <template #default="{ row }">
              {{ formatDate(row.reportDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="filePath" label="文件路径" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                :icon="Download"
                @click="handleDownload(row)"
              >
                下载
              </el-button>
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import request from '@/utils/request'

const searchForm = ref({
  userName: '',
  reportDate: ''
})

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const jumpPage = ref('')

// 获取学习收获列表
const getHarvestList = async () => {
  try {
    const response = await request.post('/Harvest/queryHarvestByPage', {
      page: currentPage.value,
      size: pageSize.value,
      userName: searchForm.value.userName,
      reportDate: searchForm.value.reportDate
    })

    if (response.data.code === '200') {
      tableData.value = response.data.data.HarvestList
      total.value = response.data.data.dataCount
    }
  } catch (error) {
    console.error('获取学习收获列表失败:', error)
    ElMessage.error('获取列表失败')
    tableData.value = []
    total.value = 0
  }
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  getHarvestList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    userName: '',
    reportDate: ''
  }
  currentPage.value = 1
  getHarvestList()
}

// 导出
const handleExport = () => {
  ElMessage.success('导出成功')
}

// 处理每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  getHarvestList()
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  getHarvestList()
}

// 跳转页面
const handleJumpPage = () => {
  const page = parseInt(jumpPage.value)
  if (page && page > 0 && page <= Math.ceil(total.value / pageSize.value)) {
    currentPage.value = page
    getHarvestList()
  }
  jumpPage.value = ''
}

// 处理文件下载
const handleDownload = async (row) => {
  try {
    // 创建一个临时的 form 表单
    const form = document.createElement('form')
    form.style.display = 'none'
    form.method = 'post'
    form.action = 'http://localhost:8880/Harvest/downloadHarvest'  // 使用完整的后端 URL
    form.target = '_blank'  // 防止页面跳转
    
    // 创建 harvestId 输入字段
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'harvestId'
    input.value = row.harvestId
    
    // 将输入字段添加到表单中
    form.appendChild(input)
    
    // 将表单添加到文档中并提交
    document.body.appendChild(form)
    form.submit()
    
    // 清理表单
    setTimeout(() => {
      document.body.removeChild(form)
    }, 100)
    
    ElMessage.success('开始下载')

  } catch (error) {
    console.error('文件下载失败:', error)
    ElMessage.error('下载失败，请重试')
  }
}

onMounted(() => {
  getHarvestList()
})
</script>

<style scoped>
.achievement-container {
  padding: 20px;
}

.search-area {
  margin-bottom: 20px;
}

.table-container {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.page-size-select {
  width: 120px;
}

.jump-page-input {
  width: 50px;
}

:deep(.el-input__inner) {
  padding: 0 8px;
  text-align: center;
}

/* 下载按钮样式 */
:deep(.el-button--link) {
  padding: 4px 8px;
  height: auto;
}

:deep(.el-button--link:hover) {
  opacity: 0.8;
}
</style> 