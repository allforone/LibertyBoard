<template>
  <div class="tutorial">
    <h2 class="tutorial-title">围棋基础教程</h2>

    <div class="tutorial-sections">
      <section class="tutorial-section">
        <h3>什么是"气"？</h3>
        <p>
          在围棋中，"气"是指棋子或棋块直接相邻的空点。每个棋子最多有4口气（上下左右），
          位于边上的棋子最多有3口气，角上的棋子最多有2口气。
        </p>
        <div class="highlight-box">
          <strong>重要规则：</strong>当一个棋子或棋块的气数为0时，它就会被提掉。
        </div>
      </section>

      <section class="tutorial-section">
        <h3>如何使用本软件</h3>
        <ul>
          <li>点击棋盘空位下子，黑白自动交替</li>
          <li>开启"显示气的区域"可以看到每个棋块的气</li>
          <li>开启"显示领地控制"可以看到双方控制的区域</li>
          <li>开启"显示气数"可以在棋子上看到该棋块的气数</li>
          <li>气数为1的棋块会用红色警告显示</li>
        </ul>
      </section>

      <section class="tutorial-section">
        <h3>基本规则</h3>
        <ul>
          <li><strong>落子：</strong>黑先白后，交替落子</li>
          <li><strong>提子：</strong>包围对方棋子使其没有气时，可以提掉对方的棋子</li>
          <li><strong>打劫：</strong>不能立即回提对方刚提过的单个棋子</li>
          <li><strong>禁着点：</strong>不能下在自己没有气的位置（自杀），除非能提掉对方的子</li>
          <li><strong>胜负：</strong>占地多者胜，白棋有贴目（通常6.5目）</li>
        </ul>
      </section>

      <section class="tutorial-section">
        <h3>形势判断</h3>
        <p>
          本软件使用影响力算法来判断领地控制。黑色半透明区域表示黑方控制，
          白色半透明区域表示白方控制。这可以帮助你理解当前的形势。
        </p>
      </section>

      <section class="tutorial-section">
        <h3>死活判断</h3>
        <p>
          一个棋块要活棋，需要有两个或以上的"眼"（被完全包围的空点）。
          只有一个眼或没有眼的棋块最终会被对方吃掉。
        </p>
      </section>

      <section class="tutorial-section">
        <h3>练习建议</h3>
        <ol>
          <li>先在9×9小棋盘上练习基本的吃子和做活</li>
          <li>熟悉后可以尝试13×13棋盘</li>
          <li>最后挑战标准的19×19棋盘</li>
          <li>多使用气的可视化功能，帮助理解棋块的死活</li>
        </ol>
      </section>
    </div>

    <div class="tutorial-footer">
      <p class="tutorial-tip">
        💡 提示：围棋的精髓在于地域的争夺和棋块的死活，多观察气的变化能帮助你更好地理解围棋。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 教程组件暂时不需要额外逻辑
</script>

<style scoped>
.tutorial {
  max-width: 700px;
}

.tutorial-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 10px;
}

.tutorial-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tutorial-section {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #4CAF50;
}

.tutorial-section h3 {
  font-size: 18px;
  color: #2c3e50;
  margin-bottom: 12px;
  font-weight: bold;
}

.tutorial-section p {
  line-height: 1.6;
  color: #555;
  margin-bottom: 10px;
}

.tutorial-section ul,
.tutorial-section ol {
  margin-left: 20px;
  line-height: 1.8;
  color: #555;
}

.tutorial-section li {
  margin-bottom: 8px;
}

.tutorial-section strong {
  color: #333;
  font-weight: bold;
}

.highlight-box {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  padding: 12px;
  margin-top: 12px;
  color: #856404;
}

.highlight-box strong {
  color: #856404;
}

.tutorial-footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.tutorial-tip {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  border-radius: 8px;
  line-height: 1.6;
  text-align: center;
  font-weight: 500;
}
</style>