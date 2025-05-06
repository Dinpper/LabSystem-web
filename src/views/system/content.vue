<template>
  <div class="content-config-container">
    <el-card class="content-config-card">
      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :inline="true">
          <el-form-item>
            <el-button type="primary" @click="refreshData">刷新</el-button>
            <el-button type="success" @click="handleAdd">添加</el-button>
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
          <el-table-column prop="email" label="邮箱" min-width="200" />
          <el-table-column label="小组内容列表" min-width="300">
            <template #default="{ row }">
              {{ getGroupNames(row.groupList) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button 
                link 
                type="primary" 
                @click="handleEdit(row)"
              >
                修改
              </el-button>
              <el-button 
                link 
                type="danger" 
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="添加用户小组"
      width="600px"
    >
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="姓名" required>
          <el-input v-model="addForm.userName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="账号" required>
          <el-input v-model="addForm.account" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="邮箱" required>
          <el-input v-model="addForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-divider>选择小组</el-divider>
        <div class="groups-container">
          <el-checkbox-group v-model="addSelectedGroups">
            <el-checkbox
              v-for="group in allGroups"
              :key="group.groupId"
              :label="group.groupId"
            >
              {{ group.groupName }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="修改用户小组"
      width="600px"
    >
      <div class="user-info">
        <p><strong>姓名：</strong>{{ editForm.userName }}</p>
        <p><strong>邮箱：</strong>{{ editForm.email }}</p>
      </div>
      <el-divider>选择小组</el-divider>
      <div class="groups-container">
        <el-checkbox-group v-model="selectedGroups">
          <el-checkbox
            v-for="group in allGroups"
            :key="group.groupId"
            :label="group.groupId"
          >
            {{ group.groupName }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 表格数据
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 对话框相关
const dialogVisible = ref(false)
const editForm = ref({
  account: '',
  userName: '',
  email: '',
  groupList: []
})

// 所有小组列表
const allGroups = ref([])
// 选中的小组ID列表
const selectedGroups = ref([])

// 添加对话框相关
const addDialogVisible = ref(false)
const addSelectedGroups = ref([])
const addForm = ref({
  userName: '',
  account: '',
  email: '',
})

// 获取小组名称列表
const getGroupNames = (groupList) => {
  if (!groupList || !groupList.length) return '-'
  return groupList.map(group => group.groupName).join('、')
}

// 获取所有小组列表
const getAllGroups = async () => {
  try {
    const response = await fetch('/api/group/queryReportGroupsList', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('获取小组列表失败')
    }

    const data = await response.json()
    if (data.code === '200') {
      allGroups.value = data.data || []
    } else {
      throw new Error(data.message || '获取小组列表失败')
    }
  } catch (error) {
    console.error('获取小组列表失败:', error)
    ElMessage.error(error.message || '获取小组列表失败')
  }
}

// 获取邮件组列表
const getEmailGroups = async () => {
  try {
    const response = await fetch('/api/emailGroup/queryEmailGroup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('获取数据失败')
    }

    const data = await response.json()
    if (data.code === '200') {
      tableData.value = data.data || []
      total.value = tableData.value.length
    } else {
      throw new Error(data.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error(error.message || '获取数据失败')
  }
}

// 刷新数据
const refreshData = () => {
  getEmailGroups()
}

// 编辑
const handleEdit = (row) => {
  editForm.value = { ...row }
  // 设置已选中的小组
  selectedGroups.value = row.groupList.map(group => group.groupId)
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户的邮件组配置吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await fetch('/api/emailGroup/deleteEmailGroupByUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        account: row.account,
        userName: row.userName,
        email: row.email
      })
    })

    if (!response.ok) {
      throw new Error('删除失败')
    }

    const data = await response.json()
    if (data.code === '200') {
      ElMessage.success('删除成功')
      refreshData()
    } else {
      throw new Error(data.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 保存
const handleSave = async () => {
  try {
    const params = {
      account: editForm.value.account,
      userName: editForm.value.userName,
      email: editForm.value.email,
      groupList: selectedGroups.value.map(id => ({ groupId: id }))
    }

    const response = await fetch('/api/emailGroup/updateEmailGroupByUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      throw new Error('保存失败')
    }

    const data = await response.json()
    if (data.code === '200') {
      ElMessage.success('保存成功')
      dialogVisible.value = false
      refreshData()
    } else {
      throw new Error(data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(error.message || '保存失败')
  }
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 处理每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

// 添加按钮点击
const handleAdd = () => {
  addForm.value = {
    userName: '',
    account: '',
    email: '',
  }
  addSelectedGroups.value = []
  addDialogVisible.value = true
}

// 添加提交
const handleAddSubmit = async () => {
  // 表单验证
  if (!addForm.value.userName || !addForm.value.account || !addForm.value.email) {
    ElMessage.warning('请填写完整信息')
    return
  }

  try {
    const params = {
      ...addForm.value,
      groupList: addSelectedGroups.value.map(id => ({ groupId: id }))
    }

    const response = await fetch('/api/emailGroup/addEmailGroupByUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      throw new Error('添加失败')
    }

    const data = await response.json()
    if (data.code === '200') {
      ElMessage.success('添加成功')
      addDialogVisible.value = false
      refreshData()
    } else {
      throw new Error(data.message || '添加失败')
    }
  } catch (error) {
    console.error('添加失败:', error)
    ElMessage.error(error.message || '添加失败')
  }
}

onMounted(() => {
  getAllGroups()
  getEmailGroups()
})
</script>

<style scoped>
.content-config-container {
  padding: 20px;
}

.content-config-card {
  min-height: calc(100vh - 100px);
}

.search-area {
  margin-bottom: 20px;
}

.table-container {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 调整表格内容的换行和省略 */
:deep(.el-table .cell) {
  white-space: pre-wrap;
  line-height: 1.5;
}

/* 用户信息样式 */
.user-info {
  margin-bottom: 20px;
}

.user-info p {
  margin: 8px 0;
  color: #606266;
}

.user-info strong {
  color: #303133;
  margin-right: 8px;
}

/* 小组选择区域样式 */
.groups-container {
  margin-top: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.groups-container :deep(.el-checkbox-group) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.groups-container :deep(.el-checkbox) {
  margin-right: 0;
  margin-left: 0;
}
</style> 