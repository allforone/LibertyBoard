<template>
  <div
    class="territory-overlay"
    :style="overlayStyle"
  >
    <!-- 领地/气的可视化网格 -->
    <div
      v-for="(row, y) in visualizationGrid"
      :key="`row-${y}`"
      class="visualization-row"
    >
      <div
        v-for="(cell, x) in row"
        :key="`cell-${x}-${y}`"
        class="visualization-cell"
        :style="getCellStyle(x, y, cell)"
      >
        <div
          v-if="cell.highlight"
          class="territory-highlight"
          :class="[
            `highlight-${cell.highlight.type}`,
            cell.highlight.owner === StoneColor.Black ? 'highlight-black' : 'highlight-white'
          ]"
        />
        <!-- 显示气的小点 -->
        <div
          v-if="cell.isLiberty && showLibertyDots"
          class="liberty-dot"
          :style="{ backgroundColor: cell.color }"
        />
      </div>
    </div>

    <!-- 悬停信息提示 -->
    <div
      v-if="hoveredInfo && showTooltip"
      class="hover-tooltip"
      :style="tooltipStyle"
    >
      <div class="tooltip-content">
        <div v-if="hoveredInfo.type === 'territory'">
          <strong>领地</strong>
          <p>{{ hoveredInfo.owner === 1 ? '黑方' : hoveredInfo.owner === 2 ? '白方' : '中立' }}</p>
        </div>
        <div v-else-if="hoveredInfo.type === 'liberty'">
          <strong>气</strong>
          <p>{{ hoveredInfo.belongsTo === 1 ? '黑方' : '白方' }}棋块的气</p>
          <p>该棋块共有 {{ hoveredInfo.totalLiberties }} 气</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useGameStore } from '../stores/game';
import { useTerritory } from '../composables/useTerritory';
import { StoneColor, Position } from '../types/go';
import { positionToKey, getStoneGroup } from '../utils/goRules';

type HighlightInfo = {
  type: 'gain' | 'loss' | 'flip';
  owner: StoneColor;
  previousOwner: StoneColor;
};

interface VisualizationCell {
  type: 'empty' | 'stone' | 'territory' | 'liberty';
  owner: number; // 0=中立, 1=黑方, 2=白方
  color: string;
  opacity: number;
  isLiberty: boolean;
  highlight?: HighlightInfo | null;
}

interface HoveredInfo {
  type: string;
  owner?: number;
  belongsTo?: number;
  totalLiberties?: number;
  x: number;
  y: number;
}

const props = defineProps<{
  mode: 'territory' | 'liberties' | 'both';
  showLibertyDots?: boolean;
  showTooltip?: boolean;
  opacity?: number;
}>();

const gameStore = useGameStore();

// 状态
const hoveredInfo = ref<HoveredInfo | null>(null);
const mousePosition = ref({ x: 0, y: 0 });

// 从store获取数据
const board = computed(() => gameStore.board);
const boardSize = computed(() => gameStore.config.boardSize);
const showTerritory = computed(() => gameStore.showTerritory);
const territoryMap = computed(() => gameStore.territoryMap);
const territoryHighlights = computed(() => gameStore.territoryHighlights);

watch([board, boardSize], () => {
  if (gameStore.showTerritory) {
    gameStore.updateTerritoryMap();
  }
});

// 使用领地计算composable
const { territoryControl, highlightedLiberties } = useTerritory(
  board,
  boardSize
);

// 单元格大小（与固定显示区域保持一致）
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
  pointerEvents: 'none' // 始终设置为none，允许点击穿透到棋盘
}));

// 创建可视化网格
const visualizationGrid = computed((): VisualizationCell[][] => {
  const grid: VisualizationCell[][] = [];

  for (let y = 0; y < boardSize.value; y++) {
    const row: VisualizationCell[] = [];

    for (let x = 0; x < boardSize.value; x++) {
      const cell: VisualizationCell = {
        type: 'empty',
        owner: 0,
        color: 'transparent',
        opacity: 0,
        isLiberty: false
      };
      const posKey = positionToKey({ x, y });

      // 检查是否有棋子
      if (board.value[y][x] !== StoneColor.Empty) {
        cell.type = 'stone';
        cell.owner = board.value[y][x];
      } else {
        // 检查是否是某个棋块的气
        const libertyColor = highlightedLiberties.value.get(posKey);
        if (libertyColor && (props.mode === 'liberties' || props.mode === 'both')) {
          cell.type = 'liberty';
          cell.color = libertyColor;
          cell.opacity = props.opacity || 0.5;
          cell.isLiberty = true;

          // 判断属于哪一方
          cell.owner = libertyColor.includes('0, 0, 0') ? 1 : 2;
        }
        // 检查领地控制
        else if (props.mode === 'territory' || props.mode === 'both') {
          const control = territoryControl.value[y][x];
          if (control !== 0) {
            cell.type = 'territory';
            cell.owner = control;

            if (control === StoneColor.Black) {
              cell.color = 'rgba(0, 0, 0, 0.3)';
            } else if (control === StoneColor.White) {
              cell.color = 'rgba(255, 255, 255, 0.5)';
            }

            cell.opacity = props.opacity || 0.5;
          }
        }
      }

      const highlight = territoryHighlights.value?.get(posKey);
      if (highlight) {
        cell.highlight = highlight;
      }

      row.push(cell);
    }

    grid.push(row);
  }

  return grid;
});

// 获取单元格样式
function getCellStyle(x: number, y: number, cell: VisualizationCell) {
  return {
    width: `${cellSize.value}px`,
    height: `${cellSize.value}px`,
    backgroundColor: cell.type !== 'stone' ? cell.color : 'transparent',
    opacity: cell.opacity
  };
}

// 处理鼠标悬停
function handleCellHover(x: number, y: number) {
  if (!props.showTooltip) return;

  const cell = visualizationGrid.value[y][x];

  if (cell.type === 'territory' || cell.type === 'liberty') {
    const info: HoveredInfo = {
      type: cell.type,
      x,
      y
    };

    if (cell.type === 'territory') {
      info.owner = cell.owner;
    } else if (cell.type === 'liberty') {
      // 找到这个气属于哪个棋块
      info.belongsTo = cell.owner;

      // 查找相邻的棋子来确定棋块
      const neighbors = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 }
      ];

      for (const neighbor of neighbors) {
        if (
          neighbor.x >= 0 &&
          neighbor.x < boardSize.value &&
          neighbor.y >= 0 &&
          neighbor.y < boardSize.value &&
          board.value[neighbor.y][neighbor.x] !== StoneColor.Empty
        ) {
          const group = getStoneGroup(
            board.value,
            neighbor,
            boardSize.value
          );
          if (group) {
            info.totalLiberties = group.liberties.size;
            break;
          }
        }
      }
    }

    hoveredInfo.value = info;
  }
}

// 处理鼠标离开
function handleCellLeave() {
  hoveredInfo.value = null;
}

// 计算提示框样式
const tooltipStyle = computed(() => {
  if (!hoveredInfo.value) return {};

  const x = hoveredInfo.value.x * cellSize.value + cellSize.value / 2;
  const y = hoveredInfo.value.y * cellSize.value + cellSize.value / 2;

  return {
    left: `${x}px`,
    top: `${y - 80}px`
  };
});

// 监听鼠标位置
function updateMousePosition(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  mousePosition.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}
</script>

<style scoped>
.territory-overlay {
  z-index: 10;
  pointer-events: none !important; /* 确保覆盖层不阻挡点击 */
}

.visualization-row {
  display: flex;
  pointer-events: none; /* 不阻挡点击 */
}

.visualization-cell {
  position: relative;
  transition: all 0.3s ease;
  pointer-events: none; /* 不阻挡点击 */
}

.territory-highlight {
  position: absolute;
  inset: 6px;
  border-radius: 10px;
  border: 2px solid transparent;
  pointer-events: none;
  animation: territory-pulse 1.8s ease-in-out infinite;
}

.territory-highlight.highlight-black {
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.35) inset;
}

.territory-highlight.highlight-white {
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.4) inset;
}

.territory-highlight.highlight-gain {
  border-color: rgba(34, 197, 94, 0.75);
  background: rgba(34, 197, 94, 0.2);
}

.territory-highlight.highlight-flip {
  border-color: rgba(59, 130, 246, 0.75);
  border-style: dashed;
  background: rgba(59, 130, 246, 0.2);
}

.territory-highlight.highlight-loss {
  border-color: rgba(248, 113, 113, 0.85);
  background: rgba(248, 113, 113, 0.25);
}

@keyframes territory-pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.6;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.6;
  }
}

.visualization-cell:hover {
  filter: brightness(1.2);
}

.liberty-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
  pointer-events: none; /* 不阻挡点击 */
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

.hover-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1000;
  transform: translateX(-50%);
}

.hover-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.9);
}

.tooltip-content strong {
  display: block;
  margin-bottom: 4px;
  color: #ffd700;
}

.tooltip-content p {
  margin: 2px 0;
}
</style>
