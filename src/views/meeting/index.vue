<template>
  <div class="meeting-container">
    <el-card class="meeting-card">
      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="会议名称">
            <el-input v-model="searchForm.meetingName" placeholder="请输入会议名称" clearable />
          </el-form-item>
          <el-form-item label="日期">
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
          <el-table-column prop="meetingName" label="会议名称" min-width="150" />
          <el-table-column prop="organizerName" label="发起人" width="120" align="center" />
          <el-table-column prop="reportDate" label="日期" width="120" align="center" />
          <el-table-column label="会议时间" width="200" align="center">
            <template #default="{ row }">
              {{ row.startTime }} - {{ row.endTime }}
            </template>
          </el-table-column>
          <el-table-column prop="location" label="地点" width="120" align="center" />
          <el-table-column prop="membersName" label="参会人员" min-width="200" show-overflow-tooltip />
          <el-table-column prop="description" label="会议内容" min-width="200" show-overflow-tooltip />
          <el-table-column label="关键字" min-width="150">
            <template #default="{ row }">
              <template v-if="row.keyword">
                <span>{{ row.keyword }}</span>
                <el-button 
                  link 
                  type="primary" 
                  @click="openKeywordDialog(row)"
                >
                  修改
                </el-button>
              </template>
              <el-button 
                v-else
                link 
                type="primary" 
                @click="openKeywordDialog(row)"
              >
                添加
              </el-button>
            </template>
          </el-table-column>
          <el-table-column label="会议总结" min-width="200">
            <template #default="{ row }">
              <div class="summary-buttons">
                <el-button 
                  link 
                  type="primary" 
                  @click="generateSummary(row)"
                >
                  生成总结
                </el-button>
                <el-button 
                  link 
                  type="primary" 
                  @click="openSummaryDialog(row)"
                >
                  修改总结
                </el-button>
              </div>
              <div v-if="row.summary" class="summary-content" @click="openSummaryDialog(row)">
                <div class="summary-text">{{ row.summary }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="会议文件" min-width="300">
            <template #default="{ row }">
              <div class="file-list" v-if="row.files && row.files.length">
                <el-popover
                  v-for="file in row.files"
                  :key="file.id"
                  placement="top-start"
                  :width="300"
                  trigger="hover"
                >
                  <template #reference>
                    <el-tag
                      size="small"
                      class="file-tag"
                      :type="getFileTagType(file.fileType)"
                    >
                      <el-icon><Document /></el-icon>
                      <span class="file-name">{{ file.fileName }}</span>
                    </el-tag>
                  </template>
                  <div class="file-info">
                    <div class="info-item">
                      <span class="label">文件名：</span>
                      <span class="value">{{ file.fileName }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">类型：</span>
                      <span class="value">{{ file.fileType }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">大小：</span>
                      <span class="value">{{ formatFileSize(file.fileSize) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">路径：</span>
                      <span class="value">{{ file.filePath }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">上传时间：</span>
                      <span class="value">{{ formatDate(file.uploadedAt) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">上传人：</span>
                      <span class="value">{{ file.userName }}</span>
                    </div>
                    <div class="file-actions">
                      <el-button 
                        type="primary" 
                        link
                        @click="handleDownload(file)"
                      >
                        下载文件
                      </el-button>
                    </div>
                  </div>
                </el-popover>
              </div>
              <el-upload
                :action="null"
                :auto-upload="false"
                :on-change="(file) => handleFileChange(file, row)"
                :show-file-list="false"
                multiple
              >
                <el-button link type="primary">
                  <el-icon><Upload /></el-icon>
                  上传文件
                </el-button>
              </el-upload>
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

    <!-- 添加总结对话框 -->
    <el-dialog
      v-model="summaryDialogVisible"
      title="会议总结"
      width="500px"
    >
      <el-form :model="summaryForm">
        <el-form-item>
          <el-input
            v-model="summaryForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入会议总结"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="summaryDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitSummary">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 关键字对话框 -->
    <el-dialog
      v-model="keywordDialogVisible"
      title="会议关键字"
      width="500px"
    >
      <el-form :model="keywordForm">
        <el-form-item>
          <el-input
            v-model="keywordForm.content"
            type="textarea"
            :rows="3"
            placeholder="请输入会议关键字"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="keywordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitKeyword">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Upload } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import dayjs from 'dayjs'

const userStore = useUserStore()

// 搜索表单数据
const searchForm = reactive({
  meetingName: '',
  date: ''
})

// 表格数据
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const jumpPage = ref('')

// 总结相关
const summaryDialogVisible = ref(false)
const summaryForm = ref({
  content: '',
  meetingId: null
})

// 关键字相关
const keywordDialogVisible = ref(false)
const keywordForm = ref({
  content: '',
  meetingId: null
})

// 获取会议记录列表
const getMeetingList = async () => {
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      meetingName: searchForm.meetingName,
      reportDate: searchForm.date
    }
    const response = await request.post('/meeting/queryMeetingByPage', params)
    if (response.data.code === '200') {
      tableData.value = response.data.data.MeetingsList
      total.value = response.data.data.dataCount
      currentPage.value = response.data.data.page
      pageSize.value = response.data.data.size
    }
  } catch (error) {
    console.error('获取会议记录失败:', error)
    ElMessage.error('获取会议记录失败')
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  getMeetingList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.meetingName = ''
  searchForm.date = ''
  handleSearch()
}

// 导出
const handleExport = async () => {
  try {
    const params = {
      meetingName: searchForm.meetingName,
      reportDate: searchForm.date
    }
    
    const response = await fetch('/api/meeting/download', {
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
      : '会议记录.xlsx'
    
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
  getMeetingList()
}

// 页码改变
const handleCurrentChange = (val) => {
  currentPage.value = val
  getMeetingList()
}

// 处理页码跳转
const handleJumpPage = () => {
  const page = parseInt(jumpPage.value)
  if (page && page > 0 && page <= Math.ceil(total.value / pageSize.value)) {
    currentPage.value = page
    getMeetingList()
  }
  jumpPage.value = ''
}

// 打开总结对话框
const openSummaryDialog = (row) => {
  summaryForm.value.content = row.summary || ''
  summaryForm.value.meetingId = row.meetingId  // 使用正确的会议ID
  summaryDialogVisible.value = true
}

// 提交总结
const submitSummary = async () => {
  try {
    const response = await request.post('/meeting/updateSummary', {
      meetingId: summaryForm.value.meetingId,
      summary: summaryForm.value.content.trim()  // 去除首尾空格
    })
    
    if (response.data.code === '200') {
      ElMessage.success('保存成功')
      summaryDialogVisible.value = false
      getMeetingList()  // 刷新列表
    }
  } catch (error) {
    console.error('保存总结失败:', error)
    ElMessage.error('保存失败')
  }
}

// 文件上传相关
const handleFileChange = async (file, row) => {
  const formData = new FormData()
  
  // 添加文件
  formData.append('files', file.raw)
  
  // 添加JSON参数
  const reportJson = {
    uploadedBy: userStore.account,
    relatedId: row.meetingId  // 使用会议ID作为关联ID
  }
  formData.append('reportJson', JSON.stringify(reportJson))
  
  try {
    const response = await request.post('/meeting/uploadMultiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    if (response.data.code === '200') {
      ElMessage.success('上传成功')
      getMeetingList()  // 刷新列表
    }
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败')
  }
}

// 打开关键字对话框
const openKeywordDialog = (row) => {
  keywordForm.value.content = row.keyword || ''
  keywordForm.value.meetingId = row.meetingId
  keywordDialogVisible.value = true
}

// 提交关键字
const submitKeyword = async () => {
  try {
    const response = await request.post('/meeting/updateKeyword', {
      meetingId: keywordForm.value.meetingId,
      keyword: keywordForm.value.content.trim()
    })
    
    if (response.data.code === '200') {
      ElMessage.success('保存成功')
      keywordDialogVisible.value = false
      getMeetingList()  // 刷新列表
    }
  } catch (error) {
    console.error('保存关键字失败:', error)
    ElMessage.error('保存失败')
  }
}

// 生成总结
const generateSummary = async (row) => {
  try {
    const response = await request.post('/meeting/getMeetingMinutes', {
      meetingId: row.meetingId
    })
    
    if (response.data.code === '200') {
      ElMessage.success('生成总结成功')
      getMeetingList()  // 刷新列表
    }
  } catch (error) {
    console.error('生成总结失败:', error)
    ElMessage.error('生成总结失败')
  }
}

// 格式化文件大小
const formatFileSize = (size) => {
  if (!size) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  return `${size.toFixed(2)} ${units[index]}`
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 根据文件类型获取标签类型
const getFileTagType = (fileType) => {
  const typeMap = {
    'PDF': 'danger',
    'Word': 'primary',
    '图片': 'success',
    'Excel': 'warning'
  }
  return typeMap[fileType] || 'info'
}

// 处理文件下载
const handleDownload = async (file) => {
  try {
    const params = {
      id: file.id
    }

    const response = await fetch('/api/fileRecord/downloadFile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      throw new Error('下载失败')
    }

    // 获取文件名
    const contentDisposition = response.headers.get('content-disposition')
    const fileName = contentDisposition
      ? decodeURIComponent(contentDisposition.split("''")[1])
      : file.fileName // 使用文件原始名称作为默认值

    // 获取文件类型
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream'

    // 获取二进制数据
    const blob = await response.blob()
    
    // 创建下载链接
    const url = window.URL.createObjectURL(
      new Blob([blob], { type: contentType })
    )
    const link = document.createElement('a')
    link.style.display = 'none'
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    
    // 清理
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)

    ElMessage.success('下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败')
  }
}

// 组件挂载时获取数据
onMounted(() => {
  getMeetingList()
})
</script>

<style scoped>
.meeting-container {
  padding: 20px;
}

.meeting-card {
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

/* 表格容器样式 */
.table-container {
  margin: 0 -20px;
  overflow: auto;
}

/* 调整表格滚动条样式 */
:deep(.el-table__body-wrapper::-webkit-scrollbar),
.table-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb),
.table-container::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background-color: #dcdfe6;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-track),
.table-container::-webkit-scrollbar-track {
  background-color: #ffffff;
}

/* 日期选择器样式 */
:deep(.el-date-editor) {
  width: 180px;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.file-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 200px;
  cursor: pointer;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-info {
  font-size: 13px;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: #909399;
  width: 70px;
  flex-shrink: 0;
}

.info-item .value {
  color: #606266;
  flex: 1;
  word-break: break-all;
}

.summary-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  padding: 4px 0;
}

.summary-content {
  cursor: pointer;
  background-color: #f5f7fa;
  border-radius: 4px;
  transition: all 0.3s ease;
  margin: 0 4px;
  max-height: 120px;  /* 设置最大高度 */
  overflow-y: auto;  /* 允许垂直滚动 */
}

.summary-content:hover {
  background-color: #ecf5ff;
}

.summary-text {
  padding: 8px 12px;
  color: #606266;
  line-height: 1.5;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 80px;  /* 约4行文本的高度 */
  overflow-y: auto;
  margin: 0;
}

.summary-content::-webkit-scrollbar {
  width: 6px;
}

.summary-content::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.summary-content::-webkit-scrollbar-track {
  background-color: transparent;
}

.file-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.info-item .value {
  color: #606266;
  flex: 1;
  word-break: break-all;
  font-family: monospace;  /* 使用等宽字体显示路径 */
}
</style> 