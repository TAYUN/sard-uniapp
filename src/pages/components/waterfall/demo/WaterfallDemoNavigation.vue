<template>
  <view class="demo-navigation">
    <!-- 分类标签切换 -->
    <view class="category-tabs">
      <view
        v-for="category in categories"
        :key="category.key"
        class="category-tab"
        :class="{ active: activeCategory === category.key }"
        @click="activeCategory = category.key"
      >
        <text class="tab-text">{{ category.name }}</text>
      </view>
    </view>

    <!-- 演示按钮列表 -->
    <scroll-view class="demo-scroll" scroll-x enable-flex>
      <view class="demo-buttons">
        <sar-button
          v-for="demo in filteredDemos"
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
import { ref, computed } from 'vue'
import { toast } from 'sard-uniapp'

interface DemoItem {
  title: string
  path: string
  category: string
}

interface Category {
  key: string
  name: string
}

// 当前激活的分类
const activeCategory = ref('basic')

// 分类定义
const categories: Category[] = [
  { key: 'basic', name: '基础' },
  { key: 'optimization', name: '优化' },
  { key: 'advanced', name: '高级' },
]

// 瀑布流演示列表（按分类组织）
const demoList: DemoItem[] = [
  // 基础演示
  {
    title: '基础用法',
    path: '/pages/components/waterfall/demo/Basic',
    category: 'basic',
  },
  {
    title: '真实案例',
    path: '/pages/components/waterfall/demo/TrueCase',
    category: 'basic',
  },
  {
    title: '列数切换',
    path: '/pages/components/waterfall/demo/Columns',
    category: 'basic',
  },
  {
    title: '重排动画',
    path: '/pages/components/waterfall/demo/ReflowAnimation',
    category: 'basic',
  },

  // 优化相关
  {
    title: '优化真实',
    path: '/pages/components/waterfall/demo/OptimizedTrueCase',
    category: 'optimization',
  },
  {
    title: '重排优化',
    path: '/pages/components/waterfall/demo/ReflowOptimizationDemo',
    category: 'optimization',
  },
  {
    title: '性能对比',
    path: '/pages/components/waterfall/demo/PerformanceComparison',
    category: 'optimization',
  },
  {
    title: '真实对比',
    path: '/pages/components/waterfall/demo/TrueOptimizationComparison',
    category: 'optimization',
  },

  // 高级功能
  {
    title: '文字问题',
    path: '/pages/components/waterfall/demo/TextHeightProblem',
    category: 'advanced',
  },
  {
    title: '混合方案',
    path: '/pages/components/waterfall/demo/HybridSolution',
    category: 'advanced',
  },
  {
    title: '整卡测量',
    path: '/pages/components/waterfall/demo/WholeCardMeasurement',
    category: 'advanced',
  },
  {
    title: '简化重排',
    path: '/pages/components/waterfall/demo/SimpleReflowDemo',
    category: 'advanced',
  },
  {
    title: '重排演示',
    path: '/pages/components/waterfall/demo/ReflowDemo',
    category: 'advanced',
  },
]

// 根据当前分类过滤演示
const filteredDemos = computed(() => {
  return demoList.filter((demo) => demo.category === activeCategory.value)
})

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

.category-tabs {
  display: flex;
  padding: 12rpx 20rpx 8rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.1);
}

.category-tab {
  flex: 1;
  text-align: center;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  margin: 0 4rpx;
  transition: all 0.2s ease;
  cursor: pointer;

  &.active {
    background: #007aff;

    .tab-text {
      color: white;
      font-weight: 500;
    }
  }

  &:not(.active) {
    background: rgba(0, 0, 0, 0.05);

    .tab-text {
      color: #666;
    }

    &:active {
      background: rgba(0, 0, 0, 0.1);
    }
  }
}

.tab-text {
  font-size: 24rpx;
  transition: color 0.2s ease;
}

.demo-scroll {
  height: 80rpx;
  white-space: nowrap;
}

.demo-buttons {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  min-width: 100%;
}

.demo-nav-btn {
  flex: 0 0 auto;
  min-width: 100rpx;
  height: 56rpx;
  font-size: 22rpx;
  padding: 0 12rpx;
  white-space: nowrap;

  &:hover {
    transform: translateY(-1rpx);
    transition: transform 0.15s ease;
  }
}
</style>
