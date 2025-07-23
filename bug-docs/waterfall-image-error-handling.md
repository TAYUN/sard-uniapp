# 瀑布流图片加载失败处理方案

## 概述

在瀑布流组件中，图片加载失败是一个常见且需要妥善处理的场景。本文档提供了一套完整的图片加载失败处理方案，包括错误状态显示、自动重试机制、用户手动重试等功能。

## 问题分析

### 当前代码的处理方式

在 `SimulatedImage.vue` 中，当前的"模拟加载"总是成功的：

```typescript
const { start } = useTimeout(
  () => {
    // 无论成功还是失败，都会执行这里
    internalWidth.value = props.meta.width
    internalHeight.value = props.meta.height
    emit('load', {
      detail: {
        width: props.meta.width,
        height: props.meta.height,
      },
    })
  },
  random(150, 1500),
)
```

但在真实场景中，图片加载可能会失败，需要考虑以下情况：

- 网络连接问题
- 图片URL无效
- 服务器返回错误
- 图片格式不支持

## 解决方案

### 1. 扩展 WaterfallItemInfo 接口

首先，在 `src/lib/components/waterfall-item/common.ts` 中扩展项目信息接口：

```typescript
export interface WaterfallItemInfo {
  loaded: boolean // 是否完成加载过程（成功或失败）
  loadSuccess: boolean // 是否加载成功
  visible: boolean // 是否可见
  height: number // 项目高度
  top: number // 垂直位置
  left: number // 水平位置
  index: number // 项目索引
  retryCount?: number // 重试次数
  beforeReflow: () => Promise<void> // 重排前的预处理
}
```

### 2. 创建真实的图片组件

创建一个新的 `WaterfallImage.vue` 组件，专门处理瀑布流中的图片：

```vue
<template>
  <view class="relative box-border" :style="{ paddingTop }">
    <!-- 图片元素 -->
    <image
      :src="src"
      class="absolute inset-0 w-full h-full"
      :class="imageClass"
      @load="onImageLoad"
      @error="onImageError"
      :mode="mode"
      :lazy-load="lazyLoad"
    />

    <!-- 加载中状态 -->
    <view
      v-if="loading"
      class="absolute inset-0 flex justify-center items-center sbg-fourth"
    >
      <view class="sar-loading sar-loading--circular"></view>
    </view>

    <!-- 加载失败状态 -->
    <view
      v-if="loadFailed"
      class="absolute inset-0 flex flex-col justify-center items-center sbg-fourth"
      @tap="retry"
    >
      <text class="text-gray-500 mb-2">加载失败</text>
      <text class="text-sm text-primary">点击重试</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { classNames } from '../../utils'

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  width: {
    type: [Number, String],
    default: 0,
  },
  height: {
    type: [Number, String],
    default: 0,
  },
  mode: {
    type: String,
    default: 'aspectFill',
  },
  lazyLoad: {
    type: Boolean,
    default: true,
  },
  imageClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['load', 'error'])

// 状态管理
const loading = ref(true)
const loadFailed = ref(false)
const actualWidth = ref(props.width || 300)
const actualHeight = ref(props.height || 225)

// 计算宽高比例的 padding-top
const paddingTop = computed(() => {
  // 如果有明确的宽高，使用它们
  if (props.width && props.height) {
    return (Number(props.height) / Number(props.width)) * 100 + '%'
  }
  // 否则使用实际加载的宽高
  return (actualHeight.value / actualWidth.value) * 100 + '%'
})

// 图片加载成功
const onImageLoad = (e) => {
  loading.value = false
  loadFailed.value = false

  // 更新实际尺寸
  actualWidth.value = e.detail.width || actualWidth.value
  actualHeight.value = e.detail.height || actualHeight.value

  // 触发加载成功事件
  emit('load', {
    detail: {
      width: actualWidth.value,
      height: actualHeight.value,
      success: true,
    },
  })
}

// 图片加载失败
const onImageError = () => {
  loading.value = false
  loadFailed.value = true

  // 触发加载失败事件，但仍然提供尺寸信息
  emit('load', {
    detail: {
      width: actualWidth.value,
      height: actualHeight.value,
      success: false,
    },
  })
}

// 重试加载
const retry = () => {
  loading.value = true
  loadFailed.value = false

  // 创建一个新的图片URL（添加时间戳避免缓存）
  const newSrc = props.src.includes('?')
    ? `${props.src}&_t=${Date.now()}`
    : `${props.src}?_t=${Date.now()}`

  // 创建一个临时Image对象进行预加载
  const img = new Image()
  img.onload = (e) => {
    onImageLoad({
      detail: {
        width: img.width,
        height: img.height,
      },
    })
  }
  img.onerror = onImageError
  img.src = newSrc
}
</script>
```

### 3. 修改 WaterfallItem 组件处理加载状态

在 `waterfall-item.vue` 中增强加载回调处理：

```typescript
/**
 * 加载完成回调
 * 当项目内容（如图片）加载完成或失败时调用
 * 通知父组件进行重新布局
 */
const onLoad = (event?: any) => {
  if (!item.loaded) {
    item.loaded = true
    // 检查是否加载成功
    item.loadSuccess = event?.detail?.success !== false
    context.onItemLoad(item) // 传递项目信息给父组件
  }
}
```

### 4. 增强 Waterfall 组件的加载状态处理

在 `waterfall.vue` 中增强加载状态处理：

```typescript
/**
 * 项目加载完成回调
 * 当子组件的内容（如图片）加载完成或失败时调用
 */
const onItemLoad = (item: WaterfallItemInfo) => {
  // 如果加载失败且允许重试
  if (!item.loadSuccess && props.maxRetries > 0) {
    // 初始化重试计数
    if (item.retryCount === undefined) {
      item.retryCount = 0
    }

    // 如果未超过最大重试次数，自动重试
    if (item.retryCount < props.maxRetries) {
      item.retryCount++
      item.loaded = false // 重置加载状态

      // 延迟重试
      setTimeout(() => {
        // 触发重试逻辑
        emit('retry', { item, retryCount: item.retryCount })
      }, props.retryDelay)

      return
    }
  }

  // 更新加载状态
  updateLoadStatus()
}
```

### 5. 添加自动重试配置选项

在 `waterfall.vue` 的 props 中添加重试相关配置：

```typescript
// 组件属性定义
const props = withDefaults(defineProps<WaterfallProps>(), {
  ...defaultWaterfallProps,
  maxRetries: 1, // 最大重试次数
  retryDelay: 2000, // 重试延迟(ms)
  fallbackHeight: 200, // 加载失败时的备用高度
})
```

### 6. 创建使用示例

创建一个新的演示文件 `src/pages/components/waterfall/demo/ErrorHandling.vue`：

```vue
<template>
  <view>
    <waterfall :columns="2" :column-gap="10" :row-gap="10">
      <!-- 正常图片 -->
      <waterfall-item v-for="(item, index) in validImages" :key="index">
        <waterfall-image :src="item.url" />
      </waterfall-item>

      <!-- 错误图片 -->
      <waterfall-item
        v-for="(item, index) in invalidImages"
        :key="'err-' + index"
      >
        <waterfall-image :src="item.url" />
      </waterfall-item>
    </waterfall>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Waterfall, WaterfallItem } from 'sard-uniapp'
import WaterfallImage from '../../../../lib/components/waterfall-image/waterfall-image.vue'

// 有效图片
const validImages = ref([
  { url: 'https://picsum.photos/300/400' },
  { url: 'https://picsum.photos/300/300' },
  { url: 'https://picsum.photos/300/500' },
])

// 无效图片（会加载失败）
const invalidImages = ref([
  { url: 'https://invalid-domain.com/image1.jpg' },
  { url: 'https://example.com/non-existent-image.jpg' },
])
</script>
```

### 7. 增强 WaterfallLoad 组件

在 `waterfall-load.vue` 中也需要处理加载失败的情况：

```vue
<template>
  <view :class="waterfallLoadClass">
    <!-- 加载中状态 -->
    <view v-if="loading" class="sar-waterfall-load__loading">
      <view class="sar-loading sar-loading--circular"></view>
      <text class="sar-waterfall-load__text">{{ loadingText }}</text>
    </view>

    <!-- 加载失败状态 -->
    <view v-else-if="error" class="sar-waterfall-load__error" @tap="retry">
      <text class="sar-waterfall-load__text">{{ errorText }}</text>
    </view>

    <!-- 全部加载完成状态 -->
    <view v-else-if="finished" class="sar-waterfall-load__finished">
      <text class="sar-waterfall-load__text">{{ finishedText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
// 添加错误状态和重试方法
const error = ref(false)
const errorText = computed(() => props.errorText || '加载失败，点击重试')

// 重试方法
const retry = () => {
  if (error.value) {
    error.value = false
    loading.value = true
    emit('retry')
  }
}

// 暴露重试和错误设置方法
defineExpose({
  setError: (isError: boolean) => {
    error.value = isError
    loading.value = false
  },
  retry,
})
</script>
```

## 核心设计原则

### 1. 状态分离

- `loaded`: 表示加载过程是否结束（成功或失败）
- `loadSuccess`: 表示加载是否成功
- 这样可以区分"正在加载"、"加载成功"、"加载失败"三种状态

### 2. 布局稳定性

- 即使图片加载失败，也要触发 `load` 事件
- 使用预设尺寸或默认尺寸维持瀑布流布局
- 通过 `paddingTop` 技巧确保容器有正确的宽高比

### 3. 用户体验

- 提供清晰的加载状态指示
- 支持手动重试功能
- 自动重试机制（可配置）
- 优雅的错误状态展示

### 4. 性能考虑

- 避免无限重试导致的性能问题
- 使用节流控制重排频率
- 合理的重试延迟设置

## 配置选项

| 属性             | 类型      | 默认值 | 说明                 |
| ---------------- | --------- | ------ | -------------------- |
| `maxRetries`     | `number`  | `1`    | 最大自动重试次数     |
| `retryDelay`     | `number`  | `2000` | 重试延迟时间(ms)     |
| `fallbackHeight` | `number`  | `200`  | 加载失败时的备用高度 |
| `lazyLoad`       | `boolean` | `true` | 是否启用懒加载       |

## 事件

| 事件名  | 参数                                     | 说明                   |
| ------- | ---------------------------------------- | ---------------------- |
| `load`  | `{ detail: { width, height, success } }` | 加载完成（成功或失败） |
| `error` | `{ item, retryCount }`                   | 加载失败               |
| `retry` | `{ item, retryCount }`                   | 重试事件               |

## 最佳实践

### 1. 错误处理策略

```typescript
// 推荐：区分不同类型的错误
const onImageError = (error) => {
  if (error.code === 'NETWORK_ERROR') {
    // 网络错误，可以重试
    scheduleRetry()
  } else if (error.code === 'INVALID_URL') {
    // URL无效，不需要重试
    showFallback()
  }
}
```

### 2. 重试策略

```typescript
// 推荐：指数退避重试
const getRetryDelay = (retryCount) => {
  return Math.min(1000 * Math.pow(2, retryCount), 10000)
}
```

### 3. 用户反馈

```vue
<!-- 推荐：提供明确的用户反馈 -->
<view v-if="loadFailed" class="error-state">
  <text>图片加载失败</text>
  <button @tap="retry">重试</button>
  <button @tap="reportError">报告问题</button>
</view>
```

## 总结

通过以上改进，瀑布流组件将能够：

1. **优雅处理图片加载失败**：显示失败状态和重试按钮
2. **自动重试**：配置最大重试次数和延迟
3. **保持布局稳定**：即使图片加载失败，也能维持瀑布流布局
4. **提供良好的用户体验**：加载状态、失败状态和重试机制
5. **性能优化**：避免无限重试和频繁重排

这些改进使瀑布流组件更加健壮，能够应对实际生产环境中的各种情况，为用户提供更好的使用体验。
