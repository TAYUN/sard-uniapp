<template>
  <view class="simple-reflow-demo">
    <view class="demo-header">
      <text class="demo-title">瀑布流重排优化演示</text>
      <text class="demo-subtitle">展示无 DOM 二次测量的重排方案</text>
    </view>

    <view class="demo-controls">
      <view class="control-item">
        <text>列数: {{ columns }}</text>
        <slider
          :value="columns"
          :min="2"
          :max="4"
          :step="1"
          @change="handleColumnsChange"
        />
      </view>

      <view class="control-item">
        <text>列间距: {{ columnGap }}px</text>
        <slider
          :value="columnGap"
          :min="5"
          :max="25"
          :step="5"
          @change="handleColumnGapChange"
        />
      </view>
    </view>

    <view class="demo-actions">
      <button @click="handleAddItem">添加项目</button>
      <button @click="handleRemoveItem">删除项目</button>
      <button @click="handleReset">重置</button>
    </view>

    <view class="demo-stats">
      <text>项目数: {{ itemCount }}</text>
      <text>容器高度: {{ containerHeight }}px</text>
      <text>重排耗时: {{ reflowTime }}ms</text>
    </view>

    <!-- 瀑布流容器 -->
    <view
      class="waterfall-container"
      :style="{ height: containerHeight + 'px' }"
    >
      <view
        v-for="item in layoutItems"
        :key="item.id"
        class="waterfall-item"
        :style="{
          position: 'absolute',
          left: item.left + 'px',
          top: item.top + 'px',
          width: item.width + 'px',
          height: item.height + 'px',
          backgroundColor: getItemColor(item.id),
          transition: 'all 0.3s ease',
        }"
      >
        <view class="item-content">
          <text class="item-id">{{ item.id }}</text>
          <text class="item-size">
            {{ Math.round(item.width) }}×{{ Math.round(item.height) }}
          </text>
        </view>
      </view>
    </view>

    <WaterfallDemoNavigation />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  useWaterfallReflow,
  type WaterfallItem,
} from '../../../../lib/use/use-waterfall-reflow'
import WaterfallDemoNavigation from './WaterfallDemoNavigation.vue'

// 响应式数据
const containerWidth = ref(350)
const columns = ref(2)
const columnGap = ref(10)
const rowGap = ref(10)
const reflowTime = ref(0)

// 使用瀑布流重排 hook
const {
  layoutItems,
  containerHeight,
  isInitialized,
  initialize,
  appendItem,
  removeItem,
} = useWaterfallReflow({
  containerWidth,
  columns,
  columnGap,
  rowGap,
})

// 计算属性
const itemCount = computed(() => layoutItems.value?.length || 0)

// 生成随机项目
const generateItem = (id: number): WaterfallItem => ({
  id,
  width: 200,
  height: 150 + Math.random() * 150,
})

// 初始数据
const initialItems = Array.from({ length: 20 }, (_, i) => generateItem(i + 1))
let nextId = 21

// 获取项目颜色
const getItemColor = (id: string | number): string => {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
  ]
  const index = typeof id === 'number' ? id : parseInt(id.toString())
  return colors[index % colors.length]
}

// 测量性能
const measurePerformance = (fn: () => void) => {
  const start = performance.now()
  fn()
  const end = performance.now()
  reflowTime.value = Math.round((end - start) * 100) / 100
}

// 事件处理
const handleColumnsChange = (e: any) => {
  measurePerformance(() => {
    columns.value = e.detail.value
  })
}

const handleColumnGapChange = (e: any) => {
  measurePerformance(() => {
    columnGap.value = e.detail.value
  })
}

const handleAddItem = () => {
  if (!isInitialized.value) return

  const newItem = generateItem(nextId++)
  measurePerformance(() => {
    appendItem(newItem)
  })
}

const handleRemoveItem = () => {
  if (!isInitialized.value || itemCount.value === 0) return

  const items = layoutItems.value
  if (items && items.length > 0) {
    const randomIndex = Math.floor(Math.random() * items.length)
    const itemToRemove = items[randomIndex]

    measurePerformance(() => {
      removeItem(itemToRemove.id)
    })
  }
}

const handleReset = () => {
  measurePerformance(() => {
    nextId = 21
    initialize(initialItems)
  })
}

// 初始化
onMounted(() => {
  initialize(initialItems)
})
</script>

<style lang="scss" scoped>
.simple-reflow-demo {
  padding: 20rpx;
  padding-bottom: 120rpx; // 为底部导航留空间
}

.demo-header {
  text-align: center;
  margin-bottom: 30rpx;
}

.demo-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
  display: block;
}

.demo-subtitle {
  font-size: 26rpx;
  color: #666;
  display: block;
}

.demo-controls {
  background: #f8f9fa;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.control-item {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;

  &:last-child {
    margin-bottom: 0;
  }

  text {
    width: 180rpx;
    font-size: 26rpx;
    color: #333;
  }

  slider {
    flex: 1;
    margin-left: 20rpx;
  }
}

.demo-actions {
  display: flex;
  gap: 15rpx;
  margin-bottom: 20rpx;

  button {
    flex: 1;
    padding: 15rpx;
    background: #007aff;
    color: white;
    border: none;
    border-radius: 8rpx;
    font-size: 26rpx;
  }
}

.demo-stats {
  display: flex;
  justify-content: space-between;
  padding: 15rpx;
  background: white;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

  text {
    font-size: 24rpx;
    color: #666;
  }
}

.waterfall-container {
  position: relative;
  width: 100%;
  background: #fff;
  border: 2rpx solid #eee;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 30rpx;
  min-height: 200rpx;
}

.waterfall-item {
  border-radius: 8rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-content {
  text-align: center;
  color: white;
}

.item-id {
  font-size: 28rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 5rpx;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3);
}

.item-size {
  font-size: 20rpx;
  opacity: 0.9;
  display: block;
}
</style>
