/**
 * 无 DOM 二次测量的瀑布流动态重排方案
 * 核心思路：第一次排版后生成 snapshot，后续通过纯公式计算重排
 */

export interface SnapshotItem {
  id: string | number
  aspect: number // 原始宽高比 w/h
  order: number // 全局渲染顺序
}

export interface LayoutItem {
  id: string | number
  left: number
  top: number
  width: number
  height: number
}

export interface ReflowParams {
  containerWidth: number
  columns: number
  columnGap: number
  rowGap: number
}

export interface ReflowResult {
  items: LayoutItem[]
  containerHeight: number
}

/**
 * 核心重排算法 - 纯函数，无副作用
 */
export function reflow(
  snapshot: SnapshotItem[],
  params: ReflowParams,
): ReflowResult {
  const { containerWidth, columns, columnGap, rowGap } = params

  // 计算列宽
  const columnWidth = (containerWidth - (columns - 1) * columnGap) / columns

  // 初始化列高度数组
  const colHeights = new Array(columns).fill(0)

  // 按 order 排序后逐个排版
  const sortedSnapshot = [...snapshot].sort((a, b) => a.order - b.order)
  const items: LayoutItem[] = []

  for (const snap of sortedSnapshot) {
    // 找到最短列
    const shortestColIndex = colHeights.indexOf(Math.min(...colHeights))

    // 计算新尺寸
    const width = columnWidth
    const height = width / snap.aspect

    // 计算新坐标
    const left = shortestColIndex * columnWidth + shortestColIndex * columnGap
    const top =
      colHeights[shortestColIndex] +
      (colHeights[shortestColIndex] > 0 ? rowGap : 0)

    items.push({
      id: snap.id,
      left,
      top,
      width,
      height,
    })

    // 更新列高度
    colHeights[shortestColIndex] = top + height
  }

  return {
    items,
    containerHeight: Math.max(...colHeights),
  }
}

/**
 * 瀑布流管理器类
 */
export class WaterfallManager {
  private snapshot: SnapshotItem[] = []
  private params: ReflowParams = {
    containerWidth: 0,
    columns: 2,
    columnGap: 10,
    rowGap: 10,
  }

  /**
   * 初始化快照（第一次排版完成后调用）
   */
  initSnapshot(
    items: Array<{ id: string | number; width: number; height: number }>,
  ) {
    this.snapshot = items.map((item, index) => ({
      id: item.id,
      aspect: item.width / item.height,
      order: index,
    }))
  }

  /**
   * 更新布局参数并重排
   */
  updateParams(newParams: Partial<ReflowParams>): ReflowResult {
    this.params = { ...this.params, ...newParams }
    return reflow(this.snapshot, this.params)
  }

  /**
   * 插入新项目
   */
  insertItem(
    insertIndex: number,
    item: { id: string | number; width: number; height: number },
  ): ReflowResult {
    const newSnap: SnapshotItem = {
      id: item.id,
      aspect: item.width / item.height,
      order: insertIndex,
    }

    // 插入到指定位置
    this.snapshot.splice(insertIndex, 0, newSnap)

    // 重新编号 order
    this.snapshot.forEach((snap, index) => {
      snap.order = index
    })

    return reflow(this.snapshot, this.params)
  }

  /**
   * 追加新项目到末尾
   */
  appendItem(item: {
    id: string | number
    width: number
    height: number
  }): ReflowResult {
    return this.insertItem(this.snapshot.length, item)
  }

  /**
   * 删除项目
   */
  removeItem(itemId: string | number): ReflowResult {
    const index = this.snapshot.findIndex((snap) => snap.id === itemId)
    if (index === -1) {
      throw new Error(`Item with id ${itemId} not found`)
    }

    this.snapshot.splice(index, 1)

    // 重新编号 order
    this.snapshot.forEach((snap, index) => {
      snap.order = index
    })

    return reflow(this.snapshot, this.params)
  }

  /**
   * 替换项目
   */
  replaceItem(
    itemId: string | number,
    newItem: { id: string | number; width: number; height: number },
  ): ReflowResult {
    const index = this.snapshot.findIndex((snap) => snap.id === itemId)
    if (index === -1) {
      throw new Error(`Item with id ${itemId} not found`)
    }

    this.snapshot[index] = {
      id: newItem.id,
      aspect: newItem.width / newItem.height,
      order: index,
    }

    return reflow(this.snapshot, this.params)
  }

  /**
   * 批量操作（减少重排次数）
   */
  batchUpdate(
    operations: Array<{
      type: 'insert' | 'append' | 'remove' | 'replace'
      data: any
    }>,
  ): ReflowResult {
    for (const op of operations) {
      switch (op.type) {
        case 'insert':
          this.insertItemWithoutReflow(op.data.index, op.data.item)
          break
        case 'append':
          this.appendItemWithoutReflow(op.data.item)
          break
        case 'remove':
          this.removeItemWithoutReflow(op.data.itemId)
          break
        case 'replace':
          this.replaceItemWithoutReflow(op.data.itemId, op.data.newItem)
          break
      }
    }

    // 重新编号并重排
    this.snapshot.forEach((snap, index) => {
      snap.order = index
    })

    return reflow(this.snapshot, this.params)
  }

  /**
   * 获取当前快照（只读）
   */
  getSnapshot(): readonly SnapshotItem[] {
    return Object.freeze([...this.snapshot])
  }

  /**
   * 获取当前参数（只读）
   */
  getParams(): readonly ReflowParams {
    return Object.freeze({ ...this.params })
  }

  // 私有方法：不触发重排的操作
  private insertItemWithoutReflow(
    insertIndex: number,
    item: { id: string | number; width: number; height: number },
  ) {
    const newSnap: SnapshotItem = {
      id: item.id,
      aspect: item.width / item.height,
      order: insertIndex,
    }
    this.snapshot.splice(insertIndex, 0, newSnap)
  }

  private appendItemWithoutReflow(item: {
    id: string | number
    width: number
    height: number
  }) {
    this.insertItemWithoutReflow(this.snapshot.length, item)
  }

  private removeItemWithoutReflow(itemId: string | number) {
    const index = this.snapshot.findIndex((snap) => snap.id === itemId)
    if (index !== -1) {
      this.snapshot.splice(index, 1)
    }
  }

  private replaceItemWithoutReflow(
    itemId: string | number,
    newItem: { id: string | number; width: number; height: number },
  ) {
    const index = this.snapshot.findIndex((snap) => snap.id === itemId)
    if (index !== -1) {
      this.snapshot[index] = {
        id: newItem.id,
        aspect: newItem.width / newItem.height,
        order: index,
      }
    }
  }
}
