<template>
  <div id="app">
    <header class="app-header">
      <h1 class="app-title">围棋学习软件</h1>
      <p class="app-subtitle">实时显示气的可视化围棋学习工具</p>
    </header>

    <main class="app-main">
      <div class="board-section">
        <div class="board-layout">
          <div class="board-wrapper">
            <GoBoard
              :show-move-numbers="displayOptions.showMoveNumbers"
              :show-liberty-count="displayOptions.showLibertyCount"
            >
              <!-- 使用插槽将覆盖层放在棋盘内部以正确对齐 -->
              <template #overlays>
                <!-- 气的可视化覆盖层 -->
                <TerritoryOverlay
                  v-if="displayOptions.showLiberties || gameStore.showTerritory"
                  :mode="overlayMode"
                  :show-liberty-dots="true"
                  :show-tooltip="true"
                  :opacity="0.5"
                />
                <!-- 初学者提示覆盖层 -->
                <VisualHints
                  :show-hints="displayOptions.showHints"
                />
              </template>
            </GoBoard>
          </div>

          <div class="side-column">
            <div class="commentary-wrapper">
              <GameCommentary />
            </div>

            <div class="controls-wrapper">
              <GameControls
                v-model:show-liberties="displayOptions.showLiberties"
                v-model:show-move-numbers="displayOptions.showMoveNumbers"
                v-model:show-liberty-count="displayOptions.showLibertyCount"
                v-model:show-hints="displayOptions.showHints"
                @open-tutorial="showTutorial = true"
              />
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 教程模态框 -->
    <div v-if="showTutorial" class="modal-overlay" @click="showTutorial = false">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="showTutorial = false">×</button>
        <Tutorial />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useGameStore } from './stores/game';
import GoBoard from './components/GoBoard.vue';
import TerritoryOverlay from './components/TerritoryOverlay.vue';
import GameControls from './components/GameControls.vue';
import GameCommentary from './components/GameCommentary.vue';
import VisualHints from './components/VisualHints.vue';
import Tutorial from './components/Tutorial.vue';

// 初始化store
const gameStore = useGameStore();

// 显示选项
const displayOptions = ref({
  showLiberties: false,
  showMoveNumbers: false,
  showLibertyCount: false,
  showHints: true // 默认开启初学者提示
});

// 教程显示状态
const showTutorial = ref(false);

// 计算覆盖层模式
const overlayMode = computed(() => {
  if (displayOptions.value.showLiberties && gameStore.showTerritory) {
    return 'both';
  } else if (displayOptions.value.showLiberties) {
    return 'liberties';
  } else {
    return 'territory';
  }
});

// 组件挂载时的初始化
onMounted(() => {
  // 可以在这里添加初始化逻辑
  console.log('围棋学习软件已加载');
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.app-title {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 8px;
  font-weight: bold;
  letter-spacing: 2px;
}

.app-subtitle {
  font-size: 1.1rem;
  color: #666;
}

.app-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  padding: 30px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.board-section {
  width: 100%;
  display: flex;
  justify-content: center;
}

.board-layout {
  display: grid;
  grid-template-columns: auto minmax(320px, 360px);
  column-gap: 28px;
  align-items: stretch;
  justify-content: center;
  width: 100%;
}

.board-wrapper {
  position: relative;
  display: inline-block;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.side-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

.commentary-wrapper {
  flex: 2 1 0;
  display: flex;
  min-height: 0;
}

.commentary-wrapper > * {
  flex: 1;
}

.controls-wrapper {
  flex: 1 1 0;
  display: flex;
  min-height: 0;
}

.controls-wrapper > * {
  flex: 1;
}

@media (max-width: 1100px) {
  .board-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .side-column {
    gap: 10px;
  }
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  animation: slideIn 0.3s ease;
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  font-size: 30px;
  cursor: pointer;
  color: #999;
  transition: color 0.3s ease;
}

.modal-close:hover {
  color: #333;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .app-main {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 768px) {
  .app-title {
    font-size: 2rem;
  }

  .app-main {
    padding: 20px;
  }

  .board-wrapper {
    padding: 10px;
    transform: scale(0.8);
    transform-origin: top center;
  }
}
</style>
