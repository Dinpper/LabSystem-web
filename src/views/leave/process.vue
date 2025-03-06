<template>
  <div class="leave-process-container">
    <el-card class="process-card">
      <template #header>
        <div class="card-header">
          <span>请假处理</span>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="申请人">
            <el-input v-model="searchForm.userName" placeholder="请输入申请人" clearable />
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
          <el-table-column prop="reportDate" label="申请日期" min-width="120" align="center" />
          <el-table-column prop="startDate" label="开始时间" min-width="160" align="center" />
          <el-table-column prop="endDate" label="结束时间" min-width="160" align="center" />
          <el-table-column prop="reason" label="请假原因" min-width="200" show-overflow-tooltip />
          <el-table-column prop="allowedFlag" label="状态" min-width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.allowedFlag)">
                {{ getStatusText(row.allowedFlag) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.allowedFlag === 0"
                type="success"
                size="small"
                @click="handleApprove(row)"
              >
                接受
              </el-button>
              <el-button
                v-if="row.allowedFlag === 0"
                type="danger"
                size="small"
                @click="openRejectDialog(row)"
              >
                拒绝
              </el-button>
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

    <!-- 审批对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
    >
      <el-form :model="approveForm" label-width="80px">
        <el-form-item label="审批备注">
          <el-input
            v-model="approveForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入审批备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitApprove" :loading="approving">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 拒绝原因对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝原因"
      width="500px"
    >
      <el-form :model="rejectForm">
        <el-form-item label="拒绝原因" :rules="[{ required: true, message: '请输入拒绝原因' }]">
          <el-input
            v-model="rejectForm.remarks"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmReject" :loading="processing">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'

const userStore = useUserStore()
const loading = ref(false)
const processing = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const jumpPage = ref('')
const rejectDialogVisible = ref(false)
const rejectForm = ref({
  id: '',
  remarks: ''
})

const searchForm = ref({
  userName: '',
  dateRange: []
})

const approveForm = ref({
  id: '',
  status: '',
  remark: ''
})

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    '0': 'warning', // 待审核
    '1': 'success', // 已通过
    '2': 'danger'   // 已拒绝
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    '0': '待审核',
    '1': '已通过',
    '2': '已拒绝'
  }
  return texts[status] || '未知'
}

// 获取请假记录
const getLeaveRecords = async () => {
  loading.value = true
  try {
    const response = await request.post('/leave/queryLeaveByPage', {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      state: '0'  // 固定传0，只查待审批的记录
    })

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

// 处理审批通过
const handleApprove = async (row) => {
  ElMessageBox.confirm('确定接受该请假申请吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      processing.value = true
      const response = await request.post('/leave/approveLeave', {
        id: row.id,
        handlers: userStore.account
      })

      if (response.data.code === '200') {
        ElMessage.success('已接受该请假申请')
        getLeaveRecords()
      }
    } catch (error) {
      console.error('处理失败:', error)
      ElMessage.error('处理失败')
    } finally {
      processing.value = false
    }
  }).catch(() => {})
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

// 打开拒绝对话框
const openRejectDialog = (row) => {
  rejectForm.value.id = row.id
  rejectForm.value.remarks = ''
  rejectDialogVisible.value = true
}

// 确认拒绝
const confirmReject = async () => {
  if (!rejectForm.value.remarks.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }

  try {
    processing.value = true
    const response = await request.post('/leave/notApprovedLeave', {
      id: rejectForm.value.id,
      handlers: userStore.account,
      remarks: rejectForm.value.remarks
    })
    
    if (response.data.code === '200') {
      ElMessage.success('已拒绝该请假申请')
      rejectDialogVisible.value = false
      getLeaveRecords()
    }
  } catch (error) {
    console.error('处理失败:', error)
    ElMessage.error('处理失败')
  } finally {
    processing.value = false
  }
}

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
.leave-process-container {
  padding: 20px;
}

.process-card {
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 