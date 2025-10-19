<template>
  <div
    v-if="showHints"
    class="hints-overlay"
    :style="overlayStyle"
  >
    <!-- 危险提示 -->
    <div
      v-for="hint in dangerousGroups"
      :key="`danger-${hint.position.x}-${hint.position.y}`"
      class="hint-marker danger-marker"
      :style="getHintStyle(hint.position)"
      :title="hint.description"
    >
      <span class="hint-icon">⚠️</span>
    </div>

    <!-- 提子机会 -->
    <div
      v-for="hint in captureOpportunities"
      :key="`capture-${hint.position.x}-${hint.position.y}`"
      class="hint-marker capture-marker"
      :style="getHintStyle(hint.position)"
      :title="hint.description"
    >
      <span class="hint-icon">🎯</span>
    </div>

    <!-- 关键点 -->
    <div
      v-for="hint in keyPoints"
      :key="`key-${hint.position.x}-${hint.position.y}`"
      class="hint-marker key-point-marker"
      :style="getHintStyle(hint.position)"
      :title="hint.description"
    >
      <span class="hint-icon">⭐</span>
    </div>

    <!-- 安全落子点 -->
    <div
      v-for="hint in safeMoves"
      :key="`safe-${hint.position.x}-${hint.position.y}`"
      class="hint-marker safe-move-marker"
      :style="getHintStyle(hint.position)"
      :title="hint.description"
    >
      <span class="hint-icon">✓</span>
    </div>

    <!-- 提示说明面板 -->
    <div v-if="topHints.length > 0 && panelVisible" class="hints-panel">
      <div class="hints-panel-header">
        <h5 class="hints-panel-title">💡 当前建议</h5>
        <button type="button" class="hints-close" @click.stop="closePanel">×</button>
      </div>
      <div class="hints-list">
        <div
          v-for="(hint, index) in topHints"
          :key="index"
          class="hint-item"
          :class="`hint-${hint.type}`"
          @mouseenter="hoveredHint = hint"
          @mouseleave="hoveredHint = null"
        >
          <span class="hint-badge">
            {{
              hint.type === 'danger' ? '⚠️' :
              hint.type === 'capture-opportunity' ? '🎯' :
              hint.type === 'key-point' ? '⭐' : '✓'
            }}
          </span>
          <span class="hint-text">{{ hint.description }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useGameStore } from '../stores/game';
import { useVisualHints } from '../composables/useVisualHints';
import type { VisualHint } from '../composables/useVisualHints';

const props = defineProps<{
  showHints: boolean;
}>();

const gameStore = useGameStore();
const hoveredHint = ref<VisualHint | null>(null);
const panelVisible = ref(true);

// 获取游戏数据
const board = computed(() => gameStore.board);
const currentPlayer = computed(() => gameStore.currentPlayer);
const boardSize = computed(() => gameStore.config.boardSize);

// 使用视觉提示
const {
  dangerousGroups,
  captureOpportunities,
  keyPoints,
  safeMoves,
  topHints
} = useVisualHints(board, currentPlayer, boardSize);

watch([board, boardSize], () => {
  panelVisible.value = true;
});

// 单元格大小（与棋盘组件保持一致）
const baseCellSize = 40;
const displaySize = 19 * baseCellSize;
const cellSize = computed(() => displaySize / boardSize.value);

// 计算覆盖层样式
const overlayStyle = computed(() => ({
  width: `${displaySize}px`,
  height: `${displaySize}px`,
  position: 'absolute',
  top: 0,
  left: 0,
  pointerEvents: 'none'
}));

// 获取提示标记的样式
function getHintStyle(position: { x: number; y: number }) {
  return {
    left: `${position.x * cellSize.value}px`,
    top: `${position.y * cellSize.value}px`,
    width: `${cellSize.value}px`,
    height: `${cellSize.value}px`
  };
}

watch(
  () => props.showHints,
  (value) => {
    if (value) {
      panelVisible.value = true;
    }
  }
);

function closePanel() {
  panelVisible.value = false;
}
</script>

<style scoped>
.hints-overlay {
  z-index: 15;
  pointer-events: none !important;
}

.hint-marker {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* allow clicks to pass through to the board */
  animation: pulse 2s infinite;
}

.hint-icon {
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.danger-marker {
  animation: danger-pulse 1s infinite;
}

@keyframes danger-pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}

.capture-marker {
  animation: capture-bounce 2s infinite;
}

@keyframes capture-bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.key-point-marker {
  animation: rotate 3s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.safe-move-marker {
  opacity: 0.7;
  animation: fade 2s infinite;
}

@keyframes fade {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.hints-panel {
  position: absolute;
  top: 10px;
  left: calc(100% + 12px);
  width: 280px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  z-index: 20;
}

.hints-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.hints-panel-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #334155;
  font-weight: 600;
}

.hints-close {
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.2s ease;
}

.hints-close:hover {
  color: #475569;
}

.hints-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.4;
  transition: all 0.2s ease;
  cursor: help;
}

.hint-item:hover {
  background: #e2e8f0;
  transform: translateX(2px);
}

.hint-danger {
  border-left: 3px solid #ef4444;
  background: #fee2e2;
}

.hint-capture-opportunity {
  border-left: 3px solid #f59e0b;
  background: #fef3c7;
}

.hint-key-point {
  border-left: 3px solid #6366f1;
  background: #e0e7ff;
}

.hint-safe-move {
  border-left: 3px solid #10b981;
  background: #d1fae5;
}

.hint-badge {
  font-size: 16px;
  flex-shrink: 0;
}

.hint-text {
  color: #475569;
  flex: 1;
}
</style>
