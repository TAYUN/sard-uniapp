<template>
  <doc-page title="优化版真实案例">
    <!-- 控制面板 -->
    <view class="control-panel">
      <view class="control-section">
        <text class="control-label">列数切换：</text>
        <view class="control-buttons">
          <sar-button
            v-for="col in [2, 3, 4]"
            :key="col"
            @click="changeColumns(col)"
            :type="columns === col ? 'default' : 'outline'"
            size="small"
            class="column-btn"
          >
            {{ col }}列
          </sar-button>
        </view>
      </view>

      <view class="control-section">
        <text class="control-label">操作：</text>
        <view class="control-buttons">
          <sar-button @click="addMoreImages" theme="secondary" size="small">
            加载更多
          </sar-button>
          <sar-button @click="refreshImages" theme="warning" size="small">
            刷新图片
          </sar-button>
          <sar-button @click="testIncrement" theme="success" size="small">
            测试增量
          </sar-button>
        </view>
      </view>

      <!-- 性能信息 -->
      <view class="performance-info" v-if="performanceData.lastReflowTime > 0">
        <text class="perf-label">重排性能：</text>
        <text class="perf-time">{{ performanceData.lastReflowTime }}ms</text>
        <text class="perf-desc">（无DOM重排算法）</text>
      </view>

      <!-- 调试信息 -->
      <view class="debug-info">
        <text class="debug-label">调试信息：</text>
        <text class="debug-text">
          初始化状态: {{ isInitialized ? '已初始化' : '未初始化' }}
        </text>
        <text class="debug-text">图片数据: {{ imageList.length }} 项</text>
        <text class="debug-text">布局项目: {{ layoutItems.length }} 项</text>
        <text class="debug-text">容器宽度: {{ containerWidth }}px</text>
        <text class="debug-text">
          容器高度: {{ Math.round(containerHeight) }}px
        </text>
      </view>
    </view>

    <!-- 优化版瀑布流容器 -->
    <view class="waterfall-wrapper">
      <view
        class="optimized-waterfall"
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
            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }"
        >
          <view class="item-content">
            <image
              mode="aspectFill"
              class="item-image"
              :src="getImageData(item.id)?.url"
              :style="{ width: '100%', height: item.height - 60 + 'px' }"
              @load="onImageLoad(item.id, $event)"
              @error="onImageError(item.id, $event)"
            />
            <view class="item-title">
              {{ getImageData(item.id)?.title }}
            </view>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="isLoading" class="loading-overlay">
        <sar-loading />
        <text class="loading-text">{{ loadingText }}</text>
      </view>
    </view>

    <!-- 统计信息 -->
    <view class="stats-panel">
      <view class="stat-item">
        <text class="stat-label">图片总数：</text>
        <text class="stat-value">{{ imageList.length }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">已加载：</text>
        <text class="stat-value">{{ loadedCount }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">加载失败：</text>
        <text class="stat-value">{{ errorCount }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">布局项目：</text>
        <text class="stat-value">{{ layoutItems.length }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">当前列数：</text>
        <text class="stat-value">{{ columns }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">容器高度：</text>
        <text class="stat-value">{{ Math.round(containerHeight) }}px</text>
      </view>
    </view>

    <!-- 瀑布流演示导航 -->
    <WaterfallDemoNavigation />
  </doc-page>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, reactive, nextTick } from 'vue'
import { random, shuffle, toast } from 'sard-uniapp'
import {
  useWaterfallReflow,
  type WaterfallItem,
} from '../../../../lib/use/use-waterfall-reflow'
import WaterfallDemoNavigation from './WaterfallDemoNavigation.vue'
import { text } from '../../read-more/demo/data'

// 图片数据接口
interface ImageItem {
  id: string
  title: string
  url: string
  width: number
  height: number
  loaded: boolean
  error: boolean
}

// 性能数据
interface PerformanceData {
  lastReflowTime: number
  totalReflows: number
  averageReflowTime: number
}

// 响应式数据
const columns = ref(2)
const isLoading = ref(false)
const loadingText = ref('')
const imageList = ref<ImageItem[]>([])
const loadedCount = ref(0)
const errorCount = ref(0)

// 性能监控
const performanceData = reactive<PerformanceData>({
  lastReflowTime: 0,
  totalReflows: 0,
  averageReflowTime: 0,
})

// 容器宽度（动态获取）
const containerWidth = ref(350)

// 获取实际容器宽度
const updateContainerWidth = () => {
  try {
    const screenWidth = uni.getSystemInfoSync().screenWidth
    const padding = 40 // 左右边距
    containerWidth.value = screenWidth - padding
  } catch (error) {
    console.error('获取屏幕宽度失败:', error)
    containerWidth.value = 350 // 使用默认值
  }
}

// 使用优化的瀑布流重排算法
const {
  layoutItems,
  containerHeight,
  isInitialized,
  initialize,
  appendItem,
  replaceItem,
  batchUpdate,
} = useWaterfallReflow({
  containerWidth,
  columns: computed(() => columns.value),
  columnGap: ref(10),
  rowGap: ref(10),
})

// 生成图片数据
const generateImageData = (startIndex = 0, count = 20): ImageItem[] => {
  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i
    const min = 15
    const max = 60
    const startTextIndex = random(0, text.length - max)
    const length = random(min, max)

    return {
      id: `img-${index}`,
      title: text.slice(startTextIndex, startTextIndex + length),
      url: `https://fastly.jsdelivr.net/npm/@sard/assets/images/cat${(index % 12) + 1}.jpg`,
      width: 300, // 默认宽度，会在图片加载后更新
      height: 200, // 默认高度，会在图片加载后更新
      loaded: false,
      error: false,
    }
  })
}

// 根据ID获取图片数据
const getImageData = (id: string | number): ImageItem | undefined => {
  return imageList.value.find((item) => item.id === id)
}

// 图片加载成功回调
const onImageLoad = (id: string | number, event: any) => {
  const imageData = getImageData(id)
  if (!imageData || imageData.loaded) return

  // 更新图片实际尺寸
  const { width, height } = event.detail
  if (width && height) {
    imageData.width = width
    imageData.height = height
  } else {
    // 如果无法获取尺寸，使用默认值
    imageData.width = 300
    imageData.height = 200
  }

  imageData.loaded = true
  imageData.error = false
  loadedCount.value++

  console.log(
    `图片 ${id} 加载成功，尺寸: ${imageData.width}x${imageData.height}`,
  )

  // 更新瀑布流布局
  updateSingleItem(imageData)
}

// 图片加载失败回调
const onImageError = (id: string | number) => {
  const imageData = getImageData(id)
  if (!imageData) return

  imageData.error = true
  imageData.loaded = true // 标记为已处理
  errorCount.value++

  // 使用默认尺寸
  imageData.width = 300
  imageData.height = 200

  console.log(`图片 ${id} 加载失败，使用默认尺寸`)

  // 更新瀑布流布局
  updateSingleItem(imageData)
}

// 更新单个项目
const updateSingleItem = (imageData: ImageItem) => {
  if (!isInitialized.value) return

  const start = performance.now()

  try {
    const waterfallItem: WaterfallItem = {
      id: imageData.id,
      width: imageData.width,
      height: imageData.height + 60, // 加上标题高度
    }

    // 检查项目是否已存在于布局中
    const existingItem = layoutItems.value.find(
      (item) => item.id === imageData.id,
    )

    if (existingItem) {
      // 项目已存在，更新尺寸
      replaceItem(imageData.id, waterfallItem)
    } else {
      // 项目不存在，添加新项目（这种情况在增量加载时可能发生）
      appendItem(waterfallItem)
    }

    const end = performance.now()
    const reflowTime = Math.round((end - start) * 100) / 100

    // 更新性能数据
    performanceData.lastReflowTime = reflowTime
    performanceData.totalReflows++

    console.log(
      `项目 ${imageData.id} ${existingItem ? '更新' : '添加'}完成，耗时: ${reflowTime}ms`,
    )
  } catch (error) {
    console.error('项目更新失败:', error, imageData)
  }
}

// 改变列数
const changeColumns = (newColumns: number) => {
  if (newColumns === columns.value) return

  const start = performance.now()
  columns.value = newColumns

  // 列数变化会自动触发重排（通过 computed 监听）
  nextTick(() => {
    const end = performance.now()
    const reflowTime = Math.round((end - start) * 100) / 100

    performanceData.lastReflowTime = reflowTime
    performanceData.totalReflows++

    toast(`切换到${newColumns}列，重排耗时：${reflowTime}ms`)
  })
}

// 加载更多图片
const addMoreImages = async () => {
  if (isLoading.value) return

  isLoading.value = true
  loadingText.value = '加载更多图片中...'

  try {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    const newImages = generateImageData(imageList.value.length, 10)
    imageList.value.push(...newImages)

    // 【关键修复】将新图片添加到瀑布流布局中
    const newWaterfallItems: WaterfallItem[] = newImages.map((item) => ({
      id: item.id,
      width: item.width,
      height: item.height + 60, // 加上标题高度
    }))

    // 使用批量更新进行增量渲染
    const start = performance.now()
    batchUpdate(
      newWaterfallItems.map((item) => ({
        type: 'append' as const,
        data: { item },
      })),
    )
    const end = performance.now()
    const reflowTime = Math.round((end - start) * 100) / 100

    // 更新性能数据
    performanceData.lastReflowTime = reflowTime
    performanceData.totalReflows++

    console.log(`增量添加 ${newImages.length} 个项目，耗时: ${reflowTime}ms`)
    toast(`添加了 ${newImages.length} 张图片，重排耗时: ${reflowTime}ms`)
  } finally {
    isLoading.value = false
  }
}

// 刷新图片
const refreshImages = async () => {
  if (isLoading.value) return

  isLoading.value = true
  loadingText.value = '刷新图片中...'

  try {
    // 重置统计
    loadedCount.value = 0
    errorCount.value = 0
    performanceData.lastReflowTime = 0
    performanceData.totalReflows = 0
    performanceData.averageReflowTime = 0

    // 生成新的图片数据
    const newImages = shuffle(generateImageData(0, 20))
    imageList.value = newImages

    // 重新初始化瀑布流
    initializeWaterfall()

    toast('图片已刷新')
  } finally {
    isLoading.value = false
  }
}

// 初始化瀑布流
const initializeWaterfall = () => {
  const waterfallItems: WaterfallItem[] = imageList.value.map((item) => ({
    id: item.id,
    width: item.width,
    height: item.height + 60, // 加上标题高度
  }))

  if (waterfallItems.length > 0) {
    initialize(waterfallItems)
    console.log(`瀑布流初始化完成，项目数: ${waterfallItems.length}`)
  }
}

// 测试增量渲染
const testIncrement = () => {
  console.log('=== 测试增量渲染 ===')
  console.log('当前图片数据:', imageList.value.length)
  console.log('当前布局项目:', layoutItems.value.length)

  // 直接添加一个测试项目
  const testItem: WaterfallItem = {
    id: `test-${Date.now()}`,
    width: 300,
    height: 260,
  }

  const start = performance.now()
  appendItem(testItem)
  const end = performance.now()

  console.log(
    `测试项目添加完成，耗时: ${Math.round((end - start) * 100) / 100}ms`,
  )
  console.log('添加后布局项目:', layoutItems.value.length)

  toast(`测试增量渲染完成，当前项目数: ${layoutItems.value.length}`)
}

// 初始化
onMounted(async () => {
  isLoading.value = true
  loadingText.value = '初始化图片数据...'

  try {
    // 更新容器宽度
    updateContainerWidth()

    // 生成初始图片数据
    const initialImages = shuffle(generateImageData(0, 20))
    imageList.value = initialImages

    // 初始化瀑布流
    initializeWaterfall()

    toast('图片数据初始化完成，开始加载图片...')
  } finally {
    isLoading.value = false
  }
})
</script>

<style lang="scss" scoped>
.control-panel {
  background: #f8f9fa;
  padding: 20rpx;
  margin: 20rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.control-section {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  flex-wrap: wrap;

  &:last-child {
    margin-bottom: 0;
  }
}

.control-label {
  font-size: 28rpx;
  color: #333;
  margin-right: 20rpx;
  min-width: 120rpx;
  font-weight: 500;
}

.control-buttons {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.column-btn {
  min-width: 80rpx;
}

.performance-info {
  display: flex;
  align-items: center;
  padding: 15rpx;
  background: linear-gradient(135deg, #51cf66, #69db7c);
  border-radius: 8rpx;
  margin-top: 15rpx;
}

.perf-label {
  font-size: 26rpx;
  color: white;
  margin-right: 10rpx;
}

.perf-time {
  font-size: 28rpx;
  font-weight: bold;
  color: white;
  margin-right: 10rpx;
}

.perf-desc {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9);
}

.debug-info {
  display: flex;
  flex-direction: column;
  padding: 15rpx;
  background: #e3f2fd;
  border-radius: 8rpx;
  margin-top: 15rpx;
}

.debug-label {
  font-size: 26rpx;
  color: #1976d2;
  margin-bottom: 8rpx;
  font-weight: 500;
}

.debug-text {
  font-size: 22rpx;
  color: #424242;
  margin-bottom: 4rpx;
}

.waterfall-wrapper {
  position: relative;
  margin: 20rpx;
  background: white;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.optimized-waterfall {
  position: relative;
  width: 100%;
  min-height: 400rpx;
  background: #fafafa;
}

.waterfall-item {
  border-radius: 8rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  background: white;
}

.item-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.item-image {
  border-radius: 8rpx 8rpx 0 0;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.item-title {
  padding: 15rpx;
  font-size: 26rpx;
  line-height: 1.4;
  color: #333;
  background: white;
  flex: 1;
  display: flex;
  align-items: center;
  border-radius: 0 0 8rpx 8rpx;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-text {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #666;
}

.stats-panel {
  background: white;
  margin: 20rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.stat-item {
  flex: 1;
  min-width: 120rpx;
  text-align: center;
  padding: 10rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
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
</style>
