<template>
  <!-- 瀑布流项目容器：绝对定位，通过 transform 控制位置 -->
  <view :class="waterfallItemClass" :style="waterfallItemStyle">
    <!-- 向子内容传递加载回调和列宽信息 -->
    <slot :on-load="onLoad" :column-width="context.columnWidth"></slot>
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
  reactive,
  ref,
  watch,
  nextTick,
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

// ==================== 项目信息管理 ====================

// 获取当前组件实例，用于DOM操作
const instance = getCurrentInstance()
// 生成唯一的项目ID，用于DOM查询
const itemId = uniqid()

/**
 * 项目信息对象（响应式）
 * 包含项目的所有状态信息，会被父组件用于布局计算
 */
const item = reactive<WaterfallItemInfo>({
  loaded: false, // 是否加载完成（图片等资源）
  loadSuccess: false, // 是否加载成功
  visible: false, // 是否可见（由父组件控制）
  height: 0, // 项目高度（DOM 实际高度）
  top: 0, // 垂直位置（由父组件计算）
  left: 0, // 水平位置（由父组件计算）
  index: props.index,
  beforeReflow: async () => {
    // 重排前的预处理：更新高度信息
    await updateHeight()
  },
})

/**
 * 更新项目高度
 * 通过 DOM 查询获取项目的实际渲染高度
 */
const updateHeight = async () => {
  try {
    await nextTick() // 很重要不然会导致获取高度错误
    // 查询 DOM 元素的边界信息，获取实际高度
    const rect = await getBoundingClientRect(`.${itemId}`, instance)
    item.height = rect.height === 0 ? 1 : rect.height
    if (rect.height === 0 || !rect.height) {
      item.height = 240 // todo 设置默认高度
    } else {
      item.height = rect.height
    }
    item.loaded = true
  } catch {
    // 查询失败时静默处理，避免报错
    void 0
  }
}

// ==================== 上下文通信 ====================

/**
 * 注入父组件提供的瀑布流上下文
 * 包含添加/移除项目、加载回调、列宽等信息
 */
const context = inject(waterfallContextKey)!

/**
 * 加载完成回调
 * 当项目内容（如图片）加载完成或失败时调用
 * 通知父组件进行重新布局
 */
const onLoad = async (event?: any) => {
  // 检查是否加载成功
  item.loadSuccess = event?.type === 'load'

  await item.beforeReflow()

  context.onItemLoad(item) // 传递项目信息给父组件
}

// ==================== 生命周期管理 ====================

/**
 * 组件挂载时：将自己注册到父组件的项目列表中
 */
onMounted(() => {
  context.addItem(item)
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
    itemId, // 唯一ID，用于DOM查询
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
</style>
