import { ref, computed, watch, readonly, type Ref } from 'vue'
import { WaterfallManager, type ReflowParams, type LayoutItem } from '../utils/waterfall-reflow'

export interface WaterfallItem {
  id: string | number
  width: number
  height: number
  [key: string]: any
}

export interface UseWaterfallReflowOptions {
  containerWidth: Ref<number>
  columns: Ref<number>
  columnGap?: Ref<number>
  rowGap?: Ref<number>
  immediate?: boolean
}

export function useWaterfallReflow(options: UseWaterfallReflowOptions) {
  const {
    containerWidth,
    columns,
    columnGap = ref(10),
    rowGap = ref(10),
    immediate = true
  } = options

  const manager = new WaterfallManager()
  const layoutItems = ref<LayoutItem[]>([])
  const containerHeight = ref(0)
  const isInitialized = ref(false)

  // 响应式参数
  const params = computed<ReflowParams>(() => ({
    containerWidth: containerWidth.value,
    columns: columns.value,
    columnGap: columnGap.value,
    rowGap: rowGap.value
  }))

  // 执行重排
  const executeReflow = () => {
    if (!isInitialized.value) return

    const result = manager.updateParams(params.value)
    layoutItems.value = result.items
    containerHeight.value = result.containerHeight
  }

  // 监听参数变化自动重排
  if (immediate) {
    watch(params, executeReflow, { deep: true })
  }

  /**
   * 初始化瀑布流（第一次排版完成后调用）
   */
  const initialize = (items: WaterfallItem[]) => {
    manager.initSnapshot(items)
    isInitialized.value = true
    executeReflow()
  }

  /**
   * 手动触发重排
   */
  const reflow = () => {
    executeReflow()
  }

  /**
   * 插入新项目
   */
  const insertItem = (insertIndex: number, item: WaterfallItem) => {
    if (!isInitialized.value) {
      throw new Error('WaterfallManager not initialized. Call initialize() first.')
    }

    const result = manager.insertItem(insertIndex, item)
    layoutItems.value = result.items
    containerHeight.value = result.containerHeight
  }

  /**
   * 追加新项目到末尾
   */
  const appendItem = (item: WaterfallItem) => {
    if (!isInitialized.value) {
      throw new Error('WaterfallManager not initialized. Call initialize() first.')
    }

    const result = manager.appendItem(item)
    layoutItems.value = result.items
    containerHeight.value = result.containerHeight
  }

  /**
   * 删除项目
   */
  const removeItem = (itemId: string | number) => {
    if (!isInitialized.value) {
      throw new Error('WaterfallManager not initialized. Call initialize() first.')
    }

    const result = manager.removeItem(itemId)
    layoutItems.value = result.items
    containerHeight.value = result.containerHeight
  }

  /**
   * 替换项目
   */
  const replaceItem = (itemId: string | number, newItem: WaterfallItem) => {
    if (!isInitialized.value) {
      throw new Error('WaterfallManager not initialized. Call initialize() first.')
    }

    const result = manager.replaceItem(itemId, newItem)
    layoutItems.value = result.items
    containerHeight.value = result.containerHeight
  }

  /**
   * 批量操作
   */
  const batchUpdate = (operations: Array<{
    type: 'insert' | 'append' | 'remove' | 'replace'
    data: any
  }>) => {
    if (!isInitialized.value) {
      throw new Error('WaterfallManager not initialized. Call initialize() first.')
    }

    const result = manager.batchUpdate(operations)
    layoutItems.value = result.items
    containerHeight.value = result.containerHeight
  }

  /**
   * 获取当前快照信息
   */
  const getSnapshot = () => manager.getSnapshot()

  /**
   * 获取当前参数
   */
  const getParams = () => manager.getParams()

  return {
    // 状态
    layoutItems: readonly(layoutItems),
    containerHeight: readonly(containerHeight),
    isInitialized: readonly(isInitialized),

    // 方法
    initialize,
    reflow,
    insertItem,
    appendItem,
    removeItem,
    replaceItem,
    batchUpdate,
    getSnapshot,
    getParams
  }
}