<template>
  <div class="demo-container">
    <h1>瀑布流最小列高度计算Bug复现Demo</h1>

    <div class="debug-info problem">
      <strong>问题描述：</strong>
      在瀑布流布局中，有时候最小列高度没有正确累加，导致项目重叠或布局错乱。

      <strong>问题原因：</strong>
      1. 计算属性 minColumn 在异步循环中可能返回过期的引用 2.
      Vue响应式更新有延迟，导致列高度状态不同步 3.
      引用失效：更新列高度后，下次循环的 minColumn 可能还指向旧的最短列
    </div>

    <div class="controls">
      <button @click="addItems(5)">添加5个项目</button>
      <button @click="addItems(10)">添加10个项目</button>
      <button @click="clearItems">清空</button>
      <button @click="toggleVersion">
        切换版本: {{ useBuggyVersion ? '有Bug版本' : '修复版本' }}
      </button>
    </div>

    <!-- 有Bug的版本 -->
    <div v-if="useBuggyVersion">
      <h2>❌ 有Bug版本 - 使用计算属性</h2>
      <BuggyWaterfall :items="items" @debug="onDebug" />
    </div>

    <!-- 修复后的版本 -->
    <div v-else>
      <h2>✅ 修复版本 - 每次重新获取最短列</h2>
      <FixedWaterfall :items="items" @debug="onDebug" />
    </div>

    <div class="debug-info" v-if="debugInfo">
      <strong>调试信息：</strong>
      <pre>{{ debugInfo }}</pre>
    </div>

    <div class="debug-info solution">
      <strong>解决方案：</strong>
      1. 不要在异步循环中依赖计算属性的引用 2. 每次循环都重新调用 getMinColumn()
      函数 3. 使用明确的列索引变量，避免引用混乱 4. 必要时添加 nextTick()
      确保响应式更新完成
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BuggyWaterfall from './components/BuggyWaterfall.vue'
import FixedWaterfall from './components/FixedWaterfall.vue'

interface WaterfallItem {
  height: number
  color: string
  top: number
  left: number
}

const items = ref<WaterfallItem[]>([])
const useBuggyVersion = ref(true)
const debugInfo = ref('')

const colors = [
  '#ffcccb',
  '#add8e6',
  '#90ee90',
  '#ffd700',
  '#dda0dd',
  '#f0e68c',
]

const addItems = (count: number) => {
  for (let i = 0; i < count; i++) {
    items.value.push({
      height: Math.floor(Math.random() * 100) + 50, // 50-150px随机高度
      color: colors[Math.floor(Math.random() * colors.length)],
      top: 0,
      left: 0,
    })
  }
  // 自动触发布局
  setTimeout(() => {
    triggerLayout()
  }, 100)
}

const clearItems = () => {
  items.value = []
  debugInfo.value = ''
}

const toggleVersion = () => {
  useBuggyVersion.value = !useBuggyVersion.value
  debugInfo.value = ''
}

const onDebug = (info: string) => {
  debugInfo.value = info
}

const triggerLayout = () => {
  // 触发重新布局的逻辑
  console.log('触发布局')
}

// 初始化一些项目
addItems(8)
</script>

<style scoped>
.demo-container {
  max-width: 800px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  padding: 20px;
}

.controls {
  margin: 20px 0;
}

.controls button {
  margin: 5px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: #f5f5f5;
  cursor: pointer;
  border-radius: 4px;
}

.controls button:hover {
  background: #e5e5e5;
}

.debug-info {
  background: #f9f9f9;
  padding: 15px;
  margin: 10px 0;
  border-left: 4px solid #007acc;
  font-family: monospace;
  white-space: pre-line;
}

.debug-info pre {
  margin: 0;
  white-space: pre-wrap;
}

.problem {
  background: #ffe6e6;
  border-left-color: #ff4444;
}

.solution {
  background: #e6ffe6;
  border-left-color: #44ff44;
}

h1 {
  color: #333;
  text-align: center;
}

h2 {
  color: #666;
  margin-top: 30px;
}
</style>
