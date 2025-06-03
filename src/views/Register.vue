<template>
  <div class="register-container">
    <el-card class="register-card">
      <h2 class="register-title">用户注册</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="账号" prop="account">
          <el-input v-model="form.account" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>
        <el-form-item label="姓名" prop="userName">
          <el-input v-model="form.userName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="sex">
          <el-select v-model="form.sex" placeholder="请选择性别">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入电话号码" />
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-input v-model="form.grade" placeholder="例如：2025" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="所属小组" prop="groupName">
          <el-select v-model="form.groupName" placeholder="新用户无小组，请选：暂无小组">
            <el-option
              v-for="group in groupOptions"
              :key="group"
              :label="group"
              :value="group"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学号" prop="stuNumber">
          <el-input v-model="form.stuNumber" placeholder="请输入学号" />
        </el-form-item>
        <el-form-item label="班级" prop="className">
          <el-input v-model="form.className" placeholder="例如：计科211" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRegister">注册</el-button>
          <el-button @click="goLogin">返回登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref(null)
const form = ref({
  account: '',
  password: '',
  confirmPassword: '',
  userName: '',
  sex: '',
  phone: '',
  grade: '',
  email: '',
  groupName: '',
  stuNumber: '',
  className: ''
})

// 小组下拉选项
const groupOptions = ref([])
const fetchGroups = async () => {
  try {
    const response = await fetch('/api/group/queryGroupsList', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await response.json()
    if (data.code === '200') {
      groupOptions.value = data.data || []
    }
  } catch (e) {
    groupOptions.value = []
  }
}
onMounted(() => {
  fetchGroups()
})

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  userName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  sex: [{ required: true, message: '请选择性别', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入电话号码', trigger: 'blur' },
    { pattern: /^\d{11}$/, message: '电话号码必须为11位数字', trigger: 'blur' }
  ],
  grade: [{ required: true, message: '请输入年级', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: ['blur', 'change'] }
  ],
  groupName: [{ required: true, message: '请输入所属小组', trigger: 'blur' }],
  stuNumber: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { pattern: /^\d{13}$/, message: '学号必须为13位数字', trigger: 'blur' }
  ],
  className: [{ required: true, message: '请输入班级', trigger: 'blur' }]
}

const handleRegister = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请先填完信息')
      return
    }
    try {
      const payload = {
        ...form.value,
        sex: form.value.sex === '男' ? 0 : 1
      }
      delete payload.confirmPassword
      const response = await fetch('/api/login/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      if (data.code === '200') {
        ElMessage.success('注册成功，请登录')
        router.push('/login')
      } else {
        ElMessage.error(data.message || '注册失败')
      }
    } catch (error) {
      ElMessage.error('注册失败，请稍后重试')
    }
  })
}

const goLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f6fa;
}
.register-card {
  width: 420px;
  padding: 32px 24px 16px 24px;
  border-radius: 12px;
}
.register-title {
  text-align: center;
  margin-bottom: 24px;
  font-size: 22px;
  color: #303133;
}
</style> 