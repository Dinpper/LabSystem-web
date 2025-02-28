import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

export const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { 
      title: '登录', 
      requiresAuth: false,
      hideInMenu: true  // 在菜单中隐藏
    }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { 
          title: '首页', 
          icon: 'House', 
          requiresAuth: true,
          roles: ['allLeader', 'user']
        }
      }
    ]
  },
  {
    path: '/checkin',
    component: Layout,
    name: 'CheckInManage',
    meta: { title: '签到管理', icon: 'Timer', roles: ['allLeader', 'user'] },
    children: [
      {
        path: 'display',
        name: 'CheckInDisplay',
        component: () => import('@/views/checkin/display.vue'),
        meta: { title: '签到显示', icon: 'Monitor', requiresAuth: true, roles: ['allLeader', 'user'] }
      },
      {
        path: 'statistics',
        name: 'CheckInStatistics',
        component: () => import('@/views/checkin/statistics.vue'),
        meta: { title: '签到统计', icon: 'DataLine', requiresAuth: true, roles: ['allLeader', 'user'] }
      },
      {
        path: 'record',
        name: 'CheckInRecord',
        component: () => import('@/views/checkin/record.vue'),
        meta: { title: '签到记录', icon: 'List', requiresAuth: true, roles: ['allLeader', 'user'] }
      }
    ]
  },
  {
    path: '/report',
    component: Layout,
    redirect: '/report/daily',
    name: 'Report',
    meta: { title: '报告管理', icon: 'Document', roles: ['allLeader', 'user'] },
    children: [
      {
        path: 'daily',
        name: 'Daily',
        component: () => import('@/views/report/daily.vue'),
        meta: { title: '报告提交', icon: 'Edit', requiresAuth: true, roles: ['allLeader', 'user'] }
      },
      {
        path: 'list',
        name: 'ReportList',
        component: () => import('@/views/report/list.vue'),
        meta: { title: '报告记录', icon: 'Files', requiresAuth: true, roles: ['allLeader', 'user'] }
      }
    ]
  },
  {
    path: '/meeting',
    component: Layout,
    name: 'MeetingManage',
    meta: { title: '会议', icon: 'Calendar', roles: ['allLeader', 'user'] },
    children: [
      {
        path: 'schedule',
        name: 'MeetingSchedule',
        component: () => import('@/views/meeting/schedule.vue'),
        meta: { title: '会议发布', icon: 'AlarmClock', requiresAuth: true, roles: ['allLeader', 'user'] }
      },
      {
        path: '',
        name: 'Meeting',
        component: () => import('@/views/meeting/index.vue'),
        meta: { title: '会议记录', icon: 'Bell', requiresAuth: true, roles: ['allLeader', 'user'] }
      }
    ]
  },
  {
    path: '/leave',
    component: Layout,
    children: [
      {
        path: '',
        name: 'Leave',
        component: () => import('@/views/leave/index.vue'),
        meta: { title: '请假', icon: 'Timer', requiresAuth: true, roles: ['allLeader', 'user'] }
      }
    ]
  },
  {
    path: '/project',
    component: Layout,
    redirect: '/project/my',
    name: 'Project',
    meta: { title: '项目管理', icon: 'Folder', roles: ['allLeader', 'user'] },
    children: [
      {
        path: 'my',
        name: 'MyProjects',
        component: () => import('@/views/project/my.vue'),
        meta: { title: '相关项目', icon: 'Collection', requiresAuth: true, roles: ['allLeader', 'user'] }
      },
      {
        path: 'all',
        name: 'AllProjects',
        component: () => import('@/views/project/all.vue'),
        meta: { title: '全部项目', icon: 'Grid', requiresAuth: true, roles: ['allLeader', 'user'] }
      }
    ]
  },
  {
    path: '/achievement',
    component: Layout,
    name: 'Achievement',
    meta: { title: '成果管理', icon: 'Medal', roles: ['allLeader', 'user'] },
    children: [
      {
        path: 'study',
        name: 'Study',
        component: () => import('@/views/achievement/study.vue'),
        meta: { title: '学习收获', icon: 'Reading', roles: ['allLeader', 'user'] }
      },
      {
        path: 'award',
        name: 'Award',
        component: () => import('@/views/achievement/award.vue'),
        meta: { title: '获奖情况', icon: 'Trophy', roles: ['allLeader', 'user'] }
      }
    ]
  },
  {
    path: '/organization',
    component: Layout,
    name: 'Organization',
    meta: { 
      title: '组织管理', 
      icon: 'Operation',
      roles: ['allLeader'],
      roles: ['allLeader', 'user']
    },
    children: [
      {
        path: 'members',
        name: 'Members',
        component: () => import('@/views/organization/members.vue'),
        meta: { 
          title: '人员管理', 
          icon: 'User', 
          requiresAuth: true,
          roles: ['allLeader', 'user']
        }
      },
      {
        path: 'groups',
        name: 'Groups',
        component: () => import('@/views/organization/groups.vue'),
        meta: { 
          title: '小组管理', 
          icon: 'UserFilled', 
          requiresAuth: true,
          roles: ['allLeader', 'user']
        }
      }
    ]
  },
  {
    path: '/profile',
    component: Layout,
    children: [
      {
        path: '',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: '个人设置', icon: 'User', requiresAuth: true, roles: ['allLeader', 'user'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 如果是访问登录页
  if (to.path === '/login') {
    if (localStorage.getItem('userRole')) {
      next({ path: '/dashboard' })
    } else {
      next()
    }
    return
  }

  // 检查是否登录
  const userRole = localStorage.getItem('userRole')
  if (!userRole) {
    next({ path: '/login' })
    return
  }

  // 检查权限
  if (to.matched.some(record => record.meta.roles)) {
    const hasPermission = to.matched.every(record => {
      if (record.meta && record.meta.roles) {
        return record.meta.roles.includes(userRole)
      }
      return true
    })

    if (hasPermission) {
      next()
    } else {
      ElMessage.error('没有访问权限')
      next('/dashboard')
    }
    return
  }

  next()
})

export default router 