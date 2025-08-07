import { InjectionKey, type StyleValue } from 'vue'
import { defaultConfig } from '../config'
import { type WaterfallItemInfo } from '../waterfall-item/common'

export interface WaterfallProps {
  rootStyle?: StyleValue
  rootClass?: string
  columns?: number
  columnGap?: number
  rowGap?: number
  maxRetries?: number // 最大重试次数
  retryDelay?: number // 重试延迟(ms)
  fallbackHeight?: number // 加载失败时的备用高度
}

export const defaultWaterfallProps = defaultConfig.waterfall

export interface WaterfallSlots {
  default?(props: Record<string, never>): any
}

export interface WaterfallEmits {
  (e: 'load'): void
  (e: 'loadstart'): void
  // retry: (payload: { item: WaterfallItemInfo; retryCount: number }) => void
  (e: 'retry'): void
}

export interface WaterfallExpose {
  reflow: () => void // 增量重排（处理待排版队列）
  fullReflow: () => void // 完整重排（重置所有状态）
  onLoad: (handler: () => void) => void
}

export interface WaterfallContext {
  columnWidth: number
  addItem: (item: WaterfallItemInfo) => void
  removeItem: (item: WaterfallItemInfo) => void
  onItemLoad: (item: WaterfallItemInfo) => void
  isReflowing: boolean // 全局重排状态
}

export const waterfallContextKey = Symbol(
  'waterfall-context',
) as InjectionKey<WaterfallContext>
