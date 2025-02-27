<template>
  <div class="daily-container">
    <el-card class="report-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">日报提交</span>
        </div>
      </template>
      
      <el-form 
        ref="reportFormRef"
        :model="reportForm"
        :rules="rules"
        label-width="100px"
        class="report-form"
      >
        <el-form-item label="工作内容" prop="workContent">
          <el-input
            v-model="reportForm.workContent"
            type="textarea"
            :rows="4"
            placeholder="请输入今日工作内容"
            resize="none"
          />
        </el-form-item>

        <el-form-item label="遇到的问题" prop="problems">
          <el-input
            v-model="reportForm.problems"
            type="textarea"
            :rows="4"
            placeholder="请输入遇到的问题（选填）"
            resize="none"
          />
        </el-form-item>

        <el-form-item label="明日计划" prop="plan">
          <el-input
            v-model="reportForm.plan"
            type="textarea"
            :rows="4"
            placeholder="请输入明日工作计划"
            resize="none"
          />
        </el-form-item>

        <el-form-item label="附件">
          <el-upload
            ref="uploadRef"
            :action="null"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            multiple
            :limit="5"
            accept=".doc,.docx,.pdf,.xls,.xlsx,.txt,.zip,.rar"
            class="upload-demo"
          >
            <el-button type="primary" class="upload-button">
              <el-icon><Upload /></el-icon>
              <span class="upload-text">添加附件</span>
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持 Word、Excel、PDF、压缩包等格式，单个文件不超过10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item class="submit-item">
          <el-button 
            type="primary" 
            :loading="loading"
            @click="handleSubmit"
            class="submit-button"
          >
            提交
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const reportFormRef = ref(null)
const uploadRef = ref(null)
const loading = ref(false)

const reportForm = reactive({
  workContent: '',
  problems: '',
  plan: '',
  files: []
})

const rules = {
  workContent: [
    { required: true, message: '请输入工作内容', trigger: 'blur' }
  ],
  plan: [
    { required: true, message: '请输入工作计划', trigger: 'blur' }
  ]
}

const handleFileChange = (file) => {
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB!')
    return false
  }
  reportForm.files.push(file.raw)
}

const handleFileRemove = (file) => {
  const index = reportForm.files.findIndex(f => f.uid === file.uid)
  if (index !== -1) {
    reportForm.files.splice(index, 1)
  }
}

const handleSubmit = async () => {
  if (!reportFormRef.value) return
  
  await reportFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const account = userStore.getAccount
        if (!account) {
          throw new Error('未获取到用户账号')
        }

        const formData = new FormData()
        
        // 将所有报告数据组装成一个 JSON 字符串
        const reportData = {
          workContent: reportForm.workContent,
          problems: reportForm.problems,
          plan: reportForm.plan,
          account
        }
        formData.append('reportJson', JSON.stringify(reportData))
        
        // 添加文件
        if (reportForm.files.length > 0) {
          reportForm.files.forEach(file => {
            formData.append('files', file)
          })
        }
        
        const response = await request.post('/report/reportSubmit', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        if (response.data.code === '200') {
          ElMessage.success('提交成功')
          reportForm.workContent = ''
          reportForm.problems = ''
          reportForm.plan = ''
          reportFormRef.value.resetFields()
          uploadRef.value.clearFiles()
          reportForm.files = []
        }
      } catch (error) {
        console.error('提交失败:', error)
        ElMessage.error('提交失败：' + error.message)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.daily-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 60px);
}

.report-card {
  max-width: 800px;
  margin: 0 auto;
  border-radius: 8px;
}

.card-header {
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.report-form {
  padding-top: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-textarea__inner) {
  border-radius: 4px;
  border-color: #dcdfe6;
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
  background-color: #fafafa;
}

:deep(.el-textarea__inner:focus) {
  background-color: #fff;
}

:deep(.el-textarea__inner::placeholder) {
  color: #909399;
}

.submit-item {
  margin-top: 30px;
  margin-bottom: 0;
}

.submit-button {
  width: 120px;
  height: 40px;
  font-size: 14px;
}

/* 移除卡片边框 */
:deep(.el-card) {
  border: none;
  box-shadow: 0 1px 4px rgba(0,21,41,0.08) !important;
}

/* 上传组件样式 */
.upload-demo :deep(.el-upload) {
  margin-right: 16px;
}

.upload-button {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
}

.upload-button .el-icon {
  font-size: 16px;
  margin-right: 6px;
}

.upload-text {
  font-size: 14px;
  font-weight: normal;
}

:deep(.el-upload-list) {
  margin-top: 10px;
  padding: 8px;
  background-color: #fafafa;
  border-radius: 4px;
}

:deep(.el-upload-list__item) {
  transition: all 0.3s;
  padding: 8px;
  margin: 4px 0;
  border-radius: 4px;
}

:deep(.el-upload-list__item:hover) {
  background-color: #f0f0f0;
}

:deep(.el-upload-list__item-name) {
  color: #606266;
  font-size: 13px;
}

:deep(.el-upload__tip) {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style> 