<template>
  <!-- 瀑布流项目容器：绝对定位，通过 transform 控制位置 -->
  <view :class="waterfallItemClass" :style="waterfallItemStyle">
    <!-- 向子内容传递加载回调和列宽信息 -->
    <text class="item">{{ item.height.toFixed(2) }}</text>

    <!-- 正常内容 -->
    <slot
      v-if="!item.showFallback"
      :on-load="onLoad"
      :column-width="context.columnWidth"
      :key="itemId"
    ></slot>

    <!-- 失败后的占位图片 -->
    <view v-else-if="!item.showFinalFallback" class="fallback-container">
      <image
        :src="fallbackImageSrc"
        mode="aspectFill"
        class="fallback-image"
        @load="onFallbackLoad"
        @error="onFallbackError"
      />
    </view>

    <!-- 最终兜底方案：文字提示 -->
    <view v-else class="final-fallback">
      <text class="fallback-text">图片加载失败</text>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 瀑布流项目组件 - 单个项目容器
 *
 * 功能说明：
 * 1. 作为瀑布流中的单个项目容器
 * 2. 自动获取内容高度并报告给父组件
 * 3. 根据父组件计算的位置进行定位
 * 4. 提供加载完成回调给内容组件
 * 5. 支持平滑的显示动画效果
 */

import {
  computed,
  getCurrentInstance,
  inject,
  onMounted,
  onBeforeUnmount,
  // reactive,
  ref,
  watch,
  nextTick,
  shallowReactive,
} from 'vue'
import {
  classNames,
  stringifyStyle,
  createBem,
  uniqid,
  getBoundingClientRect,
} from '../../utils'
import {
  type WaterfallItemProps,
  type WaterfallItemSlots,
  type WaterfallItemEmits,
  type WaterfallItemExpose,
  type WaterfallItemInfo,
} from './common'
import { waterfallContextKey } from '../waterfall/common'
import { useTimeout } from '../../use'

// 组件配置：启用虚拟主机和样式隔离
defineOptions({
  options: {
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

// 组件属性定义
const props = withDefaults(defineProps<WaterfallItemProps>(), {})

// 插槽定义
defineSlots<WaterfallItemSlots>()

// 事件定义
defineEmits<WaterfallItemEmits>()

// BEM 样式类名生成器
const bem = createBem('waterfall-item')

// 图片加载重试次数
let retryCount = 2

// 最大等待时间（包括错误重试和占位图片加载失败的时间）也就是这个item要在maxWait毫秒内处理完成所有情况，否则跳过
// const maxWait = 1000

// 占位图片地址 - 可以修改为失败的地址来测试最终兜底方案
const fallbackImageSrc = 'https://wot-design-uni.cn/logo3hh.png'

let overtime = false

// const { start: startAwait } = useTimeout(() => {
//   if (!item.loaded) {
//     console.log('超时')
//     overtime = true
//     // 超时后直接跳到最终兜底方案
//     item.showFinalFallback = true
//     item.height = 150
//     item.loaded = true // 标记为已完成处理
//     context.onItemLoad(item)
//   }
// }, maxWait)

// ==================== 上下文通信 ====================

/**
 * 注入父组件提供的瀑布流上下文
 * 包含添加/移除项目、加载回调、列宽等信息
 */
const context = inject(waterfallContextKey)!
// 生成唯一的项目ID，用于DOM查询
let itemId = ref(uniqid())
/**
 * 加载完成回调
 * 当项目内容（如图片）加载完成或失败时调用
 * 通知父组件进行重新布局
 */
const onLoad = async (event?: any) => {
  if (overtime) return // 已超时，忽略后续加载事件
  retryCount--
  // 检查是否加载成功
  item.loadSuccess = event?.type === 'load'
  if (item.loadSuccess) {
    await item.beforeReflow()
  } else if (!item.loadSuccess && retryCount > 0) {
    console.log('重试', retryCount)
    await item.refreshImage()
  } else {
    // 原始内容加载失败，显示占位图片
    console.log('原始内容加载失败，显示占位图片')
    item.showFallback = true
    item.height = 150 // 设置固定高度
    item.loaded = true
  }
  if (item.loaded) {
    context.onItemLoad(item) // 传递项目信息给父组件
  }
}

/**
 * 占位图片加载成功
 */
const onFallbackLoad = () => {
  console.log('占位图片加载成功')
  // 占位图片加载成功，保持当前状态即可
}

/**
 * 占位图片也加载失败，显示最终兜底方案
 */
const onFallbackError = () => {
  console.log('占位图片也加载失败，显示最终兜底方案')
  item.showFinalFallback = true
  console.log('showFinalFallback', item.showFinalFallback)
}

// ==================== 项目信息管理 ====================

// 获取当前组件实例，用于DOM操作
const instance = getCurrentInstance()

/**
 * 项目信息对象（响应式）todo shallowReactive
 * 包含项目的所有状态信息，会被父组件用于布局计算
 */
const item = shallowReactive<WaterfallItemInfo>({
  loaded: false, // 是否加载完成（图片等资源）
  loadSuccess: false, // 是否加载成功
  visible: false, // 是否可见（由父组件控制）
  width: context.columnWidth, // 项目宽度（DOM 实际宽度）实际上和context.columnWidth相等
  height: 0, // 项目高度（DOM 实际高度）
  top: 0, // 垂直位置（由父组件计算）
  left: 0, // 水平位置（由父组件计算）
  index: props.index,
  // 失败处理状态
  showFallback: false, // 显示占位图片
  showFinalFallback: false, // 显示最终兜底方案
  beforeReflow: async () => {
    // 重排前的预处理：更新高度信息
    await updateHeight()
  },
  refreshImage: async () => {
    // 重新加载图片
    item.loaded = false
    item.showFallback = false
    item.showFinalFallback = false
    itemId.value = uniqid()
    // await item.beforeReflow()
  },
})

/**
 * 更新项目高度
 * 通过 DOM 查询获取项目的实际渲染高度
 */

const updateHeight = async () => {
  try {
    await nextTick() // 很重要不然会导致获取高度错误
    // await new Promise((resolve) => setTimeout(resolve, 100))
    // 查询 DOM 元素的边界信息，获取实际高度
    const rect = await getBoundingClientRect(`.${itemId.value}`, instance)
    if (overtime) return
    if (!rect?.height || rect?.height === 0) {
      item.height = 240.0000000000011 // 设置特殊高度与默认240高度区别开，避免误伤正常240的情况
      item.loaded = true
    } else {
      // 纯图片加载加载失败，图片容器可能也是240
      item.height = rect.height
      item.loaded = true
      // console.log('rect.height', rect.height)
    }
  } catch (error) {
    // 查询失败时静默处理，避免报错
    console.error(error, `error高度获取失败，${item.height}`)

    void 0
  }
}

// ==================== 生命周期管理 ====================

/**
 * 组件挂载时：将自己注册到父组件的项目列表中
 */
onMounted(() => {
  context.addItem(item)
  // startAwait()
})

/**
 * 组件卸载前：从父组件的项目列表中移除自己
 */
onBeforeUnmount(() => {
  context.removeItem(item)
})

// ==================== 动画效果管理 ====================

const laterVisible = ref(false)

const { start } = useTimeout(() => {
  laterVisible.value = true
}, 100)

watch(
  () => item.visible,
  () => {
    if (item.visible) {
      start() // 自动处理清理和重新设置
    } else {
      laterVisible.value = false
    }
  },
)

// ==================== 样式计算 ====================

/**
 * 计算项目的CSS类名
 * 包含：基础类名、显示状态类名、唯一ID、用户自定义类名
 */
const waterfallItemClass = computed(() => {
  return classNames(
    bem.b(), // 基础类名：sar-waterfall-item
    bem.m('show', item.visible || context.isReflowing), // 显示状态：重排时也保持可见
    bem.m('reflowing', context.isReflowing), // 重排状态类名
    itemId.value, // 唯一ID，用于DOM查询
    props.rootClass, // 用户自定义类名
  )
})

// const waterfallItemClass = computed(() => {
//   return classNames(
//     bem.b(),
//     bem.m('show', item.visible),
//     itemId,
//     props.rootClass,
//   )
// })

/**
 * 计算项目的内联样式
 * 包含：宽度、位置变换、过渡动画
 */
const waterfallItemStyle = computed(() => {
  return stringifyStyle(
    {
      // 宽度：使用父组件计算的列宽
      width: context.columnWidth + 'px',

      // 位置：使用 3D 变换进行定位（性能更好）
      transform: `translate3d(${item.left}px,${item.top}px,0px)`,

      // 过渡动画：根据延迟状态决定是否包含 transform 动画
      transition: laterVisible.value
        ? `opacity var(--sar-waterfall-duration) ease-out,transform var(--sar-waterfall-duration) ease-out` // 包含位置动画，使用缓出效果
        : `opacity var(--sar-waterfall-duration) ease-out`, // 仅包含透明度动画
    },
    props.rootStyle, // 用户自定义样式
  )
})

// ==================== 组件暴露接口 ====================

/**
 * 暴露给父组件的方法和属性
 * 当前为空，可根据需要扩展
 */
defineExpose<WaterfallItemExpose>({})
</script>

<style lang="scss">
@import './index.scss';
.item {
  position: absolute;
  // inset: 0;
  z-index: 9999;
  color: red;
}

.fallback-container {
  width: 100%;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.fallback-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.final-fallback {
  width: 100%;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border: 1px dashed #ddd;
}

.fallback-text {
  font-size: 14px;
  color: #999;
  text-align: center;
}
</style>
