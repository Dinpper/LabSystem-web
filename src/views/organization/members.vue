<template>
  <div class="members-container">
    <el-card class="members-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">人员管理</span>
          <el-button type="primary" @click="handleAddMember">
            添加人员
          </el-button>
        </div>
      </template>
      
      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="姓名">
            <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable />
          </el-form-item>
          <el-form-item label="小组">
            <el-select v-model="searchForm.groupId" placeholder="请选择小组" clearable>
              <el-option
                v-for="group in groupOptions"
                :key="group.id"
                :label="group.name"
                :value="group.id"
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
      <el-table :data="tableData" border style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="姓名" min-width="120" />
        <el-table-column prop="groupName" label="所属小组" min-width="150" />
        <el-table-column prop="phone" label="电话" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// 搜索表单数据
const searchForm = reactive({
  name: '',
  groupId: ''
})

// 表格数据
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 小组选项
const groupOptions = ref([])

// 获取小组列表
const getGroups = async () => {
  try {
    const response = await request.get('/groups/list')
    if (response.data.code === '200') {
      groupOptions.value = response.data.data
    }
  } catch (error) {
    console.error('获取小组列表失败:', error)
  }
}

// 获取人员列表
const getMembers = async () => {
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm
    }
    const response = await request.get('/members/list', { params })
    if (response.data.code === '200') {
      tableData.value = response.data.data.list
      total.value = response.data.data.total
    }
  } catch (error) {
    console.error('获取人员列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  getMembers()
}

// 重置搜索
const resetSearch = () => {
  searchForm.name = ''
  searchForm.groupId = ''
  handleSearch()
}

// 添加人员
const handleAddMember = () => {
  // TODO: 实现添加人员逻辑
}

// 编辑人员
const handleEdit = (row) => {
  // TODO: 实现编辑人员逻辑
}

// 删除人员
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除 ${row.name} 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await request.delete(`/members/${row.id}`)
      if (response.data.code === '200') {
        ElMessage.success('删除成功')
        getMembers()
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
}

.search-area {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 