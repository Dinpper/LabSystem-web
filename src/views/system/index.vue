<template>
  <div class="system-config-container">
    <!-- 报告发送设置 -->
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>报告发送设置</span>
        </div>
      </template>

      <el-form :model="reportForm" label-width="120px">
        <el-form-item label="发送方式">
          <el-radio-group v-model="reportForm.reportSendType">
            <el-radio :label="0">不发送邮件</el-radio>
            <el-radio :label="1">日报</el-radio>
            <el-radio :label="2">周报</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSaveReport">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 节假日设置 -->
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>节假日设置</span>
        </div>
      </template>

      <el-form :model="holidayForm" label-width="120px">
        <el-form-item label="节假日处理">
          <el-radio-group v-model="holidayForm.skipHoliday">
            <el-radio :label="0">不跳过节假日</el-radio>
            <el-radio :label="1">跳过节假日</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSaveHoliday">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const reportForm = ref({
  reportSendType: '0'
})

const holidayForm = ref({
  skipHoliday: '0'
})

// 获取报告发送配置
const getReportConfig = async () => {
  try {
    const response = await request.post('/systemConfig/queryReportType')
    if (response.data.code === '200') {
      reportForm.value.reportSendType = response.data.msg
    }
  } catch (error) {
    console.error('获取报告发送配置失败:', error)
    ElMessage.error('获取报告发送配置失败')
  }
}

// 获取节假日配置
const getHolidayConfig = async () => {
  try {
    const response = await request.post('/systemConfig/queryIsSkipHolidays')
    if (response.data.code === '200') {
      holidayForm.value.skipHoliday = response.data.msg
    }
  } catch (error) {
    console.error('获取节假日配置失败:', error)
    ElMessage.error('获取节假日配置失败')
  }
}

// 保存报告发送设置
const handleSaveReport = async () => {
  // 检查是否有变化
  const response = await request.post('/systemConfig/queryReportType')
  if (response.data.code === '200' && response.data.msg === reportForm.value.reportSendType) {
    ElMessage.info('配置未发生变化')
    return
  }

  try {
    const response = await request.post('/systemConfig/updateReportType', {
      configValue: reportForm.value.reportSendType
    })
    if (response.data.code === '200') {
      ElMessage.success('保存成功')
    }
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存失败')
  }
}

// 保存节假日设置
const handleSaveHoliday = async () => {
  // 检查是否有变化
  const response = await request.post('/systemConfig/queryIsSkipHolidays')
  if (response.data.code === '200' && response.data.msg === holidayForm.value.skipHoliday) {
    ElMessage.info('配置未发生变化')
    return
  }

  try {
    const response = await request.post('/systemConfig/updateIsSkipHolidays', {
      configValue: holidayForm.value.skipHoliday
    })
    if (response.data.code === '200') {
      ElMessage.success('保存成功')
    }
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  getReportConfig()
  getHolidayConfig()
})
</script>

<style scoped>
.system-config-container {
  padding: 20px;
}

.config-card {
  max-width: 800px;
  margin: 0 auto 20px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.el-form {
  margin-top: 20px;
}

.el-form-item {
  margin-bottom: 30px;
}

.el-radio-group {
  margin-left: 20px;
}
</style> 