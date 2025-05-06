# 创建个人分析组件
<template>
  <div class="analysis-container">
    <el-card class="analysis-card">
      <div class="analysis-header">
        <h2>个人分析</h2>
        <el-button type="primary" @click="generateAnalysis">生成分析</el-button>
      </div>
      <div v-if="rawContent" class="analysis-content">
        <pre>{{ rawContent }}</pre>
      </div>
      <div v-else class="empty-content">
        <el-empty description="暂无分析内容，点击上方按钮生成分析" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const rawContent = ref('')

const generateAnalysis = async () => {
  try {
    const response = await fetch('/api/user/generatePersonalSummary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        account: userStore.account
      })
    })

    if (!response.ok) {
      throw new Error('生成分析失败')
    }

    const data = await response.json()
    if (data.code === '200') {
      rawContent.value = data.msg
      ElMessage.success('生成分析成功')
    } else {
      throw new Error(data.message || '生成分析失败')
    }
  } catch (error) {
    console.error('生成分析失败:', error)
    ElMessage.error(error.message || '生成分析失败')
  }
}
</script>

<style scoped>
.analysis-container {
  padding: 20px;
}

.analysis-card {
  min-height: calc(100vh - 100px);
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.analysis-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.analysis-content {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.analysis-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  line-height: 1.8;
  color: #606266;
}

.empty-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

/* 添加过渡动画 */
.analysis-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 