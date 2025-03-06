<template>
  <div class="leave-apply-container">
    <el-card class="apply-card">
      <template #header>
        <div class="card-header">
          <span>请假申请</span>
        </div>
      </template>

      <el-form 
        ref="formRef"
        :model="leaveForm"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="开始时间" prop="startDate">
          <el-date-picker
            v-model="leaveForm.startDate"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            :disabled-date="disabledDate"
          />
        </el-form-item>

        <el-form-item label="结束时间" prop="endDate">
          <el-date-picker
            v-model="leaveForm.endDate"
            type="datetime"
            placeholder="选择结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            :disabled-date="disabledDate"
            :disabled="!leaveForm.startDate"
            :min-time="leaveForm.startDate"
          />
        </el-form-item>

        <el-form-item label="请假原因" prop="reason">
          <el-input
            v-model="leaveForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入请假原因"
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="submitForm"
            :loading="loading"
          >
            提交申请
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'

const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const leaveForm = ref({
  startDate: '',
  endDate: '',
  reason: ''
})

const rules = {
  startDate: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endDate: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (value && leaveForm.value.startDate && value <= leaveForm.value.startDate) {
          callback(new Error('结束时间必须晚于开始时间'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  reason: [
    { required: true, message: '请输入请假原因', trigger: 'blur' },
    { min: 2, max: 200, message: '长度在 2 到 200 个字符', trigger: 'blur' }
  ]
}

// 禁用今天之前的日期
const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e7
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await request.post('/leave/addLeave', {
          startDate: leaveForm.value.startDate,
          endDate: leaveForm.value.endDate,
          reason: leaveForm.value.reason,
          account: userStore.account
        })

        if (response.data.code === '200') {
          ElMessage.success('请假申请提交成功')
          resetForm()
        }
      } catch (error) {
        console.error('提交请假申请失败:', error)
        ElMessage.error('提交失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}
</script>

<style scoped>
.leave-apply-container {
  padding: 20px;
}

.apply-card {
  max-width: 800px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

:deep(.el-form) {
  margin-top: 20px;
  padding: 20px;
}

:deep(.el-form-item) {
  margin-bottom: 30px;
}

:deep(.el-date-editor) {
  width: 100%;
  max-width: 360px;
}

:deep(.el-textarea__inner) {
  font-family: inherit;
}

:deep(.el-button) {
  padding: 12px 20px;
  font-size: 14px;
}

:deep(.el-button + .el-button) {
  margin-left: 12px;
}
</style> 