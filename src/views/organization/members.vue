<template>
  <div class="members-container">
    <el-card class="members-card">
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
          <el-table-column label="性别" width="80" align="center">
            <template #default="{ row }">
              {{ row.sex === 1 ? '女' : '男' }}
            </template>
          </el-table-column>
          <el-table-column prop="groupName" label="所属小组" min-width="150" />
          <el-table-column prop="grade" label="年级" width="100" align="center" />
          <el-table-column prop="className" label="班级" min-width="120" />
          <el-table-column prop="phone" label="电话" min-width="120" />
          <el-table-column prop="email" label="邮箱" min-width="180" />
          <el-table-column prop="stuNumber" label="学号" min-width="140" />
          <el-table-column label="上报状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.reportFlag === 1 ? 'success' : 'danger'">
                {{ row.reportFlag === 1 ? '上报' : '不上报' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="scope">
              <el-button link type="primary" @click="handleEdit(scope.row)">
                编辑
              </el-button>
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

      <!-- 编辑对话框 -->
      <el-dialog
        v-model="dialogVisible"
        title="编辑人员信息"
        width="400px"
      >
        <el-form :model="editForm" label-width="80px">
          <el-form-item label="姓名">
            <span>{{ editForm.name }}</span>
          </el-form-item>
          <el-form-item label="所属小组">
            <el-select v-model="editForm.groupName" placeholder="请选择小组">
              <el-option
                v-for="group in groupOptions"
                :key="group"
                :label="group"
                :value="group"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="上报状态">
            <el-switch
              v-model="editForm.reportFlag"
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
            <el-button type="primary" @click="handleSave">保存</el-button>
          </span>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

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

// 获取人员列表
const getMembers = async () => {
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      userName: searchForm.userName,
      groupName: searchForm.groupName
    }
    const response = await request.post('/user/queryUserByPage', params)
    if (response.data.code === '200') {
      tableData.value = response.data.data.userList
      total.value = response.data.data.dataCount
      currentPage.value = response.data.data.page
      pageSize.value = response.data.data.size
    }
  } catch (error) {
    console.error('获取人员列表失败:', error)
    ElMessage.error('获取人员列表失败')
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  getMembers()
}

// 重置搜索
const resetSearch = () => {
  searchForm.userName = ''
  searchForm.groupName = ''
  handleSearch()
}

// 编辑对话框相关
const dialogVisible = ref(false)
const editForm = reactive({
  account: '',
  name: '',
  groupName: '',
  reportFlag: 0
})

// 保存原始数据用于比较
const originalForm = reactive({
  groupName: '',
  reportFlag: 0
})

// 编辑人员
const handleEdit = (row) => {
  editForm.account = row.account
  editForm.name = row.userName
  editForm.groupName = row.groupName
  editForm.reportFlag = row.reportFlag
  // 保存原始数据
  originalForm.groupName = row.groupName
  originalForm.reportFlag = row.reportFlag
  dialogVisible.value = true
}

// 保存编辑
const handleSave = async () => {
  try {
    // 检查数据是否被修改
    if (editForm.groupName === originalForm.groupName && 
        editForm.reportFlag === originalForm.reportFlag) {
      ElMessage.info('未修改任何数据')
      dialogVisible.value = false
      return
    }
    
    const operator = userStore.getAccount
    if (!operator) {
      throw new Error('未获取到操作人账号')
    }
    
    const response = await request.post('/user/updateUser', {
      operator,
      account: editForm.account,
      groupName: editForm.groupName,
      reportFlag: editForm.reportFlag
    })
    
    if (response.data.code === '200') {
      ElMessage.success('保存成功')
      dialogVisible.value = false
      getMembers()
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败：' + error.message)
  }
}

// 删除人员
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除 ${row.userName} 吗？`,
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
      
      const response = await request.post('/user/deleteUser', {
        operator,
        account: row.account
      })
      
      if (response.data.code === '200') {
        ElMessage.success('删除成功')
        getMembers()
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败：' + error.message)
    }
  }).catch(() => {})
}

// 处理页码跳转
const handleJumpPage = () => {
  const page = parseInt(jumpPage.value)
  if (page && page > 0 && page <= Math.ceil(total.value / pageSize.value)) {
    currentPage.value = page
    getMembers()
  }
  jumpPage.value = ''
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1  // 重置到第一页
  getMembers()
}

// 页码改变
const handleCurrentChange = (val) => {
  currentPage.value = val
  getMembers()
}

// 组件挂载时获取数据
onMounted(() => {
  getGroups()
  getMembers()
})
</script>

<style scoped>
.members-container {
  padding: 20px;
}

.members-card {
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

/* 编辑对话框中的下拉框样式 */
:deep(.el-dialog .el-select) {
  width: 100%;
}

/* 编辑对话框中只读文本的样式 */
.el-form-item span {
  color: var(--el-text-color-regular);
}

/* 表格容器样式 */
.table-container {
  margin: 0 -20px;  /* 抵消卡片的内边距 */
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