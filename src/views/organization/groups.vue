<template>
  <div class="groups-container">
    <el-card class="groups-card">
      <!-- 工具栏 -->
      <div class="toolbar">
        <el-button type="primary" @click="handleAdd">新增小组</el-button>
        <el-button type="success" @click="handleExport">导出</el-button>
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
          <el-table-column prop="groupName" label="小组名称" min-width="150" />
          <el-table-column prop="leaderName" label="组长" min-width="120" />
          <el-table-column prop="memberCount" label="成员数量" width="100" align="center" />
          <el-table-column prop="userList" label="成员列表" min-width="300" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.userList || '暂无成员' }}
            </template>
          </el-table-column>
          <el-table-column label="上报状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.reportFlag === 1 ? 'success' : 'danger'">
                {{ row.reportFlag === 1 ? '上报' : '不上报' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="scope">
              <el-button link type="danger" @click="handleDelete(scope.row)">
                删除
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="400px"
    >
      <el-form 
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="组名" prop="groupName">
          <el-input v-model="form.groupName" placeholder="请输入小组名称" />
        </el-form-item>
        <el-form-item label="组长" prop="leaderName">
          <el-input v-model="form.leaderName" placeholder="请输入组长姓名" />
        </el-form-item>
        <el-form-item label="上报状态">
          <el-switch
            v-model="form.reportFlag"
            :active-value="1"
            :inactive-value="0"
            active-text="上报"
            inactive-text="不上报"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 表格数据
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const jumpPage = ref('')

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增小组')
const formRef = ref(null)

// 表单数据
const form = reactive({
  groupName: '',
  leaderName: '',
  reportFlag: 1,
  originalGroupName: ''  // 添加原始组名字段
})

// 表单校验规则
const rules = {
  groupName: [
    { required: true, message: '请输入小组名称', trigger: 'blur' }
  ],
  leaderName: [
    { required: true, message: '请输入组长姓名', trigger: 'blur' }
  ]
}

// 获取小组列表
const getGroups = async () => {
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
    }
    const response = await request.post('/group/queryGroupsByPage', params)
    if (response.data.code === '200') {
      tableData.value = response.data.data.grouplist
      total.value = response.data.data.dataCount
      currentPage.value = response.data.data.page
      pageSize.value = response.data.data.size
    }
  } catch (error) {
    console.error('获取小组列表失败:', error)
    ElMessage.error('获取小组列表失败')
  }
}

// 导出
const handleExport = async () => {
  try {
    const operator = userStore.getAccount
    if (!operator) {
      throw new Error('未获取到操作人账号')
    }

    const response = await fetch('/api/group/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ operator })
    })

    // 获取文件名
    const contentDisposition = response.headers.get('content-disposition')
    const fileName = contentDisposition
      ? decodeURIComponent(contentDisposition.split("''")[1])
      : '小组统计.xlsx'
    
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
  currentPage.value = 1
  getGroups()
}

// 页码改变
const handleCurrentChange = (val) => {
  currentPage.value = val
  getGroups()
}

// 处理页码跳转
const handleJumpPage = () => {
  const page = parseInt(jumpPage.value)
  if (page && page > 0 && page <= Math.ceil(total.value / pageSize.value)) {
    currentPage.value = page
    getGroups()
  }
  jumpPage.value = ''
}

// 编辑小组
const handleEdit = (row) => {
  dialogTitle.value = '编辑小组'
  // 重置并设置表单数据
  Object.assign(form, {
    groupName: row.groupName,
    leaderName: row.leaderAccount || row.leaderName, // 优先使用leaderAccount
    reportFlag: row.reportFlag,
    originalGroupName: row.groupName
  })
  dialogVisible.value = true
}

// 删除小组
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除小组 ${row.groupName} 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const operator = userStore.getAccount
      if (!operator) {
        throw new Error('未获取到操作人账号')
      }
      
      const response = await request.post('/group/deleteGroup', {
        operator,
        groupName: row.groupName
      })
      
      if (response.data.code === '200') {
        ElMessage.success('删除成功')
        getGroups()  // 刷新列表
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败：' + error.message)
    }
  }).catch(() => {
    // 取消删除，不做任何操作
  })
}

// 新增小组
const handleAdd = () => {
  dialogTitle.value = '新增小组'
  // 重置表单数据
  Object.assign(form, {
    groupName: '',
    leaderName: '',
    reportFlag: 1,
    originalGroupName: ''  // 清空原始组名
  })
  dialogVisible.value = true
}

// 保存
const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      // 检查必填参数
      if (!form.groupName.trim()) {
        ElMessage.warning('请设置组名')
        return
      }
      if (!form.leaderName.trim()) {
        ElMessage.warning('请设置组长')
        return
      }

      try {
        const operator = userStore.getAccount
        if (!operator) {
          throw new Error('未获取到操作人账号')
        }

        // 根据是否有originalGroupName判断是新增还是编辑
        const isEdit = form.originalGroupName !== ''
        const url = isEdit ? '/group/updateGroup' : '/group/addGroup'
        const params = isEdit ? {
          groupName: form.groupName.trim(),
          leaderAccount: form.leaderName.trim(),
          reportFlag: form.reportFlag,
          originalGroupName: form.originalGroupName
        } : {
          operator,
          groupName: form.groupName.trim(),
          leaderName: form.leaderName.trim(),
          reportFlag: form.reportFlag
        }

        const response = await request.post(url, params)

        if (response.data.code === '200') {
          ElMessage.success(isEdit ? '编辑成功' : '新增成功')
          dialogVisible.value = false
          getGroups()  // 刷新列表
        }
      } catch (error) {
        console.error(isEdit ? '编辑失败:' : '新增失败:', error)
        ElMessage.error((isEdit ? '编辑' : '新增') + '失败：' + error.message)
      }
    }
  })
}

// 组件挂载时获取数据
onMounted(() => {
  getGroups()
})
</script>

<style scoped>
.groups-container {
  padding: 20px;
}

.groups-card {
  min-height: calc(100vh - 100px);
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

/* 对话框样式 */
:deep(.el-dialog__body) {
  padding-top: 20px;
}
</style> 