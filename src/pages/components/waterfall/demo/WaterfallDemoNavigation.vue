<template>
  <view class="demo-navigation">
    <scroll-view
      class="demo-nav-scroll"
      scroll-x
      :show-scrollbar="false"
      :enable-flex="true"
      :scroll-with-animation="true"
    >
      <view class="demo-nav-content">
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
    </scroll-view>
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
  { title: '真实', path: '/pages/components/waterfall/demo/TrueCase' },
  { title: '列数', path: '/pages/components/waterfall/demo/Columns' },
  { title: '刷新', path: '/pages/components/waterfall/demo/Dynamic' },
  { title: '动画', path: '/pages/components/waterfall/demo/ReflowAnimation' },
  { title: '平滑', path: '/pages/components/waterfall/demo/SmoothReflow' },
  { title: '已知', path: '/pages/components/waterfall/demo/KnownSize' },
  { title: '等待', path: '/pages/components/waterfall/demo/MaxWait' },
  { title: '大图', path: '/pages/components/waterfall/demo/BigImage' },
  { title: '重排', path: '/pages/components/waterfall/demo/ReflowDemo' },
  { title: '重排2', path: '/pages/components/waterfall/demo/ReflowDemo2' },
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
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10rpx);
  border-top: 1rpx solid var(--sar-border-color);
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.1);

  // 暗黑模式支持
  @media (prefers-color-scheme: dark) {
    background-color: rgba(0, 0, 0, 0.95);
  }
}

.demo-nav-scroll {
  width: 100%;
  height: 84rpx;
  white-space: nowrap;
}

.demo-nav-content {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 16rpx 50rpx; // 左右留出渐变遮罩的空间
  min-width: 100%;
}

.demo-nav-btn {
  flex: 0 0 auto;
  min-width: 60rpx;
  height: 52rpx;
  font-size: 16rpx;
  padding: 0 4rpx;
  white-space: nowrap;
  border-radius: 6rpx;

  &:hover {
    transform: translateY(-1rpx);
    transition: transform 0.15s ease;
  }

  // 确保按钮文字不换行
  :deep(.sar-button__text) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 80rpx;
  }
}
</style>
