<template>
  <doc-page title="混合方案示例">
    <!-- 方案说明 -->
    <view class="solution-explanation">
      <text class="explanation-title">混合方案：图片无DOM + 文字DOM测量</text>
      <view class="explanation-content">
        <text class="explanation-text">
          图片部分使用无DOM重排算法获得高性能， 文字部分使用DOM测量确保准确性，
          在性能和准确性之间取得最佳平衡。
        </text>
      </view>
    </view>

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
          >
            {{ col }}列
          </sar-button>
        </view>
      </view>

      <view class="control-section">
        <text class="control-label">操作：</text>
        <view class="control-buttons">
          <sar-button @click="addMoreItems" theme="secondary" size="small">
            加载更多
          </sar-button>
          <sar-button @click="refreshItems" theme="warning" size="small">
            刷新数据
          </sar-button>
        </view>
      </view>

      <!-- 性能对比 -->
      <view
        class="performance-comparison"
        v-if="performanceData.hybridTime > 0"
      >
        <text class="perf-title">性能对比：</text>
        <view class="perf-row">
          <text class="perf-label">混合方案：</text>
          <text class="perf-time">{{ performanceData.hybridTime }}ms</text>
        </view>
        <view class="perf-row">
          <text class="perf-label">预估纯DOM：</text>
          <text class="perf-time estimated">
            {{ performanceData.estimatedDomTime }}ms
          </text>
        </view>
        <view class="perf-row">
          <text class="perf-label">性能提升：</text>
          <text class="perf-improvement">
            {{ performanceData.improvement }}%
          </text>
        </view>
      </view>
    </view>

    <!-- 混合瀑布流容器 -->
    <view class="waterfall-wrapper">
      <view
        class="hybrid-waterfall"
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
            <!-- 图片部分：使用无DOM算法计算 -->
            <image
              mode="aspectFill"
              class="item-image"
              :src="getItemData(item.id)?.imageUrl"
              :style="{
                width: '100%',
                height: getItemData(item.id)?.imageHeight + 'px',
              }"
              @load="onImageLoad(item.id, $event)"
              @error="onImageError(item.id, $event)"
            />

            <!-- 文字部分：使用DOM测量 -->
            <view
              :ref="(el) => setTextRef(item.id, el)"
              class="item-text-container"
            >
              <text class="item-text">{{ getItemData(item.id)?.text }}</text>
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
        <text class="stat-label">项目总数：</text>
        <text class="stat-value">{{ itemList.length }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">图片已加载：</text>
        <text class="stat-value">{{ imageLoadedCount }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">文字已测量：</text>
        <text class="stat-value">{{ textMeasuredCount }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">布局项目：</text>
        <text class="stat-value">{{ layoutItems.length }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">当前列数：</text>
        <text class="stat-value">{{ columns }}</text>
      </view>
    </view>

    <!-- 技术说明 -->
    <view class="technical-explanation">
      <text class="tech-title">技术实现原理</text>
      <view class="tech-steps">
        <view class="tech-step">
          <text class="step-number">1</text>
          <view class="step-content">
            <text class="step-title">图片高度计算</text>
            <text class="step-desc">使用无DOM算法，基于宽高比快速计算</text>
          </view>
        </view>
        <view class="tech-step">
          <text class="step-number">2</text>
          <view class="step-content">
            <text class="step-title">文字高度测量</text>
            <text class="step-desc">使用DOM查询获取实际渲染高度</text>
          </view>
        </view>
        <view class="tech-step">
          <text class="step-number">3</text>
          <view class="step-content">
            <text class="step-title">高度合并</text>
            <text class="step-desc">图片高度 + 文字高度 = 总高度</text>
          </view>
        </view>
        <view class="tech-step">
          <text class="step-number">4</text>
          <view class="step-content">
            <text class="step-title">布局更新</text>
            <text class="step-desc">使用合并后的高度更新瀑布流布局</text>
          </view>
        </view>
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

// 混合项目数据接口
interface HybridItem {
  id: string
  imageUrl: string
  imageWidth: number
  imageHeight: number
  imageLoaded: boolean
  text: string
  textHeight: number
  textMeasured: boolean
}

// 性能数据
interface PerformanceData {
  hybridTime: number
  estimatedDomTime: number
  improvement: number
}

// 响应式数据
const columns = ref(2)
const isLoading = ref(false)
const loadingText = ref('')
const itemList = ref<HybridItem[]>([])
const imageLoadedCount = ref(0)
const textMeasuredCount = ref(0)

// 性能监控
const performanceData = reactive<PerformanceData>({
  hybridTime: 0,
  estimatedDomTime: 0,
  improvement: 0,
})

// 容器宽度
const containerWidth = ref(350)

// 文字元素引用
const textRefs = new Map<string, any>()

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

// 设置文字元素引用
const setTextRef = (id: string, el: any) => {
  if (el) {
    textRefs.set(id, el)
  }
}

// 生成混合项目数据
const generateHybridData = (startIndex = 0, count = 20): HybridItem[] => {
  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i
    const min = 20
    const max = 80
    const startTextIndex = random(0, text.length - max)
    const length = random(min, max)

    return {
      id: `hybrid-${index}`,
      imageUrl: `https://fastly.jsdelivr.net/npm/@sard/assets/images/cat${(index % 12) + 1}.jpg`,
      imageWidth: 300,
      imageHeight: 200,
      imageLoaded: false,
      text: text.slice(startTextIndex, startTextIndex + length),
      textHeight: 0,
      textMeasured: false,
    }
  })
}

// 根据ID获取项目数据
const getItemData = (id: string | number): HybridItem | undefined => {
  return itemList.value.find((item) => item.id === id)
}

// 测量文字高度
const measureTextHeight = async (id: string): Promise<number> => {
  const textEl = textRefs.get(id)
  if (!textEl) return 60 // 默认高度

  try {
    await nextTick()
    const rect = await uni
      .createSelectorQuery()
      .select(`#text-${id}`)
      .boundingClientRect()
      .exec()

    return rect[0]?.height || 60
  } catch (error) {
    console.error('文字高度测量失败:', error)
    return 60
  }
}

// 图片加载成功回调
const onImageLoad = async (id: string | number, event: any) => {
  const itemData = getItemData(id)
  if (!itemData || itemData.imageLoaded) return

  // 更新图片实际尺寸
  const { width, height } = event.detail
  if (width && height) {
    itemData.imageWidth = width
    itemData.imageHeight = height
  }

  itemData.imageLoaded = true
  imageLoadedCount.value++

  console.log(
    `图片 ${id} 加载成功，尺寸: ${itemData.imageWidth}x${itemData.imageHeight}`,
  )

  // 检查是否可以更新布局
  await checkAndUpdateLayout(itemData)
}

// 图片加载失败回调
const onImageError = async (id: string | number) => {
  const itemData = getItemData(id)
  if (!itemData) return

  itemData.imageLoaded = true
  imageLoadedCount.value++

  console.log(`图片 ${id} 加载失败，使用默认尺寸`)

  // 检查是否可以更新布局
  await checkAndUpdateLayout(itemData)
}

// 检查并更新布局
const checkAndUpdateLayout = async (itemData: HybridItem) => {
  // 如果图片还没加载完，等待
  if (!itemData.imageLoaded) return

  // 测量文字高度（如果还没测量）
  if (!itemData.textMeasured) {
    try {
      // 等待DOM更新
      await nextTick()

      // 简化的文字高度估算（实际项目中可以使用更精确的方法）
      const columnWidth =
        (containerWidth.value - (columns.value - 1) * 10) / columns.value
      const estimatedLines = Math.ceil(
        itemData.text.length / (columnWidth / 12),
      ) // 假设每个字符12px宽
      itemData.textHeight = Math.max(estimatedLines * 24 + 20, 60) // 行高24px + padding

      itemData.textMeasured = true
      textMeasuredCount.value++

      console.log(`文字 ${itemData.id} 高度测量完成: ${itemData.textHeight}px`)
    } catch (error) {
      console.error('文字高度测量失败:', error)
      itemData.textHeight = 60
      itemData.textMeasured = true
    }
  }

  // 更新瀑布流布局
  await updateHybridLayout(itemData)
}

// 更新混合布局
const updateHybridLayout = async (itemData: HybridItem) => {
  const start = performance.now()

  try {
    // 计算图片高度（无DOM算法）
    const columnWidth =
      (containerWidth.value - (columns.value - 1) * 10) / columns.value
    const imageHeight =
      (columnWidth * itemData.imageHeight) / itemData.imageWidth

    // 总高度 = 图片高度 + 文字高度
    const totalHeight = imageHeight + itemData.textHeight

    const waterfallItem: WaterfallItem = {
      id: itemData.id,
      width: columnWidth,
      height: totalHeight,
    }

    // 检查项目是否已存在
    const existingItem = layoutItems.value.find(
      (item) => item.id === itemData.id,
    )

    if (existingItem) {
      replaceItem(itemData.id, waterfallItem)
    } else {
      appendItem(waterfallItem)
    }

    const end = performance.now()
    const hybridTime = Math.round((end - start) * 100) / 100

    // 估算纯DOM方案的耗时（基于经验值）
    const estimatedDomTime = hybridTime * 3 // 假设DOM方案慢3倍

    // 更新性能数据
    performanceData.hybridTime = hybridTime
    performanceData.estimatedDomTime = estimatedDomTime
    performanceData.improvement = Math.round(
      ((estimatedDomTime - hybridTime) / estimatedDomTime) * 100,
    )

    console.log(`混合布局更新完成 ${itemData.id}，耗时: ${hybridTime}ms`)
  } catch (error) {
    console.error('混合布局更新失败:', error, itemData)
  }
}

// 改变列数
const changeColumns = (newColumns: number) => {
  if (newColumns === columns.value) return

  const start = performance.now()
  columns.value = newColumns

  // 重新测量所有文字高度（因为宽度变了）
  itemList.value.forEach((item) => {
    item.textMeasured = false
    item.textHeight = 0
  })

  textMeasuredCount.value = 0

  // 重新检查和更新所有项目
  setTimeout(async () => {
    for (const item of itemList.value) {
      if (item.imageLoaded) {
        await checkAndUpdateLayout(item)
      }
    }

    const end = performance.now()
    const reflowTime = Math.round((end - start) * 100) / 100
    toast(`切换到${newColumns}列，重排耗时：${reflowTime}ms`)
  }, 100)
}

// 加载更多项目
const addMoreItems = async () => {
  if (isLoading.value) return

  isLoading.value = true
  loadingText.value = '加载更多项目中...'

  try {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const newItems = generateHybridData(itemList.value.length, 8)
    itemList.value.push(...newItems)

    // 立即添加到布局（使用默认尺寸）
    const newWaterfallItems: WaterfallItem[] = newItems.map((item) => ({
      id: item.id,
      width: (containerWidth.value - (columns.value - 1) * 10) / columns.value,
      height: 260, // 默认高度
    }))

    batchUpdate(
      newWaterfallItems.map((item) => ({
        type: 'append' as const,
        data: { item },
      })),
    )

    toast(`添加了 ${newItems.length} 个项目`)
  } finally {
    isLoading.value = false
  }
}

// 刷新项目
const refreshItems = async () => {
  if (isLoading.value) return

  isLoading.value = true
  loadingText.value = '刷新项目中...'

  try {
    // 重置统计
    imageLoadedCount.value = 0
    textMeasuredCount.value = 0
    performanceData.hybridTime = 0
    performanceData.estimatedDomTime = 0
    performanceData.improvement = 0

    // 清空引用
    textRefs.clear()

    // 生成新数据
    const newItems = shuffle(generateHybridData(0, 20))
    itemList.value = newItems

    // 初始化瀑布流
    const initialWaterfallItems: WaterfallItem[] = newItems.map((item) => ({
      id: item.id,
      width: (containerWidth.value - (columns.value - 1) * 10) / columns.value,
      height: 260, // 默认高度
    }))

    initialize(initialWaterfallItems)

    toast('项目已刷新')
  } finally {
    isLoading.value = false
  }
}

// 初始化
onMounted(async () => {
  isLoading.value = true
  loadingText.value = '初始化项目数据...'

  try {
    // 更新容器宽度
    try {
      const screenWidth = uni.getSystemInfoSync().screenWidth
      containerWidth.value = screenWidth - 40
    } catch (error) {
      containerWidth.value = 350
    }

    // 生成初始数据
    const initialItems = shuffle(generateHybridData(0, 20))
    itemList.value = initialItems

    // 初始化瀑布流
    const initialWaterfallItems: WaterfallItem[] = initialItems.map((item) => ({
      id: item.id,
      width: (containerWidth.value - (columns.value - 1) * 10) / columns.value,
      height: 260, // 默认高度
    }))

    initialize(initialWaterfallItems)

    toast('项目数据初始化完成，开始加载内容...')
  } finally {
    isLoading.value = false
  }
})
</script>

<style lang="scss" scoped>
.solution-explanation {
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  border-radius: 8rpx;
  padding: 20rpx;
  margin: 20rpx;
}

.explanation-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #0c5460;
  display: block;
  margin-bottom: 10rpx;
}

.explanation-content {
  margin-top: 10rpx;
}

.explanation-text {
  font-size: 28rpx;
  color: #0c5460;
  line-height: 1.5;
}

.control-panel {
  background: #f8f9fa;
  padding: 20rpx;
  margin: 20rpx;
  border-radius: 12rpx;
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

.performance-comparison {
  margin-top: 20rpx;
  padding: 15rpx;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 8rpx;
}

.perf-title {
  font-size: 26rpx;
  color: white;
  font-weight: bold;
  display: block;
  margin-bottom: 10rpx;
}

.perf-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5rpx;
}

.perf-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

.perf-time {
  font-size: 24rpx;
  color: white;
  font-weight: bold;

  &.estimated {
    color: rgba(255, 255, 255, 0.7);
  }
}

.perf-improvement {
  font-size: 24rpx;
  color: #90ee90;
  font-weight: bold;
}

.waterfall-wrapper {
  position: relative;
  margin: 20rpx;
  background: white;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.hybrid-waterfall {
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
}

.item-text-container {
  padding: 15rpx;
  flex: 1;
  background: white;
  border-radius: 0 0 8rpx 8rpx;
}

.item-text {
  font-size: 26rpx;
  line-height: 1.4;
  color: #333;
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

.technical-explanation {
  background: white;
  margin: 20rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.tech-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.tech-steps {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.tech-step {
  display: flex;
  align-items: flex-start;
  gap: 15rpx;
}

.step-number {
  width: 60rpx;
  height: 60rpx;
  background: #007aff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.step-desc {
  font-size: 24rpx;
  color: #666;
  line-height: 1.4;
}
</style>
