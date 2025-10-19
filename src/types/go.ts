// 围棋相关的类型定义

// 棋子颜色
export enum StoneColor {
  Empty = 0,
  Black = 1,
  White = 2
}

// 坐标位置
export interface Position {
  x: number;
  y: number;
}

// 棋子
export interface Stone {
  position: Position;
  color: StoneColor;
}

// 棋块（连接的同色棋子组）
export interface StoneGroup {
  stones: Position[];
  color: StoneColor;
  liberties: Set<string>; // 气的位置集合
}

// 游戏状态
export interface GameState {
  board: StoneColor[][];
  currentPlayer: StoneColor;
  capturedBlack: number; // 被提黑子数
  capturedWhite: number; // 被提白子数
  moveHistory: Move[];
  koPosition: Position | null; // 打劫位置
  showTerritory: boolean; // 是否显示领地
  territoryMap: number[][]; // 领地地图，0=中立，1=黑方，2=白方
}

// 走棋记录
export interface Move {
  position: Position;
  color: StoneColor;
  capturedStones: Position[];
  moveNumber: number;
}

// 领地信息
export interface Territory {
  blackTerritory: Position[];
  whiteTerritory: Position[];
  neutralTerritory: Position[];
  blackScore: number;
  whiteScore: number;
}

// 游戏配置
export interface GameConfig {
  boardSize: 9 | 13 | 19;
  handicap: number; // 让子数
  komi: number; // 贴目
}

// 教程步骤
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  boardState?: StoneColor[][];
  highlightPositions?: Position[];
  interactive: boolean;
}

// 棋局分析
export interface Analysis {
  groups: StoneGroup[];
  territory: Territory;
  deadStones: Position[];
  lifeStatus: Map<string, boolean>; // 棋块ID -> 死活状态
}