<template>
  <div class="achievement-container">
    <el-card class="achievement-card">
      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="奖项名称">
            <el-input v-model="searchForm.name" placeholder="请输入奖项名称" clearable />
          </el-form-item>
          <el-form-item label="获奖日期">
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
          <el-table-column prop="name" label="奖项名称" min-width="150" />
          <el-table-column prop="level" label="奖项级别" width="120" align="center" />
          <el-table-column prop="date" label="获奖日期" width="120" align="center" />
          <el-table-column prop="winner" label="获奖人" width="120" align="center" />
          <el-table-column prop="organization" label="颁奖单位" width="150" align="center" />
          <el-table-column prop="description" label="获奖说明" min-width="200" show-overflow-tooltip />
        </el-table>
      </div>

      <!-- 分页部分与study.vue相同 -->
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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const searchForm = ref({
  name: '',
  date: ''
})

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const jumpPage = ref('')

// 获取学习收获列表
const getStudyList = async () => {
  try {
    // 这里替换为实际的API调用
    const response = await request.post('/achievement/study/list', {
      page: currentPage.value,
      size: pageSize.value,
      name: searchForm.value.name,
      date: searchForm.value.date
    })

    if (response.data.code === '200') {
      tableData.value = response.data.data.list
      total.value = response.data.data.total
    }
  } catch (error) {
    console.error('获取学习收获列表失败:', error)
    ElMessage.error('获取列表失败')
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  getStudyList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    name: '',
    date: ''
  }
  currentPage.value = 1
  getStudyList()
}

// 导出
const handleExport = () => {
  ElMessage.success('导出成功')
}

// 处理每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  getStudyList()
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  getStudyList()
}

// 跳转页面
const handleJumpPage = () => {
  const page = parseInt(jumpPage.value)
  if (page && page > 0 && page <= Math.ceil(total.value / pageSize.value)) {
    currentPage.value = page
    getStudyList()
  }
  jumpPage.value = ''
}
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
</style> 