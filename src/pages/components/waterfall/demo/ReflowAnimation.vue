<template>
  <doc-page title="重排动画效果">
    <view class="demo-controls">
      <sar-button
        @click="changeColumns(2)"
        :type="columns === 2 ? 'pale' : 'default'"
      >
        2列
      </sar-button>
      <sar-button
        @click="changeColumns(3)"
        :type="columns === 3 ? 'pale' : 'default'"
      >
        3列
      </sar-button>
      <sar-button
        @click="changeColumns(4)"
        :type="columns === 4 ? 'pale' : 'default'"
      >
        4列
      </sar-button>
      <sar-button @click="triggerReflow" type="outline">手动重排</sar-button>
    </view>

    <sar-waterfall
      ref="waterfallRef"
      class="mx-32"
      :columns="columns"
      :column-gap="16"
      :row-gap="16"
      @load="onLoad"
    >
      <sar-waterfall-item
        v-for="(item, index) in list"
        :key="index"
        :index="index"
      >
        <template #default="{ onLoad }">
          <view class="demo-item">
            <SimulatedImage :meta="item.img" @load="onLoad" />
            <view class="item-content">
              <view class="item-title">{{ item.title }}</view>
              <view class="item-index">项目 #{{ index + 1 }}</view>
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
  title: string
  img: {
    width: number
    height: number
  }
}

const list = ref<ListItem[]>([])
const columns = ref(2)
const waterfallRef = ref()

const getData = () => {
  return new Promise<ListItem[]>((resolve) => {
    const data = Array(15)
      .fill(0)
      .map(() => {
        const min = 10
        const max = 30
        const startIndex = random(0, text.length - max)
        const length = random(min, max)
        return {
          title: text.slice(startIndex, startIndex + length),
          img: {
            width: random(200, 400),
            height: random(150, 400),
          },
        }
      })
    resolve(data)
  })
}

const changeColumns = (newColumns: number) => {
  columns.value = newColumns
}

const triggerReflow = () => {
  if (waterfallRef.value) {
    waterfallRef.value.reflow(true)
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
.demo-controls {
  display: flex;
  gap: 16rpx;
  padding: 32rpx;
  flex-wrap: wrap;
  justify-content: center;
}

.demo-item {
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
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
  margin-bottom: 12rpx;
}

.item-index {
  font-size: 24rpx;
  color: #999;
  text-align: right;
}
</style>
