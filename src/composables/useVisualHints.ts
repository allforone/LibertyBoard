import { computed, unref } from 'vue';
import type { Ref } from 'vue';
import type { Position } from '../types/go';
import { StoneColor } from '../types/go';
import { getStoneGroup, getNeighbors, isValidMove } from '../utils/goRules';

export interface VisualHint {
  position: Position;
  type: 'danger' | 'capture-opportunity' | 'safe-move' | 'key-point';
  description: string;
  priority: number; // 1-5, 5 being highest
}

export function useVisualHints(
  board: Ref<StoneColor[][]>,
  currentPlayer: Ref<StoneColor>,
  boardSizeInput: Ref<number> | number
) {
  const boardSize = computed(() => unref(boardSizeInput));
  // 找出所有危险的棋子（气数少于等于2的）
  const dangerousGroups = computed(() => {
    const dangers: VisualHint[] = [];
    const visited = new Set<string>();

    const size = boardSize.value;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const pos = { x, y };
        const key = `${x},${y}`;

        if (visited.has(key) || board.value[y][x] === StoneColor.Empty) {
          continue;
        }

        const group = getStoneGroup(board.value, pos, size);
        if (group) {
          // 标记这个棋块的所有棋子为已访问
          group.stones.forEach(stone => {
            visited.add(`${stone.x},${stone.y}`);
          });

          // 如果是当前玩家的棋子且气数少
          if (group.color === currentPlayer.value && group.liberties.size <= 2) {
            // 选择棋块中的一个代表位置
            const representativeStone = group.stones[0];
            dangers.push({
              position: representativeStone,
              type: 'danger',
              description: `这个棋块只有${group.liberties.size}口气，处于危险中！`,
              priority: group.liberties.size === 1 ? 5 : 3
            });
          }
        }
      }
    }

    return dangers;
  });

  // 找出可以提子的机会
  const captureOpportunities = computed(() => {
    const opportunities: VisualHint[] = [];
    const opponentColor = currentPlayer.value === StoneColor.Black ? StoneColor.White : StoneColor.Black;
    const visited = new Set<string>();

    const size = boardSize.value;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const pos = { x, y };
        const key = `${x},${y}`;

        if (visited.has(key) || board.value[y][x] !== opponentColor) {
          continue;
        }

        const group = getStoneGroup(board.value, pos, size);
        if (group && group.liberties.size === 1) {
          group.stones.forEach(stone => {
            visited.add(`${stone.x},${stone.y}`);
          });

          // 找到唯一的气点
          const libertyKey = Array.from(group.liberties)[0];
          const [libX, libY] = libertyKey.split(',').map(Number);

          opportunities.push({
            position: { x: libX, y: libY },
            type: 'capture-opportunity',
            description: `下在这里可以提掉对方${group.stones.length}个棋子`,
            priority: group.stones.length > 2 ? 5 : 4
          });
        }
      }
    }

    return opportunities;
  });

  // 找出关键点（如占角、拆边等）
  const keyPoints = computed(() => {
    const size = boardSize.value;
    const points: VisualHint[] = [];
    const moveCount = countStones(size);

    // 开局阶段的关键点
    if (moveCount < 10 && size === 19) {
      // 只对19路棋盘显示角部推荐
      const cornerPoints = [
        { x: 3, y: 3 },
        { x: 3, y: 15 },
        { x: 15, y: 3 },
        { x: 15, y: 15 }
      ];

      for (const point of cornerPoints) {
        if (board.value[point.y][point.x] === StoneColor.Empty &&
            isValidMove(board.value, point, currentPlayer.value, size, null)) {
          points.push({
            position: point,
            type: 'key-point',
            description: '角部是围棋开局的关键位置',
            priority: 3
          });
        }
      }
    }

    return points;

    function countStones(currentSize: number): number {
      let count = 0;
      for (let y = 0; y < currentSize; y++) {
        for (let x = 0; x < currentSize; x++) {
          if (board.value[y][x] !== StoneColor.Empty) {
            count++;
          }
        }
      }
      return count;
    }
  });

  // 找出安全的落子点（简化版，只推荐最紧急的）
  const safeMoves = computed(() => {
    const moves: VisualHint[] = [];

    // 只寻找气数为1的棋块的补气点（最紧急的）
    const myGroups = getAllGroupsOfColor(currentPlayer.value);
    const urgentGroups = myGroups.filter(group => group.liberties.size === 1);

    for (const group of urgentGroups.slice(0, 2)) { // 最多处理2个紧急棋块
      const libertyKey = Array.from(group.liberties)[0];
      const [x, y] = libertyKey.split(',').map(Number);
      const pos = { x, y };

      moves.push({
        position: pos,
        type: 'safe-move',
        description: '紧急！补救这个棋块',
        priority: 5
      });
    }

    return moves;

    function getAllGroupsOfColor(color: StoneColor) {
      const groups = [];
      const visited = new Set<string>();

      for (let y = 0; y < boardSize.value; y++) {
        for (let x = 0; x < boardSize.value; x++) {
          const key = `${x},${y}`;
          if (!visited.has(key) && board.value[y][x] === color) {
          const group = getStoneGroup(board.value, { x, y }, boardSize.value);
            if (group) {
              groups.push(group);
              group.stones.forEach(stone => {
                visited.add(`${stone.x},${stone.y}`);
              });
            }
          }
        }
      }
      return groups;
    }
  });

  // 合并所有提示
  const allHints = computed(() => {
    return [
      ...dangerousGroups.value,
      ...captureOpportunities.value,
      ...keyPoints.value,
      ...safeMoves.value
    ].sort((a, b) => b.priority - a.priority);
  });

  // 获取最重要的提示
  const topHints = computed(() => {
    return allHints.value.slice(0, 3);
  });

  return {
    dangerousGroups,
    captureOpportunities,
    keyPoints,
    safeMoves,
    allHints,
    topHints
  };
}
