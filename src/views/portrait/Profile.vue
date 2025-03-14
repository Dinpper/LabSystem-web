<template>
  <div class="main-content">
    <el-card class="profile-card">
      <div class="avatar-section">
        <img :src="user.avatar" alt="用户头像" class="avatar" />
      </div>
      <div class="info-section">
        <el-descriptions column="1" border>
          <el-descriptions-item label="昵称">{{ user.nickname }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ user.studentId }}</el-descriptions-item>
          <el-descriptions-item label="性别">
            <el-radio-group v-model="user.gender" size="small">
              <el-radio label="男">男</el-radio>
              <el-radio label="女">女</el-radio>
            </el-radio-group>
          </el-descriptions-item>
          <el-descriptions-item label="电话">{{ user.phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ user.email }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ user.grade }}</el-descriptions-item>
          <el-descriptions-item label="班级">{{ user.class }}</el-descriptions-item>
          <el-descriptions-item label="所属分组">{{ user.group }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const user = ref({
  avatar: 'https://n.sinaimg.cn/sinakd10111/416/w640h576/20200512/267e-itmiwrz2548879.jpg', // 使用指定的头像URL
  nickname: '庞嘉豪',
  studentId: '2021212205223',
  gender: '男',
  phone: '15336551316',
  email: 'zhangsan@example.com',
  grade: '大四',
  class: '计算机科学与技术',
  group: '开发组'
});
</script>

<style scoped>
.main-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(to right, #f3e7e9, #e3eeff); /* 修改背景色 */
}

.profile-card {
  width: 70%; /* 占据浏览器的一半宽度 */
  padding: 20px;
  background: linear-gradient(145deg, #ffffff, #e6e6e6);
  border-radius: 15px;
  box-shadow: 8px 8px 15px #b8b9be, -8px -8px 15px #ffffff;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.profile-card:hover {
  transform: translateY(-10px);
  box-shadow: 12px 12px 20px #b8b9be, -12px -12px 20px #ffffff;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.avatar {
  width: 400px; /* 放大4倍 */
  height: 400px; /* 放大4倍 */
  border-radius: 50%;
  border: 4px solid #ddd;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  object-fit: cover; /* 确保图片填充圆形框 */
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.info-section {
  text-align: center;
}

.el-descriptions-item__label {
  font-weight: bold;
}
</style> 