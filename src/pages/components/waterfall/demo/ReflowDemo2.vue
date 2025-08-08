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
        <button @click="addRandomItem">添加随机项</button>
        <button @click="insertRandomItem">插入随机项</button>
        <button @click="removeRandomItem">删除随机项</button>
        <button @click="batchAddItems">批量添加</button>
        <button @click="resetItems">重置</button>
      </view>

      <view class="demo-stats">
        <text>项目数量: {{ items.length }}</text>
        <text>容器高度: {{ Math.round(containerHeight) }}px</text>
        <text>重排耗时: {{ reflowTime }}ms</text>
      </view>
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

// 生成随机项目
const generateRandomItem = (id: string | number): WaterfallItem => {
  const width = 200 + Math.random() * 100 // 200-300px
  const height = 150 + Math.random() * 200 // 150-350px
  return { id, width, height }
}

// 生成初始数据
const generateInitialItems = (): WaterfallItem[] => {
  return Array.from({ length: 20 }, (_, i) => generateRandomItem(i + 1))
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

const addRandomItem = () => {
  const newId = Math.max(...items.value.map((item) => Number(item.id))) + 1
  const newItem = generateRandomItem(newId)

  measureReflowTime(() => {
    items.value.push(newItem)
    appendItem(newItem)
  })
}

const insertRandomItem = () => {
  if (items.value.length === 0) return

  const insertIndex = Math.floor(Math.random() * items.value.length)
  const newId = Math.max(...items.value.map((item) => Number(item.id))) + 1
  const newItem = generateRandomItem(newId)

  measureReflowTime(() => {
    items.value.splice(insertIndex, 0, newItem)
    insertItem(insertIndex, newItem)
  })
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

const batchAddItems = () => {
  const newItems = Array.from({ length: 5 }, (_, i) => {
    const newId =
      Math.max(...items.value.map((item) => Number(item.id))) + i + 1
    return generateRandomItem(newId)
  })

  measureReflowTime(() => {
    items.value.push(...newItems)
    batchUpdate(
      newItems.map((item) => ({
        type: 'append' as const,
        data: { item },
      })),
    )
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
