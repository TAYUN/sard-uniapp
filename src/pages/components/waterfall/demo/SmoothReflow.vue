<template>
  <doc-page title="平滑重排测试">
    <view class="demo-controls">
      <view class="control-group">
        <text class="control-label">列数切换：</text>
        <sar-button
          v-for="col in [2, 3, 4, 5]"
          :key="col"
          @click="changeColumns(col)"
          :type="columns === col ? 'default' : 'outline'"
          size="small"
        >
          {{ col }}列
        </sar-button>
      </view>

      <view class="control-group">
        <text class="control-label">间距调整：</text>
        <sar-button
          @click="changeGap(8)"
          :type="gap === 8 ? 'default' : 'outline'"
          size="small"
        >
          小间距
        </sar-button>
        <sar-button
          @click="changeGap(16)"
          :type="gap === 16 ? 'default' : 'outline'"
          size="small"
        >
          中间距
        </sar-button>
        <sar-button
          @click="changeGap(24)"
          :type="gap === 24 ? 'default' : 'outline'"
          size="small"
        >
          大间距
        </sar-button>
      </view>

      <view class="control-group">
        <sar-button @click="triggerReflow" theme="secondary" size="small">
          手动重排
        </sar-button>
        <sar-button @click="triggerFullReflow" theme="warning" size="small">
          完整重排
        </sar-button>
        <sar-button @click="addItems" theme="success" size="small">
          添加项目
        </sar-button>
      </view>
    </view>

    <sar-waterfall
      ref="waterfallRef"
      class="mx-32"
      :columns="columns"
      :column-gap="gap"
      :row-gap="gap"
      @load="onLoad"
    >
      <sar-waterfall-item
        v-for="(item, index) in list"
        :key="item.id"
        :index="index"
      >
        <template #default="{ onLoad }">
          <view class="demo-item" :style="{ backgroundColor: item.color }">
            <SimulatedImage :meta="item.img" @load="onLoad" />
            <view class="item-content">
              <view class="item-title">{{ item.title }}</view>
              <view class="item-meta">
                <text class="item-id">ID: {{ item.id }}</text>
                <text class="item-index">#{{ index + 1 }}</text>
              </view>
            </view>
          </view>
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
  id: string
  title: string
  color: string
  img: {
    width: number
    height: number
  }
}

const list = ref<ListItem[]>([])
const columns = ref(3)
const gap = ref(16)
const waterfallRef = ref()

let itemIdCounter = 1

const colors = [
  '#FFE5E5',
  '#E5F3FF',
  '#E5FFE5',
  '#FFF5E5',
  '#F0E5FF',
  '#FFE5F5',
  '#E5FFFF',
  '#FFFFE5',
]

const getData = (count = 12) => {
  return new Promise<ListItem[]>((resolve) => {
    const data = Array(count)
      .fill(0)
      .map(() => {
        const min = 15
        const max = 40
        const startIndex = random(0, text.length - max)
        const length = random(min, max)
        return {
          id: `item-${itemIdCounter++}`,
          title: text.slice(startIndex, startIndex + length),
          color: colors[random(0, colors.length - 1)],
          img: {
            width: random(200, 400),
            height: random(150, 350),
          },
        }
      })
    resolve(data)
  })
}

const changeColumns = (newColumns: number) => {
  columns.value = newColumns
}

const changeGap = (newGap: number) => {
  gap.value = newGap
}

const triggerReflow = () => {
  if (waterfallRef.value) {
    // waterfallRef.value.reflow()
  }
}

const triggerFullReflow = () => {
  if (waterfallRef.value) {
    // waterfallRef.value.fullReflow()
  }
}

const addItems = async () => {
  const newItems = await getData(6)
  list.value.push(...newItems)
  toast(`添加了 ${newItems.length} 个项目`)
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
.demo-controls {
  padding: 32rpx;
  background: #f8f9fa;
  margin-bottom: 20rpx;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;

  &:last-child {
    margin-bottom: 0;
  }
}

.control-label {
  font-size: 28rpx;
  color: #666;
  min-width: 120rpx;
}

.demo-item {
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease-out;

  &:active {
    transform: scale(0.98);
  }
}

.item-content {
  padding: 24rpx;
}

.item-title {
  font-size: 28rpx;
  line-height: 1.4;
  color: #333;
  margin-bottom: 16rpx;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-id {
  font-size: 22rpx;
  color: #999;
}

.item-index {
  font-size: 22rpx;
  color: #666;
  font-weight: 500;
}
</style>
