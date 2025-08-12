<template>
  <doc-page title="基础使用">
    <sar-waterfall class="mx-32" @load="onLoad">
      <sar-waterfall-item v-for="(item, index) in list" :key="index">
        <template #default="{ onLoad, errorInfo }">
          <SimulatedImage
            v-if="errorInfo.errorType === 'none'"
            :meta="item.img"
            @load="onLoad"
          />
          <!-- 第二层：占位图片 -->
          <view
            v-else-if="errorInfo.hasError && !errorInfo.showFinalFallback"
            class="fallback-container"
          >
            <image
              :src="errorInfo.fallbackImageSrc"
              mode="aspectFill"
              class="fallback-image"
              @load="errorInfo.onFallbackLoad"
              @error="errorInfo.onFallbackError"
            />
          </view>
          <view v-else class="final-fallback">
            <view class="fallback-content">
              <text class="fallback-text">
                {{ errorInfo.errorMessage || '图片加载失败' }}
              </text>
              <text class="fallback-type">
                {{ getErrorTypeText(errorInfo.errorType) }}
              </text>
            </view>
          </view>
          <view class="mt-10">{{ item.title }}</view>
        </template>
      </sar-waterfall-item>
    </sar-waterfall>

    <!-- 瀑布流演示导航 -->
    <WaterfallDemoNavigation />
  </doc-page>
</template>

<script lang="ts" setup>
import { random, toast } from 'sard-uniapp'
import { nextTick, onMounted, ref } from 'vue'
import SimulatedImage from './SimulatedImage.vue'
import WaterfallDemoNavigation from './WaterfallDemoNavigation.vue'
import { text } from '../../read-more/demo/data'

interface ListItem {
  title: string
  img: {
    width: number
    height: number
  }
}

const list = ref<ListItem[]>([])

const getData = () => {
  return new Promise<ListItem[]>((resolve) => {
    const data = Array(20)
      .fill(0)
      .map(() => {
        const min = 20
        const max = 50
        const startIndex = random(0, text.length - max)
        const length = random(min, max)
        return {
          title: text.slice(startIndex, startIndex + length),
          img: {
            width: random(100, 500),
            height: random(100, 500),
          },
        }
      })
    resolve(data)
  })
}
// 错误类型文本转换
const getErrorTypeText = (errorType: string) => {
  switch (errorType) {
    case 'original-failed':
      return '原始内容加载失败'
    case 'fallback-failed':
      return '占位图片也加载失败'
    case 'timeout':
      return '加载超时'
    default:
      return ''
  }
}

const onLoad = () => {
  toast.hide()
}

onMounted(async () => {
  nextTick(() => {
    toast.loading('加载中')
  })
  list.value.push(...(await getData()))
})
</script>

<style lang="scss" scoped>
// 错误处理相关样式
.fallback-container {
  width: 100%;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 8rpx;
}

.fallback-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8rpx;
}

.final-fallback {
  width: 100%;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border: 1px dashed #ddd;
  border-radius: 8rpx;
}

.fallback-content {
  text-align: center;
}

.fallback-text {
  font-size: 28rpx;
  color: #999;
  display: block;
  margin-bottom: 8rpx;
}

.fallback-type {
  font-size: 24rpx;
  color: #ccc;
  display: block;
}
</style>
