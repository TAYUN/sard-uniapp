import { type StyleValue } from 'vue'

export interface WaterfallItemProps {
  rootStyle?: StyleValue
  rootClass?: string
  index?: number
  maxWait?: number
  width?: number
  height?: number
  /**
   * 失败处理模式
   * - 'placeholder': 显示占位符（默认）
   * - 'error-image': 显示错误图片
   * - 'retry-tip': 显示重试提示
   * - 'hide': 隐藏项目
   */
  failureMode?: 'placeholder' | 'error-image' | 'retry-tip' | 'hide'
  /**
   * 失败时的回退高度
   */
  fallbackHeight?: number
  /**
   * 错误图片地址
   */
  errorImageSrc?: string
}

export interface WaterfallItemSlots {
  default?(props: {
    onLoad: () => void
    columnWidth: number
    imageHeight: number
    key: string
    errorInfo: {
      hasError: boolean
      showFallback: boolean
      errorType: 'none' | 'original-failed' | 'fallback-failed' | 'timeout'
      errorMessage: string
      fallbackImageSrc: string
      onFallbackLoad: () => void
      onFallbackError: () => void
    }
  }): any
  image?(props: {
    onLoad: () => void
    columnWidth?: number
    key?: string
    errorInfo?: {
      hasError: boolean
      showFallback: boolean
      errorType: 'none' | 'original-failed' | 'fallback-failed' | 'timeout'
      errorMessage: string
      fallbackImageSrc: string
      onFallbackLoad: () => void
      onFallbackError: () => void
    }
  }): any
}

export interface WaterfallItemEmits {}

export interface WaterfallItemExpose {}

export interface WaterfallItemInfo {
  loaded: boolean // 是否完成加载过程（成功或失败）
  loadSuccess: boolean // 是否加载成功
  visible: boolean // 是否可见
  width: number // 项目宽度
  heightError: boolean // 高度是否异常
  height: number // 项目高度
  top: number // 垂直位置
  left: number // 水平位置
  index?: number // 项目索引
  retryCount?: number // 重试次数
  updateHeight: (a?: boolean) => Promise<void> // 重排前的预处理
  refreshImage: (a?: boolean) => Promise<void> // 重排前的预处理
  // 三层错误处理状态
  errorType: 'none' | 'original-failed' | 'fallback-failed' | 'timeout' // 错误类型
  errorMessage: string // 错误信息
  showPlaceholder: boolean // 显示占位图片（第二层）
  showFallback: boolean // 显示最终兜底方案（第三层）
}
