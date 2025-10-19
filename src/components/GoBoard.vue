<template>
  <div class="go-board-container">
    <div
      class="go-board"
      :style="boardStyle"
      @click="handleBoardClick"
    >
      <!-- 棋盘网格线 -->
      <svg class="board-grid" :viewBox="`0 0 ${viewBoxSize} ${viewBoxSize}`">
        <!-- 横线 -->
        <line
          v-for="i in boardSize"
          :key="`h-${i}`"
          :x1="cellSize / 2"
          :y1="(i - 0.5) * cellSize"
          :x2="viewBoxSize - cellSize / 2"
          :y2="(i - 0.5) * cellSize"
          stroke="#000"
          stroke-width="1"
        />
        <!-- 竖线 -->
        <line
          v-for="i in boardSize"
          :key="`v-${i}`"
          :x1="(i - 0.5) * cellSize"
          :y1="cellSize / 2"
          :x2="(i - 0.5) * cellSize"
          :y2="viewBoxSize - cellSize / 2"
          stroke="#000"
          stroke-width="1"
        />
        <!-- 星位 -->
        <circle
          v-for="star in starPoints"
          :key="`star-${star.x}-${star.y}`"
          :cx="(star.x + 0.5) * cellSize"
          :cy="(star.y + 0.5) * cellSize"
          r="3"
          fill="#000"
        />
      </svg>

      <!-- 棋子 -->
      <div class="stones-container">
        <div
          v-for="(row, y) in board"
          :key="`stone-row-${y}`"
          class="stone-row"
          :style="{ height: `${cellSize}px` }"
        >
          <div
            v-for="(stone, x) in row"
            :key="`stone-${x}-${y}`"
            class="stone-cell"
            :data-x="x"
            :data-y="y"
            :style="{ width: `${cellSize}px`, height: `${cellSize}px` }"
          >
            <div
              v-if="stone !== StoneColor.Empty"
              class="stone"
              :class="[
                stone === StoneColor.Black ? 'black-stone' : 'white-stone',
                hoveredGroup?.stones.some(s => s.x === x && s.y === y) ? 'group-highlight' : ''
              ]"
              @mouseenter="handleStoneHover(x, y)"
              @mouseleave="handleStoneLeave"
              :style="{ width: `${cellSize - 4}px`, height: `${cellSize - 4}px` }"
            >
              <!-- 显示手数 -->
              <span
                v-if="showMoveNumbers && getMoveNumber(x, y)"
                class="move-number"
                :class="stone === StoneColor.Black ? 'text-white' : 'text-black'"
              >
                {{ getMoveNumber(x, y) }}
              </span>
              <!-- 显示气数 -->
              <span
                v-if="showLibertyCount && getLibertyCountForStone(x, y) !== null"
                class="liberty-count"
                :class="[
                  stone === StoneColor.Black ? 'text-white' : 'text-black',
                  getLibertyCountForStone(x, y) <= 1 ? 'danger' : ''
                ]"
              >
                {{ getLibertyCountForStone(x, y) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 悬停提示 -->
      <div
        v-if="hoverPosition"
        class="hover-indicator"
        :style="getHoverStyle()"
        :class="currentPlayer === StoneColor.Black ? 'black-hover' : 'white-hover'"
      />

      <!-- 气的可视化覆盖层 (移到棋盘内部以正确对齐) -->
      <slot name="overlays"></slot>
    </div>

    <!-- 坐标标记 -->
    <div class="coordinates">
      <!-- 顶部坐标 -->
      <div class="coord-row coord-top">
        <div
          v-for="i in boardSize"
          :key="`coord-top-${i}`"
          class="coord-cell"
        >
          {{ String.fromCharCode(65 + i - 1 + (i > 8 ? 1 : 0)) }}
        </div>
      </div>
      <!-- 左侧坐标 -->
      <div class="coord-col coord-left">
        <div
          v-for="i in boardSize"
          :key="`coord-left-${i}`"
          class="coord-cell"
        >
          {{ boardSize - i + 1 }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useGameStore } from '../stores/game';
import { useTerritory } from '../composables/useTerritory';
import { StoneColor, Position, StoneGroup } from '../types/go';
import { getStoneGroup } from '../utils/goRules';

const gameStore = useGameStore();

// Props
const props = defineProps<{
  showMoveNumbers?: boolean;
  showLibertyCount?: boolean;
}>();

// 状态
const hoverPosition = ref<Position | null>(null);
const hoveredGroup = ref<StoneGroup | null>(null);

// 从store获取数据
const board = computed(() => gameStore.board);
const currentPlayer = computed(() => gameStore.currentPlayer);
const boardSize = computed(() => gameStore.config.boardSize);
const moveHistory = computed(() => gameStore.moveHistory);

// 使用领地计算composable
const { getLibertyCount } = useTerritory(board, boardSize);

// 计算属性
const baseCellSize = 40;
const displaySize = 19 * baseCellSize;
const cellSize = computed(() => displaySize / boardSize.value);
const viewBoxSize = computed(() => boardSize.value * cellSize.value);

const boardStyle = computed(() => ({
  width: `${displaySize}px`,
  height: `${displaySize}px`,
  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23DCA858\'/%3E%3C/svg%3E")',
  backgroundSize: 'cover'
}));

// 星位计算
const starPoints = computed(() => {
  const points: Position[] = [];
  if (boardSize.value === 19) {
    // 19路棋盘的9个星位
    const positions = [3, 9, 15];
    for (const x of positions) {
      for (const y of positions) {
        points.push({ x, y });
      }
    }
  } else if (boardSize.value === 13) {
    // 13路棋盘的5个星位
    points.push({ x: 6, y: 6 }); // 天元
    points.push({ x: 3, y: 3 }, { x: 9, y: 3 });
    points.push({ x: 3, y: 9 }, { x: 9, y: 9 });
  } else if (boardSize.value === 9) {
    // 9路棋盘的5个星位
    points.push({ x: 4, y: 4 }); // 天元
    points.push({ x: 2, y: 2 }, { x: 6, y: 2 });
    points.push({ x: 2, y: 6 }, { x: 6, y: 6 });
  }
  return points;
});

// 处理点击棋盘
function handleBoardClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const cell = target.closest('.stone-cell') as HTMLElement;

  if (cell) {
    const x = parseInt(cell.dataset.x!);
    const y = parseInt(cell.dataset.y!);
    gameStore.placeStone({ x, y });
  }
}

// 处理鼠标悬停在棋子上
function handleStoneHover(x: number, y: number) {
  const group = getStoneGroup(board.value, { x, y }, boardSize.value);
  hoveredGroup.value = group;
}

// 处理鼠标离开棋子
function handleStoneLeave() {
  hoveredGroup.value = null;
}

// 获取悬停样式
function getHoverStyle() {
  if (!hoverPosition.value) return {};

  return {
    left: `${hoverPosition.value.x * cellSize.value}px`,
    top: `${hoverPosition.value.y * cellSize.value}px`,
    width: `${cellSize.value}px`,
    height: `${cellSize.value}px`
  };
}

// 获取手数
function getMoveNumber(x: number, y: number): number | null {
  const move = moveHistory.value.find(m => m.position.x === x && m.position.y === y);
  return move ? move.moveNumber : null;
}

// 获取棋子的气数
function getLibertyCountForStone(x: number, y: number): number | null {
  if (board.value[y][x] === StoneColor.Empty) return null;
  return getLibertyCount({ x, y });
}

// 监听鼠标移动
function handleMouseMove(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const cell = target.closest('.stone-cell') as HTMLElement;

  if (cell) {
    const x = parseInt(cell.dataset.x!);
    const y = parseInt(cell.dataset.y!);

    if (board.value[y][x] === StoneColor.Empty) {
      hoverPosition.value = { x, y };
    } else {
      hoverPosition.value = null;
    }
  } else {
    hoverPosition.value = null;
  }
}

function handleMouseLeave() {
  hoverPosition.value = null;
}
</script>

<style scoped>
.go-board-container {
  position: relative;
  display: inline-block;
  padding: 30px;
}

.go-board {
  position: relative;
  border: 2px solid #000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.board-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.stones-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.stone-row {
  display: flex;
}

.stone-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.stone {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.black-stone {
  background: radial-gradient(circle at 35% 35%, #555, #000);
}

.white-stone {
  background: radial-gradient(circle at 35% 35%, #fff, #e0e0e0);
}

.stone:hover {
  transform: scale(1.05);
}

.group-highlight {
  box-shadow: 0 0 8px 2px rgba(255, 215, 0, 0.8);
}

.hover-indicator {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  opacity: 0.5;
}

.black-hover {
  background: radial-gradient(circle at 35% 35%, #555, #000);
}

.white-hover {
  background: radial-gradient(circle at 35% 35%, #fff, #e0e0e0);
}

.move-number {
  font-size: 12px;
  font-weight: bold;
  user-select: none;
}

.liberty-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #333;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
}

.liberty-count.danger {
  background: #ff4444;
  color: white !important;
  border-color: #cc0000;
}

.coordinates {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.coord-row {
  display: flex;
  position: absolute;
  left: 30px;
  right: 30px;
}

.coord-top {
  top: 5px;
}

.coord-col {
  position: absolute;
  top: 30px;
  bottom: 30px;
  display: flex;
  flex-direction: column;
}

.coord-left {
  left: 5px;
}

.coord-cell {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.text-white {
  color: white;
}

.text-black {
  color: black;
}
</style>
