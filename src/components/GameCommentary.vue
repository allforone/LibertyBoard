<template>
  <div class="game-commentary">
    <!-- 标题栏 -->
    <div class="commentary-header">
      <h3 class="commentary-title">
        <span class="icon">📚</span>
        围棋讲解
      </h3>
      <button
        class="toggle-btn"
        @click="isExpanded = !isExpanded"
        :title="isExpanded ? '收起' : '展开'"
      >
        {{ isExpanded ? '收起' : '展开' }}
      </button>
    </div>

    <!-- 内容区域 -->
    <div v-show="isExpanded" class="commentary-content">
      <!-- 游戏阶段信息 -->
      <div class="game-stage">
        <div class="stage-info">
          <span class="stage-label">当前阶段：</span>
          <span class="stage-value">{{ positionEvaluation.stage }}</span>
        </div>
        <div class="move-counter">
          第 <strong>{{ moveNumber }}</strong> 手
        </div>
      </div>

      <!-- 落子分析 -->
      <div v-if="moveAnalysis" class="move-analysis">
        <!-- 分析标题 -->
        <div class="analysis-header" :class="`importance-${moveAnalysis.importance}`">
          <h4>{{ moveAnalysis.title }}</h4>
          <span class="importance-badge">
            {{ importanceText[moveAnalysis.importance] }}
          </span>
        </div>

        <!-- 主要讲解 -->
        <div class="analysis-explanation">
          <p>{{ moveAnalysis.explanation }}</p>
        </div>

        <!-- 要点提示 -->
        <div v-if="moveAnalysis.tips.length > 0" class="analysis-tips">
          <h5 class="tips-title">💡 要点提示</h5>
          <ul class="tips-list">
            <li v-for="(tip, index) in moveAnalysis.tips" :key="index">
              {{ tip }}
            </li>
          </ul>
        </div>

        <!-- 概念解释 -->
        <div v-if="moveAnalysis.concepts.length > 0" class="concepts-section">
          <h5 class="concepts-title">📖 相关概念</h5>
          <div class="concepts-list">
            <div
              v-for="(concept, index) in moveAnalysis.concepts"
              :key="index"
              class="concept-card"
              @click="expandedConcept = expandedConcept === index ? -1 : index"
            >
              <div class="concept-header">
                <strong>{{ concept.term }}</strong>
                <span class="expand-icon">
                  {{ expandedConcept === index ? '▼' : '▶' }}
                </span>
              </div>
              <div v-show="expandedConcept === index" class="concept-details">
                <p class="concept-definition">{{ concept.definition }}</p>
                <p v-if="concept.example" class="concept-example">
                  <em>示例：{{ concept.example }}</em>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 没有落子时的默认内容 -->
      <div v-else class="default-content">
        <div class="welcome-message">
          <h4>欢迎学习围棋！</h4>
          <p>围棋是一种策略性棋类游戏，起源于中国，已有4000多年的历史。</p>
        </div>

        <div class="basic-rules">
          <h5>基本规则</h5>
          <ul>
            <li><strong>落子：</strong>黑先白后，交替落子</li>
            <li><strong>提子：</strong>对方棋子没有气时会被提掉</li>
            <li><strong>禁着：</strong>不能下在没有气的地方（自杀）</li>
            <li><strong>打劫：</strong>不能立即回提（避免循环）</li>
            <li><strong>胜负：</strong>占地多的一方获胜</li>
          </ul>
        </div>

        <div class="beginner-tips">
          <h5>初学者建议</h5>
          <ul>
            <li>🎯 开局先占角，角部最容易围地</li>
            <li>🛡️ 注意保护自己棋子的气</li>
            <li>⚔️ 寻找对方气少的棋子进行攻击</li>
            <li>🏃 被叫吃时要及时逃跑或做活</li>
            <li>🤝 适时连接自己的棋块，增强力量</li>
          </ul>
        </div>
      </div>

      <div
        v-if="showTerritoryExplanation"
        class="territory-explanation"
      >
        <div class="territory-explanation-header">
          <h5>领地变化解析</h5>
          <span class="territory-counts">
            黑方 {{ territoryChange?.blackTotal ?? 0 }} · 白方 {{ territoryChange?.whiteTotal ?? 0 }}
          </span>
        </div>
        <p class="territory-explanation-text">
          {{ territoryChange?.message }}
        </p>
        <div class="territory-diff">
          <span v-if="territoryChange?.blackGain">
            黑方新增 {{ territoryChange?.blackGain }} 点
          </span>
          <span v-if="territoryChange?.blackLoss">
            黑方失去 {{ territoryChange?.blackLoss }} 点
          </span>
          <span v-if="territoryChange?.whiteGain">
            白方新增 {{ territoryChange?.whiteGain }} 点
          </span>
          <span v-if="territoryChange?.whiteLoss">
            白方失去 {{ territoryChange?.whiteLoss }} 点
          </span>
        </div>
      </div>

      <!-- 快捷操作提示 -->
      <div class="shortcuts">
        <h5>快捷操作</h5>
        <div class="shortcut-list">
          <span class="shortcut-item">显示气：开启后查看各棋块的呼吸点</span>
          <span class="shortcut-item">显示领地：查看双方控制的区域</span>
          <span class="shortcut-item">悔棋：撤销上一步</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useGameStore } from '../stores/game';
import { useGameAnalysis } from '../composables/useGameAnalysis';

const gameStore = useGameStore();
const isExpanded = ref(true);
const expandedConcept = ref(-1);

// 重要性文本映射
const importanceText = {
  low: '一般',
  medium: '重要',
  high: '关键',
  critical: '危急'
};

// 获取游戏数据
const board = computed(() => gameStore.board);
const moveNumber = computed(() => gameStore.moveNumber);
const lastMove = computed(() => {
  const history = gameStore.moveHistory;
  return history.length > 0 ? history[history.length - 1] : null;
});

const territoryChange = computed(() => gameStore.lastTerritoryChange);
const showTerritoryExplanation = computed(
  () => gameStore.showTerritory && !!territoryChange.value
);

// 使用游戏分析
const { moveAnalysis, positionEvaluation } = useGameAnalysis(
  board,
  lastMove,
  gameStore.config.boardSize
);

// 监听新的落子，重置概念展开状态
watch(moveNumber, () => {
  expandedConcept.value = -1;
});
</script>

<style scoped>
.game-commentary {
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 8px;
}

.commentary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.commentary-title {
  margin: 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  font-size: 1.4rem;
}

.toggle-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.commentary-content {
  padding: 20px;
  max-height: 600px;
  overflow-y: auto;
}

.game-stage {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f0f4f8;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stage-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stage-label {
  color: #64748b;
  font-size: 0.9rem;
}

.stage-value {
  font-weight: 600;
  color: #334155;
}

.move-counter {
  font-size: 1.1rem;
  color: #475569;
}

.move-counter strong {
  color: #667eea;
  font-size: 1.3rem;
}

.move-analysis {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.analysis-header.importance-low {
  background: #e0f2fe;
  border-left: 4px solid #0ea5e9;
}

.analysis-header.importance-medium {
  background: #f0fdf4;
  border-left: 4px solid #22c55e;
}

.analysis-header.importance-high {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
}

.analysis-header.importance-critical {
  background: #fee2e2;
  border-left: 4px solid #ef4444;
}

.analysis-header h4 {
  margin: 0;
  color: #1e293b;
}

.importance-badge {
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.analysis-explanation {
  padding: 0 16px;
  margin-bottom: 20px;
}

.analysis-explanation p {
  line-height: 1.6;
  color: #475569;
}

.analysis-tips {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.tips-title {
  margin: 0 0 12px 0;
  color: #334155;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
}

.tips-list li {
  color: #475569;
  line-height: 1.6;
  margin-bottom: 8px;
}

.tips-list li:last-child {
  margin-bottom: 0;
}

.concepts-section {
  margin-top: 20px;
}

.concepts-title {
  margin: 0 0 12px 0;
  color: #334155;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.concepts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.concept-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.concept-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.concept-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.concept-header strong {
  color: #667eea;
}

.expand-icon {
  color: #94a3b8;
  font-size: 0.8rem;
  transition: transform 0.3s ease;
}

.concept-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  animation: expand 0.3s ease;
}

@keyframes expand {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 200px;
  }
}

.concept-definition {
  color: #475569;
  line-height: 1.5;
  margin-bottom: 8px;
}

.concept-example {
  color: #64748b;
  font-size: 0.9rem;
  font-style: italic;
}

.default-content {
  padding: 0 16px;
}

.welcome-message {
  background: linear-gradient(135deg, #e0f2fe 0%, #ddd6fe 100%);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.welcome-message h4 {
  margin: 0 0 8px 0;
  color: #1e293b;
}

.welcome-message p {
  margin: 0;
  color: #475569;
  line-height: 1.5;
}

.basic-rules,
.beginner-tips {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.basic-rules h5,
.beginner-tips h5 {
  margin: 0 0 12px 0;
  color: #334155;
}

.basic-rules ul,
.beginner-tips ul {
  margin: 0;
  padding-left: 20px;
}

.basic-rules li,
.beginner-tips li {
  color: #475569;
  line-height: 1.8;
  margin-bottom: 6px;
}

.territory-explanation {
  margin-top: 16px;
  padding: 16px;
  background: #f0fdfa;
  border: 1px solid #99f6e4;
  border-radius: 8px;
  color: #134e4a;
}

.territory-explanation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.territory-counts {
  font-size: 0.85rem;
  color: #0f766e;
}

.territory-explanation-text {
  margin: 0 0 10px 0;
  line-height: 1.6;
}

.territory-diff {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.85rem;
  color: #0f766e;
}

.shortcuts {
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
}

.shortcuts h5 {
  margin: 0 0 12px 0;
  color: #92400e;
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-item {
  color: #78350f;
  font-size: 0.9rem;
  padding-left: 12px;
  position: relative;
}

.shortcut-item:before {
  content: '•';
  position: absolute;
  left: 0;
}

/* 滚动条样式 */
.commentary-content::-webkit-scrollbar {
  width: 6px;
}

.commentary-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.commentary-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.commentary-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
