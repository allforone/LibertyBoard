import { computed } from 'vue';
import type { Ref } from 'vue';
import type { Position, Move } from '../types/go';
import { StoneColor } from '../types/go';
import { getStoneGroup, countLiberties, getNeighbors } from '../utils/goRules';

export interface MoveAnalysis {
  type: 'placement' | 'capture' | 'defensive' | 'territorial' | 'ko' | 'atari';
  importance: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  explanation: string;
  tips: string[];
  concepts: GameConcept[];
}

export interface GameConcept {
  term: string;
  definition: string;
  example?: string;
}

export function useGameAnalysis(
  board: Ref<StoneColor[][]>,
  lastMove: Ref<Move | null>,
  boardSize: number
) {
  // 分析最后一步棋
  const moveAnalysis = computed((): MoveAnalysis | null => {
    if (!lastMove.value) return null;

    const move = lastMove.value;
    const position = move.position;
    const color = move.color;

    // 获取这步棋形成的棋块
    const group = getStoneGroup(board.value, position, boardSize);
    if (!group) return null;

    const libertyCount = group.liberties.size;
    const capturedCount = move.capturedStones.length;

    // 分析周围的情况
    const neighbors = getNeighbors(position, boardSize);
    const enemyGroups = neighbors
      .map(pos => {
        if (board.value[pos.y][pos.x] !== StoneColor.Empty &&
            board.value[pos.y][pos.x] !== color) {
          return getStoneGroup(board.value, pos, boardSize);
        }
        return null;
      })
      .filter(g => g !== null);

    // 判断落子类型并生成讲解
    return analyzeMove(
      position,
      color,
      libertyCount,
      capturedCount,
      enemyGroups,
      move.moveNumber
    );
  });

  // 分析具体着法
  function analyzeMove(
    position: Position,
    color: StoneColor,
    libertyCount: number,
    capturedCount: number,
    enemyGroups: any[],
    moveNumber: number
  ): MoveAnalysis {
    const colorName = color === StoneColor.Black ? '黑棋' : '白棋';

    // 如果有提子
    if (capturedCount > 0) {
      return {
        type: 'capture',
        importance: capturedCount > 2 ? 'high' : 'medium',
        title: `${colorName}提子成功！`,
        explanation: `这一手${colorName}成功提掉了对方${capturedCount}个棋子。提子是围棋中获得优势的重要手段之一。`,
        tips: [
          '提子后要注意保护自己新形成的棋块',
          '被提的空点可能成为对方的禁着点（不能立即回提）',
          `提掉的棋子会增加你的俘虏数，影响最终计分`
        ],
        concepts: [
          {
            term: '提子',
            definition: '当对方棋块的气被全部堵住（气数为0）时，这些棋子就会被提走',
            example: '就像刚才这一手，对方的棋子没有气了，所以被提掉了'
          },
          {
            term: '气',
            definition: '棋子在棋盘上的呼吸点，即上下左右的空点',
            example: '每个棋子最多有4口气（在棋盘中央时）'
          }
        ]
      };
    }

    // 检查是否形成叫吃（Atari）
    const atariGroups = enemyGroups.filter(g => g && g.liberties.size === 1);
    if (atariGroups.length > 0) {
      return {
        type: 'atari',
        importance: 'high',
        title: `${colorName}叫吃！`,
        explanation: `这一手形成了叫吃，对方的棋块只剩下1口气了。下一步如果对方不补救，你就可以提掉这些棋子。`,
        tips: [
          '叫吃后要观察对方是否会逃跑或反击',
          '有时候不必立即提子，可以先走其他更重要的点',
          '连续的叫吃可以追杀对方的大龙'
        ],
        concepts: [
          {
            term: '叫吃（Atari）',
            definition: '使对方棋块只剩一口气的状态',
            example: '就像现在，对方必须立即应对，否则下一手就会被提掉'
          },
          {
            term: '逃跑',
            definition: '被叫吃时，通过延伸棋块来增加气',
            example: '对方可以在剩余的气点上落子来增加气数'
          }
        ]
      };
    }

    // 检查自身是否处于危险（气数少）
    if (libertyCount <= 2) {
      return {
        type: 'defensive',
        importance: libertyCount === 1 ? 'critical' : 'high',
        title: `⚠️ ${colorName}需要小心！`,
        explanation: `你的这个棋块只有${libertyCount}口气，处于危险状态。需要考虑补强或者准备弃子。`,
        tips: [
          libertyCount === 1 ? '立即补气，否则下一手就会被提！' : '尽快增加气数，避免被叫吃',
          '可以通过连接其他棋块来增加整体的气',
          '有时候弃掉小棋保存大龙是明智的选择'
        ],
        concepts: [
          {
            term: '补气',
            definition: '在自己棋块的气点上落子，增加棋块的气数',
            example: '当棋块气数太少时，需要及时补气避免被提'
          },
          {
            term: '弃子',
            definition: '战略性地放弃部分棋子，以获得其他利益',
            example: '有时候救不活的棋子，不如用来做其他用途'
          }
        ]
      };
    }

    // 开局阶段的讲解
    if (moveNumber <= 10) {
      const corner = isCornerMove(position, boardSize);
      const side = isSideMove(position, boardSize);

      if (corner) {
        return {
          type: 'placement',
          importance: 'medium',
          title: '角部开局',
          explanation: '占角是围棋开局的基本原则。角部最容易围成实地，是开局必争之处。',
          tips: [
            '先占角，再守角或挂角',
            '常见的角部定式有小目、星位、三三等',
            '角部的选择会影响后续的布局方向'
          ],
          concepts: [
            {
              term: '占角',
              definition: '在棋盘四个角落的区域下子',
              example: '通常第一手会下在角部的星位或小目'
            },
            {
              term: '定式',
              definition: '角部双方经过长期研究形成的固定下法',
              example: '学习定式可以避免在开局吃亏'
            }
          ]
        };
      }

      if (side) {
        return {
          type: 'placement',
          importance: 'medium',
          title: '边的展开',
          explanation: '在确保角部后，向边上发展是自然的选择。边上比中央更容易围地。',
          tips: [
            '边上的拆二、拆三是常见的展开',
            '注意与角部棋子的配合',
            '不要让对方轻易打入你的阵地'
          ],
          concepts: [
            {
              term: '拆边',
              definition: '在边上展开自己的棋子，扩大势力范围',
              example: '拆二是隔一路，拆三是隔两路'
            },
            {
              term: '打入',
              definition: '在对方的势力范围内下子',
              example: '打入需要精确的计算，否则容易被吃'
            }
          ]
        };
      }
    }

    // 中盘的一般性讲解
    return {
      type: 'territorial',
      importance: 'medium',
      title: `${colorName}落子`,
      explanation: `${colorName}下在了(${String.fromCharCode(65 + position.x)}${boardSize - position.y})。这个棋块现在有${libertyCount}口气。`,
      tips: [
        '时刻关注各个棋块的气数',
        '寻找对方的弱点进行攻击',
        '在攻击的同时要注意自身的安全',
        '适时转换，不要一味追求吃子'
      ],
      concepts: [
        {
          term: '气',
          definition: '棋子或棋块的生存空间，即相邻的空点',
          example: `你的这个棋块现在有${libertyCount}口气`
        },
        {
          term: '棋块',
          definition: '相连的同色棋子形成的整体',
          example: '多个棋子连在一起共享气'
        },
        {
          term: '势力',
          definition: '棋子对周围空点的控制和影响',
          example: '通过布局来扩大自己的势力范围'
        }
      ]
    };
  }

  // 判断是否是角部着子
  function isCornerMove(pos: Position, size: number): boolean {
    const threshold = 4;
    return (pos.x < threshold || pos.x >= size - threshold) &&
           (pos.y < threshold || pos.y >= size - threshold);
  }

  // 判断是否是边上着子
  function isSideMove(pos: Position, size: number): boolean {
    const threshold = 4;
    const isEdge = pos.x < threshold || pos.x >= size - threshold ||
                   pos.y < threshold || pos.y >= size - threshold;
    return isEdge && !isCornerMove(pos, size);
  }

  // 获取局面评估
  const positionEvaluation = computed(() => {
    let blackTerritory = 0;
    let whiteTerritory = 0;
    let blackStones = 0;
    let whiteStones = 0;
    let neutralPoints = 0;

    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        const stone = board.value[y][x];
        if (stone === StoneColor.Black) {
          blackStones++;
        } else if (stone === StoneColor.White) {
          whiteStones++;
        } else {
          neutralPoints++;
        }
      }
    }

    return {
      blackStones,
      whiteStones,
      neutralPoints,
      stage: getGameStage(blackStones + whiteStones)
    };
  });

  // 判断游戏阶段
  function getGameStage(moveCount: number): string {
    if (moveCount < 30) return '布局阶段';
    if (moveCount < 100) return '中盘战斗';
    return '收官阶段';
  }

  return {
    moveAnalysis,
    positionEvaluation
  };
}