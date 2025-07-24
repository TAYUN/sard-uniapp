<template>
  <!-- 瀑布流容器：动态高度，包含所有瀑布流项目 -->
  <view :class="waterfallClass" :style="waterfallStyle">
    <slot></slot>
  </view>
</template>

<script setup lang="ts">
/**
 * 瀑布流组件 - 优化版本
 *
 * 核心优化：
 * 1. 使用快照 + 纯公式重排，避免 DOM 二次测量
 * 2. 支持动态插入/删除项目
 * 3. 毫秒级重排性能
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
import {
  useWaterfallReflow,
  type WaterfallItem,
} from '../../use/use-waterfall-reflow'
import { onHide, onShow } from '@dcloudio/uni-app'

// 组件配置
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

const containerId = uniqid()
const instance = getCurrentInstance()
const containerWidth = ref(0)

// 使用优化的重排 hook
const {
  layoutItems,
  containerHeight,
  isInitialized,
  initialize,
  reflow: reflowOptimized,
  appendItem,
  insertItem,
  removeItem: removeItemOptimized,
  batchUpdate,
} = useWaterfallReflow({
  containerWidth,
  columns: computed(() => props.columns),
  columnGap: computed(() => props.columnGap),
  rowGap: computed(() => props.rowGap),
})

/**
 * 组件挂载后获取容器实际宽度
 */
onMounted(async () => {
  containerWidth.value = (
    await getBoundingClientRect(`.${containerId}`, instance)
  ).width
})

// ==================== 加载状态管理 ====================

let loadStatus: 'idle' | 'busy' = 'idle'
const isReflowing = ref(false)
let loadedHandlers: (() => void)[] = []

const onLoad = (handler: () => void) => {
  nextTick(() => {
    if (loadStatus === 'idle') {
      handler()
    } else {
      if (!loadedHandlers.includes(handler)) {
        loadedHandlers.push(handler)
      }
    }
  })
}

const updateLoadStatus = () => {
  if (pendingItems.length === 0) {
    loadedHandlers.forEach((handler) => handler())
    loadedHandlers = []
    loadStatus = 'idle'
    emit('load')
  } else {
    loadStatus = 'busy'
    emit('loadstart')
  }
}

// ==================== 瀑布流项目管理 ====================

const items: WaterfallItemInfo[] = []
const pendingItems: WaterfallItemInfo[] = []

// 项目ID到布局信息的映射
const itemLayoutMap = new Map<
  string | number,
  {
    left: number
    top: number
    width: number
    height: number
  }
>()

/**
 * 添加瀑布流项目
 */
const addItem = (item: WaterfallItemInfo) => {
  pendingItems.push(item)
  items.push(item)
}

/**
 * 移除瀑布流项目
 */
const removeItem = (item: WaterfallItemInfo) => {
  if (items.includes(item)) {
    const index = items.indexOf(item)
    items.splice(index, 1)

    // 从优化重排系统中移除
    if (isInitialized.value && item.id) {
      removeItemOptimized(item.id)
    }
  }
}

// ==================== 布局同步 ====================

/**
 * 将优化重排的结果同步到传统项目系统
 */
const syncLayoutToItems = () => {
  // 更新映射表
  itemLayoutMap.clear()
  layoutItems.value.forEach((layoutItem) => {
    itemLayoutMap.set(layoutItem.id, {
      left: layoutItem.left,
      top: layoutItem.top,
      width: layoutItem.width,
      height: layoutItem.height,
    })
  })

  // 同步到传统项目系统
  items.forEach((item) => {
    if (item.id && itemLayoutMap.has(item.id)) {
      const layout = itemLayoutMap.get(item.id)!
      item.left = layout.left
      item.top = layout.top
      // width 由 columnWidth 计算属性提供
      // height 保持原有逻辑
    }
  })
}

// 监听布局变化，同步到传统系统
watch(layoutItems, syncLayoutToItems, { deep: true })

// ==================== 瀑布流布局算法 ====================

/**
 * 处理排版队列 - 优化版本
 */
const processQueue = async () => {
  if (!isActive.value) return

  updateLoadStatus()

  // 收集已加载完成的项目
  const loadedItems: WaterfallItem[] = []

  // 处理队列中的项目
  for (let i = pendingItems.length - 1; i >= 0; i--) {
    const item = pendingItems[i]

    if (item.loaded && item.width && item.height) {
      // 项目已加载完成，添加到优化系统
      loadedItems.push({
        id: item.id || `item-${Date.now()}-${Math.random()}`,
        width: item.width,
        height: item.height,
      })

      // 从待处理队列中移除
      pendingItems.splice(i, 1)

      // 设置项目可见
      setTimeout(() => {
        item.visible = true
      }, item.animationDelay || 0)
    }
  }

  // 如果有新加载的项目，更新优化系统
  if (loadedItems.length > 0) {
    if (!isInitialized.value) {
      // 首次初始化
      initialize(loadedItems)
    } else {
      // 批量添加新项目
      batchUpdate(
        loadedItems.map((item) => ({
          type: 'append' as const,
          data: { item },
        })),
      )
    }
  }

  updateLoadStatus()
}

/**
 * 完整重新排版函数 - 优化版本
 */
const fullReflow = async () => {
  if (!isActive.value) return

  isReflowing.value = true

  // 重置所有项目状态
  items.forEach((item) => {
    item.visible = false
    item.loaded = false
    item.animationDelay = 0
    item.beforeReflow()
  })

  // 重建待排版队列
  pendingItems.length = 0
  pendingItems.push(...items)

  // 等待项目重新加载后处理
  setTimeout(() => {
    processQueue()
    isReflowing.value = false
  }, 100)
}

/**
 * 平滑重排函数 - 优化版本
 */
const smoothReflow = async () => {
  if (!isActive.value) return

  isReflowing.value = true

  // 如果已初始化，直接触发优化重排
  if (isInitialized.value) {
    reflowOptimized()
  }

  setTimeout(() => {
    isReflowing.value = false
  }, 300)
}

/**
 * 初始重排函数
 */
const initialReflow = async () => {
  if (!isActive.value) return

  // 重建待排版队列
  pendingItems.length = 0
  items.forEach((item) => {
    item.visible = false
    item.loaded = false
    item.beforeReflow()
  })
  pendingItems.push(...items)

  processQueue()
}

/**
 * 主排版函数
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
 */
const onItemLoad = (item: WaterfallItemInfo) => {
  // 触发队列处理
  processQueue()
}

// ==================== 响应式监听 ====================

/**
 * 监听布局相关属性变化
 */
watch(
  [() => props.columns, () => props.columnGap, () => props.rowGap],
  (newValues, oldValues) => {
    const [newColumns] = newValues
    const [oldColumns] = oldValues || []

    setTimeout(() => {
      if (oldColumns && oldColumns !== newColumns) {
        // 列数变化，使用平滑重排
        smoothReflow()
      } else {
        // 初始化或其他情况
        const hasVisibleItems = items.some((item) => item.visible)
        if (hasVisibleItems) {
          smoothReflow()
        } else {
          initialReflow()
        }
      }
    }, 50)
  },
)

/**
 * 监听页面活跃状态变化
 */
watch(
  () => isActive.value,
  (newActive, oldActive) => {
    if (newActive && !oldActive) {
      setTimeout(() => {
        reflow(false)
      }, 100)
    }
  },
  { immediate: true },
)

onShow(() => {
  isActive.value = true
})

onHide(() => {
  isActive.value = false
})

// ==================== 上下文提供 ====================

/**
 * 计算列宽度 - 兼容传统系统
 */
const columnWidth = computed(() => {
  return (
    (containerWidth.value - (props.columns - 1) * props.columnGap) /
    props.columns
  )
})

provide(
  waterfallContextKey,
  reactive({
    addItem,
    removeItem,
    onItemLoad,
    columnWidth,
    isReflowing,
  }),
)

// ==================== 组件暴露接口 ====================

defineExpose<WaterfallExpose>({
  reflow,
  fullReflow,
  smoothReflow,
  initialReflow,
  onLoad,
})

// ==================== 样式计算 ====================

const waterfallClass = computed(() => {
  return classNames(bem.b(), containerId, props.rootClass)
})

const waterfallStyle = computed(() => {
  return stringifyStyle(
    {
      height: containerHeight.value + 'px',
    },
    props.rootStyle,
  )
})
</script>

<style lang="scss">
@import './index.scss';
</style>
