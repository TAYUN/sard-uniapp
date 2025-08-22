<template>
  <!-- 瀑布流项目容器：绝对定位，通过 transform 控制位置 -->
  <view :class="waterfallItemClass" :style="waterfallItemStyle">
    <!-- 向子内容传递加载回调和列宽信息 -->
    <text class="item">{{ item.height.toFixed(2) }}</text>
    <!-- 适用于已知图片高度，如果传入了width,和height，就使用这个 -->
    <!-- <view v-if="$slots.image" :style="waterfallItemImageStyle">
      <slot
        name="image"
        :on-load="onLoad"
        :error-info="slotErrorInfo"
      ></slot>
    </view> -->

    <!-- 插槽内容，传递完整的错误处理信息 -->
    <slot
      :on-load="onLoad"
      :column-width="context.columnWidth"
      :image-height="context.columnWidth * ratio"
      :key="itemId"
      :error-info="slotErrorInfo"
    ></slot>
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
 * todo:
 * 简化item的属性
 * 添加错误处理支持受控和非受控功能
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
const props = withDefaults(defineProps<WaterfallItemProps>(), {
  errorHandlingMode: 'none', // 默认不处理
  retryCount: 2,
})

// 插槽定义
defineSlots<WaterfallItemSlots>()

// 事件定义
defineEmits<WaterfallItemEmits>()

// BEM 样式类名生成器
const bem = createBem('waterfall-item')

const currWidth = ref(props.width || 320)
const currHeight = ref(props.height || 240)

const ratio = computed(() => currHeight.value / currWidth.value)

// 图片加载重试次数
let retryCount = props.retryCount

// 最大等待时间（包括错误重试和占位图片加载失败的时间）也就是这个item要在maxWait毫秒内处理完成所有情况，否则跳过
const MAX_WAIT = props?.maxWait || 3000
const FALLBACK_HEIGHT = 200 // 异常默认高度

// 占位图片地址 - 可以修改为失败的地址来测试最终兜底方案
const fallbackImageSrc =
  Math.random() > 0.5
    ? 'https://sutras.github.io/sard-uniapp-docs//logo.svg'
    : 'https://sutras.github.io/sard-uniapp-docs//logoxxxx.svg'

let overtime = false

const { start: startTimeout } = useTimeout(async () => {
  if (!item.loaded && !overtime) {
    console.log('加载超时，启用兜底方案')
    overtime = true
    // 根据模式决定超时后的处理方式
    switch (props.errorHandlingMode) {
      case 'none':
        setStatus(ItemStatus.TIMEOUT, '加载超时')
        break

      case 'placeholder':
        setStatus(ItemStatus.TIMEOUT, '加载占位超时')
        break

      case 'retry':
        setStatus(ItemStatus.TIMEOUT, '重试超时')
        break

      case 'fallback':
        setStatus(ItemStatus.TIMEOUT, '加载超时')
        break
    }
    await item.updateHeight()
    item.loaded = true
  }
}, MAX_WAIT)

// ==================== 上下文通信 ====================

/**
 * 注入父组件提供的瀑布流上下文
 * 包含添加/移除项目、加载回调、列宽等信息
 */
const context = inject(waterfallContextKey)!
// 生成唯一的项目ID，用于DOM查询
let itemId = ref(uniqid())

// 如果是已知高度
const onLoadKnownSize = async () => {
  await item.updateHeight()
  item.loaded = true
  // 如果高度有问题，单独处理
  if (!item.height || item.heightError) {
    console.warn('项目高度异常，但仍标记为已加载')
  }
  // todo 如果已知高度也加载失败了呢
}
// 模式1：默认模式 - 失败就结束
const handleLoadFailure_None = async () => {
  setStatus(ItemStatus.FINAL_FALLBACK, '加载失败')
  await item.updateHeight()
  item.loaded = true
  console.log('item', item)
}

// 模式2：占位图模式 - 失败后直接显示占位图片
const handleLoadFailure_Placeholder = async () => {
  setStatus(ItemStatus.ORIGINAL_FAILED, '原始内容加载失败，显示占位图片')
  // 不设置 loaded = true，让占位图片的加载回调来处理
}

// 模式3：只重试模式 - 重试指定次数
const handleLoadFailure_Retry = async () => {
  retryCount--

  if (retryCount > 0) {
    // 还有重试次数，重新加载
    console.log(`重试加载，剩余次数: ${retryCount}`)
    await item.refreshImage(false)
  } else {
    // 重试次数用完，结束处理
    setStatus(ItemStatus.FINAL_FALLBACK, `重试${props.retryCount}次后仍然失败`)
    await item.updateHeight()
    item.loaded = true
  }
}

// 模式4：完整模式 - 原有的三层处理机制
const handleLoadFailure_Fallback = async () => {
  retryCount--

  if (retryCount > 0) {
    // 重试
    await item.refreshImage(false)
  } else {
    // 进入占位图片阶段
    setStatus(ItemStatus.ORIGINAL_FAILED, '原始内容加载失败')
  }
}
/**
 * 第一层：原始内容加载完成回调
 * 当项目内容（如图片）加载完成或失败时调用
 * 通知父组件进行重新布局
 */
const onLoad = async (event?: any) => {
  if (props.width && props.height) return
  if (overtime) return // 已超时，忽略后续加载事件

  item.loadSuccess = event?.type === 'load'

  // 检查是否加载成功
  if (item.loadSuccess) {
    // 加载成功：更新高度并完成
    setStatus(ItemStatus.NONE)
    await item.updateHeight()
    item.loaded = true
    // 如果高度有问题，单独处理
    if (!item.height || item.heightError) {
      console.warn('项目高度异常，但仍标记为已加载')
    }
    return
  }

  // 加载失败：根据模式处理
  switch (props.errorHandlingMode) {
    case 'none':
      // 默认模式：失败就结束，使用默认高度
      await handleLoadFailure_None()
      break

    case 'placeholder':
      await handleLoadFailure_Placeholder()
      break

    case 'retry':
      // 重试模式：重试指定次数后结束
      await handleLoadFailure_Retry()
      break

    case 'fallback':
      // 完整模式：重试 + 占位图 + 兜底
      await handleLoadFailure_Fallback()
      break
  }
}

/**
 * 第二层：占位图片加载成功
 */
const onFallbackLoad = async () => {
  // console.log('占位图片加载成功')
  // 占位图片加载成功，保持当前状态即可
  // errorType 保持为 'original-failed'，因为原始内容确实失败了

  if (overtime) return // 已超时，忽略后续加载事件
  setStatus(ItemStatus.PLACEHOLDER_SUCCESS, '占位图片加载成功')
  await item.updateHeight()
  item.loaded = true
}

/**
 * 第二层失败：占位图片也加载失败，进入第三层（文字兜底）
 */
const onFallbackError = async () => {
  // console.log('占位图片也加载失败，显示最终兜底方案')
  if (overtime) return // 已超时，忽略后续加载事件

  setStatus(ItemStatus.FINAL_FALLBACK, '占位图片也加载失败')
  // 最后显示最终兜底方案结束处理
  await item.updateHeight()
  item.loaded = true
}

/**
 * 更新项目高度
 * 通过 DOM 查询获取项目的实际渲染高度
 */

const updateHeight = async (flag = false) => {
  try {
    // 如果父级排版中断，停止获取dom信息
    if (context.isLayoutInterrupted) return
    await nextTick() // 很重要不然会导致获取高度错误
    // 查询 DOM 元素的边界信息，获取实际高度
    const rect = await getBoundingClientRect(`.${itemId.value}`, instance)
    if (!rect?.height || rect?.height === 0) {
      // console.log('rect', rect)
      item.height = FALLBACK_HEIGHT // 出错了，使用默认高度
      item.heightError = true // 设置特殊高度与默认240高度区别开，避免误伤正常240的情况
    } else {
      // 纯图片加载加载失败，图片容器可能也是240
      item.height = rect.height
      // console.log('rect.height', rect.height)
    }
  } catch (error) {
    // 查询失败时静默处理，避免报错
    console.error(error, `error高度获取失败，${item.height}`)

    // void 0
  } finally {
    // 移除已处理的项目
    if (flag) {
      item.loaded = true
    }
  }
}
/**
 * 重新加载图片
 * @param isReset 是否重置所有错误状态
 */
const refreshImage = async (isReset = true) => {
  // 重新加载图片，重置所有错误状态
  item.loaded = false
  item.loadSuccess = false
  item.heightError = false
  setStatus(ItemStatus.NONE)
  itemId.value = uniqid()
  // 重新启动超时计时器 todo 这里应该打开吗？需要使用参数控制是否重新启动定时器吗？
  if (isReset && props?.maxWait) {
    overtime = false
    startTimeout()
  }
}

// ==================== 项目信息管理 ====================

// 获取当前组件实例，用于DOM操作
const instance = getCurrentInstance()

// 错误状态枚举
const ItemStatus = {
  NONE: 'none',
  ORIGINAL_FAILED: 'original_failed',
  PLACEHOLDER_LOADING: 'placeholder_loading',
  PLACEHOLDER_SUCCESS: 'placeholder_success',
  TIMEOUT: 'timeout',
  FINAL_FALLBACK: 'final_fallback',
} as const

type ItemStatusType = (typeof ItemStatus)[keyof typeof ItemStatus]

// 单一真相源：错误状态
const errorState = shallowReactive({
  status: ItemStatus.NONE as ItemStatusType,
  message: '',
})
// 从 status 派生的布尔值（供内部使用和向下兼容）
// const showPlaceholder = computed(() => {
//   return errorState.status === ItemStatus.ORIGINAL_FAILED ||
//          errorState.status === ItemStatus.PLACEHOLDER_LOADING ||
//          errorState.status === ItemStatus.PLACEHOLDER_SUCCESS
// })

// const showFinalFallback = computed(() => {
//   return errorState.status === ItemStatus.FINAL_FALLBACK
// })

// const inErrorPhase = computed(() => {
//   return errorState.status !== ItemStatus.NONE &&
//          errorState.status !== ItemStatus.PLACEHOLDER_LOADING &&
//          errorState.status !== ItemStatus.PLACEHOLDER_SUCCESS
// })

// 设置状态的统一方法
const setStatus = (status: ItemStatusType, message = '') => {
  errorState.status = status
  errorState.message = message
}

// 语义化的 errorInfo slot 结构
const slotErrorInfo = computed(() => ({
  status: errorState.status,
  message: errorState.message,
  placeholder: {
    src: fallbackImageSrc,
    onLoad: onFallbackLoad,
    onError: onFallbackError,
  },
  actions: {
    retry: props.errorHandlingMode === 'retry' ? refreshImage : undefined,
    refreshImage: refreshImage,
  },
}))

// 为了向下兼容，映射新的状态模型到原有的 error-info slot 结构
// const slotErrorInfoLegacy = computed(() => ({
//   hasError: inErrorPhase.value,
//   showFallback: showFinalFallback.value,
//   errorType: errorState.status === ItemStatus.NONE ? 'none' :
//             errorState.status === ItemStatus.ORIGINAL_FAILED ? 'original-failed' :
//             errorState.status === ItemStatus.FINAL_FALLBACK ? 'fallback-failed' :
//             errorState.status === ItemStatus.TIMEOUT ? 'timeout' : 'none',
//   errorMessage: errorState.message,
// }))

/**
 * 项目信息对象（响应式）
 * 包含项目的所有状态信息，会被父组件用于布局计算
 */
const item = shallowReactive<WaterfallItemInfo>({
  loaded: false, // 是否加载完成（图片等资源）
  loadSuccess: false, // 是否加载成功
  visible: false, // 是否可见（由父组件控制）
  width: context.columnWidth, // 项目宽度（DOM 实际宽度）实际上和context.columnWidth相等
  heightError: false, // 是否高度异常
  height: 0, // 项目高度（DOM 实际高度）
  top: 0, // 垂直位置（由父组件计算）
  left: 0, // 水平位置（由父组件计算）
  index: props.index,
  // 三层错误处理状态
  // errorType: 'none', // 错误类型：none | original-failed | fallback-failed | timeout
  // errorMessage: '', // 错误信息
  // showPlaceholder: false, // 显示占位图片（第二层）
  // showFallback: false, // 显示最终兜底方案（第三层）
  updateHeight,
  refreshImage,
})

// ==================== 生命周期管理 ====================

/**
 * 组件挂载时：将自己注册到父组件的项目列表中，并启动超时计时器
 */
onMounted(async () => {
  context.addItem(item)

  // 判断是否开启固定宽度高度
  if (props.width && props.height) {
    onLoadKnownSize()
  }
  // 只有在 fallback 模式下才启动超时计时器
  if (props?.maxWait) {
    startTimeout()
  }
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
      start()
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
      // 高度
      // paddingTop: props?.width && props?.height ? paddingTop.value : '0',
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
// const waterfallItemImageStyle = computed(() => {
//   return stringifyStyle({
//     // 宽度：使用父组件计算的列宽
//     // width: context.columnWidth + 'px',
//     // 高度
//     paddingTop: props?.width && props?.height ? ratio.value * 100 + '%' : '0',
//   })
// })

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
</style>
