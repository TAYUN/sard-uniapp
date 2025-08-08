<template>
  <doc-page title="整卡DOM测量方案">
    <!-- 方案说明 -->
    <view class="solution-explanation">
      <text class="explanation-title">整卡DOM测量：最实用的瀑布流方案</text>
      <view class="explanation-content">
        <text class="explanation-text">
          图片使用widthFix模式自动撑开高度，然后测量整个卡片的实际高度。
          这是最简单、最准确的瀑布流实现方案。
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
          <sar-button @click="addMoreCards" theme="secondary" size="small">
            加载更多
          </sar-button>
          <sar-button @click="refreshCards" theme="warning" size="small">
            刷新卡片
          </sar-button>
        </view>
      </view>

      <!-- 性能信息 -->
      <view class="performance-info" v-if="performanceData.totalTime > 0">
        <text class="perf-title">性能数据：</text>
        <text class="perf-text">
          测量耗时: {{ performanceData.totalTime }}ms
        </text>
        <text class="perf-text">
          已测量: {{ measuredCount }}/{{ cardList.length }}
        </text>
      </view>
    </view>

    <!-- 瀑布流容器 -->
    <view class="waterfall-wrapper">
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
            transition: 'all 0.3s ease',
          }"
        >
          <view
            :ref="(el) => setMeasureRef(item.id, el)"
            :id="`card-${item.id}`"
            class="card-wrapper"
          >
            <CardContent
              :data="getCardData(item.id)"
              @image-load="onCardImageLoad(item.id)"
              @image-error="onCardImageLoad(item.id)"
            />
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
        <text class="stat-label">卡片总数</text>
        <text class="stat-value">{{ cardList.length }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">已测量</text>
        <text class="stat-value">{{ measuredCount }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">当前列数</text>
        <text class="stat-value">{{ columns }}</text>
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
import CardContent from './components/CardContent.vue'
import { text } from '../../read-more/demo/data'

// 卡片数据接口
interface CardData {
  id: string
  title: string
  description: string
  imageUrl: string
  tags: string[]
  author: string
  date: string
  likes: number
  comments: number
}

// 响应式数据
const columns = ref(2)
const isLoading = ref(false)
const loadingText = ref('')
const cardList = ref<CardData[]>([])
const measuredCount = ref(0)
const measureRefs = new Map<string, any>()

// 性能监控
const performanceData = reactive({
  totalTime: 0,
})

// 容器宽度
const containerWidth = ref(350)

// 瀑布流重排算法
const { layoutItems, containerHeight, initialize, replaceItem, batchUpdate } =
  useWaterfallReflow({
    containerWidth,
    columns: computed(() => columns.value),
    columnGap: ref(10),
    rowGap: ref(10),
  })

// 设置测量元素引用
const setMeasureRef = (id: string, el: any) => {
  if (el) {
    measureRefs.set(id, el)
  }
}

// 生成卡片数据
const generateCardData = (startIndex = 0, count = 15): CardData[] => {
  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i
    const titleLen = random(8, 25)
    const descLen = random(30, 100)

    return {
      id: `card-${index}`,
      title: text.slice(random(0, text.length - titleLen), titleLen),
      description: text.slice(random(0, text.length - descLen), descLen),
      imageUrl: `https://fastly.jsdelivr.net/npm/@sard/assets/images/cat${(index % 12) + 1}.jpg`,
      tags: ['标签1', '标签2', '标签3'].slice(0, random(1, 3)),
      author: `作者${index + 1}`,
      date: '2024-01-01',
      likes: random(10, 999),
      comments: random(0, 99),
    }
  })
}

// 根据ID获取卡片数据
const getCardData = (id: string | number): CardData | undefined => {
  return cardList.value.find((card) => card.id === id)
}

// 图片加载完成后测量卡片高度
const onCardImageLoad = async (id: string) => {
  // 等待DOM更新
  await nextTick()

  const start = performance.now()

  try {
    // 使用uni-app的DOM查询API
    const query = uni.createSelectorQuery()
    const rect = await new Promise<any>((resolve) => {
      query
        .select(`#card-${id}`)
        .boundingClientRect((data) => {
          resolve(data)
        })
        .exec()
    })

    if (rect && rect.height > 0) {
      // 更新瀑布流布局
      const columnWidth =
        (containerWidth.value - (columns.value - 1) * 10) / columns.value
      replaceItem(id, {
        id,
        width: columnWidth,
        height: rect.height,
      })

      const end = performance.now()
      const totalTime = Math.round((end - start) * 100) / 100
      performanceData.totalTime = totalTime
      measuredCount.value++

      console.log(`卡片 ${id} 测量完成: ${rect.height}px, 耗时: ${totalTime}ms`)
    }
  } catch (error) {
    console.error('卡片测量失败:', error)
  }
}

// 改变列数
const changeColumns = (newColumns: number) => {
  if (newColumns === columns.value) return

  columns.value = newColumns
  measuredCount.value = 0
  measureRefs.clear()

  // 重新初始化（使用默认高度）
  const defaultItems: WaterfallItem[] = cardList.value.map((card) => ({
    id: card.id,
    width: (containerWidth.value - (newColumns - 1) * 10) / newColumns,
    height: 250, // 默认高度
  }))

  initialize(defaultItems)
  toast(`切换到${newColumns}列`)
}

// 加载更多卡片
const addMoreCards = async () => {
  if (isLoading.value) return

  isLoading.value = true
  loadingText.value = '加载更多...'

  try {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const newCards = generateCardData(cardList.value.length, 6)
    cardList.value.push(...newCards)

    // 添加到瀑布流
    const columnWidth =
      (containerWidth.value - (columns.value - 1) * 10) / columns.value
    const newItems: WaterfallItem[] = newCards.map((card) => ({
      id: card.id,
      width: columnWidth,
      height: 250, // 默认高度
    }))

    batchUpdate(
      newItems.map((item) => ({
        type: 'append' as const,
        data: { item },
      })),
    )

    toast(`添加了 ${newCards.length} 张卡片`)
  } finally {
    isLoading.value = false
  }
}

// 刷新卡片
const refreshCards = async () => {
  if (isLoading.value) return

  isLoading.value = true
  loadingText.value = '刷新中...'

  try {
    // 重置数据
    measuredCount.value = 0
    measureRefs.clear()
    performanceData.totalTime = 0

    // 生成新卡片
    const newCards = shuffle(generateCardData(0, 15))
    cardList.value = newCards

    // 初始化瀑布流
    const columnWidth =
      (containerWidth.value - (columns.value - 1) * 10) / columns.value
    const initialItems: WaterfallItem[] = newCards.map((card) => ({
      id: card.id,
      width: columnWidth,
      height: 250, // 默认高度
    }))

    initialize(initialItems)
    toast('已刷新')
  } finally {
    isLoading.value = false
  }
}

// 初始化
onMounted(async () => {
  isLoading.value = true
  loadingText.value = '初始化中...'

  try {
    // 获取容器宽度
    try {
      const screenWidth = uni.getSystemInfoSync().screenWidth
      containerWidth.value = screenWidth - 40
    } catch (error) {
      containerWidth.value = 350
    }

    // 生成初始卡片
    const initialCards = generateCardData(0, 15)
    cardList.value = initialCards

    // 初始化瀑布流
    const columnWidth =
      (containerWidth.value - (columns.value - 1) * 10) / columns.value
    const initialItems: WaterfallItem[] = initialCards.map((card) => ({
      id: card.id,
      width: columnWidth,
      height: 250, // 默认高度，等待图片加载后更新
    }))

    initialize(initialItems)
    toast('初始化完成，等待图片加载...')
  } finally {
    isLoading.value = false
  }
})
</script>

<style lang="scss" scoped>
.solution-explanation {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 8rpx;
  padding: 20rpx;
  margin: 20rpx;
}

.explanation-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #155724;
  display: block;
  margin-bottom: 10rpx;
}

.explanation-text {
  font-size: 28rpx;
  color: #155724;
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
  margin-bottom: 15rpx;
  flex-wrap: wrap;

  &:last-child {
    margin-bottom: 0;
  }
}

.control-label {
  font-size: 28rpx;
  color: #333;
  margin-right: 15rpx;
  min-width: 100rpx;
  font-weight: 500;
}

.control-buttons {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
}

.performance-info {
  margin-top: 15rpx;
  padding: 15rpx;
  background: linear-gradient(135deg, #28a745, #20c997);
  border-radius: 8rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  align-items: center;
}

.perf-title {
  font-size: 26rpx;
  color: white;
  font-weight: bold;
}

.perf-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9);
}

.waterfall-wrapper {
  position: relative;
  margin: 20rpx;
  background: white;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.waterfall-container {
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

.card-wrapper {
  height: 100%;
  width: 100%;
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
  margin-top: 15rpx;
  font-size: 26rpx;
  color: #666;
}

.stats-panel {
  background: white;
  margin: 20rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 20rpx;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 15rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.stat-value {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}
</style>
