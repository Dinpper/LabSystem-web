<template>
  <div class="kmeans-wrapper">
    <div class="main-content">
      <el-row :gutter="20" justify="center" style="margin-top: 20px;">
        <el-col :span="24">
          <el-card class="image-card main-image" shadow="hover">
            <img src="../../assets/real_images/feature_distribution.png" alt="特征分布图" class="kmeans-image" />
          </el-card>
        </el-col>
        <el-col :span="24" style="margin-top: 20px;">
          <el-card class="explanation-card" shadow="hover">
            <div class="explanation-content">
              <h3 style="color: #2c3e50; font-size: 28px; font-weight: bold;">一、现象描述</h3>
              <p style="font-size: 18px; color: #555;">
                通过对本图和excel的深度分析，可以发现以下几个显著现象：
              </p>
              <h4 style="color: #e74c3c; font-size: 22px; font-weight: bold;">1. 安全领域技能方向人才分布不均</h4>
              <p style="font-size: 16px; color: #555;">
                数据中，"Pwn方向""逆向方向""漏洞挖掘""安全研究"等安全攻防类技能方向的数值普遍偏低，甚至部分学生在该类技能上的评分为0。例如：
              </p>
              <ul style="font-size: 16px; color: #555;">
                <li>Pwn方向：仅个别学生（如"刘晨"评分为3.636，"孙致远1"为3.402）显示较高能力，多数学生评分低于2.0。</li>
                <li>逆向方向：仅"吴童"等少数学生具备相关能力（评分为2.783），其他学生评分接近0。</li>
                <li>漏洞挖掘：仅"任伊侨"等极少数学生评分超过5.0，普遍集中在1.5以下。</li>
                <li>相比之下，"Java开发""Python算法""前端开发"等开发类技能的学生分布更广泛，例如"付悦榕"的Java开发评分为2.401，"方佳程"的Python算法达到1.934。</li>
              </ul>
              <h4 style="color: #e74c3c; font-size: 22px; font-weight: bold;">2. 聚类标签呈现"重开发、轻安全"的群体特征</h4>
              <p style="font-size: 16px; color: #555;">
                根据"聚类名称"分类：
              </p>
              <ul style="font-size: 16px; color: #555;">
                <li>"偏开发能力和实践动手"：聚类标签为3，覆盖超过40%的学生（如"付悦榕""余晨昊"），其技能集中在功能开发、算法实现和工具应用。</li>
                <li>"偏基础技能与安全测试"：标签为0，占比约30%，但实际安全技能（如Pwn、逆向）评分仍不突出，更多体现为"自学能力""刷题能力"等通用技能。</li>
                <li>"偏向某些特定领域技术"：标签为2，占比约15%，但多为孤立的高分技能（如"叶青晨"的密码方向3.837，"王涛"的Sql安全5.677），缺乏系统性安全能力。</li>
              </ul>
              <h4 style="color: #e74c3c; font-size: 22px; font-weight: bold;">3. 安全研究类技能与开发技能的正相关性弱</h4>
              <p style="font-size: 16px; color: #555;">
                数据显示，安全技能（如"逆向方向""漏洞挖掘"）与学生的基础开发能力（如"编程能力""算法能力"）相关性较低。例如：
              </p>
              <ul style="font-size: 16px; color: #555;">
                <li>"余程宇"在"Pwn方向"评分为2.708，但其"编程能力"仅为1.834，表明部分学生可能在特定领域有专长，但综合能力不足。</li>
                <li>"周芝林"在"安全脚本"上评分1.984，但"逆向方向"为0，反映安全技能的孤立性。</li>
              </ul>
              <h4 style="color: #e74c3c; font-size: 22px; font-weight: bold;">4. 实践能力和工具使用能力与安全技能脱节</h4>
              <p style="font-size: 16px; color: #555;">
                尽管多数学生在"实践能力""善用工具"等通用技能上评分较高（普遍1.5-2.0），但这些能力并未转化为安全领域的具体应用。例如：
              </p>
              <ul style="font-size: 16px; color: #555;">
                <li>"王一冕"的"实践能力"为1.612，"善用工具"为1.626，但"逆向方向"为0。</li>
                <li>"凌涛"的"刷题能力"达1.402，但"漏洞挖掘"仅1.454。</li>
              </ul>
              <h3 style="color: #2c3e50; font-size: 28px; font-weight: bold;">二、可能原因</h3>
              <h4 style="color: #e74c3c; font-size: 22px; font-weight: bold;">1. 教学资源与课程设计偏向开发领域</h4>
              <p style="font-size: 16px; color: #555;">
                资源设置失衡：网络安全实验室可能将更多资源分配给其他安全方向，而Pwn、逆向等安全方向仅作为选修或短期培训，导致学生缺乏系统学习路径。
              </p>

              <h4 style="color: #e74c3c; font-size: 22px; font-weight: bold;">2. 安全领域学习门槛高且缺乏实践场景</h4>
              <p style="font-size: 16px; color: #555;">
                技能复杂性：Pwn、逆向等方向需掌握汇编语言、操作系统底层原理和漏洞利用技术，学生易因难度放弃。
              </p>

              <h4 style="color: #e74c3c; font-size: 22px; font-weight: bold;">3. 行业认知与就业导向影响学生选择</h4>
              <p style="font-size: 16px; color: #555;">
                就业压力驱动：开发岗位需求量大且待遇明确，而安全岗位门槛高且早期薪资不具优势，导致学生优先选择开发技能。
              </p>
              <p style="font-size: 16px; color: #555;">
                安全意识薄弱：学生对网络安全的社会价值认知不足，误认为"开发技能是基础，安全是附加项"。
              </p>
              <h4 style="color: #e74c3c; font-size: 22px; font-weight: bold;">4. 评价体系与激励机制不完善</h4>
              <p style="font-size: 16px; color: #555;">
                考核偏向通用技能：现有评价体系可能更关注"刷题能力""项目开发"，而安全技能未被纳入核心指标。
              </p>
              <p style="font-size: 16px; color: #555;">
                缺乏正向激励：缺少针对安全研究的奖学金、认证奖励或竞赛荣誉，难以激发学生兴趣。
              </p>
              <h4 style="color: #e74c3c; font-size: 22px; font-weight: bold;">5. 安全领域工具链与社区支持不足</h4>
              <p style="font-size: 16px; color: #555;">
                工具分散且学习成本高：IDA Pro、GDB等工具需大量时间掌握，而实验室可能未提供系统培训。
              </p>
              <p style="font-size: 16px; color: #555;">
                社区参与度低：学生未融入开源安全项目或行业社区，导致知识更新滞后。
              </p>
              <h3 style="color: #2c3e50; font-size: 28px; font-weight: bold;">三、解决方案</h3>
              <h4 style="color: #e74c3c; font-size: 22px; font-weight: bold;">1. 重构课程体系，强化安全技能培养</h4>
              <p style="font-size: 16px; color: #555;">
                必修课整合：将"Pwn基础""逆向工程"纳入核心课程，与开发课程并行。例如，在Java开发课中融入安全编码实践。
              </p>
              <p style="font-size: 16px; color: #555;">
                模块化进阶路径：设计"入门（工具使用）→中级（漏洞分析）→高级（攻防实战）"的阶梯式课程，降低学习曲线。
              </p>
              <h4 style="color: #e74c3c; font-size: 22px; font-weight: bold;">2. 构建实战驱动的学习环境</h4>
              <p style="font-size: 16px; color: #555;">
                建立CTF竞赛平台：定期举办内部CTF，并与行业赛事（如DEF CON、GeekPwn）对接，将"比赛主力"评分纳入评价体系。
              </p>
              <p style="font-size: 16px; color: #555;">
                校企合作靶场：联合企业搭建漏洞挖掘实验环境，如模拟工控系统、Web应用靶场，提供真实业务场景。
              </p>
              <h4 style="color: #e74c3c; font-size: 22px; font-weight: bold;">3. 优化激励机制与职业引导</h4>
              <p style="font-size: 16px; color: #555;">
                设立安全专项奖学金：对在逆向、漏洞挖掘等领域表现突出的学生提供资金支持。
              </p>
              <p style="font-size: 16px; color: #555;">
                职业规划辅导：邀请安全行业专家分享职业路径，展示安全工程师、渗透测试员的成长前景。
              </p>
              <h4 style="color: #e74c3c; font-size: 22px; font-weight: bold;">4. 加强师资与工具资源投入</h4>
              <p style="font-size: 16px; color: #555;">
                引进实战型导师：聘请具有DEF CON参赛经验或企业红队背景的讲师，开设"漏洞利用实战"工作坊。
              </p>
              <p style="font-size: 16px; color: #555;">
                工具链标准化：实验室统一部署IDA Pro、Burp Suite等工具，并提供汉化教程和脚本库。
              </p>
              <h4 style="color: #e74c3c; font-size: 22px; font-weight: bold;">5. 推动社区与开源项目参与</h4>
              <p style="font-size: 16px; color: #555;">
                开源贡献计划：鼓励学生参与Metasploit、Snort等安全项目，将贡献度计入学业评价。
              </p>
              <p style="font-size: 16px; color: #555;">
                建立内部知识库：搭建Wiki平台，收录往届学生的逆向分析报告、漏洞复现案例，形成可持续的知识沉淀。
              </p>
              <h4 style="color: #e74c3c; font-size: 22px; font-weight: bold;">6. 动态调整聚类模型与评价指标</h4>
              <p style="font-size: 16px; color: #555;">
                聚类维度优化：在现有"开发能力""基础技能"标签基础上，增加"攻防能力""漏洞研究"等维度，更精准识别安全人才。
              </p>
              <p style="font-size: 16px; color: #555;">
                技能关联性分析：通过数据挖掘（如Apriori算法）找出"编程能力"与"逆向方向"的潜在关联，设计交叉培养方案。
              </p>
              <h3 style="color: #2c3e50; font-size: 28px; font-weight: bold;">总结</h3>
              <p style="font-size: 16px; color: #555;">
                当前学生画像呈现出"开发能力突出，安全技能薄弱"的结构性失衡，需通过课程改革、实战环境搭建和激励机制优化系统性解决。长期目标是培养既懂开发又精攻防的复合型人才，满足行业对网络安全人才的迫切需求。
              </p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
const circleImages = [
  new URL('../assets/real_images/radar_chart_cluster_0.png', import.meta.url).href,
  new URL('../assets/real_images/radar_chart_cluster_1.png', import.meta.url).href,
  new URL('../assets/real_images/radar_chart_cluster_2.png', import.meta.url).href,
  new URL('../assets/real_images/radar_chart_cluster_3.png', import.meta.url).href
];
</script>

<style scoped>
.kmeans-wrapper {
  height: calc(100vh - 84px); /* 减去顶部导航栏的高度 */
  overflow-y: auto;
}

/* 自定义滚动条样式 */
.kmeans-wrapper::-webkit-scrollbar {
  width: 8px;
}

.kmeans-wrapper::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.kmeans-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  transition: background 0.3s;
}

.kmeans-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.main-content {
  padding: 20px;
  background: linear-gradient(to right, #f3e7e9, #e3eeff);
  color: #333;
}

.image-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  width: 100%;
}

.image-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.kmeans-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.main-image {
  height: 800px;
}

.explanation-card {
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  width: 100%;
}

.explanation-content {
  color: #333;
}

.explanation-content h3 {
  margin-bottom: 10px;
  font-size: 24px;
  color: #2c3e50;
}

.explanation-content p {
  font-size: 16px;
  line-height: 1.5;
  color: #555;
}

.circle-image {
  border-radius: 50%;
  overflow: hidden;
  height: 450px;
  width: 450px;
}

.kmeans-image-circle {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style> 