<template>
  <div
    class="waterfall"
    :style="{ height: containerHeight + 'px' }"
    @click="layout"
  >
    <div
      v-for="(item, index) in items"
      :key="index"
      class="waterfall-item"
      :style="{
        width: columnWidth + 'px',
        height: item.height + 'px',
        left: item.left + 'px',
        top: item.top + 'px',
        backgroundColor: item.color,
      }"
    >
      项目 {{ index }} ({{ item.height }}px)
    </div>
    <div class="layout-trigger">点击重新布局</div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, nextTick } from 'vue'

interface WaterfallItem {
  height: number
  color: string
  top: number
  left: number
}

interface Column {
  colIndex: number
  height: number
}

const props = defineProps<{
  items: WaterfallItem[]
}>()

const emit = defineEmits<{
  debug: [info: string]
}>()

const columns = reactive<Column[]>([
  { colIndex: 0, height: 0 },
  { colIndex: 1, height: 0 },
  { colIndex: 2, height: 0 },
])

const containerHeight = ref(0)
const columnWidth = 120
const columnGap = 10
const rowGap = 10

// ✅ 解决方案：使用函数而不是计算属性
const getMinColumn = (): Column => {
  let min = columns[0]
  for (let i = 1; i < columns.length; i++) {
    if (columns[i].height < min.height) {
      min = columns[i]
    }
  }
  return min
}

const layout = async () => {
  // 重置列高度
  columns.forEach((col) => (col.height = 0))

  let debugLog = '修复版本布局过程：\n'

  for (let i = 0; i < props.items.length; i++) {
    const item = props.items[i]

    // ✅ 解决方案：每次循环都重新获取最短列
    const currentMin = getMinColumn()
    debugLog += `项目${i}: 选择列${currentMin.colIndex}(高度${currentMin.height}) `

    item.top = currentMin.height + rowGap
    item.left = (columnGap + columnWidth) * currentMin.colIndex

    // ✅ 解决方案：使用明确的列索引
    const targetColumnIndex = currentMin.colIndex
    const newHeight = item.top + item.height
    columns[targetColumnIndex].height = newHeight

    debugLog += `-> 更新后高度${newHeight}\n`

    // ✅ 解决方案：确保响应式更新完成
    await nextTick()

    // 模拟异步操作
    await new Promise((resolve) => setTimeout(resolve, 1))
  }

  containerHeight.value = Math.max(...columns.map((col) => col.height))
  debugLog += `\n最终列高度: ${columns.map((col) => col.height).join(', ')}`
  debugLog += `\n容器高度: ${containerHeight.value}px`

  emit('debug', debugLog)
}

// 自动布局
layout()
</script>

<style scoped>
.waterfall {
  position: relative;
  border: 2px solid #ddd;
  margin: 20px 0;
  min-height: 200px;
  cursor: pointer;
}

.waterfall-item {
  position: absolute;
  background: #f0f0f0;
  border: 1px solid #ccc;
  padding: 10px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  text-align: center;
}

.layout-trigger {
  position: absolute;
  bottom: 5px;
  right: 5px;
  font-size: 12px;
  color: #666;
  background: rgba(255, 255, 255, 0.8);
  padding: 2px 6px;
  border-radius: 3px;
}
</style>
