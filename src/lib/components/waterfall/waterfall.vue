<template>
  <!-- 瀑布流容器：动态高度，包含所有瀑布流项目 -->
  <view :class="waterfallClass" :style="waterfallStyle">
    <slot></slot>
  </view>
</template>

<script setup lang="ts">
/**
 * 瀑布流组件 - 主容器组件
 *
 * 功能说明：
 * 1. 管理多列瀑布流布局
 * 2. 计算每个项目的位置（top, left）
 * 3. 监听项目加载状态，动态调整布局
 * 4. 提供上下文给子组件使用
 */

import {
  computed,
  getCurrentInstance,
  nextTick,
  onMounted,
  provide,
  reactive,
  ref,
  watch,
} from 'vue'
import {
  classNames,
  stringifyStyle,
  createBem,
  getBoundingClientRect,
  uniqid,
  throttle,
} from '../../utils'
import {
  type WaterfallProps,
  type WaterfallSlots,
  type WaterfallEmits,
  type WaterfallExpose,
  defaultWaterfallProps,
  waterfallContextKey,
} from './common'
import { type WaterfallItemInfo } from '../waterfall-item/common'
import { onHide, onShow } from '@dcloudio/uni-app'

// 组件配置：启用虚拟主机和样式隔离
defineOptions({
  options: {
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

// 组件属性定义
const props = withDefaults(defineProps<WaterfallProps>(), defaultWaterfallProps)

// 插槽定义
defineSlots<WaterfallSlots>()

// 事件定义
const emit = defineEmits<WaterfallEmits>()

// BEM 样式类名生成器
const bem = createBem('waterfall')

const isActive = ref(true)

// ==================== 容器尺寸管理 ====================

// 生成唯一的容器ID，用于DOM查询
const containerId = uniqid()
// 获取当前组件实例，用于DOM操作
const instance = getCurrentInstance()

// 容器宽度（响应式）
const containerWidth = ref(0)
// 容器高度（响应式，根据最高列计算）
const containerHeight = ref(0)

/**
 * 计算每列的宽度
 * 公式：(总宽度 - (列数-1) * 列间距) / 列数
 */
const columnWidth = computed(() => {
  return (
    (containerWidth.value - (props.columns - 1) * props.columnGap) /
    props.columns
  )
})

/**
 * 组件挂载后获取容器实际宽度
 */
onMounted(async () => {
  containerWidth.value = (
    await getBoundingClientRect(`.${containerId}`, instance)
  ).width
  // 初始化列高度状态
  initColumns()
})

// ==================== 加载状态管理 ====================

/**
 * 加载状态：
 * - 'idle': 空闲状态，所有项目都已加载完成
 * - 'busy': 忙碌状态，有项目正在加载中
 */
let loadStatus: 'idle' | 'busy' = 'idle'

/**
 * 加载完成后的回调函数队列
 * 当所有项目加载完成时，会依次执行这些回调
 */
let loadedHandlers: (() => void)[] = []

/**
 * 注册加载完成回调
 * @param handler 回调函数
 */
const onLoad = (handler: () => void) => {
  nextTick(() => {
    if (loadStatus === 'idle') {
      // 如果当前是空闲状态，立即执行回调
      handler()
    } else {
      // 如果正在加载中，将回调加入队列
      if (!loadedHandlers.includes(handler)) {
        loadedHandlers.push(handler)
      }
    }
  })
}

/**
 * 更新加载状态
 * 检查所有项目的加载状态，更新整体加载状态并触发相应事件
 */
const updateLoadStatus = () => {
  // 检查是否有未加载完成的项目
  const includeLoading = items.some((item) => !item.loaded)

  if (includeLoading) {
    // 有项目未加载完成
    if (loadStatus === 'idle') {
      loadStatus = 'busy'
      emit('loadstart') // 触发加载开始事件
    }
  } else {
    // 所有项目都已加载完成
    if (loadStatus === 'busy') {
      // 执行所有等待的回调函数
      loadedHandlers.forEach((handler) => handler())
      loadedHandlers = []

      loadStatus = 'idle'
      emit('load') // 触发加载完成事件
    }
  }
}

// ==================== 瀑布流项目管理 ====================

/**
 * 瀑布流项目列表
 * 存储所有子组件的信息，包括位置、尺寸、加载状态等
 */
const items: WaterfallItemInfo[] = []

/**
 * 待排版项目队列
 * 存储需要排版的项目，按顺序排版
 */
const pendingItems: WaterfallItemInfo[] = []

/**
 * 列高度状态管理
 * 直接维护每列的当前高度，避免重复计算
 * 使用 reactive 确保对象内部属性变化能触发响应式更新
 */
const columns = reactive<{ colIndex: number; height: number }[]>([])

/**
 * 初始化列高度状态
 */
const initColumns = () => {
  columns.length = 0 // 清空数组
  columns.push(
    ...Array(props.columns)
      .fill(0)
      .map((_, index) => ({ colIndex: index, height: 0 })),
  )
}

/**
 * 重置所有列的高度为0
 */
const resetColumnsHeight = () => {
  columns.forEach((column) => {
    column.height = 0
  })
}

/**
 * 获取当前最短的列（实时计算，避免异步问题）
 * 不使用计算属性，确保每次都能获取到最新的列状态
 */
const getMinColumn = () => {
  // if (columns.length === 0) return null

  let min = columns[0]
  for (let i = 1; i < columns.length; i++) {
    if (columns[i].height < min.height) {
      min = columns[i]
    }
  }
  return min
}
const minColumn = computed(() => getMinColumn())

/**
 * 添加瀑布流项目
 * 当子组件挂载时调用，将项目信息添加到列表中
 * @param item 项目信息对象
 */
const addItem = (item: WaterfallItemInfo) => {
  // 直接加入待排版队列
  if (!pendingItems.includes(item)) {
    pendingItems.push(item)
  }
}

/**
 * 移除瀑布流项目
 * 当子组件卸载时调用，从列表中移除项目信息
 * @param item 项目信息对象
 */
const removeItem = (item: WaterfallItemInfo) => {
  if (items.includes(item)) {
    items.splice(items.indexOf(item), 1)
    // todo 调度器重排后面的
    updateLoadStatus() // 更新加载状态
  }
}

// ==================== 瀑布流布局算法 ====================

/**
 * 处理排版队列
 * 从 pendingItems 队列中取出项目进行排版
 */
const processQueue = throttle(async () => {
  // 如果页面不活跃，暂停排版
  if (!isActive.value) {
    return
  }

  // 处理队列中的项目
  while (pendingItems.length > 0) {
    // 如果页面在排版过程中变为不活跃，停止排版
    if (!isActive.value) {
      break
    }

    const item = pendingItems[0] // 取队列第一个项目

    // 检查项目是否已加载
    // 没加载完，就等待加载完成 因为不管子项目加载成功还是加载失败，都会调设置loaded为true
    // 检查项目是否已加载
    if (!item.loaded) {
      // 创建一个 Promise 等待加载完成
      await new Promise<void>((resolve) => {
        // 创建一个监听器
        const unwatch = watch(
          () => item.loaded,
          (newLoaded) => {
            if (newLoaded) {
              unwatch() // 停止监听
              resolve() // 解决 Promise
            }
          },
        )

        // 设置超时，避免永久等待
        setTimeout(() => {
          unwatch()
          console.warn('项目加载超时，强制继续')
          resolve()
        }, 5000)
      })
    }

    try {
      // 执行项目的预处理（如获取尺寸）
      await item.beforeReflow()

      // 验证高度是否有效
      if (item.height <= 0) {
        console.warn('项目高度无效:', item.height, '跳过此项目')
        pendingItems.shift() // 移除无效项目
        continue
      }
    } catch (error) {
      console.error('获取项目尺寸失败:', error)
      // 如果获取尺寸失败，停止排版
      break
    }

    // 计算项目位置
    item.top = minColumn.value.height + props.rowGap
    item.left = (props.columnGap + columnWidth.value) * minColumn.value.colIndex
    item.visible = true // 设置为可见

    // 更新该列的高度
    columns[minColumn.value.colIndex].height = item.top + item.height
    // 从队列中移除已排版的项目
    pendingItems.shift()
    // 确保每个项目排版后都有一个微任务的间隔，避免竞态条件
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  // 计算容器总高度（取最高列的高度）
  containerHeight.value = Math.max(...columns.map((col) => col.height), 0)
}, 16) // 减少节流时间到 16ms（约 60fps），提高响应性

/**
 * 完整重新排版函数（仅在必要时使用）
 * 重新排版所有项目，用于列数变化等需要完全重新布局的场景
 */
const fullReflow = throttle(async () => {
  // 如果页面不活跃，暂停排版
  if (!isActive.value) {
    return
  }

  // 重置所有项目的可见状态
  items.forEach((item) => {
    item.visible = false
  })

  // 重置所有列的高度
  resetColumnsHeight()

  // 重新构建待排版队列
  pendingItems.length = 0
  pendingItems.push(...items)

  // todo 交给调度器排列
}, 50)

/**
 * 主排版函数
 * 根据情况选择增量排版或完整重排版
 */
const reflow = (force = true) => {
  if (force) {
    return fullReflow()
  } else {
    return processQueue()
  }
}

/**
 * 项目加载完成回调
 * 当子组件的内容（如图片）加载完成时调用
 */
const onItemLoad = () => {
  updateLoadStatus() // 更新加载状态
}

// ==================== 响应式监听 ====================

/**
 * 监听布局相关属性变化
 * 当列数、列间距、行间距发生变化时，需要完整重新排版
 */
watch([() => props.columns, () => props.columnGap, () => props.rowGap], () => {
  setTimeout(() => {
    // 列数变化时重新初始化列状态
    if (columns.length !== props.columns) {
      initColumns()
    }
    reflow(true) // 强制完整重排版
  }, 50) // 延迟执行，确保DOM更新完成
})

/**
 * 监听页面活跃状态变化
 * 当页面从不活跃变为活跃时，继续处理待排版的项目
 */
watch(
  () => isActive.value,
  (newActive, oldActive) => {
    if (newActive && !oldActive) {
      // 页面从不活跃变为活跃，继续处理待排版队列
      setTimeout(() => {
        // 交给调度器 排列
        reflow(false)
      }, 100) // 延迟执行，确保页面完全激活
    }
    // 页面变为不活跃时不需要特殊处理，processQueue 会自动停止
  },
  {
    immediate: true,
  },
)

onShow(() => {
  isActive.value = true
})

onHide(() => {
  isActive.value = false
})

// ==================== 上下文提供 ====================

/**
 * 向子组件提供瀑布流上下文
 * 子组件可以通过 inject 获取这些方法和数据
 */
provide(
  waterfallContextKey,
  reactive({
    addItem, // 添加项目方法
    removeItem, // 移除项目方法
    onItemLoad, // 项目加载完成回调
    columnWidth, // 列宽度（响应式）
  }),
)

// ==================== 组件暴露接口 ====================

/**
 * 暴露给父组件的方法
 * 父组件可以通过 ref 调用这些方法
 */
defineExpose<WaterfallExpose>({
  reflow, // 手动触发重排
  onLoad, // 注册加载完成回调
})

// ==================== 样式计算 ====================

/**
 * 计算容器的CSS类名
 * 包含BEM基础类名、唯一ID和用户自定义类名
 */
const waterfallClass = computed(() => {
  return classNames(bem.b(), containerId, props.rootClass)
})

/**
 * 计算容器的内联样式
 * 主要是动态设置容器高度
 */
const waterfallStyle = computed(() => {
  return stringifyStyle(
    {
      height: containerHeight.value + 'px', // 动态高度
    },
    props.rootStyle, // 用户自定义样式
  )
})
</script>

<style lang="scss">
@import './index.scss';
</style>
