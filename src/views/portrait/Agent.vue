<template>
  <div class="agent-wrapper">
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElLoading } from 'element-plus';

const messages = ref([
  { text: '你好！有什么我可以帮助你的吗？', type: 'bot' }
]);

const input = ref('');
let loadingInstance = null; // 用于存储加载实例

// 示例测试数据
const promptData = [
  "java",
  "项目",
  "开发"
];

const sendMessage = async () => {
  if (input.value.trim() !== '') {
    messages.value.push({ text: input.value, type: 'user' });
    const userInput = input.value;
    input.value = '';
    loadingInstance = ElLoading.service({ target: '.chat-window' }); // 开始加载
    try {
      const response = await axios.post('http://172.22.236.90:8880/agent/ask', {
        prompt: promptData,
        question: userInput
      });
      simulateBotResponse(response.data);
    } catch (error) {
      console.error('Error fetching response:', error);
      messages.value.push({ text: '抱歉，无法获取回答。', type: 'bot' });
    } finally {
      if (loadingInstance) loadingInstance.close(); // 结束加载
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

onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped>
.agent-wrapper {
  height: calc(100vh - 84px); /* 减去顶部导航栏的高度 */
  overflow-y: auto;
}

.main-content {
  padding: 20px;
  background: linear-gradient(to right, #f3e7e9, #e3eeff);
  color: #333;
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

/* 自定义滚动条样式 */
.agent-wrapper::-webkit-scrollbar {
  width: 8px;
}

.agent-wrapper::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.agent-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  transition: background 0.3s;
}

.agent-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>