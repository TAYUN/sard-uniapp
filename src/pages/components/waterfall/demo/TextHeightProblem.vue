<template>
  <doc-page title="文字高度问题演示">
    <!-- 问题说明 -->
    <view class="problem-explanation">
      <text class="explanation-title">无DOM重排算法的文字高度问题</text>
      <view class="explanation-content">
        <text class="explanation-text">
          当瀑布流项目包含文字时，文字高度会随容器宽度变化而变化，
          这使得基于固定宽高比的无DOM重排算法失效。
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
        <text class="control-label">解决方案：</text>
        <view class="control-buttons">
          <sar-button
            @click="currentSolution = 'none'"
            :type="currentSolution === 'none' ? 'default' : 'outline'"
            size="small"
          >
            无处理
          </sar-button>
          <sar-button
            @click="currentSolution = 'fixed'"
            :type="currentSolution === 'fixed' ? 'default' : 'outline'"
            size="small"
          >
            固定高度
          </sar-button>
          <sar-button
            @click="currentSolution = 'hybrid'"
            :type="currentSolution === 'hybrid' ? 'default' : 'outline'"
            size="small"
          >
            混合方案
          </sar-button>
        </view>
      </view>
    </view>

    <!-- 问题演示 -->
    <view class="demo-section">
      <text class="section-title">问题演示</text>

      <!-- 文字高度变化演示 -->
      <view class="text-demo">
        <view class="demo-item">
          <text class="demo-label">2列宽度下的文字：</text>
          <view
            class="text-container"
            :style="{ width: twoColumnWidth + 'px' }"
          >
            <text class="demo-text">{{ sampleText }}</text>
          </view>
          <text class="height-info">高度: {{ twoColumnHeight }}px</text>
        </view>

        <view class="demo-item">
          <text class="demo-label">3列宽度下的文字：</text>
          <view
            class="text-container"
            :style="{ width: threeColumnWidth + 'px' }"
          >
            <text class="demo-text">{{ sampleText }}</text>
          </view>
          <text class="height-info">高度: {{ threeColumnHeight }}px</text>
        </view>

        <view class="demo-item">
          <text class="demo-label">4列宽度下的文字：</text>
          <view
            class="text-container"
            :style="{ width: fourColumnWidth + 'px' }"
          >
            <text class="demo-text">{{ sampleText }}</text>
          </view>
          <text class="height-info">高度: {{ fourColumnHeight }}px</text>
        </view>
      </view>
    </view>

    <!-- 解决方案演示 -->
    <view class="solution-section">
      <text class="section-title">解决方案对比</text>

      <view class="solution-demo">
        <!-- 方案1: 无处理（问题演示） -->
        <view v-if="currentSolution === 'none'" class="solution-content">
          <text class="solution-title">方案1: 无处理（存在问题）</text>
          <view class="problem-demo">
            <text class="problem-text">
              使用无DOM重排算法，但文字高度计算错误，
              导致布局混乱、重叠或空隙过大。
            </text>
          </view>
        </view>

        <!-- 方案2: 固定高度 -->
        <view v-if="currentSolution === 'fixed'" class="solution-content">
          <text class="solution-title">方案2: 固定文字容器高度</text>
          <view class="fixed-height-demo">
            <view
              v-for="item in demoItems"
              :key="item.id"
              class="fixed-item"
              :style="{ width: currentColumnWidth + 'px' }"
            >
              <image
                class="item-image"
                :src="item.imageUrl"
                mode="aspectFill"
                :style="{ height: item.imageHeight + 'px' }"
              />
              <view class="fixed-text-container">
                <text class="item-text">{{ item.text }}</text>
              </view>
            </view>
          </view>
          <view class="solution-pros-cons">
            <text class="pros">✅ 优点: 高度可预测，无DOM算法有效</text>
            <text class="cons">❌ 缺点: 文字可能被截断或留白过多</text>
          </view>
        </view>

        <!-- 方案3: 混合方案 -->
        <view v-if="currentSolution === 'hybrid'" class="solution-content">
          <text class="solution-title">方案3: 混合方案（推荐）</text>
          <view class="hybrid-demo">
            <text class="hybrid-description">
              图片使用无DOM算法，文字部分使用传统DOM测量，
              在性能和准确性之间取得平衡。
            </text>
          </view>
          <view class="solution-pros-cons">
            <text class="pros">✅ 优点: 图片高性能，文字准确布局</text>
            <text class="cons">⚠️ 缺点: 部分性能优势，但实用性更强</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 技术方案详解 -->
    <view class="technical-section">
      <text class="section-title">技术方案详解</text>

      <view class="tech-solution">
        <text class="tech-title">1. 纯图片场景</text>
        <text class="tech-desc">✅ 完全适用无DOM重排算法</text>
        <view class="code-example">
          <text class="code-text">
            // 图片宽高比固定，计算简单 const height = width / aspectRatio
          </text>
        </view>
      </view>

      <view class="tech-solution">
        <text class="tech-title">2. 固定文字高度</text>
        <text class="tech-desc">✅ 可使用无DOM算法，但用户体验受限</text>
        <view class="code-example">
          <text class="code-text">
            // 固定文字容器高度 const textHeight = FIXED_TEXT_HEIGHT // 如: 80px
            const totalHeight = imageHeight + textHeight
          </text>
        </view>
      </view>

      <view class="tech-solution">
        <text class="tech-title">3. 混合方案（推荐）</text>
        <text class="tech-desc">⚖️ 平衡性能和准确性</text>
        <view class="code-example">
          <text class="code-text">
            // 图片部分: 无DOM算法 const imageHeight = imageWidth / aspectRatio
            // 文字部分: DOM测量 const textHeight = await
            measureTextHeight(text, width) // 总高度 const totalHeight =
            imageHeight + textHeight
          </text>
        </view>
      </view>

      <view class="tech-solution">
        <text class="tech-title">4. 文字高度预估</text>
        <text class="tech-desc">🔬 实验性方案，基于统计学预估</text>
        <view class="code-example">
          <text class="code-text">
            // 基于字符数和宽度预估高度 const estimatedHeight =
            estimateTextHeight( text.length, width, fontSize, lineHeight )
          </text>
        </view>
      </view>
    </view>

    <!-- 建议 -->
    <view class="recommendation-section">
      <text class="section-title">使用建议</text>
      <view class="recommendations">
        <view class="recommendation-item">
          <text class="rec-title">🖼️ 纯图片瀑布流</text>
          <text class="rec-desc">完全使用无DOM重排算法，性能最佳</text>
        </view>
        <view class="recommendation-item">
          <text class="rec-title">📝 图片+固定文字</text>
          <text class="rec-desc">固定文字容器高度，使用无DOM算法</text>
        </view>
        <view class="recommendation-item">
          <text class="rec-title">📰 图片+动态文字</text>
          <text class="rec-desc">使用混合方案或传统瀑布流组件</text>
        </view>
        <view class="recommendation-item">
          <text class="rec-title">🔤 纯文字瀑布流</text>
          <text class="rec-desc">建议使用传统瀑布流组件</text>
        </view>
      </view>
    </view>

    <!-- 瀑布流演示导航 -->
    <WaterfallDemoNavigation />
  </doc-page>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { random } from 'sard-uniapp'
import WaterfallDemoNavigation from './WaterfallDemoNavigation.vue'
import { text } from '../../read-more/demo/data'

// 响应式数据
const columns = ref(2)
const currentSolution = ref<'none' | 'fixed' | 'hybrid'>('none')
const containerWidth = ref(350)

// 示例文字
const sampleText = ref(
  '这是一段示例文字，用来演示在不同宽度下文字高度的变化。当容器宽度改变时，文字会重新换行，导致高度发生变化，这就是无DOM重排算法面临的核心挑战。文字越长，这个问题越明显。',
)

// 模拟高度（实际应用中需要DOM测量）
const twoColumnHeight = ref(120)
const threeColumnHeight = ref(160)
const fourColumnHeight = ref(200)

// 计算不同列数下的宽度
const twoColumnWidth = computed(() => (containerWidth.value - 10) / 2)
const threeColumnWidth = computed(() => (containerWidth.value - 20) / 3)
const fourColumnWidth = computed(() => (containerWidth.value - 30) / 4)

const currentColumnWidth = computed(() => {
  return (containerWidth.value - (columns.value - 1) * 10) / columns.value
})

// 演示数据
const demoItems = ref([
  {
    id: 1,
    imageUrl: 'https://fastly.jsdelivr.net/npm/@sard/assets/images/cat1.jpg',
    imageHeight: 150,
    text: '这是一段较短的文字描述。',
  },
  {
    id: 2,
    imageUrl: 'https://fastly.jsdelivr.net/npm/@sard/assets/images/cat2.jpg',
    imageHeight: 180,
    text: '这是一段比较长的文字描述，用来演示在固定高度容器中的显示效果。当文字过长时可能会被截断。',
  },
  {
    id: 3,
    imageUrl: 'https://fastly.jsdelivr.net/npm/@sard/assets/images/cat3.jpg',
    imageHeight: 120,
    text: '中等长度的文字描述，展示不同长度文字在固定容器中的表现。',
  },
])

// 改变列数
const changeColumns = (newColumns: number) => {
  columns.value = newColumns
}

// 初始化
onMounted(() => {
  // 获取容器宽度
  try {
    const screenWidth = uni.getSystemInfoSync().screenWidth
    containerWidth.value = screenWidth - 40
  } catch (error) {
    containerWidth.value = 350
  }
})
</script>

<style lang="scss" scoped>
.problem-explanation {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8rpx;
  padding: 20rpx;
  margin: 20rpx;
}

.explanation-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #856404;
  display: block;
  margin-bottom: 10rpx;
}

.explanation-content {
  margin-top: 10rpx;
}

.explanation-text {
  font-size: 28rpx;
  color: #856404;
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

.demo-section,
.solution-section,
.technical-section,
.recommendation-section {
  background: white;
  margin: 20rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.text-demo {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.demo-item {
  border: 1px solid #e0e0e0;
  border-radius: 8rpx;
  padding: 15rpx;
}

.demo-label {
  font-size: 26rpx;
  color: #666;
  display: block;
  margin-bottom: 10rpx;
}

.text-container {
  border: 1px dashed #ccc;
  padding: 10rpx;
  margin-bottom: 10rpx;
  background: #fafafa;
}

.demo-text {
  font-size: 24rpx;
  line-height: 1.4;
  color: #333;
}

.height-info {
  font-size: 22rpx;
  color: #007aff;
  font-weight: bold;
}

.solution-content {
  margin-bottom: 20rpx;
}

.solution-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 15rpx;
}

.fixed-height-demo {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  margin-bottom: 15rpx;
}

.fixed-item {
  border: 1px solid #e0e0e0;
  border-radius: 8rpx;
  overflow: hidden;
  background: white;
}

.item-image {
  width: 100%;
  background: #f0f0f0;
}

.fixed-text-container {
  height: 80rpx;
  padding: 10rpx;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.item-text {
  font-size: 22rpx;
  line-height: 1.3;
  color: #333;
}

.hybrid-demo {
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
  margin-bottom: 15rpx;
}

.hybrid-description {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

.solution-pros-cons {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.pros {
  font-size: 24rpx;
  color: #28a745;
}

.cons {
  font-size: 24rpx;
  color: #dc3545;
}

.tech-solution {
  margin-bottom: 25rpx;
  padding: 15rpx;
  border-left: 4rpx solid #007aff;
  background: #f8f9fa;
}

.tech-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.tech-desc {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 10rpx;
}

.code-example {
  background: #2d3748;
  padding: 15rpx;
  border-radius: 6rpx;
  margin-top: 10rpx;
}

.code-text {
  font-size: 22rpx;
  color: #e2e8f0;
  font-family: 'Courier New', monospace;
  line-height: 1.4;
}

.recommendations {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.recommendation-item {
  padding: 15rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
  border-left: 4rpx solid #28a745;
}

.rec-title {
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.rec-desc {
  font-size: 24rpx;
  color: #666;
  line-height: 1.4;
}

.problem-demo {
  padding: 20rpx;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8rpx;
  margin-bottom: 15rpx;
}

.problem-text {
  font-size: 26rpx;
  color: #721c24;
  line-height: 1.5;
}
</style>
