<template>
  <div class="timeline-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="timeline-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h2>学习成长轨迹</h2>
              <el-select v-model="selectedYear" placeholder="选择年份" style="width: 120px">
                <el-option
                  v-for="year in years"
                  :key="year"
                  :label="year + '年'"
                  :value="year"
                />
              </el-select>
            </div>
          </template>
          
          <div class="timeline-content">
            <el-timeline>
              <el-timeline-item
                v-for="(activity, index) in activities"
                :key="index"
                :timestamp="activity.time"
                :type="activity.type"
                :hollow="activity.type === 'success'"
              >
                <el-card class="activity-card">
                  <h4>{{ activity.title }}</h4>
                  <p>{{ activity.content }}</p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="stats-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>学习统计</h3>
            </div>
          </template>
          <div id="learningStats" class="stats-chart"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="achievement-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>成就展示</h3>
            </div>
          </template>
          <div class="achievement-list">
            <div v-for="(achievement, index) in achievements" :key="index" class="achievement-item">
              <el-icon><Trophy /></el-icon>
              <span>{{ achievement }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Trophy } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const route = useRoute();
const userStore = useUserStore();
const selectedYear = ref(new Date().getFullYear());
const years = [2021, 2022, 2023, 2024];
const activities = ref([]);

// 获取时间轴数据
const fetchTimelineData = async () => {
  try {
    const account = userStore.getAccount;
    console.log('发送请求参数:', { account, year: selectedYear.value });
    
    const response = await axios.post('http://172.22.236.90:8880/user/timeline', {
      account: account,
      year: selectedYear.value
    });
    
    console.log('收到响应:', response.data);
    
    if (response.data.code === '200' || response.data.code === 200) {
      activities.value = response.data.data.map(item => {
        // 解析日期字符串
        const date = new Date(item.reportDate);
        const formattedDate = `${date.getMonth() + 1}月${date.getDate()}日`;
        
        // 根据工作内容判断类型
        let type = 'primary';
        if (item.workContent.includes('完成')) {
          type = 'success';
        } else if (item.workContent.includes('问题') || item.workContent.includes('困难')) {
          type = 'warning';
        }

        return {
          time: formattedDate,
          title: "学习记录",
          content: item.workContent,
          type: type
        };
      });
      console.log('处理后的活动数据:', activities.value);
    } else {
      console.error('响应状态码不是200:', response.data);
      ElMessage.error(response.data.message || '获取数据失败');
    }
  } catch (error) {
    console.error('获取时间轴数据失败:', error);
    ElMessage.error('获取数据失败，请稍后重试');
  }
};

// 监听年份变化
watch(selectedYear, () => {
  fetchTimelineData();
});

const achievements = [
  '实验室优秀成员',
  '项目开发先进个人',
  '技能提升标兵',
  '团队协作之星'
];

onMounted(async () => {
  await fetchTimelineData(); // 获取时间轴数据
  
  // 初始化学习统计图表
  const statsChart = echarts.init(document.getElementById('learningStats'));
  const option = {
    title: {
      text: '月度学习时长统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value',
      name: '学习时长(小时)'
    },
    series: [{
      data: [120, 132, 101, 134, 90, 230],
      type: 'line',
      smooth: true,
      areaStyle: {
        opacity: 0.3
      }
    }]
  };
  statsChart.setOption(option);
});
</script>

<style scoped>
.timeline-container {
  padding: 20px;
  background: linear-gradient(to right, #f3e7e9, #e3eeff);
  min-height: 100vh;
}

.timeline-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-content {
  padding: 20px 0;
}

.activity-card {
  margin-bottom: 10px;
}

.activity-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.activity-card p {
  margin: 0;
  color: #666;
}

.activity-stats {
  margin-top: 10px;
}

.stats-chart {
  height: 300px;
}

.achievement-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.achievement-item .el-icon {
  color: #e6a23c;
  font-size: 20px;
}
</style> 