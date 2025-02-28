import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    console.log('发送请求:', config.url, config.data)
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    console.log('响应数据:', response.data)
    if (response.data.code === '200') {
      return response
    } else {
      ElMessage.error(response.data.message || '操作失败')
      return Promise.reject(new Error(response.data.message || '操作失败'))
    }
  },
  error => {
    console.error('响应错误:', error.response || error)
    ElMessage.error(error.message || '请求失败')
    return Promise.reject(error)
  }
)

export default service 