<template>
  <div class="groups-container">
    <el-card class="groups-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">小组管理</span>
          <el-button type="primary" @click="handleAddGroup">
            添加小组
          </el-button>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="小组名称">
            <el-input v-model="searchForm.name" placeholder="请输入小组名称" clearable />
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
        <el-table-column prop="name" label="小组名称" min-width="150" />
        <el-table-column prop="memberCount" label="成员数量" width="100" align="center" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button link type="primary" @click="handleMembers(scope.row)">
              成员管理
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
  name: ''
})

// 表格数据
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取小组列表
const getGroups = async () => {
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      name: searchForm.name
    }
    const response = await request.get('/groups/list', { params })
    if (response.data.code === '200') {
      tableData.value = response.data.data.list
      total.value = response.data.data.total
    }
  } catch (error) {
    console.error('获取小组列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  getGroups()
}

// 重置搜索
const resetSearch = () => {
  searchForm.name = ''
  handleSearch()
}

// 添加小组
const handleAddGroup = () => {
  // TODO: 实现添加小组逻辑
}

// 编辑小组
const handleEdit = (row) => {
  // TODO: 实现编辑小组逻辑
}

// 管理成员
const handleMembers = (row) => {
  // TODO: 实现成员管理逻辑
}

// 删除小组
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
      const response = await request.delete(`/groups/${row.id}`)
      if (response.data.code === '200') {
        ElMessage.success('删除成功')
        getGroups()
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
  getGroups()
}

// 页码改变
const handleCurrentChange = (val) => {
  currentPage.value = val
  getGroups()
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