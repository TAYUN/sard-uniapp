import { type StyleValue } from 'vue'

export interface WaterfallItemProps {
  rootStyle?: StyleValue
  rootClass?: string
  index?: number
}

export interface WaterfallItemSlots {
  default?(props: { onLoad: () => void; columnWidth: number }): any
}

export interface WaterfallItemEmits {}

export interface WaterfallItemExpose {}

export interface WaterfallItemInfo {
  loaded: boolean // 是否完成加载过程（成功或失败）
  loadSuccess: boolean // 是否加载成功
  visible: boolean // 是否可见
  width: number // 项目宽度
  height: number // 项目高度
  top: number // 垂直位置
  left: number // 水平位置
  index?: number // 项目索引
  retryCount?: number // 重试次数
  beforeReflow: () => Promise<void> // 重排前的预处理
}
