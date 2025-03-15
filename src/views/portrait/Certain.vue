<template>
  <div class="portrait-wrapper">
    <div class="main-content">
      <el-row :gutter="20">
        <el-col :span="7">
          <el-card class="info-card" shadow="hover">
            <div class="info-header">
              <img src="../../assets/avatar.jpg" alt="头像" class="avatar" />
              <div class="info-details">
                <p>姓名: {{ userInfo.userName || '--' }}</p>
                <p>学号: {{ userInfo.stuNumber || '--' }}</p>
                <p>专业: {{ userInfo.className || '--' }}</p>
                <p>年级: {{ userInfo.grade || '--' }}</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="17">
          <el-card class="tag-cloud-card" shadow="hover">
            <div class="tag-cloud-container">
              <div id="tagCloud" class="tag-cloud">
                <p v-if="!keywordsLoaded" class="placeholder-text">快来看看你的keywords吧！</p>
              </div>
              <el-button type="primary" @click="loadKeywords" class="load-button">加载关键词</el-button>
              <el-button type="success" @click="downloadReport" class="download-button">下载我的年度报告</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card class="radar-chart-card" shadow="hover">
            <div id="radarChart" class="radar-chart"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="pie-chart-card" shadow="hover">
            <div id="pieChart" class="pie-chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue';
import * as echarts from 'echarts';
// import 'echarts-wordcloud/dist/echarts-wordcloud.min.js';
import 'echarts-wordcloud'
import request from '@/utils/request'
import axios from 'axios';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
// 导入 CSV 文件
import csvData from '@/assets/students_clustered.csv?raw';

const route = useRoute();
const userStore = useUserStore();
const keywordsLoaded = ref(false);
let tagCloudChart = null;  // 存储图表实例
const userInfo = ref({});

const loadKeywords = async () => {
  try {

    // 解析 CSV 数据
    const rows = csvData.split('\n');
    const headers = rows[0].split(',');
    const username = userStore.userName || '庞嘉豪';
    const studentIndex = rows.findIndex(row => row.includes(username));

    if (studentIndex === -1) {
      throw new Error('未找到指定学生');
    }

    const studentData = rows[studentIndex].split(',');
    const keywords = headers.slice(1, -2).map((header, index) => ({
      name: header,
      value: parseFloat(studentData[index + 1]) || 0
    }));

    const filteredKeywords = keywords.filter(keyword => keyword.value > 0);

    console.log('读取到的关键词:', filteredKeywords);

    // 如果已存在实例，先销毁
    if (tagCloudChart) {
      tagCloudChart.dispose();
    }
    // 创建新实例
    tagCloudChart = echarts.init(document.getElementById('tagCloud'));
    const tagCloudOption = {
      series: [{
        type: 'wordCloud',
        sizeRange: [10, 50],
        rotationRange: [-45, 45],
        textStyle: {
          normal: {
            color: function () {
              return 'rgb(' + [
                Math.round(Math.random() * 160),
                Math.round(Math.random() * 160),
                Math.round(Math.random() * 160)
              ].join(',') + ')';
            }
          }
        },
        data: filteredKeywords
      }]
    };

    tagCloudChart.setOption(tagCloudOption);
    keywordsLoaded.value = true;
  } catch (error) {
    console.error('Error loading keywords:', error);
  }
};

const downloadReport = async () => {
  try {
    const postElements = {
      username: '庞嘉豪',
      totalHour: '120',
      totalReport: '15',
      totalNum: '15000',
      percentage: '85',
      kw1: '编程',
      kw2: '数据分析',
      kw3: '项目管理',
      kw4: '团队合作'
    };

    const response = await axios.post('http://172.22.236.90:8880/user/post', postElements, {
      responseType: 'blob' // 确保接收的是二进制数据
    });

    // 创建一个下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '年度报告.png'); // 设置下载文件名
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading report:', error);
  }
};

const calculateAbilityScores = (keywords) => {
  // 定义能力指标类别
  const abilityCategories = {
    '技术实践能力': [
      'Java开发', 'PHP开发', '前端开发', '功能开发', 'Python算法', 
      'Web方向', 'Pwn方向', '密码方向', '逆向方向', '安全脚本',
      '图像视频处理', 'UI设计', '测试运维', '框架学习'
    ],
    '学习钻研能力': [
      '自学能力', '乐于钻研', '知识点', '文档阅读', '基础技能',
      '复习中', '复现中', '刷题能力', '理解能力', '算法能力'
    ],
    '项目管理能力': [
      '项目大佬', '设计方案', '调研意识', '系统思想', '整理归纳',
      '善用工具', '善于复盘', '大工作量'
    ],
    '创新研究能力': [
      '安全研究', '漏洞挖掘', 'Sql安全', '区块链', '模型调优',
      '论文能力', 'Buu高手', '比赛主力'
    ],
    '团队协作能力': [
      '协调合作', '小组交流', '兼顾课程'
    ],
    '抗压适应能力': [
      '大工作量', '实验', '数据处理', 'IO流', '实践能力'
    ]
  };

  // 初始化得分
  let scores = {};
  for (let category in abilityCategories) {
    scores[category] = 0;
  }

  // 计算每个类别的总分
  keywords.forEach(keyword => {
    for (let category in abilityCategories) {
      if (abilityCategories[category].includes(keyword.name)) {
        scores[category] += keyword.value;
      }
    }
  });

  // 归一化处理（确保总和为100）
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  if (total > 0) {
    for (let category in scores) {
      scores[category] = Math.round((scores[category] / total) * 100);
    }
  }

  return scores;
};

// 获取用户信息
const getUserInfo = async () => {
  try {
    const response = await request.post('/user/queryUserMessage', {
      account: userStore.getAccount
    })
    
    if (response.data.code === '200') {
      userInfo.value = response.data.data;
    } else {
      console.error('获取用户信息失败:', response.data.message);
    }
  } catch (error) {
    console.error('获取用户信息出错:', error);
  }
};

onMounted(async () => {
  await nextTick(); // 确保 DOM 元素已加载
  await getUserInfo(); // 获取用户信息

  // 获取并处理关键词数据
  try {
    // 直接使用导入的 csvData
    if (!csvData) {
      throw new Error('无法加载学生数据');
    }

    // 解析 CSV 数据
    const rows = csvData.split('\n');
    const headers = rows[0].split(',');
    const username = userStore.userName || '庞嘉豪';
    const studentIndex = rows.findIndex(row => row.includes(username));

    if (studentIndex === -1) {
      throw new Error('未找到指定学生');
    }

    const studentData = rows[studentIndex].split(',');
    const keywords = headers.slice(1, -2).map((header, index) => ({
      name: header,
      value: parseFloat(studentData[index + 1]) || 0
    }));

    const filteredKeywords = keywords.filter(keyword => keyword.value > 0);

    // 计算能力指标得分
    const abilityScores = calculateAbilityScores(filteredKeywords);

    // 初始化雷达图
    const radarChart = echarts.init(document.getElementById('radarChart'));
    const radarData = [800, 700, 600, 750, 850]; // 示例数据
    const totalScore = radarData.reduce((a, b) => a + b, 0);

    const radarOption = {
      title: {
        text: `总分: ${totalScore}`,
        left: 'center',
        top: '10%',
        textStyle: {
          color: '#333',
          fontSize: 16
        }
      },
      tooltip: {},
      radar: {
        indicator: [
          { name: '学习成绩', max: 1000 },
          { name: '竞赛能力', max: 1000 },
          { name: '实验室签到时长', max: 1000 },
          { name: '一技之长', max: 1000 },
          { name: '日报完善', max: 1000 }
        ],
        shape: 'circle',
        splitNumber: 5,
        radius: '70%',
        axisName: {
          color: '#333'
        },
        splitLine: {
          lineStyle: {
            color: ['#ddd']
          }
        },
        splitArea: {
          areaStyle: {
            color: ['#f3f3f3', '#fff']
          }
        }
      },
      series: [{
        name: '个人能力',
        type: 'radar',
        data: [
          {
            value: radarData,
            name: '能力值',
            areaStyle: {
              color: 'rgba(0, 128, 255, 0.3)'
            }
          }
        ]
      }]
    };

    radarChart.setOption(radarOption);

    // 初始化饼图
    const pieChart = echarts.init(document.getElementById('pieChart'));
    
    // 将能力指标得分转换为饼图数据
    const pieData = Object.entries(abilityScores).map(([name, value]) => ({
      name,
      value
    }));

    const pieOption = {
      title: {
        text: '能力分布',
        left: 'center',
        top: '10%',
        textStyle: {
          color: '#333',
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}%'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: Object.keys(abilityScores)
      },
      series: [
        {
          name: '能力',
          type: 'pie',
          radius: '50%',
          data: pieData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          itemStyle: {
            normal: {
              label: {
                show: true,
                formatter: '{b} ({c}%)'
              }
            }
          }
        }
      ]
    };

    pieChart.setOption(pieOption);
    
    // 保存关键词数据以供后续使用
    keywordsLoaded.value = true;

  } catch (error) {
    console.error('Error loading data:', error);
  }
});

// 组件卸载时清理图表实例
onUnmounted(() => {
  if (tagCloudChart) {
    tagCloudChart.dispose();
    tagCloudChart = null;
  }
})
</script>

<style scoped>
.portrait-wrapper {
  height: calc(100vh - 84px); /* 减去顶部导航栏的高度 */
  overflow-y: auto;
}

/* 自定义滚动条样式 */
.portrait-wrapper::-webkit-scrollbar {
  width: 8px;
}

.portrait-wrapper::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.portrait-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  transition: background 0.3s;
}

.portrait-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.main-content {
  padding: 20px;
  background: linear-gradient(to right, #f3e7e9, #e3eeff);
  color: #333;
}

.info-card {
  background: linear-gradient(to right, #f0f8ff, #e6e6fa);
  color: #333;
  padding: 20px;
  border-radius: 10px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 360px;
}

.info-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.info-header {
  display: flex;
  align-items: center;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-right: 20px;
}

.info-details p {
  margin: 20px;
}

.tag-cloud-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 400px;
  position: relative;
}

.tag-cloud-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.tag-cloud {
  width: 100%;
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-text {
  font-size: 18px;
  color: #888;
}

.load-button {
  margin-left: 10px;
}

.radar-chart-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 500px; /* 增加容器高度 */
  position: relative;
}

.radar-chart {
  width: 400px;
  height: 400px;
}

.pie-chart-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 500px;
  position: relative;
}

.pie-chart {
  width: 550px;
  height: 550px;
}

.download-button {
  margin-left: 10px;
}
</style> 