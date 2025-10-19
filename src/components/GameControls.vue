<template>
  <div class="game-controls">
    <div class="controls-row players-row">
      <div class="player-mini" :class="{ active: currentPlayer === StoneColor.Black }">
        <span class="player-icon player-icon--black">●</span>
        <div class="player-text">
          <span class="player-name">黑</span>
          <span class="player-meta">提 {{ capturedWhite }} · 分 {{ blackScore.toFixed(1) }}</span>
        </div>
      </div>
      <div class="player-mini" :class="{ active: currentPlayer === StoneColor.White }">
        <span class="player-icon player-icon--white">○</span>
        <div class="player-text">
          <span class="player-name">白</span>
          <span class="player-meta">提 {{ capturedBlack }} · 分 {{ whiteScore.toFixed(1) }}</span>
        </div>
      </div>
    </div>

    <div class="controls-row stats-actions-row">
      <div class="stats-row">
        <span class="stat-chip">
          📝 <strong>{{ moveNumber }}</strong> 手
        </span>
        <span class="stat-chip">
          📐 <strong>{{ boardSize }}×{{ boardSize }}</strong>
        </span>
        <span class="stat-chip">
          ⚖️ <strong>{{ komi }}</strong> 贴目
        </span>
      </div>

      <div class="actions-group">
        <button
          class="icon-button"
          title="悔棋"
          @click="handleUndo"
          :disabled="moveNumber === 0"
        >
          <span class="symbol">↶</span>
          <span class="label">悔</span>
        </button>
        <button
          class="icon-button danger"
          title="重新开始"
          @click="handleReset"
        >
          <span class="symbol">⟲</span>
          <span class="label">新</span>
        </button>
        <button
          class="icon-button"
          title="弃权"
          @click="handlePass"
        >
          <span class="symbol">⏭</span>
          <span class="label">弃</span>
        </button>
        <button
          class="icon-button outline"
          title="学习教程"
          @click="$emit('openTutorial')"
        >
          <span class="symbol">📘</span>
          <span class="label">教</span>
        </button>
      </div>
    </div>

    <div class="controls-row toggles-row">
      <div class="toggle-list">
        <label class="toggle-chip">
          <input type="checkbox" v-model="localShowTerritory" @change="handleTerritoryToggle" />
          <span>🌐 领地</span>
        </label>
        <label class="toggle-chip">
          <input type="checkbox" v-model="showLibertiesModel" />
          <span>💨 气域</span>
        </label>
        <label class="toggle-chip">
          <input type="checkbox" v-model="showMoveNumbersModel" />
          <span>🔢 手数</span>
        </label>
        <label class="toggle-chip">
          <input type="checkbox" v-model="showLibertyCountModel" />
          <span>🫁 气数</span>
        </label>
        <label class="toggle-chip">
          <input type="checkbox" v-model="showHintsModel" />
          <span>🧭 提示</span>
        </label>
      </div>
    </div>

    <div class="controls-row size-row">
      <div class="size-group">
        <span class="size-label">📏 棋盘</span>
        <div class="size-buttons">
          <button
            v-for="size in [9, 13, 19]"
            :key="size"
            :class="['size-button', { active: boardSize === size }]"
            @click="handleBoardSizeChange(size)"
          >
            {{ size }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="gameStatus"
      class="status-bar"
      :class="gameStatus.type"
    >
      <span class="status-text">{{ gameStatus.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useGameStore } from '../stores/game';
import { StoneColor } from '../types/go';

const gameStore = useGameStore();

const props = defineProps<{
  showLiberties?: boolean;
  showMoveNumbers?: boolean;
  showLibertyCount?: boolean;
  showHints?: boolean;
}>();

const emit = defineEmits<{
  'update:showLiberties': [value: boolean];
  'update:showMoveNumbers': [value: boolean];
  'update:showLibertyCount': [value: boolean];
  'update:showHints': [value: boolean];
  'openTutorial': [];
}>();

const showLibertiesModel = computed({
  get: () => props.showLiberties ?? false,
  set: (value: boolean) => emit('update:showLiberties', value)
});

const showMoveNumbersModel = computed({
  get: () => props.showMoveNumbers ?? false,
  set: (value: boolean) => emit('update:showMoveNumbers', value)
});

const showLibertyCountModel = computed({
  get: () => props.showLibertyCount ?? false,
  set: (value: boolean) => emit('update:showLibertyCount', value)
});

const showHintsModel = computed({
  get: () => props.showHints ?? false,
  set: (value: boolean) => emit('update:showHints', value)
});

const localShowTerritory = ref(gameStore.showTerritory);
const gameStatus = ref<{ type: string; message: string } | null>(null);

const currentPlayer = computed(() => gameStore.currentPlayer);
const capturedBlack = computed(() => gameStore.capturedBlack);
const capturedWhite = computed(() => gameStore.capturedWhite);
const moveNumber = computed(() => gameStore.moveNumber);
const boardSize = computed(() => gameStore.config.boardSize);
const komi = computed(() => gameStore.config.komi);
const blackScore = computed(() => gameStore.blackScore);
const whiteScore = computed(() => gameStore.whiteScore);

watch(
  () => gameStore.showTerritory,
  (value) => {
    localShowTerritory.value = value;
  }
);

function handleUndo() {
  gameStore.undo();
  showGameStatus('悔棋成功', 'info');
}

function handleReset() {
  if (moveNumber.value > 0) {
    if (confirm('确定要重新开始游戏吗？当前棋局将丢失。')) {
      gameStore.resetGame();
      showGameStatus('游戏已重置', 'success');
    }
  } else {
    gameStore.resetGame();
  }
}

function handlePass() {
  gameStore.currentPlayer = gameStore.currentPlayer === StoneColor.Black
    ? StoneColor.White
    : StoneColor.Black;

  const playerName = gameStore.currentPlayer === StoneColor.Black ? '黑方' : '白方';
  showGameStatus(`${playerName === '黑方' ? '白方' : '黑方'}弃权，轮到${playerName}`, 'info');
}

function handleTerritoryToggle() {
  gameStore.toggleTerritoryDisplay();
}

function handleBoardSizeChange(size: 9 | 13 | 19) {
  if (size === boardSize.value) return;

  if (moveNumber.value > 0) {
    if (confirm(`确定要切换到${size}×${size}棋盘吗？当前棋局将丢失。`)) {
      gameStore.changeBoardSize(size);
      showGameStatus(`已切换到${size}×${size}棋盘`, 'success');
    }
  } else {
    gameStore.changeBoardSize(size);
    showGameStatus(`已切换到${size}×${size}棋盘`, 'success');
  }
}

function showGameStatus(message: string, type: string) {
  gameStatus.value = { message, type };
  setTimeout(() => {
    gameStatus.value = null;
  }, 2500);
}
</script>

<style scoped>
.game-controls {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.controls-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
}

.players-row {
  flex: 0 0 auto;
  align-items: center;
}

.stats-actions-row {
  flex: 0 0 auto;
  align-items: center;
}

.toggles-row {
  flex: 0 0 auto;
}

.size-row {
  flex: 0 0 auto;
}


.player-mini {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  color: #334155;
  transition: border 0.2s ease, box-shadow 0.2s ease;
}

.player-mini.active {
  border-color: #22c55e;
  box-shadow: 0 6px 12px rgba(16, 185, 129, 0.18);
}

.player-icon {
  font-size: 16px;
}

.player-icon--black {
  color: #111827;
}

.player-icon--white {
  color: #e2e8f0;
  text-shadow: 0 0 1px #94a3b8;
}


.player-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}


.player-name {
  font-weight: 600;
  color: #0f172a;
}

.player-meta {
  font-size: 12px;
  color: #64748b;
}

.stats-row {
  flex: 1 1 100%;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 5px 8px;
  border-radius: 10px;
  background: #f1f5f9;
  font-size: 11px;
  color: #334155;
  white-space: nowrap;
}

.stat-chip strong {
  color: #0f172a;
  font-weight: 700;
}


.actions-group {
  flex: 1 1 200px;
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.icon-button {
  flex: 1 1 44px;
  min-width: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 44px;
  border: none;
  border-radius: 10px;
  background: #2563eb;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-button .symbol {
  font-size: 14px;
  line-height: 1;
}

.icon-button .label {
  font-size: 11px;
}

.icon-button:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(37, 99, 235, 0.22);
}

.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-button.danger {
  background: #ef4444;
}

.icon-button.danger:hover:not(:disabled) {
  background: #dc2626;
  box-shadow: 0 6px 12px rgba(239, 68, 68, 0.22);
}

.icon-button.outline {
  background: #fff;
  color: #15803d;
  border: 2px solid #22c55e;
}

.icon-button.outline:hover {
  background: #22c55e;
  color: #fff;
}


.toggle-list {
  display: flex;
  gap: 6px;
}

.toggle-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 5px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 11px;
  color: #334155;
  cursor: pointer;
  white-space: nowrap;
  flex: 1 1 0;
}

.toggle-chip input {
  width: 12px;
  height: 12px;
  cursor: pointer;
}

.size-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.size-label {
  font-size: 11px;
  color: #64748b;
}

.size-buttons {
  display: inline-flex;
  gap: 4px;
}

.size-button {
  min-width: 28px;
  padding: 5px 6px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 11px;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.size-button:hover {
  border-color: #2563eb;
  background: #e0f2fe;
}

.size-button.active {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.status-bar {
  flex: 0 0 auto;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid rgba(37, 99, 235, 0.3);
}

.status-bar.success {
  background: #ecfdf5;
  color: #047857;
  border-color: rgba(16, 185, 129, 0.3);
}

.status-bar.warning {
  background: #fff7ed;
  color: #c2410c;
  border-color: rgba(234, 88, 12, 0.3);
}

.status-bar.error {
  background: #fef2f2;
  color: #b91c1c;
  border-color: rgba(220, 38, 38, 0.3);
}

@media (max-width: 880px) {
  .actions-group {
    justify-content: flex-start;
  }
}
</style>
