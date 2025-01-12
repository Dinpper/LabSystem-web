import { defineStore } from 'pinia'
import axios from 'axios'

export const useUserStore = defineStore('user', {
  state: () => {
    console.log('初始化 store state, localStorage account:', localStorage.getItem('account'))
    return {
      token: localStorage.getItem('token') || '',
      username: localStorage.getItem('username') || '',
      account: localStorage.getItem('account') || ''
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
        const response = await axios.post('/api/login/loginIn', loginForm)
        
        if (response.data.code === '200') {
          this.account = loginForm.account
          localStorage.setItem('account', loginForm.account)
          console.log('登录成功，保存账号:', this.account)
          
          const token = response.data.data?.token || 'dummy-token'
          this.token = token
          this.username = loginForm.account
          
          localStorage.setItem('token', token)
          localStorage.setItem('username', loginForm.account)
        }
        return response.data
      } catch (error) {
        console.error('Login error in store:', error)
        throw error
      }
    },

    logout() {
      this.token = ''
      this.username = ''
      this.account = ''
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      localStorage.removeItem('account')
    }
  }
}) 