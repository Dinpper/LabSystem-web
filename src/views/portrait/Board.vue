<template>
  <div class="board-wrapper">
    <div class="main-content">
      <el-container>
        <el-header id="header">
          <el-input
            v-model="searchQuery"
            placeholder="搜索学生姓名、标签、聚类结果或建议"
            clearable
            @input="filterStudents"
            style="width: 300px; margin-bottom: 20px;"
          />
          <div class="cluster-summary">
            <div v-for="(count, cluster) in clusterCounts" :key="cluster" class="cluster-item">
              {{ cluster }}: <el-tag type="success">{{ count }}</el-tag>
            </div>
          </div>
        </el-header>
        <el-main>
          <el-table :data="paginatedStudents" style="width: 100%">
            <el-table-column prop="name" label="学生姓名" width="180"></el-table-column>
            <el-table-column prop="tags" label="标签"></el-table-column>
            <el-table-column prop="cluster" label="聚类结果" width="180"></el-table-column>
            <el-table-column prop="suggestion" label="建议"></el-table-column>
          </el-table>
          <el-pagination
            background
            layout="prev, pager, next"
            :total="filteredStudents.length"
            :page-size="pageSize"
            :current-page.sync="currentPage"
            @current-change="handlePageChange"
          />
        </el-main>
      </el-container>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Papa from 'papaparse';
import axios from 'axios';

const students = ref([]);
const filteredStudents = ref([]);
const pageSize = 15;
const currentPage = ref(1);
const searchQuery = ref('');
const clusterCounts = ref({});

const tagMap = {
  'Java开发': '后端开发',
  'Python算法': '数据分析',
  '前端开发': '前端开发',
  'Buu高手': 'CTFer刷题',
  'PHP开发': '渗透测试',
  'Sql安全': 'sql',
  'Pwn方向':'二进制大神',
  'Web方向':'web安全',
  '善于复盘':'乐于复盘',
  'PPT制作':'汇报能手',
  '实践能力':'实践高手',
  '自学能力':'自主学习',
  '善用工具':'学习积极',
  '功能开发':'核心能力',
  '区块链':'前沿技术',
  '基础技能':'基础知识',
  '复习中':'复习巩固',
  '复现中':'技术复现',
  '实验':'实验操作',
 '密码方向':'加密技术',
 '编程能力':'编程能力',
 '协调合作':'系统接口',
 '数据处理':'数据处理',
 '整理归纳':'信息整理',
 'IO流':'文件管理',
 '文档阅读':'文档编写',
 '设计方案':'解决方案',
 '框架学习':'技术框架',
 '模型调优':'数据模型',
 '比赛主力':'竞赛活动',
 '安全研究':'安全研究',
 '测试运维':'质量测试',
 '漏洞挖掘':'安全漏洞',
 '理解能力':'概念理解',
 '知识点':'知识要点',
 '乐于钻研':'学术研究',
 '算法能力':'计算算法',
 '系统思想':'系统架构',
 '大工作量':'代码编写',
 '安全脚本':'脚本开发',
 '图像视频处理':'视频制作',
 '小组交流':'学术讨论',
 '论文能力':'学术论文',
 '调研意识':'市场调研',
 '逆向方向':'逆向工程',
 'UI设计':'网页设计',
 '项目大佬':'项目管理',
 '兼顾课程':'学业优秀',

  // 添加其他映射
};

const suggestions = [
  '建议加强项目实践',
  '建议参与更多竞赛',
  '建议提升理论知识',
  '建议参与科研项目',
  '建议学习新的编程语言',
  '建议定期进行技术分享',
  '建议阅读专业书籍和论文',
  '建议关注行业动态和技术趋势',
  '建议加入专业社区和论坛',
  '建议进行跨学科学习',
  '建议参加工作坊和研讨会',
  '建议寻找导师或指导者',
  '建议进行自我评估和反思',
  '建议建立个人品牌和在线影响力',
  '建议关注健康和工作生活平衡',
  '建议学习项目管理和团队协作',
  '建议探索开源项目和贡献代码',
  '建议定期进行技术面试练习',
  '建议学习数据科学和机器学习',
  '建议提升公共演讲和表达能力',
  '建议学习敏捷开发和Scrum框架',
  '建议关注网络安全和隐私保护',
  '建议学习用户体验和界面设计',
  '建议参与创业项目和孵化器',
  '建议学习区块链和加密货币技术',
  '建议提升领导力和管理能力',
  '建议学习云计算和分布式系统',
  '建议参与国际会议和交流项目',
  '建议学习人工智能和深度学习',
  '建议提升问题解决和创新思维',
  '建议学习产品管理和市场分析',
  '建议参与行业咨询和顾问工作',
  '建议学习游戏开发和虚拟现实',
  '建议提升英语和跨文化交流能力',
  '建议学习法律和知识产权保护',
  '建议参与环境和社会责任项目',
  '建议学习金融科技和区块链应用',
  '建议提升团队管理和领导力',
  '建议学习数据分析和商业智能',
  '建议参与社会创新和公益项目'
];

const fetchCSVData = async () => {
  const response = await axios.get('/src/students_clustered.csv');
  Papa.parse(response.data, {
    header: true,
    complete: (results) => {
      students.value = results.data.map((row) => ({
        name: row['学生姓名'],
        tags: Object.keys(tagMap).filter(key => row[key] > 0).map(key => tagMap[key]).join(', '),
        cluster: row['聚类名称'],
        suggestion: suggestions[Math.floor(Math.random() * suggestions.length)]
      }));
      filteredStudents.value = students.value;
      updateClusterCounts();
    }
  });
};

const updateClusterCounts = () => {
  const counts = {};
  students.value.forEach(student => {
    if (student.cluster) {
      counts[student.cluster] = (counts[student.cluster] || 0) + 1;
    }
  });
  clusterCounts.value = counts;
};

const filterStudents = () => {
  const query = searchQuery.value.toLowerCase();
  filteredStudents.value = students.value.filter(student => {
    const name = student.name ? student.name.toLowerCase() : '';
    const tags = student.tags ? student.tags.toLowerCase() : '';
    const cluster = student.cluster ? student.cluster.toLowerCase() : '';
    const suggestion = student.suggestion ? student.suggestion.toLowerCase() : '';

    return (
      name.includes(query) ||
      tags.includes(query) ||
      cluster.includes(query) ||
      suggestion.includes(query)
    );
  });
  currentPage.value = 1; // 重置到第一页
};

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredStudents.value.slice(start, end);
});

const handlePageChange = (page) => {
  currentPage.value = page;
};

onMounted(() => {
  fetchCSVData();
});
</script>

<style scoped>
.board-wrapper {
  height: calc(100vh - 84px); /* 减去顶部导航栏的高度 */
  overflow-y: auto;
}

/* 自定义滚动条样式 */
.board-wrapper::-webkit-scrollbar {
  width: 8px;
}

.board-wrapper::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.board-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  transition: background 0.3s;
}

.board-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

#header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.main-content {
  padding: 20px;
  background: linear-gradient(to right, #f3e7e9, #e3eeff);
  color: #333;
}

.el-header {
  background-color: #fff;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cluster-summary {
  margin-top: 10px;
  font-size: 13px;
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
}

.cluster-item {
  margin-right: 15px;
}

.el-main {
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style> 