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
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const reportFormRef = ref(null)
const loading = ref(false)

const reportForm = reactive({
  workContent: '',
  problems: '',
  plan: ''
})

const rules = {
  workContent: [
    { required: true, message: '请输入工作内容', trigger: 'blur' }
  ],
  plan: [
    { required: true, message: '请输入工作计划', trigger: 'blur' }
  ]
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

        const response = await request.post('/report/reportSubmit', {
          ...reportForm,
          account
        })

        if (response.data.code === '200') {
          ElMessage.success('提交成功')
          // 清空表单
          reportForm.workContent = ''
          reportForm.problems = ''
          reportForm.plan = ''
          // 重置表单校验状态
          reportFormRef.value.resetFields()
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
</style> 