<template>
  <view :class="waterfallLoadClass" :style="waterfallLoadStyle">
    <view :class="bem.e('content')">
      <slot :on-load="onLoad" :overtime="overtime"></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { classNames, createBem, stringifyStyle } from '../utils'
import {
  type WaterfallLoadProps,
  type WaterfallLoadSlots,
  type WaterfallLoadEmits,
  type WaterfallLoadExpose,
} from '../types/waterfall-load'
import { useTimeout } from '../utils'

defineOptions({
  options: {
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const props = withDefaults(defineProps<WaterfallLoadProps>(), {})

defineSlots<WaterfallLoadSlots>()

const emit = defineEmits<WaterfallLoadEmits>()

const bem = createBem('waterfall-load')

// main
let loaded = false

const overtime = ref(false)

const currWidth = ref(props.width || 320)
const currHeight = ref(props.height || 240)

const paddingTop = computed(
  () => (currHeight.value / currWidth.value) * 100 + '%',
)

const { start } = useTimeout(
  () => {
    if (!loaded) {
      overtime.value = true
      // emit('load', { width: 0, height: 0, type: 'error' }) // 这里不必向上汇报
    }
  },
  () => props.maxWait || 0,
)

const onLoad = ({ detail }: any) => {
  void detail
  loaded = true // 图片加载状态
  // if (!overtime.value) {
  //   if (detail.width) {
  //     currWidth.value = detail.width
  //     currHeight.value = detail.height
  //   }
  //   emit('load', { detail, type: 'load' })
  // }
}

onMounted(() => {
  start()
  // 已知宽高，应该触发成功
  emit('load', {
    width: currWidth.value,
    height: currHeight.value,
    type: 'load',
  })
})

// others
defineExpose<WaterfallLoadExpose>({})

const waterfallLoadClass = computed(() => {
  return classNames(bem.b(), props.rootClass)
})

const waterfallLoadStyle = computed(() => {
  return stringifyStyle(
    {
      paddingTop: paddingTop.value,
    },
    props.rootStyle,
  )
})
</script>

<style lang="scss">
@import '../styles/waterfall-load.scss';
</style>
