import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type {
  GameState,
  Position,
  Move,
  GameConfig
} from '../types/go';
import { StoneColor } from '../types/go';
import {
  createEmptyBoard,
  isValidMove,
  makeMove,
  cloneBoard,
  getAllGroups
} from '../utils/goRules';

interface TerritoryChangeSummary {
  message: string;
  blackGain: number;
  blackLoss: number;
  whiteGain: number;
  whiteLoss: number;
  blackTotal: number;
  whiteTotal: number;
  changes: TerritoryChangeDetail[];
}

interface TerritoryChangeDetail {
  position: Position;
  previousOwner: StoneColor;
  newOwner: StoneColor;
}

interface TerritoryHighlight {
  type: 'gain' | 'loss' | 'flip';
  owner: StoneColor;
  previousOwner: StoneColor;
}

interface MoveContext {
  color: StoneColor;
  position: Position;
  captured: number;
}

export const useGameStore = defineStore('game', () => {
  // 游戏配置
  const config = ref<GameConfig>({
    boardSize: 19,
    handicap: 0,
    komi: 6.5
  });

  // 游戏状态
  const board = ref<StoneColor[][]>(createEmptyBoard(config.value.boardSize));
  const currentPlayer = ref<StoneColor>(StoneColor.Black);
  const capturedBlack = ref(0);
  const capturedWhite = ref(0);
  const moveHistory = ref<Move[]>([]);
  const koPosition = ref<Position | null>(null);
  const showTerritory = ref(false);
  const territoryMap = ref<number[][]>(
    Array(config.value.boardSize).fill(null).map(() =>
      Array(config.value.boardSize).fill(0)
    )
  );
  const lastTerritoryChange = ref<TerritoryChangeSummary | null>(null);
  const territoryHighlights = ref<Map<string, TerritoryHighlight>>(new Map());

  // 计算属性
  const moveNumber = computed(() => moveHistory.value.length);

  const blackScore = computed(() => {
    let score = capturedWhite.value;
    if (showTerritory.value) {
      // 计算黑方控制的地域
      for (let row of territoryMap.value) {
        for (let cell of row) {
          if (cell === 1) score++;
        }
      }
    }
    return score;
  });

  const whiteScore = computed(() => {
    let score = capturedBlack.value + config.value.komi;
    if (showTerritory.value) {
      // 计算白方控制的地域
      for (let row of territoryMap.value) {
        for (let cell of row) {
          if (cell === 2) score++;
        }
      }
    }
    return score;
  });

  const currentGroups = computed(() => {
    return getAllGroups(board.value, config.value.boardSize);
  });

  // 方法
  // 领地更新的防抖计时器（移除，不再使用）
  // let territoryUpdateTimer: ReturnType<typeof setTimeout> | null = null;

  function placeStone(position: Position): boolean {
    if (!isValidMove(
      board.value,
      position,
      currentPlayer.value,
      config.value.boardSize,
      koPosition.value
    )) {
      return false;
    }

    const moveColor = currentPlayer.value;
    const newBoard = cloneBoard(board.value);
    const { capturedStones, newKoPosition } = makeMove(
      newBoard,
      position,
      moveColor,
      config.value.boardSize
    );

    // 更新棋盘
    board.value = newBoard;

    // 更新提子计数
    if (moveColor === StoneColor.Black) {
      capturedWhite.value += capturedStones.length;
    } else {
      capturedBlack.value += capturedStones.length;
    }

    // 添加到历史记录
    moveHistory.value.push({
      position,
      color: moveColor,
      capturedStones,
      moveNumber: moveNumber.value + 1
    });

    // 更新打劫位置
    koPosition.value = newKoPosition;

    pendingTerritoryContext = {
      color: moveColor,
      position,
      captured: capturedStones.length
    };

    // 切换玩家
    currentPlayer.value = moveColor === StoneColor.Black
      ? StoneColor.White
      : StoneColor.Black;

    return true;
  }

  function undo(): void {
    if (moveHistory.value.length === 0) return;

    const lastMove = moveHistory.value.pop()!;

    // 移除最后下的棋子
    board.value[lastMove.position.y][lastMove.position.x] = StoneColor.Empty;

    // 恢复被提的棋子
    for (const stone of lastMove.capturedStones) {
      const restoredColor = lastMove.color === StoneColor.Black
        ? StoneColor.White
        : StoneColor.Black;
      board.value[stone.y][stone.x] = restoredColor;
    }

    // 更新提子计数
    if (lastMove.color === StoneColor.Black) {
      capturedWhite.value -= lastMove.capturedStones.length;
    } else {
      capturedBlack.value -= lastMove.capturedStones.length;
    }

    // 切换回上一个玩家
    currentPlayer.value = lastMove.color;

    // 清除打劫位置（简化处理）
    koPosition.value = null;

    pendingTerritoryContext = null;
    updateTerritoryMap();
  }

  function resetGame(): void {
    board.value = createEmptyBoard(config.value.boardSize);
    currentPlayer.value = StoneColor.Black;
    capturedBlack.value = 0;
    capturedWhite.value = 0;
    moveHistory.value = [];
    koPosition.value = null;
    territoryMap.value = Array(config.value.boardSize).fill(null).map(() =>
      Array(config.value.boardSize).fill(0)
    );
    // 清除缓存
    lastBoardState = '';
   cachedTerritoryMap = null;
    lastTerritoryChange.value = null;
    pendingTerritoryContext = null;
    clearTerritoryHighlights();
  }

  function toggleTerritoryDisplay(): void {
    showTerritory.value = !showTerritory.value;
    if (showTerritory.value) {
      pendingTerritoryContext = null;
      updateTerritoryMap();
      lastTerritoryChange.value = null;
    } else {
      clearTerritoryHighlights();
      territoryMap.value = Array(config.value.boardSize).fill(null).map(() =>
        Array(config.value.boardSize).fill(0)
      );
    }
  }

  // 缓存上次的棋盘状态和领地计算结果
  let lastBoardState: string = '';
  let cachedTerritoryMap: number[][] | null = null;
  let pendingTerritoryContext: MoveContext | null = null;
  let territoryHighlightTimer: ReturnType<typeof setTimeout> | null = null;

  function clearTerritoryHighlights(): void {
    territoryHighlights.value = new Map();
    if (territoryHighlightTimer) {
      clearTimeout(territoryHighlightTimer);
      territoryHighlightTimer = null;
    }
  }

  function applyTerritoryHighlights(
    changes: TerritoryChangeDetail[],
    context: MoveContext | null
  ): void {
    if (!showTerritory.value || !context || changes.length === 0) {
      clearTerritoryHighlights();
      return;
    }

    if (territoryHighlightTimer) {
      clearTimeout(territoryHighlightTimer);
      territoryHighlightTimer = null;
    }

    const highlights = new Map<string, TerritoryHighlight>();

    for (const change of changes) {
      const key = `${change.position.x},${change.position.y}`;

      let type: TerritoryHighlight['type'] | null = null;
      let owner: StoneColor = StoneColor.Empty;

      if (change.newOwner === StoneColor.Empty && change.previousOwner !== StoneColor.Empty) {
        type = 'loss';
        owner = change.previousOwner;
      } else if (change.previousOwner === StoneColor.Empty && change.newOwner !== StoneColor.Empty) {
        type = 'gain';
        owner = change.newOwner;
      } else if (
        change.previousOwner !== StoneColor.Empty &&
        change.newOwner !== StoneColor.Empty &&
        change.previousOwner !== change.newOwner
      ) {
        type = 'flip';
        owner = change.newOwner;
      }

      if (!type || owner === StoneColor.Empty) continue;

      highlights.set(key, {
        type,
        owner,
        previousOwner: change.previousOwner
      });
    }

    territoryHighlights.value = highlights;

    if (highlights.size > 0) {
      territoryHighlightTimer = setTimeout(() => {
        territoryHighlights.value = new Map();
        territoryHighlightTimer = null;
      }, 4000);
    }
  }

  function updateTerritoryMap(): void {
    const boardSize = config.value.boardSize;

    // 只在显示领地时才进行计算
    if (!showTerritory.value) {
      territoryMap.value = Array(boardSize).fill(null).map(() =>
        Array(boardSize).fill(0)
      );
      lastTerritoryChange.value = null;
      pendingTerritoryContext = null;
      clearTerritoryHighlights();
      return;
    }

    const previousMap = territoryMap.value.map(row => [...row]);

    // 检查棋盘是否改变，如果没变就使用缓存
    const currentBoardState = JSON.stringify(board.value);
    if (currentBoardState === lastBoardState && cachedTerritoryMap) {
      territoryMap.value = cachedTerritoryMap;
      const summary = summarizeTerritoryChange(
        previousMap,
        cachedTerritoryMap,
        pendingTerritoryContext
      );
      lastTerritoryChange.value = summary;
      applyTerritoryHighlights(summary.changes, pendingTerritoryContext);
      pendingTerritoryContext = null;
      return;
    }

    const newTerritoryMap = Array(boardSize).fill(null).map(() =>
      Array(boardSize).fill(0)
    );

    // 使用洪水填充算法正确判断领地
    const visited = new Set<string>();

    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        if (board.value[y][x] === StoneColor.Empty) {
          const key = `${x},${y}`;
          if (!visited.has(key)) {
            // 找出这个空区域及其边界
            const result = floodFillEmpty(x, y, visited);

            // 如果边界只属于一种颜色，标记为该颜色的领地
            if (result.borderColor !== 0) {
              for (const pos of result.positions) {
                newTerritoryMap[pos.y][pos.x] = result.borderColor;
              }
            }
          }
        }
      }
    }

    // 更新缓存
    lastBoardState = currentBoardState;
    cachedTerritoryMap = newTerritoryMap;
    territoryMap.value = newTerritoryMap;
    const summary = summarizeTerritoryChange(
      previousMap,
      newTerritoryMap,
      pendingTerritoryContext
    );
    lastTerritoryChange.value = summary;
    applyTerritoryHighlights(summary.changes, pendingTerritoryContext);
    pendingTerritoryContext = null;
  }

  // 洪水填充算法，找出连续的空区域及其边界颜色
  function floodFillEmpty(
    startX: number,
    startY: number,
    visited: Set<string>
  ): { positions: Position[], borderColor: number } {
    const boardSize = config.value.boardSize;
    const positions: Position[] = [];
    const borderColors = new Set<StoneColor>();
    const stack: Position[] = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const pos = stack.pop()!;
      const key = `${pos.x},${pos.y}`;

      if (visited.has(key)) continue;
      if (pos.x < 0 || pos.x >= boardSize || pos.y < 0 || pos.y >= boardSize) continue;

      const stone = board.value[pos.y][pos.x];

      if (stone === StoneColor.Empty) {
        visited.add(key);
        positions.push(pos);

        // 检查四个方向
        stack.push({ x: pos.x - 1, y: pos.y });
        stack.push({ x: pos.x + 1, y: pos.y });
        stack.push({ x: pos.x, y: pos.y - 1 });
        stack.push({ x: pos.x, y: pos.y + 1 });
      } else {
        // 记录边界颜色
        borderColors.add(stone);
      }
    }

    // 判断领地归属：只有当边界全是同一种颜色时才算领地
    let borderColor = 0;
    if (borderColors.size === 1) {
      const color = Array.from(borderColors)[0];
      borderColor = color === StoneColor.Black ? 1 : 2;
    }

    return { positions, borderColor };
  }

  function changeBoardSize(size: 9 | 13 | 19): void {
    config.value.boardSize = size;
    // 清除缓存
    lastBoardState = '';
    cachedTerritoryMap = null;
    resetGame();
  }

  function summarizeTerritoryChange(
    previousMap: number[][],
    newMap: number[][],
    context: MoveContext | null
  ): TerritoryChangeSummary {
    let blackGain = 0;
    let blackLoss = 0;
    let whiteGain = 0;
    let whiteLoss = 0;
    let blackTotal = 0;
    let whiteTotal = 0;
    const changes: TerritoryChangeDetail[] = [];

    for (let y = 0; y < newMap.length; y++) {
      for (let x = 0; x < newMap[y].length; x++) {
        const prevOwner = (previousMap?.[y]?.[x] ?? 0) as StoneColor;
        const nextOwner = newMap[y][x] as StoneColor;

        if (nextOwner === 1) blackTotal++;
        if (nextOwner === 2) whiteTotal++;

        if (prevOwner === nextOwner) continue;

        if (prevOwner === 1) {
          blackLoss++;
        } else if (prevOwner === 2) {
          whiteLoss++;
        }

        if (nextOwner === 1) {
          blackGain++;
        } else if (nextOwner === 2) {
          whiteGain++;
        }

        changes.push({
          position: { x, y },
          previousOwner: prevOwner,
          newOwner: nextOwner
        });
      }
    }

    return {
      message: buildTerritoryMessage(context, {
        blackGain,
        blackLoss,
        whiteGain,
        whiteLoss,
        blackTotal,
        whiteTotal
      }),
      blackGain,
      blackLoss,
      whiteGain,
      whiteLoss,
      blackTotal,
      whiteTotal,
      changes
    };
  }

  function buildTerritoryMessage(
    context: MoveContext | null,
    stats: {
      blackGain: number;
      blackLoss: number;
      whiteGain: number;
      whiteLoss: number;
      blackTotal: number;
      whiteTotal: number;
    }
  ): string {
    const {
      blackGain,
      blackLoss,
      whiteGain,
      whiteLoss,
      blackTotal,
      whiteTotal
    } = stats;

    const totalSummary = `当前判定：黑方控制 ${blackTotal} 个空点，白方控制 ${whiteTotal} 个空点。`;

    if (!context) {
      if (blackGain === 0 && blackLoss === 0 && whiteGain === 0 && whiteLoss === 0) {
        return `领地状态重新评估，但格局没有明显变化。${totalSummary}`;
      }

      const blackNet = blackGain - blackLoss;
      const whiteNet = whiteGain - whiteLoss;
      return `领地状态重新评估。黑方净变化 ${blackNet}，白方净变化 ${whiteNet}。${totalSummary}`;
    }

    const playerName = context.color === StoneColor.Black ? '黑方' : '白方';
    const opponentName = context.color === StoneColor.Black ? '白方' : '黑方';
    const gained = context.color === StoneColor.Black ? blackGain : whiteGain;
    const lost = context.color === StoneColor.Black ? blackLoss : whiteLoss;
    const opponentGain = context.color === StoneColor.Black ? whiteGain : blackGain;

    const parts: string[] = [];

    if (context.captured > 0) {
      parts.push(`提掉对方${context.captured}子`);
    }

    if (gained > 0) {
      parts.push(`围住了${gained}个新的空点`);
    }

    if (lost > 0) {
      parts.push(`同时让出了${lost}个空点`);
    } else if (opponentGain > 0) {
      parts.push(`${opponentName}趁机控制了${opponentGain}个空点`);
    }

    if (parts.length === 0) {
      parts.push('这一手主要调整了棋形，领地分布保持稳定');
    }

    return `这一手${playerName}${parts.join('，')}，因此领地判定发生了变化。${totalSummary}`;
  }

  // 监听棋盘变化，在显示领地时实时刷新
  watch(
    () => board.value,
    () => {
      if (showTerritory.value) {
        updateTerritoryMap();
      }
    },
    { deep: true }
  );

  return {
    // 状态
    board,
    currentPlayer,
    capturedBlack,
    capturedWhite,
    moveHistory,
    koPosition,
    showTerritory,
    territoryMap,
    config,
    lastTerritoryChange,
    territoryHighlights,

    // 计算属性
    moveNumber,
    blackScore,
    whiteScore,
    currentGroups,

    // 方法
    placeStone,
    undo,
    resetGame,
    toggleTerritoryDisplay,
    updateTerritoryMap,
    changeBoardSize
  };
});
