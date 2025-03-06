<template>
  <div class="leave-record-container">
    <el-card class="record-card">
      <template #header>
        <div class="card-header">
          <span>请假记录</span>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="申请人">
            <el-input v-model="searchForm.userName" placeholder="请输入申请人" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.state" placeholder="全部" style="width: 120px">
              <el-option label="全部" value="" />
              <el-option label="待审核" value="0" />
              <el-option label="已批准" value="1" />
              <el-option label="已拒绝" value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 表格区域 -->
      <div class="table-container">
        <el-table 
          :data="tableData" 
          border 
          v-loading="loading"
          style="width: 100%"
        >
          <el-table-column type="index" label="序号" width="80" align="center" />
          <el-table-column prop="userName" label="申请人" min-width="100" align="center" />
          <el-table-column prop="reportDate" label="申请日期" min-width="120" align="center">
            <template #default="{ row }">
              {{ formatDate(row.reportDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="startDate" label="开始时间" min-width="160" align="center">
            <template #default="{ row }">
              {{ formatDateTime(row.startDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="endDate" label="结束时间" min-width="160" align="center">
            <template #default="{ row }">
              {{ formatDateTime(row.endDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="请假原因" min-width="200" show-overflow-tooltip />
          <el-table-column prop="allowedFlag" label="状态" min-width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.allowedFlag)">
                {{ getStatusText(row.allowedFlag) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="handlerName" label="处理人" min-width="120" align="center" />
          <el-table-column prop="remarks" label="拒绝理由" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.remarks || '--' }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <span>共 {{ total }} 条</span>
        <el-select v-model="pageSize" @change="handleSizeChange" class="page-size-select">
          <el-option
            v-for="size in [10, 20, 50, 100]"
            :key="size"
            :value="size"
            :label="`${size}条/页`"
          />
        </el-select>
        <el-pagination
          small
          background
          v-model:current-page="currentPage"
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
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
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'

const userStore = useUserStore()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = ref({
  userName: '',
  state: '', // 空字符串表示全部
  dateRange: []
})

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    '0': 'warning',  // 待审批
    '1': 'success',  // 已通过
    '2': 'danger',   // 已拒绝
    '': 'info'       // 全部
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    '0': '待审批',
    '1': '已通过',
    '2': '已拒绝',
    '': '全部'
  }
  return texts[status] || '未知'
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  return dateStr
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr
}

// 获取请假记录
const getLeaveRecords = async () => {
  loading.value = true
  try {
    const [startDate, endDate] = searchForm.value.dateRange || []
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      userName: searchForm.value.userName || undefined,
      reportDate: startDate || undefined,
      state: searchForm.value.state || undefined
    }

    const response = await request.post('/leave/queryLeaveByPage', params)

    if (response.data.code === '200') {
      tableData.value = response.data.data.leaveList
      total.value = response.data.data.dataCount
    }
  } catch (error) {
    console.error('获取请假记录失败:', error)
    ElMessage.error('获取记录失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  getLeaveRecords()
}

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    userName: '',
    state: '', // 重置时也设为全部
    dateRange: []
  }
  handleSearch()
}

// 处理每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val
  getLeaveRecords()
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  getLeaveRecords()
}

// 添加跳转页码变量
const jumpPage = ref('')

// 添加跳转页面处理函数
const handleJumpPage = () => {
  const page = parseInt(jumpPage.value)
  if (page && page > 0 && page <= Math.ceil(total.value / pageSize.value)) {
    currentPage.value = page
    getLeaveRecords()
  }
  jumpPage.value = ''
}

onMounted(() => {
  getLeaveRecords()
})
</script>

<style scoped>
.leave-record-container {
  padding: 20px;
}

.record-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.search-area {
  margin-bottom: 20px;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.table-container {
  padding: 0 20px;
}

.pagination-container {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.page-size-select {
  width: 100px !important;
}

.jump-page-input {
  width: 50px;
  :deep(.el-input__inner) {
    padding: 0 8px;
    text-align: center;
  }
}

:deep(.el-pagination) {
  --el-pagination-button-height: 24px;
  --el-pagination-button-width: 24px;
  margin: 0;
  justify-content: center;
}

span {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

/* 调整状态选择框的宽度 */
:deep(.el-select) {
  width: 120px !important;
}
</style> 