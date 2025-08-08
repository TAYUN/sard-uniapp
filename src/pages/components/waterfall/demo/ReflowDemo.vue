<template>
  <view class="reflow-demo">
    <view class="demo-header">
      <text class="demo-title">无 DOM 二次测量瀑布流重排演示</text>
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
        <button @click="addRandomItem" :disabled="loadingItems.size > 0">
          {{ loadingItems.size > 0 ? '加载中...' : '添加随机项' }}
        </button>
        <button @click="insertRandomItem" :disabled="loadingItems.size > 0">
          {{ loadingItems.size > 0 ? '加载中...' : '插入随机项' }}
        </button>
        <button @click="removeRandomItem">删除随机项</button>
        <button @click="batchAddItems" :disabled="loadingItems.size > 0">
          {{ loadingItems.size > 0 ? '加载中...' : '批量添加' }}
        </button>
        <button @click="resetItems" :disabled="loadingItems.size > 0">
          {{ loadingItems.size > 0 ? '加载中...' : '重置' }}
        </button>
      </view>

      <view class="demo-stats">
        <text>项目数量: {{ items.length }}</text>
        <text>容器高度: {{ Math.round(containerHeight) }}px</text>
        <text>重排耗时: {{ reflowTime }}ms</text>
        <text v-if="loadingItems.size > 0" class="loading-text">
          加载中: {{ loadingItems.size }}项
        </text>
      </view>
    </view>

    <!-- 加载指示器 -->
    <view v-if="loadingItems.size > 0" class="loading-indicator">
      <view class="loading-spinner"></view>
      <text>正在加载 {{ loadingItems.size }} 个项目...</text>
    </view>

    <view
      class="waterfall-container"
      :style="{ height: containerHeight + 'px' }"
      ref="containerRef"
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
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import {
  useWaterfallReflow,
  type WaterfallItem,
} from '../utils/use-waterfall-reflow'

// 响应式数据
const containerRef = ref()
const containerWidth = ref(375)
const columns = ref(2)
const columnGap = ref(10)
const rowGap = ref(10)
const reflowTime = ref(0)
const loadingItems = ref(new Set<string | number>()) // 正在加载的项目ID

// 初始数据
const items = ref<WaterfallItem[]>([])

// 使用瀑布流重排 hook
const {
  layoutItems,
  containerHeight,
  // isInitialized,
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

// 生成随机项目（同步版本，用于初始化）
// const generateRandomItem = (id: string | number): WaterfallItem => {
//   const width = 200 + Math.random() * 100 // 200-300px
//   const height = 150 + Math.random() * 200 // 150-350px
//   return { id, width, height }
// }

// 生成随机项目（异步版本，模拟图片加载延迟）
const generateRandomItemAsync = async (
  id: string | number,
): Promise<WaterfallItem> => {
  // 模拟网络延迟 500-2000ms
  const delay = 500 + Math.random() * 1500
  await new Promise((resolve) => setTimeout(resolve, delay))

  const width = 200 + Math.random() * 100 // 200-300px
  const height = 150 + Math.random() * 200 // 150-350px
  return { id, width, height }
}

// 生成初始数据（异步版本）
const generateInitialItems = async (): Promise<WaterfallItem[]> => {
  const itemIds = Array.from({ length: 20 }, (_, i) => i + 1)

  // 添加所有初始项目到加载状态
  itemIds.forEach((id) => loadingItems.value.add(id))

  try {
    // 并发生成所有初始项目
    const items = await Promise.all(
      itemIds.map((id) => generateRandomItemAsync(id)),
    )
    return items
  } finally {
    // 清除所有加载状态
    itemIds.forEach((id) => loadingItems.value.delete(id))
  }
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
  measureReflowTime(() => {
    columns.value = e.detail.value
  })
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

const addRandomItem = async () => {
  const newId = Math.max(...items.value.map((item) => Number(item.id))) + 1

  // 添加到加载状态
  loadingItems.value.add(newId)

  try {
    const newItem = await generateRandomItemAsync(newId)

    measureReflowTime(() => {
      items.value.push(newItem)
      appendItem(newItem)
    })
  } finally {
    // 移除加载状态
    loadingItems.value.delete(newId)
  }
}

const insertRandomItem = async () => {
  if (items.value.length === 0) return

  const insertIndex = Math.floor(Math.random() * items.value.length)
  const newId = Math.max(...items.value.map((item) => Number(item.id))) + 1

  // 添加到加载状态
  loadingItems.value.add(newId)

  try {
    const newItem = await generateRandomItemAsync(newId)

    measureReflowTime(() => {
      items.value.splice(insertIndex, 0, newItem)
      insertItem(insertIndex, newItem)
    })
  } finally {
    // 移除加载状态
    loadingItems.value.delete(newId)
  }
}

const removeRandomItem = () => {
  if (items.value.length === 0) return

  const removeIndex = Math.floor(Math.random() * items.value.length)
  const itemToRemove = items.value[removeIndex]

  measureReflowTime(() => {
    items.value.splice(removeIndex, 1)
    removeItem(itemToRemove.id)
  })
}

const batchAddItems = async () => {
  const batchSize = 5
  const startId = Math.max(...items.value.map((item) => Number(item.id))) + 1
  const newIds = Array.from({ length: batchSize }, (_, i) => startId + i)

  // 添加所有项目到加载状态
  newIds.forEach((id) => loadingItems.value.add(id))

  try {
    // 并发生成所有项目
    const newItems = await Promise.all(
      newIds.map((id) => generateRandomItemAsync(id)),
    )

    measureReflowTime(() => {
      items.value.push(...newItems)
      batchUpdate(
        newItems.map((item) => ({
          type: 'append' as const,
          data: { item },
        })),
      )
    })
  } finally {
    // 移除所有加载状态
    newIds.forEach((id) => loadingItems.value.delete(id))
  }
}

const resetItems = async () => {
  try {
    const newItems = await generateInitialItems()

    measureReflowTime(() => {
      items.value = newItems
      initialize(newItems)
    })
  } catch (error) {
    console.error('重置项目失败:', error)
  }
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

  try {
    const initialItems = await generateInitialItems()
    items.value = initialItems
    initialize(initialItems)
  } catch (error) {
    console.error('初始化失败:', error)
  }
})
</script>

<style lang="scss" scoped>
.reflow-demo {
  padding: 20rpx;
}

.demo-header {
  margin-bottom: 30rpx;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.demo-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.demo-controls {
  margin-bottom: 20rpx;
}

.control-group {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;

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
    padding: 10rpx 20rpx;
    font-size: 24rpx;
    background: #007aff;
    color: white;
    border: none;
    border-radius: 8rpx;

    &:disabled {
      background: #ccc;
      color: #999;
      cursor: not-allowed;
    }
  }
}

.demo-stats {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #666;

  text {
    flex: 1;
    text-align: center;
  }

  .loading-text {
    color: #007aff;
    font-weight: bold;
  }
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
  margin-bottom: 20rpx;
  background: #f0f8ff;
  border: 2rpx solid #007aff;
  border-radius: 12rpx;
  color: #007aff;
  font-size: 28rpx;

  .loading-spinner {
    width: 32rpx;
    height: 32rpx;
    border: 4rpx solid #e3f2fd;
    border-top: 4rpx solid #007aff;
    border-radius: 50%;
    margin-right: 15rpx;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.waterfall-container {
  position: relative;
  width: 100%;
  background: #fff;
  border: 2rpx solid #eee;
  border-radius: 12rpx;
  overflow: hidden;
}

.waterfall-item {
  transition: all 0.3s ease;
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
</style>
