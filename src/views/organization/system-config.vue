<template>
  <div class="system-config-container">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>系统配置</span>
        </div>
      </template>

      <el-form :model="configForm" label-width="120px">
        <!-- 报告发送配置 -->
        <el-form-item label="报告发送设置">
          <el-radio-group v-model="configForm.reportSendType">
            <el-radio :label="0">不发送邮件</el-radio>
            <el-radio :label="1">日报</el-radio>
            <el-radio :label="2">周报</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 节假日设置 -->
        <el-form-item label="节假日设置">
          <el-radio-group v-model="configForm.skipHoliday">
            <el-radio :label="0">不跳过节假日</el-radio>
            <el-radio :label="1">跳过节假日</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 保存按钮 -->
        <el-form-item>
          <el-button type="primary" @click="handleSave">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const configForm = ref({
  reportSendType: 0,
  skipHoliday: 0
})

// 获取配置
const getConfig = async () => {
  try {
    const response = await request.post('/system/getConfig')
    if (response.data.code === '200') {
      configForm.value = response.data.data
    }
  } catch (error) {
    console.error('获取配置失败:', error)
    ElMessage.error('获取配置失败')
  }
}

// 保存配置
const handleSave = async () => {
  try {
    const response = await request.post('/system/saveConfig', configForm.value)
    if (response.data.code === '200') {
      ElMessage.success('保存成功')
    }
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  getConfig()
})
</script>

<style scoped>
.system-config-container {
  padding: 20px;
}

.config-card {
  max-width: 800px;
  margin: 0 auto;
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