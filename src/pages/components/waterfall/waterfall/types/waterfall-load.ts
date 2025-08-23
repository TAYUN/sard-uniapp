import { type StyleValue } from 'vue'

export interface WaterfallLoadProps {
  rootStyle?: StyleValue
  rootClass?: string
  maxWait?: number
  width?: number
  height?: number
}

export interface WaterfallLoadSlots {
  default?(props: { onLoad: (event: any) => void; overtime: boolean }): any
}
export interface ImageLoadEvent {
  type: 'load' | 'error'
  detail: {
    width: number
    height: number
  }
}
export interface WaterfallLoadEmits {
  (e: 'load', event: any): void
}

export interface WaterfallLoadExpose {}
