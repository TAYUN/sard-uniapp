<template>
  <doc-page title="已知宽高">
    <sar-waterfall class="mx-32">
      <sar-waterfall-item
        v-for="(item, index) in list"
        :key="index"
        :width="item.img.width"
        :height="item.img.height"
      >
        <!-- <template #default="{ onLoad }">
          <sar-waterfall-load
            :width="item.img.width"
            :height="item.img.height"
            @load="onLoad"
          >
            <SimulatedImage class="w-full h-full pt-0" :meta="item.img" />
          </sar-waterfall-load>
          <view class="mt-10">{{ item.title }}</view>
        </template> -->
        <!-- <template #image>
        </template> -->
        <template #default="{ imageHeight }">
          <!-- <SimulatedImage
            :style="{ height: `${imageHeight}px` }"
            :meta="item.img"
            @load="onLoad"
          /> -->
          <image
            class="w-full pt-0"
            mode="aspectFill"
            :style="{ height: `${imageHeight}px` }"
            :src="item.url"
          />
          <view class="mt-10">{{ item.title }}</view>
        </template>
      </sar-waterfall-item>
    </sar-waterfall>

    <!-- 瀑布流演示导航 -->
    <WaterfallDemoNavigation />
  </doc-page>
</template>

<script lang="ts" setup>
import { random } from 'sard-uniapp'
import { onMounted, ref } from 'vue'
// import SimulatedImage from './SimulatedImage.vue'
import WaterfallDemoNavigation from './WaterfallDemoNavigation.vue'
import { text } from '../../read-more/demo/data'
import { onReachBottom } from '@dcloudio/uni-app'

interface ListItem {
  title: string
  img: {
    width: number
    height: number
  }
  url: string
}

const list = ref<ListItem[]>([])

const getData = () => {
  return new Promise<ListItem[]>((resolve) => {
    const data = Array(20)
      .fill(0)
      .map((_, i) => {
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
          url: `https://fastly.jsdelivr.net/npm/@sard/assets/images/cat${(i % 12) + 1}.jpg`,
        }
      })
    resolve(data)
  })
}

onMounted(async () => {
  list.value.push(...(await getData()))
})

onReachBottom(async () => {
  list.value.push(...(await getData()))
})
</script>
