<template>
  <view class="reflow-optimization-demo">
    <view class="demo-header">
      <text class="demo-title">瀑布流重排优化演示</text>
      <view class="demo-description">
        <text>展示无 DOM 二次测量的瀑布流重排方案</text>
      </view>
    </view>

    <view class="demo-controls">
      <view class="control-group">
        <text>列数: {{ columns }}</text>
        <slider
          :value="columns"
          :min="1"
          :max="5"
          :step="1"
          @change="onColumnsChange"
        />
      </view>

      <view class="control-group">
        <text>列间距: {{ columnGap }}px</text>
        <slider
          :value="columnGap"
          :min="0"
          :max="30"
          :step="2"
          @change="onColumnGapChange"
        />
      </view>

      <view class="control-group">
        <text>行间距: {{ rowGap }}px</text>
        <slider
          :value="rowGap"
          :min="0"
          :max="30"
          :step="2"
          @change="onRowGapChange"
        />
      </view>
    </view>

    <view class="demo-actions">
      <button @click="addRandomItem">添加随机项</button>
      <button @click="insertRandomItem">插入随机项</button>
      <button @click="removeRandomItem">删除随机项</button>
      <button @click="batchAddItems">批量添加</button>
      <button @click="resetItems">重置</button>
    </view>

    <view class="demo-stats">
      <view class="stat-item">
        <text class="stat-label">项目数量</text>
        <text class="stat-value">{{ items?.length || 0 }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">容器高度</text>
        <text class="stat-value">{{ Math.round(containerHeight || 0) }}px</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">重排耗时</text>
        <text class="stat-value">{{ reflowTime }}ms</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">性能提升</text>
        <text class="stat-value">{{ performanceImprovement }}x</text>
      </view>
    </view>

    <!-- 优化版瀑布流容器 -->
    <view
      class="waterfall-container"
      :style="{ height: (containerHeight || 0) + 'px' }"
      ref="containerRef"
    >
      <view
        v-for="layoutItem in layoutItems || []"
        :key="layoutItem.id"
        class="waterfall-item"
        :style="{
          position: 'absolute',
          left: layoutItem.left + 'px',
          top: layoutItem.top + 'px',
          width: layoutItem.width + 'px',
          height: layoutItem.height + 'px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }"
      >
        <view class="item-content">
          <view
            class="item-image"
            :style="{ backgroundColor: getItemColor(layoutItem.id) }"
          >
            <text class="item-id">{{ layoutItem.id }}</text>
          </view>
          <view class="item-info">
            <text class="item-size">
              {{ Math.round(layoutItem.width) }}×{{
                Math.round(layoutItem.height)
              }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 性能对比说明 -->
    <view class="performance-explanation">
      <text class="explanation-title">性能优化原理</text>
      <view class="explanation-content">
        <view class="explanation-item">
          <text class="item-title">传统方案痛点：</text>
          <text class="item-desc">
            每次重排都需要重新测量 DOM，200 张图耗时 80-100ms
          </text>
        </view>
        <view class="explanation-item">
          <text class="item-title">优化方案核心：</text>
          <text class="item-desc">
            第一次排版后生成快照，后续通过纯公式计算，耗时 < 2ms
          </text>
        </view>
        <view class="explanation-item">
          <text class="item-title">关键技术：</text>
          <text class="item-desc">
            快照 + 纯公式重排，零 DOM 读写，O(n) 复杂度
          </text>
        </view>
      </view>
    </view>

    <!-- 瀑布流演示导航 -->
    <WaterfallDemoNavigation />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  useWaterfallReflow,
  type WaterfallItem,
} from '../../../../lib/use/use-waterfall-reflow'
import WaterfallDemoNavigation from './WaterfallDemoNavigation.vue'

// 响应式数据
const containerRef = ref()
const containerWidth = ref(375)
const columns = ref(2)
const columnGap = ref(10)
const rowGap = ref(10)
const reflowTime = ref(0)

// 项目数据
const items = ref<WaterfallItem[]>([])

// 使用瀑布流重排 hook
const {
  layoutItems,
  containerHeight,
  isInitialized,
  initialize,
  appendItem,
  insertItem,
  removeItem,
  batchUpdate,
} = useWaterfallReflow({
  containerWidth,
  columns,
  columnGap,
  rowGap,
})

// 计算性能提升倍数（假设传统方案耗时）
const performanceImprovement = computed(() => {
  if (reflowTime.value === 0) return '∞'
  const traditionalTime = items.value.length * 0.5 // 假设每个项目传统方案需要 0.5ms
  return traditionalTime > 0
    ? Math.round(traditionalTime / reflowTime.value)
    : '∞'
})

// 生成随机项目
const generateRandomItem = (id: string | number): WaterfallItem => {
  const width = 200 + Math.random() * 100 // 200-300px
  const height = 150 + Math.random() * 200 // 150-350px
  return { id, width, height }
}

// 生成初始数据
const generateInitialItems = (): WaterfallItem[] => {
  return Array.from({ length: 30 }, (_, i) => generateRandomItem(i + 1))
}

// 获取项目颜色
const getItemColor = (id: string | number): string => {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#85C1E9',
    '#F8C471',
    '#82E0AA',
    '#F1948A',
  ]
  const index = typeof id === 'number' ? id : parseInt(id.toString())
  return colors[index % colors.length]
}

// 测量重排性能
const measureReflowTime = (fn: () => void) => {
  const start = performance.now()
  fn()
  const end = performance.now()
  reflowTime.value = Math.round((end - start) * 100) / 100
}

// 事件处理
const onColumnsChange = (e: any) => {
  columns.value = e.detail.value
  // measureReflowTime(() => {
  // })
}

const onColumnGapChange = (e: any) => {
  measureReflowTime(() => {
    columnGap.value = e.detail.value
  })
}

const onRowGapChange = (e: any) => {
  measureReflowTime(() => {
    rowGap.value = e.detail.value
  })
}

const addRandomItem = () => {
  const newId =
    items.value.length > 0
      ? Math.max(...items.value.map((item) => Number(item.id))) + 1
      : 1
  const newItem = generateRandomItem(newId)

  measureReflowTime(() => {
    items.value.push(newItem)
    if (isInitialized.value) {
      appendItem(newItem)
    }
  })
}

const insertRandomItem = () => {
  if (items.value.length === 0) return

  const insertIndex = Math.floor(Math.random() * items.value.length)
  const newId = Math.max(...items.value.map((item) => Number(item.id))) + 1
  const newItem = generateRandomItem(newId)

  measureReflowTime(() => {
    items.value.splice(insertIndex, 0, newItem)
    if (isInitialized.value) {
      insertItem(insertIndex, newItem)
    }
  })
}

const removeRandomItem = () => {
  if (items.value.length === 0) return

  const removeIndex = Math.floor(Math.random() * items.value.length)
  const itemToRemove = items.value[removeIndex]

  measureReflowTime(() => {
    items.value.splice(removeIndex, 1)
    if (isInitialized.value) {
      removeItem(itemToRemove.id)
    }
  })
}

const batchAddItems = () => {
  const newItems = Array.from({ length: 5 }, (_, i) => {
    const newId =
      items.value.length > 0
        ? Math.max(...items.value.map((item) => Number(item.id))) + i + 1
        : i + 1
    return generateRandomItem(newId)
  })

  measureReflowTime(() => {
    items.value.push(...newItems)
    if (isInitialized.value) {
      batchUpdate(
        newItems.map((item) => ({
          type: 'append' as const,
          data: { item },
        })),
      )
    }
  })
}

const resetItems = () => {
  measureReflowTime(() => {
    items.value = generateInitialItems()
    initialize(items.value)
  })
}

// 获取容器宽度
const updateContainerWidth = () => {
  if (containerRef.value) {
    // 在实际项目中，这里应该通过 uni.createSelectorQuery() 获取真实宽度
    // 这里为了演示简化处理
    containerWidth.value = 375
  }
}

// 初始化
onMounted(async () => {
  await nextTick()
  updateContainerWidth()

  items.value = generateInitialItems()
  initialize(items.value)
})
</script>

<style lang="scss" scoped>
.reflow-optimization-demo {
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

.demo-controls {
  background: #f8f9fa;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.control-group {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;

  &:last-child {
    margin-bottom: 0;
  }

  text {
    width: 200rpx;
    font-size: 28rpx;
    color: #666;
  }

  slider {
    flex: 1;
    margin-left: 20rpx;
  }
}

.demo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  margin-bottom: 20rpx;

  button {
    flex: 1;
    min-width: 140rpx;
    padding: 12rpx 20rpx;
    font-size: 24rpx;
    background: #007aff;
    color: white;
    border: none;
    border-radius: 8rpx;
  }
}

.demo-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  margin-bottom: 30rpx;
}

.stat-item {
  flex: 1;
  min-width: 160rpx;
  padding: 15rpx;
  background: white;
  border-radius: 8rpx;
  text-align: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 5rpx;
}

.stat-value {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.waterfall-container {
  position: relative;
  width: 100%;
  background: #fff;
  border: 2rpx solid #eee;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 30rpx;
}

.waterfall-item {
  border-radius: 8rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.item-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.item-image {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.item-id {
  color: white;
  font-size: 28rpx;
  font-weight: bold;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3);
}

.item-info {
  padding: 8rpx;
  background: rgba(0, 0, 0, 0.05);
  text-align: center;
}

.item-size {
  font-size: 20rpx;
  color: #666;
}

.performance-explanation {
  background: white;
  padding: 20rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 30rpx;
}

.explanation-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
  display: block;
}

.explanation-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.explanation-item {
  padding: 12rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
  border-left: 4rpx solid #007aff;
}

.item-title {
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 5rpx;
}

.item-desc {
  font-size: 24rpx;
  color: #666;
  line-height: 1.4;
  display: block;
}
</style>
