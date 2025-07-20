<template>
  <view class="demo-navigation">
    <sar-button
      v-for="demo in demoList"
      :key="demo.path"
      size="mini"
      type="outline"
      class="demo-nav-btn"
      @click="navigateToDemo(demo.path)"
    >
      {{ demo.title }}
    </sar-button>
  </view>
</template>

<script lang="ts" setup>
import { toast } from 'sard-uniapp'

interface DemoItem {
  title: string
  path: string
}

// 瀑布流演示列表
const demoList: DemoItem[] = [
  { title: '基础', path: '/pages/components/waterfall/demo/Basic' },
  { title: '大图', path: '/pages/components/waterfall/demo/BigImage' },
  { title: '列数', path: '/pages/components/waterfall/demo/Columns' },
  { title: '刷新', path: '/pages/components/waterfall/demo/Dynamic' },
  { title: '已知', path: '/pages/components/waterfall/demo/KnownSize' },
  { title: '等待', path: '/pages/components/waterfall/demo/MaxWait' },
  { title: '真实', path: '/pages/components/waterfall/demo/TrueCase' },
]

const navigateToDemo = (path: string) => {
  uni.navigateTo({
    url: path,
    fail: (err) => {
      console.error('导航失败:', err)
      toast.fail('页面跳转失败')
    },
  })
}
</script>

<style lang="scss" scoped>
.demo-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 16rpx 20rpx;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10rpx);
  border-top: 1rpx solid var(--sar-border-color);
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.1);

  // 暗黑模式支持
  @media (prefers-color-scheme: dark) {
    background-color: rgba(0, 0, 0, 0.95);
  }
}

.demo-nav-btn {
  flex: 0 0 auto;
  min-width: 80rpx;
  height: 56rpx;
  font-size: 20rpx;
  padding: 0 8rpx;

  &:hover {
    transform: translateY(-1rpx);
    transition: transform 0.15s ease;
  }
}
</style>
