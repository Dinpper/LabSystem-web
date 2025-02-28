import { defineStore } from 'pinia'
import axios from 'axios'

export const useUserStore = defineStore('user', {
  state: () => {
    console.log('初始化 store state, localStorage account:', localStorage.getItem('account'))
    return {
      token: localStorage.getItem('token') || '',
      userName: localStorage.getItem('userName') || '',
      account: localStorage.getItem('account') || '',
      role: localStorage.getItem('userRole') || ''
    }
  },

  getters: {
    getAccount: (state) => {
      const account = state.account || localStorage.getItem('account')
      console.log('getter getAccount 被调用:', account)
      return account
    }
  },

  actions: {
    async login(loginForm) {
      try {
        console.log('开始登录，账号:', loginForm.account)
        const response = await axios({
          method: 'post',
          url: '/api/login/loginIn',
          data: loginForm,
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.data.code === '200') {
          const { userName, role } = response.data.data
          
          this.userName = userName
          this.account = loginForm.account
          this.role = role
          
          localStorage.setItem('userName', userName)
          localStorage.setItem('account', loginForm.account)
          localStorage.setItem('userRole', role)
          
          console.log('登录成功，保存账号:', this.account)
        }
        return response.data
      } catch (error) {
        console.error('登录失败:', error)
        throw error
      }
    },

    logout() {
      this.token = ''
      this.userName = ''
      this.account = ''
      this.role = ''
      localStorage.removeItem('token')
      localStorage.removeItem('userName')
      localStorage.removeItem('account')
      localStorage.removeItem('userRole')
    }
  }
}) 