import { computed, unref } from 'vue';
import type { Ref } from 'vue';
import type { Position, Territory } from '../types/go';
import { StoneColor } from '../types/go';
import { getAllGroups, getNeighbors, positionToKey } from '../utils/goRules';

export function useTerritory(
  board: Ref<StoneColor[][]>,
  boardSizeInput: Ref<number> | number
) {
  const boardSize = computed(() => unref(boardSizeInput));
  // 计算每个棋块的气
  const groupLiberties = computed(() => {
    const groups = getAllGroups(board.value, boardSize.value);
    const libertiesMap = new Map<string, Set<string>>();

    for (const group of groups) {
      for (const stone of group.stones) {
        const key = positionToKey(stone);
        libertiesMap.set(key, group.liberties);
      }
    }

    return libertiesMap;
  });

  // 计算领地控制图
  const territoryControl = computed(() => {
    const size = boardSize.value;
    const control = Array(size).fill(null).map(() =>
      Array(size).fill(0)
    );
    const influence = calculateInfluence(board.value, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // 如果该点已有棋子，跳过
        if (board.value[y][x] !== StoneColor.Empty) {
          control[y][x] = board.value[y][x];
          continue;
        }

        // 根据影响力判断控制权
        const inf = influence[y][x];
        if (inf > 0.2) {
          control[y][x] = StoneColor.Black;
        } else if (inf < -0.2) {
          control[y][x] = StoneColor.White;
        }
      }
    }

    return control;
  });

  // 计算完整的领地信息
  const territoryInfo = computed((): Territory => {
    const blackTerritory: Position[] = [];
    const whiteTerritory: Position[] = [];
    const neutralTerritory: Position[] = [];
    const control = territoryControl.value;
    const size = boardSize.value;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board.value[y][x] === StoneColor.Empty) {
          const pos = { x, y };
          if (control[y][x] === StoneColor.Black) {
            blackTerritory.push(pos);
          } else if (control[y][x] === StoneColor.White) {
            whiteTerritory.push(pos);
          } else {
            neutralTerritory.push(pos);
          }
        }
      }
    }

    return {
      blackTerritory,
      whiteTerritory,
      neutralTerritory,
      blackScore: blackTerritory.length,
      whiteScore: whiteTerritory.length
    };
  });

  // 获取指定位置棋子的气数
  function getLibertyCount(position: Position): number {
    if (board.value[position.y][position.x] === StoneColor.Empty) {
      return 0;
    }

    const key = positionToKey(position);
    const liberties = groupLiberties.value.get(key);
    return liberties ? liberties.size : 0;
  }

  // 获取指定位置所属棋块的所有气的位置
  function getGroupLiberties(position: Position): Position[] {
    const key = positionToKey(position);
    const liberties = groupLiberties.value.get(key);

    if (!liberties) return [];

    return Array.from(liberties).map(libKey => {
      const [x, y] = libKey.split(',').map(Number);
      return { x, y };
    });
  }

  // 简化的影响力计算，只考虑近距离影响（优化性能）
  function calculateInfluence(board: StoneColor[][], size: number): number[][] {
    const influence = Array(size).fill(null).map(() =>
      Array(size).fill(0)
    );

    const maxDistance = 5; // 只计算5格内的影响

    // 对每个棋子计算其影响力辐射
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board[y][x] !== StoneColor.Empty) {
          const color = board[y][x];
          const strength = color === StoneColor.Black ? 1 : -1;

          // 只计算附近区域的影响力
          const startY = Math.max(0, y - maxDistance);
          const endY = Math.min(size - 1, y + maxDistance);
          const startX = Math.max(0, x - maxDistance);
          const endX = Math.min(size - 1, x + maxDistance);

          for (let dy = startY; dy <= endY; dy++) {
            for (let dx = startX; dx <= endX; dx++) {
              const distance = Math.abs(x - dx) + Math.abs(y - dy);
              if (distance > 0 && distance <= maxDistance) {
                const decay = 1 / (1 + distance * 0.5);
                influence[dy][dx] += strength * decay;
              }
            }
          }
        }
      }
    }

    return influence;
  }

  // 检查某个区域是否被完全包围
  function isAreaSurrounded(
    startPos: Position,
    byColor: StoneColor
  ): boolean {
    if (board.value[startPos.y][startPos.x] !== StoneColor.Empty) {
      return false;
    }

    const visited = new Set<string>();
    const stack = [startPos];
    let isSurrounded = true;

    while (stack.length > 0 && isSurrounded) {
      const pos = stack.pop()!;
      const key = positionToKey(pos);

      if (visited.has(key)) continue;
      visited.add(key);

      const neighbors = getNeighbors(pos, boardSize.value);
      for (const neighbor of neighbors) {
        const neighborColor = board.value[neighbor.y][neighbor.x];

        if (neighborColor === StoneColor.Empty) {
          const nKey = positionToKey(neighbor);
          if (!visited.has(nKey)) {
            stack.push(neighbor);
          }
        } else if (neighborColor !== byColor) {
          // 遇到了对方的棋子，不是被完全包围
          isSurrounded = false;
          break;
        }
      }
    }

    return isSurrounded;
  }

  // 高亮显示气的区域
  const highlightedLiberties = computed(() => {
    const highlights = new Map<string, string>(); // position key -> color

    const groups = getAllGroups(board.value, boardSize.value);

    for (const group of groups) {
      const color = group.color === StoneColor.Black
        ? 'rgba(0, 0, 0, 0.3)'
        : 'rgba(255, 255, 255, 0.5)';

      for (const liberty of group.liberties) {
        highlights.set(liberty, color);
      }
    }

    return highlights;
  });

  return {
    groupLiberties,
    territoryControl,
    territoryInfo,
    highlightedLiberties,
    getLibertyCount,
    getGroupLiberties,
    isAreaSurrounded
  };
}
