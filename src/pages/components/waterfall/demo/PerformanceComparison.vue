<template>
  <view class="performance-demo">
    <view class="demo-header">
      <text class="demo-title">瀑布流重排性能对比</text>
      <view class="demo-description">
        <text>对比传统 DOM 重测方案 vs 无 DOM 二次测量方案的性能差异</text>
      </view>
    </view>

    <view class="test-controls">
      <view class="control-row">
        <text>测试项目数量:</text>
        <picker :range="itemCountOptions" @change="onItemCountChange">
          <view class="picker">{{ itemCountOptions[itemCountIndex] }}</view>
        </picker>
      </view>

      <view class="control-row">
        <text>列数变化:</text>
        <text>{{ columns }} → {{ targetColumns }}</text>
        <button @click="runPerformanceTest">开始性能测试</button>
      </view>
    </view>

    <view class="results-section" v-if="testResults.length > 0">
      <text class="section-title">测试结果</text>

      <view class="results-table">
        <view class="table-header">
          <text>项目数量</text>
          <text>传统方案</text>
          <text>新方案</text>
          <text>性能提升</text>
        </view>

        <view
          v-for="result in testResults"
          :key="result.itemCount"
          class="table-row"
        >
          <text>{{ result.itemCount }}</text>
          <text>{{ result.oldTime }}ms</text>
          <text>{{ result.newTime }}ms</text>
          <text class="improvement">{{ result.improvement }}x</text>
        </view>
      </view>
    </view>

    <view class="demo-container">
      <view class="method-section">
        <text class="method-title">传统方案 (模拟 DOM 重测)</text>
        <view
          class="waterfall-container traditional"
          :style="{ height: traditionalHeight + 'px' }"
        >
          <view
            v-for="item in traditionalItems"
            :key="item.id"
            class="waterfall-item"
            :style="{
              position: 'absolute',
              left: item.left + 'px',
              top: item.top + 'px',
              width: item.width + 'px',
              height: item.height + 'px',
            }"
          >
            <view class="item-content traditional-item">
              <text>{{ item.id }}</text>
            </view>
          </view>
        </view>
        <text class="time-display">重排耗时: {{ traditionalTime }}ms</text>
      </view>

      <view class="method-section">
        <text class="method-title">新方案 (纯公式计算)</text>
        <view
          class="waterfall-container modern"
          :style="{ height: containerHeight + 'px' }"
        >
          <view
            v-for="layoutItem in layoutItems"
            :key="layoutItem.id"
            class="waterfall-item"
            :style="{
              position: 'absolute',
              left: layoutItem.left + 'px',
              top: layoutItem.top + 'px',
              width: layoutItem.width + 'px',
              height: layoutItem.height + 'px',
            }"
          >
            <view class="item-content modern-item">
              <text>{{ layoutItem.id }}</text>
            </view>
          </view>
        </view>
        <text class="time-display">重排耗时: {{ modernTime }}ms</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  useWaterfallReflow,
  type WaterfallItem,
} from '../../../../lib/use/use-waterfall-reflow'

// 测试配置
const itemCountOptions = ['50', '100', '200', '500']
const itemCountIndex = ref(1)
const columns = ref(2)
const targetColumns = ref(3)
const containerWidth = ref(350)
const columnGap = ref(10)
const rowGap = ref(10)

// 测试结果
interface TestResult {
  itemCount: number
  oldTime: number
  newTime: number
  improvement: string
}
const testResults = ref<TestResult[]>([])

// 传统方案状态
const traditionalItems = ref<
  Array<{
    id: number
    left: number
    top: number
    width: number
    height: number
  }>
>([])
const traditionalHeight = ref(0)
const traditionalTime = ref(0)

// 新方案状态
const modernTime = ref(0)
const { layoutItems, containerHeight, initialize } = useWaterfallReflow({
  containerWidth,
  columns,
  columnGap,
  rowGap,
  immediate: false,
})

// 生成测试数据
const generateTestItems = (count: number): WaterfallItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    width: 150 + Math.random() * 100,
    height: 100 + Math.random() * 150,
  }))
}

// 传统方案：模拟 DOM 重测的瀑布流算法
const traditionalWaterfallLayout = (
  items: WaterfallItem[],
  containerWidth: number,
  columns: number,
  columnGap: number,
  rowGap: number,
) => {
  // 模拟 DOM 读取操作的延迟
  const simulateDOMRead = () => {
    // 模拟 getBoundingClientRect() 等 DOM 操作的耗时
    const start = performance.now()
    while (performance.now() - start < 0.1) {
      // 空循环模拟 DOM 读取耗时
    }
  }

  const columnWidth = (containerWidth - (columns - 1) * columnGap) / columns
  const colHeights = new Array(columns).fill(0)
  const result: Array<{
    id: number
    left: number
    top: number
    width: number
    height: number
  }> = []

  for (const item of items) {
    // 模拟每次都要读取 DOM 获取尺寸
    simulateDOMRead()

    const shortestColIndex = colHeights.indexOf(Math.min(...colHeights))
    const width = columnWidth
    const height = width / (item.width / item.height)
    const left = shortestColIndex * (columnWidth + columnGap)
    const top =
      colHeights[shortestColIndex] + (colHeights[shortestColIndex] ? rowGap : 0)

    result.push({
      id: Number(item.id),
      left,
      top,
      width,
      height,
    })

    colHeights[shortestColIndex] = top + height
  }

  return {
    items: result,
    height: Math.max(...colHeights),
  }
}

// 执行传统方案重排
const runTraditionalReflow = (items: WaterfallItem[]) => {
  const start = performance.now()
  const result = traditionalWaterfallLayout(
    items,
    containerWidth.value,
    targetColumns.value,
    columnGap.value,
    rowGap.value,
  )
  const end = performance.now()

  traditionalItems.value = result.items
  traditionalHeight.value = result.height
  traditionalTime.value = Math.round((end - start) * 100) / 100
}

// 执行新方案重排
const runModernReflow = () => {
  const start = performance.now()
  columns.value = targetColumns.value
  const end = performance.now()

  modernTime.value = Math.round((end - start) * 100) / 100
}

// 运行性能测试
const runPerformanceTest = async () => {
  const itemCount = parseInt(itemCountOptions[itemCountIndex.value])
  const testItems = generateTestItems(itemCount)

  // 初始化新方案
  columns.value = 2
  initialize(testItems)

  // 初始化传统方案
  const initialResult = traditionalWaterfallLayout(
    testItems,
    containerWidth.value,
    2,
    columnGap.value,
    rowGap.value,
  )
  traditionalItems.value = initialResult.items
  traditionalHeight.value = initialResult.height

  // 等待渲染完成
  await new Promise((resolve) => setTimeout(resolve, 100))

  // 测试传统方案
  runTraditionalReflow(testItems)

  // 等待一下再测试新方案
  await new Promise((resolve) => setTimeout(resolve, 100))

  // 测试新方案
  runModernReflow()

  // 记录结果
  const improvement =
    traditionalTime.value > 0
      ? (traditionalTime.value / modernTime.value).toFixed(1)
      : '∞'

  const existingIndex = testResults.value.findIndex(
    (r) => r.itemCount === itemCount,
  )
  const newResult: TestResult = {
    itemCount,
    oldTime: traditionalTime.value,
    newTime: modernTime.value,
    improvement,
  }

  if (existingIndex >= 0) {
    testResults.value[existingIndex] = newResult
  } else {
    testResults.value.push(newResult)
  }

  // 按项目数量排序
  testResults.value.sort((a, b) => a.itemCount - b.itemCount)
}

// 事件处理
const onItemCountChange = (e: any) => {
  itemCountIndex.value = e.detail.value
}

// 初始化
onMounted(() => {
  const initialItems = generateTestItems(50)
  initialize(initialItems)

  const initialResult = traditionalWaterfallLayout(
    initialItems,
    containerWidth.value,
    2,
    columnGap.value,
    rowGap.value,
  )
  traditionalItems.value = initialResult.items
  traditionalHeight.value = initialResult.height
})
</script>

<style lang="scss" scoped>
.performance-demo {
  padding: 20rpx;
}

.demo-header {
  margin-bottom: 30rpx;
  text-align: center;
}

.demo-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
  display: block;
}

.demo-description {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
}

.test-controls {
  background: #f8f9fa;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 30rpx;
}

.control-row {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;

  &:last-child {
    margin-bottom: 0;
  }

  text {
    font-size: 28rpx;
    color: #333;
    margin-right: 20rpx;
  }
}

.picker {
  padding: 10rpx 20rpx;
  background: white;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 28rpx;
}

button {
  padding: 12rpx 24rpx;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
  margin-left: auto;
}

.results-section {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
  display: block;
}

.results-table {
  background: white;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.table-header,
.table-row {
  display: flex;
  padding: 15rpx;

  text {
    flex: 1;
    text-align: center;
    font-size: 26rpx;
  }
}

.table-header {
  background: #f8f9fa;
  font-weight: bold;
  color: #333;
}

.table-row {
  border-top: 1rpx solid #eee;

  &:nth-child(even) {
    background: #fafafa;
  }
}

.improvement {
  color: #28a745;
  font-weight: bold;
}

.demo-container {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.method-section {
  background: white;
  border-radius: 12rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.method-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
  display: block;
}

.waterfall-container {
  position: relative;
  width: 100%;
  min-height: 200rpx;
  border: 2rpx solid #eee;
  border-radius: 8rpx;
  margin-bottom: 15rpx;

  &.traditional {
    background: #fff5f5;
  }

  &.modern {
    background: #f0fff4;
  }
}

.waterfall-item {
  border-radius: 6rpx;
  overflow: hidden;
  box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.1);
}

.item-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
  color: white;

  &.traditional-item {
    background: #ff6b6b;
  }

  &.modern-item {
    background: #51cf66;
  }
}

.time-display {
  font-size: 26rpx;
  color: #666;
  text-align: center;
  display: block;
}
</style>
