import type { Position, StoneGroup } from '../types/go';
import { StoneColor } from '../types/go';

// 将位置转换为字符串key
export function positionToKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

// 将字符串key转换为位置
export function keyToPosition(key: string): Position {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

// 获取相邻位置（上下左右）
export function getNeighbors(pos: Position, boardSize: number): Position[] {
  const neighbors: Position[] = [];
  const { x, y } = pos;

  if (x > 0) neighbors.push({ x: x - 1, y });
  if (x < boardSize - 1) neighbors.push({ x: x + 1, y });
  if (y > 0) neighbors.push({ x, y: y - 1 });
  if (y < boardSize - 1) neighbors.push({ x, y: y + 1 });

  return neighbors;
}

// 获取棋块（连通的同色棋子组）
export function getStoneGroup(
  board: StoneColor[][],
  pos: Position,
  boardSize: number
): StoneGroup | null {
  const color = board[pos.y][pos.x];
  if (color === StoneColor.Empty) return null;

  const visited = new Set<string>();
  const stones: Position[] = [];
  const liberties = new Set<string>();

  const dfs = (p: Position) => {
    const key = positionToKey(p);
    if (visited.has(key)) return;
    visited.add(key);

    if (board[p.y][p.x] === color) {
      stones.push(p);

      const neighbors = getNeighbors(p, boardSize);
      for (const neighbor of neighbors) {
        if (board[neighbor.y][neighbor.x] === StoneColor.Empty) {
          liberties.add(positionToKey(neighbor));
        } else if (board[neighbor.y][neighbor.x] === color) {
          dfs(neighbor);
        }
      }
    }
  };

  dfs(pos);

  return {
    stones,
    color,
    liberties
  };
}

// 计算棋块的气数
export function countLiberties(
  board: StoneColor[][],
  pos: Position,
  boardSize: number
): number {
  const group = getStoneGroup(board, pos, boardSize);
  return group ? group.liberties.size : 0;
}

// 检查棋块是否被提
export function isGroupCaptured(
  board: StoneColor[][],
  pos: Position,
  boardSize: number
): boolean {
  return countLiberties(board, pos, boardSize) === 0;
}

// 移除棋块
export function removeGroup(
  board: StoneColor[][],
  group: StoneGroup
): Position[] {
  const removedStones: Position[] = [];

  for (const pos of group.stones) {
    board[pos.y][pos.x] = StoneColor.Empty;
    removedStones.push(pos);
  }

  return removedStones;
}

// 检查是否是自杀手（下了之后自己没气）
export function isSuicideMove(
  board: StoneColor[][],
  pos: Position,
  color: StoneColor,
  boardSize: number
): boolean {
  // 临时放置棋子
  board[pos.y][pos.x] = color;

  // 检查是否能提对方的子
  const opponentColor = color === StoneColor.Black ? StoneColor.White : StoneColor.Black;
  const neighbors = getNeighbors(pos, boardSize);
  let canCapture = false;

  for (const neighbor of neighbors) {
    if (board[neighbor.y][neighbor.x] === opponentColor) {
      if (isGroupCaptured(board, neighbor, boardSize)) {
        canCapture = true;
        break;
      }
    }
  }

  // 如果能提对方的子，不是自杀
  if (canCapture) {
    board[pos.y][pos.x] = StoneColor.Empty;
    return false;
  }

  // 检查自己是否有气
  const hasLiberties = countLiberties(board, pos, boardSize) > 0;

  // 恢复棋盘
  board[pos.y][pos.x] = StoneColor.Empty;

  return !hasLiberties;
}

// 检查是否是打劫位置
export function isKoMove(
  board: StoneColor[][],
  pos: Position,
  koPosition: Position | null
): boolean {
  return koPosition !== null &&
         koPosition.x === pos.x &&
         koPosition.y === pos.y;
}

// 执行落子（包括提子）
export function makeMove(
  board: StoneColor[][],
  pos: Position,
  color: StoneColor,
  boardSize: number
): { capturedStones: Position[], newKoPosition: Position | null } {
  // 放置棋子
  board[pos.y][pos.x] = color;

  // 检查并移除被提的对方棋子
  const opponentColor = color === StoneColor.Black ? StoneColor.White : StoneColor.Black;
  const neighbors = getNeighbors(pos, boardSize);
  const capturedStones: Position[] = [];

  for (const neighbor of neighbors) {
    if (board[neighbor.y][neighbor.x] === opponentColor) {
      const group = getStoneGroup(board, neighbor, boardSize);
      if (group && group.liberties.size === 0) {
        const removed = removeGroup(board, group);
        capturedStones.push(...removed);
      }
    }
  }

  // 检查是否形成打劫
  let newKoPosition: Position | null = null;
  if (capturedStones.length === 1) {
    const capturedPos = capturedStones[0];
    // 检查是否是简单劫（提一子后对方立即可以回提）
    board[capturedPos.y][capturedPos.x] = opponentColor;
    const wouldCapture = isGroupCaptured(board, pos, boardSize);
    board[capturedPos.y][capturedPos.x] = StoneColor.Empty;

    if (wouldCapture) {
      newKoPosition = capturedPos;
    }
  }

  return { capturedStones, newKoPosition };
}

// 判断落子是否合法
export function isValidMove(
  board: StoneColor[][],
  pos: Position,
  color: StoneColor,
  boardSize: number,
  koPosition: Position | null
): boolean {
  // 检查位置是否在棋盘内
  if (pos.x < 0 || pos.x >= boardSize || pos.y < 0 || pos.y >= boardSize) {
    return false;
  }

  // 检查位置是否为空
  if (board[pos.y][pos.x] !== StoneColor.Empty) {
    return false;
  }

  // 检查是否违反劫规则
  if (isKoMove(board, pos, koPosition)) {
    return false;
  }

  // 检查是否是自杀手
  if (isSuicideMove(board, pos, color, boardSize)) {
    return false;
  }

  return true;
}

// 创建空棋盘
export function createEmptyBoard(size: number): StoneColor[][] {
  return Array(size).fill(null).map(() => Array(size).fill(StoneColor.Empty));
}

// 深拷贝棋盘
export function cloneBoard(board: StoneColor[][]): StoneColor[][] {
  return board.map(row => [...row]);
}

// 获取所有棋块
export function getAllGroups(board: StoneColor[][], boardSize: number): StoneGroup[] {
  const visited = new Set<string>();
  const groups: StoneGroup[] = [];

  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      const pos = { x, y };
      const key = positionToKey(pos);

      if (!visited.has(key) && board[y][x] !== StoneColor.Empty) {
        const group = getStoneGroup(board, pos, boardSize);
        if (group) {
          groups.push(group);
          group.stones.forEach(p => visited.add(positionToKey(p)));
        }
      }
    }
  }

  return groups;
}