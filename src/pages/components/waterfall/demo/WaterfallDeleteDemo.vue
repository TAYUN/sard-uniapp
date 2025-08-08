<template>
  <doc-page title="删除项目">
    <!-- 操作按钮区域 -->
    <view class="demo-header mx-32 mb-32">
      <sar-button size="small" @click="addItem" class="demo-btn">
        添加项目
      </sar-button>
      <sar-button
        size="small"
        type="outline"
        @click="() => batchAddItems(5)"
        class="demo-btn"
      >
        批量添加5个
      </sar-button>
      <sar-button
        size="small"
        type="outline"
        @click="removeRandomItem"
        class="demo-btn"
      >
        删除随机项目
      </sar-button>
      <sar-button
        size="small"
        type="outline"
        theme="danger"
        @click="clearAll"
        class="demo-btn"
      >
        清空所有
      </sar-button>
    </view>

    <!-- 瀑布流容器 -->
    <sar-waterfall
      ref="waterfallRef"
      :columns="2"
      :column-gap="10"
      :row-gap="10"
      class="mx-32"
      @load="onLoad"
    >
      <sar-waterfall-item
        v-for="item in items"
        :key="item.id"
        :index="item.index"
        class="demo-item"
      >
        <template #default="{ onLoad }">
          <SimulatedImage :meta="item.img" @load="onLoad" />
          <view class="demo-content p-16">
            <view class="demo-title mb-8">{{ item.title }}</view>
            <view class="demo-meta">
              <text class="demo-id">ID: {{ item.id }}</text>
              <text class="demo-index">Index: {{ item.index }}</text>
            </view>
            <sar-button
              size="mini"
              type="outline"
              theme="danger"
              class="demo-delete-btn mt-12"
              @click="removeItem(item.index)"
            >
              删除此项
            </sar-button>
          </view>
        </template>
      </sar-waterfall-item>
    </sar-waterfall>

    <!-- 状态信息 -->
    <view class="demo-status mx-32 mt-32">
      <view class="demo-status-row">
        <text class="demo-status-text">当前项目数量: {{ items.length }}</text>
      </view>
      <view class="demo-status-row" v-if="items.length > 0">
        <text class="demo-status-text">
          项目索引: {{ items.map((item) => item.index).join(', ') }}
        </text>
      </view>
    </view>

    <!-- 瀑布流演示导航 -->
    <WaterfallDemoNavigation />
  </doc-page>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { random, toast } from 'sard-uniapp'
import SimulatedImage from './SimulatedImage.vue'
import WaterfallDemoNavigation from './WaterfallDemoNavigation.vue'
import { text } from '../../read-more/demo/data'

interface DemoItem {
  id: number
  index: number
  title: string
  img: {
    width: number
    height: number
  }
}

const waterfallRef = ref()
const items = ref<DemoItem[]>([])
let nextId = 1

// 生成随机文本
const getRandomTitle = () => {
  const min = 10
  const max = 30
  const startIndex = random(0, text.length - max)
  const length = random(min, max)
  return text.slice(startIndex, startIndex + length)
}

// 生成随机图片尺寸
const getRandomImageSize = () => {
  return {
    width: random(200, 400),
    height: random(150, 500),
  }
}

// 添加项目
const addItem = () => {
  try {
    const newItem: DemoItem = {
      id: nextId++,
      index: items.value.length,
      title: getRandomTitle(),
      img: getRandomImageSize(),
    }
    items.value.push(newItem)

    console.log('添加项目:', newItem)
    // 显示添加成功提示
    toast.success(`添加项目 #${newItem.id}`)
  } catch (error) {
    console.error('添加项目失败:', error)
    toast.fail('添加失败')
  }
}

// 批量添加项目
const batchAddItems = (count: number = 5) => {
  try {
    const startId = nextId
    for (let i = 0; i < count; i++) {
      const newItem: DemoItem = {
        id: nextId++,
        index: items.value.length,
        title: getRandomTitle(),
        img: getRandomImageSize(),
      }
      items.value.push(newItem)
    }

    console.log(`批量添加 ${count} 个项目`)
    toast.success(`批量添加 ${count} 个项目 (#${startId}-#${nextId - 1})`)
  } catch (error) {
    console.error('批量添加失败:', error)
    toast.fail('批量添加失败')
  }
}

// 删除指定项目
const removeItem = async (index: number) => {
  try {
    // 从数据中移除
    const itemIndex = items.value.findIndex((item) => item.index === index)
    if (itemIndex !== -1) {
      // 从数据中移除项目
      items.value.splice(itemIndex, 1)
    } else {
      console.error('未找到要删除的项目，索引:', index)
    }
  } catch (error) {
    console.error('删除项目失败:', error)
    toast.fail('删除失败')
  }
}

// 删除随机项目
const removeRandomItem = () => {
  if (items.value.length > 0) {
    const randomIndex = Math.floor(Math.random() * items.value.length)
    const targetItem = items.value[randomIndex]
    removeItem(targetItem.index)
  } else {
    toast('没有可删除的项目')
  }
}

// 清空所有项目
const clearAll = async () => {
  try {
    if (items.value.length === 0) {
      toast('列表已经为空')
      return
    }

    const count = items.value.length
    items.value = []
    await nextTick()
    waterfallRef.value?.refreshReflow()

    toast.success(`已清空 ${count} 个项目`)
  } catch (error) {
    console.error('清空失败:', error)
    toast.fail('清空失败')
  }
}

// 瀑布流加载完成回调
const onLoad = () => {
  toast.hide()
}

// 初始化数据
const initData = () => {
  const initialData: DemoItem[] = Array(6)
    .fill(0)
    .map((_, index) => ({
      id: nextId++,
      index,
      title: getRandomTitle(),
      img: getRandomImageSize(),
    }))

  items.value = initialData
}

onMounted(async () => {
  nextTick(() => {
    toast.loading('加载中')
  })
  initData()
})
</script>

<style lang="scss" scoped>
.demo-header {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
  align-items: center;
}

.demo-btn {
  flex: 0 0 auto;
}

.demo-item {
  border-radius: 16rpx;
  overflow: hidden;
  background-color: var(--sar-bg-color);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2rpx);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
  }
}

.demo-content {
  background-color: var(--sar-bg-color);
}

.demo-title {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--sar-text-color);
  line-height: 1.4;
  word-break: break-all;
}

.demo-meta {
  display: flex;
  gap: 16rpx;
  font-size: 24rpx;
  color: var(--sar-text-color-secondary);
}

.demo-id,
.demo-index {
  flex: 0 0 auto;
}

.demo-delete-btn {
  width: 100%;
}

.demo-status {
  padding: 24rpx;
  background-color: var(--sar-bg-color-secondary);
  border-radius: 16rpx;
}

.demo-status-row {
  margin-bottom: 8rpx;
  text-align: center;

  &:last-child {
    margin-bottom: 0;
  }
}

.demo-status-text {
  font-size: 28rpx;
  color: var(--sar-text-color-secondary);
  font-weight: 500;
  word-break: break-all;
}

// 暗黑模式适配
@media (prefers-color-scheme: dark) {
  .demo-item {
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);

    &:hover {
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.4);
    }
  }
}
</style>
