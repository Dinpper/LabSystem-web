<template>
  <div class="system-config-container">
    <!-- 报告发送设置 -->
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>报告发送设置</span>
          <div class="current-status">
            <span class="status-label">当前状态：</span>
            <el-tag :type="getReportTagType(currentReportType)">
              {{ getReportTypeText(currentReportType) }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-form :model="reportForm" label-width="120px">
        <el-form-item label="发送方式">
          <el-radio-group v-model="reportForm.reportSendType">
            <el-radio label="0">不发送邮件</el-radio>
            <el-radio label="1">日报</el-radio>
            <el-radio label="2">周报</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleSaveReport"
            :loading="reportSaving"
          >
            {{ reportSaving ? '保存中...' : '保存设置' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 节假日设置 -->
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>节假日设置</span>
          <div class="current-status">
            <span class="status-label">当前状态：</span>
            <el-tag :type="getHolidayTagType(currentHolidayType)">
              {{ getHolidayText(currentHolidayType) }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-form :model="holidayForm" label-width="120px">
        <el-form-item label="节假日处理">
          <el-radio-group v-model="holidayForm.skipHoliday">
            <el-radio label="0">不跳过节假日</el-radio>
            <el-radio label="1">跳过节假日</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleSaveHoliday"
            :loading="holidaySaving"
          >
            {{ holidaySaving ? '保存中...' : '保存设置' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const currentReportType = ref('0')
const currentHolidayType = ref('0')

const reportForm = ref({
  reportSendType: '0'
})

const holidayForm = ref({
  skipHoliday: '0'
})

const reportSaving = ref(false)
const holidaySaving = ref(false)

// 获取报告类型文本
const getReportTypeText = (type) => {
  const types = {
    '0': '不发送邮件',
    '1': '日报',
    '2': '周报'
  }
  return types[type] || '未设置'
}

// 获取报告标签类型
const getReportTagType = (type) => {
  const types = {
    '0': 'info',
    '1': 'success',
    '2': 'warning'
  }
  return types[type] || 'info'
}

// 获取节假日文本
const getHolidayText = (type) => {
  return type === '1' ? '跳过节假日' : '不跳过节假日'
}

// 获取节假日标签类型
const getHolidayTagType = (type) => {
  return type === '1' ? 'success' : 'info'
}

// 获取报告发送配置
const getReportConfig = async () => {
  try {
    const response = await request.post('/systemConfig/queryReportType')
    if (response.data.code === '200') {
      reportForm.value.reportSendType = response.data.msg
      currentReportType.value = response.data.msg
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
      currentHolidayType.value = response.data.msg
    }
  } catch (error) {
    console.error('获取节假日配置失败:', error)
    ElMessage.error('获取节假日配置失败')
  }
}

// 保存报告发送设置
const handleSaveReport = async () => {
  reportSaving.value = true
  try {
    // 检查是否有变化
    const response = await request.post('/systemConfig/queryReportType')
    if (response.data.code === '200' && response.data.msg === reportForm.value.reportSendType) {
      ElMessage.info('配置未发生变化')
      return
    }

    const saveResponse = await request.post('/systemConfig/updateReportType', {
      configValue: reportForm.value.reportSendType
    })
    if (saveResponse.data.code === '200') {
      ElMessage.success('保存成功')
      currentReportType.value = reportForm.value.reportSendType
    }
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存失败')
  } finally {
    reportSaving.value = false
  }
}

// 保存节假日设置
const handleSaveHoliday = async () => {
  holidaySaving.value = true
  try {
    // 检查是否有变化
    const response = await request.post('/systemConfig/queryIsSkipHolidays')
    if (response.data.code === '200' && response.data.msg === holidayForm.value.skipHoliday) {
      ElMessage.info('配置未发生变化')
      return
    }

    const saveResponse = await request.post('/systemConfig/updateIsSkipHolidays', {
      configValue: holidayForm.value.skipHoliday
    })
    if (saveResponse.data.code === '200') {
      ElMessage.success('保存成功')
      currentHolidayType.value = holidayForm.value.skipHoliday
    }
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存失败')
  } finally {
    holidaySaving.value = false
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
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.current-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  color: #606266;
  font-size: 14px;
}

.el-form {
  margin-top: 20px;
  padding: 20px;
}

.el-form-item {
  margin-bottom: 30px;
}

.el-radio-group {
  margin-left: 20px;
}

/* 美化单选框样式 */
:deep(.el-radio) {
  margin-right: 30px;
}

:deep(.el-radio__label) {
  font-size: 14px;
  padding-left: 8px;
}

/* 标签样式 */
:deep(.el-tag) {
  padding: 0 12px;
  height: 28px;
  line-height: 26px;
  font-size: 13px;
}
</style> 