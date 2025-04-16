<template>
  <div class="main-content">
    <el-card class="chat-card">
      <div class="chat-window" ref="chatWindow">
        <div v-for="(message, index) in messages" :key="index" :class="['message', message.type]">
          <span>{{ message.text }}</span>
        </div>
      </div>
      <el-input
        v-model="input"
        placeholder="输入你的问题..."
        @keyup.enter="sendMessage"
        class="chat-input"
      ></el-input>
      <el-button type="primary" @click="sendMessage" class="send-button">发送</el-button>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElLoading } from 'element-plus';
import { useRoute } from 'vue-router';
import request from '@/utils/request'
// 导入 CSV 文件
import csvData from '@/assets/students_clustered.csv?raw';
import {useUserStore} from "@/stores/user.js";


const route = useRoute();
const userStore = useUserStore();
const messages = ref([
  { text: '你好！有什么我可以帮助你的吗？', type: 'bot' }
]);

const input = ref('');
let loadingInstance = null;
const promptData = ref([]); // 改为响应式数据

// 获取学生关键词
const loadStudentKeywords = async () => {
  try {
    // const response = await axios.get('/src/students_clustered.csv');
    // const csvData = response.data;

    // 解析 CSV 数据
    const rows = csvData.split('\n');
    const headers = rows[0].split(',');
    const username = userStore.userName || '庞嘉豪';
    const studentIndex = rows.findIndex(row => row.includes(username));

    if (studentIndex === -1) {
      throw new Error('未找到指定学生');
    }

    const studentData = rows[studentIndex].split(',');
    
    // 获取关键词及其权重
    const keywords = headers.slice(1, -2).map((header, index) => ({
      name: header,
      value: parseFloat(studentData[index + 1]) || 0
    }));

    // 过滤并排序关键词
    const filteredKeywords = keywords
      .filter(keyword => keyword.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map(keyword => keyword.name);

    promptData.value = filteredKeywords;
    console.log('已加载学生关键词:', promptData.value);
  } catch (error) {
    console.error('Error loading keywords:', error);
    promptData.value = ['java', '项目', '开发']; // 使用默认值
  }
};

const sendMessage = async () => {
  if (input.value.trim() !== '') {
    messages.value.push({ text: input.value, type: 'user' });
    const userInput = input.value;
    input.value = '';
    loadingInstance = ElLoading.service({ target: '.chat-window' });
    try {
      const response = await request.post('/agent/ask', {
        prompt: promptData.value,
        question: userInput
      });
      console.log('完整返回内容：', response);
      console.log(response.data);
      simulateBotResponse(response.data.msg);

    } catch (error) {
      console.error('Error fetching response:', error);
      messages.value.push({ text: '抱歉，无法获取回答。', type: 'bot' });
    } finally {
      if (loadingInstance) loadingInstance.close();
    }
  }
};

const simulateBotResponse = (fullText) => {
  let currentText = '';
  const interval = setInterval(() => {
    if (currentText.length < fullText.length) {
      currentText += fullText[currentText.length];
      if (messages.value[messages.value.length - 1].type === 'bot') {
        messages.value[messages.value.length - 1].text = currentText;
      } else {
        messages.value.push({ text: currentText, type: 'bot' });
      }
      scrollToBottom();
    } else {
      clearInterval(interval);
    }
  }, 10);
};

const scrollToBottom = () => {
  const chatWindow = document.querySelector('.chat-window');
  chatWindow.scrollTop = chatWindow.scrollHeight;
};

onMounted(async () => {
  await loadStudentKeywords(); // 加载学生关键词
  scrollToBottom();
});
</script>

<style scoped>
.main-content {
  padding: 20px;
  background: linear-gradient(to right, #f3e7e9, #e3eeff);
  color: #333;
  min-height: 100vh;
}

.chat-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  height: 630px;
  display: flex;
  flex-direction: column;
}

.chat-window {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  height: 500px;
}

.message {
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 8px;
  display: block;
  width: calc(100% - 20px);
  word-wrap: break-word;
}

.message.user {
  background-color: #e6f7ff;
  text-align: right;
}

.message.bot {
  background-color: #f0f0f0;
}

.chat-input {
  margin-bottom: 10px;
  height: 50px;
}

.send-button {
  align-self: flex-end;
}
</style>