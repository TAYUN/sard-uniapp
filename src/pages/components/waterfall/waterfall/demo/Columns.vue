<template>
  <doc-page title="自定义列数">
    <sar-slider v-model="columns" class="m-30" show-scale :min="1" :max="8" />
    <sar-waterfall
      class="mx-16"
      :columns="columns"
      :column-gap="4"
      :row-gap="4"
      @load="onLoad"
    >
      <sar-waterfall-item v-for="(item, index) in list" :key="index">
        <template #default="{ onLoad }">
          <image
            mode="widthFix"
            class="flex w-full"
            :src="item.url"
            @load="onLoad"
            @error="onLoad"
          />
        </template>
      </sar-waterfall-item>
    </sar-waterfall>

    <!-- 瀑布流演示导航 -->
    <WaterfallDemoNavigation />
  </doc-page>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'

const columns = ref(3)

interface ListItem {
  url: string
}

const list = ref<ListItem[]>([])

const getData = () => {
  return new Promise<ListItem[]>((resolve) => {
    const data = Array(30)
      .fill(0)
      .map((_, i) => {
        return {
          url: `https://fastly.jsdelivr.net/npm/@sard/assets/images/tiger${(i % 12) + 1}.jpg`,
        }
      })
    resolve(data)
  })
}

const onLoad = () => {}

onMounted(async () => {
  list.value.push(...(await getData()))
})
</script>
