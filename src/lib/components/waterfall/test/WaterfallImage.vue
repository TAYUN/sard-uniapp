<template>
  <view class="relative box-border" :style="{ paddingTop }">
    <!-- 图片元素 -->
    <image
      :src="src"
      class="absolute inset-0 w-full h-full"
      :class="imageClass"
      @load="onImageLoad"
      @error="onImageError"
      :mode="mode"
      :lazy-load="lazyLoad"
    />

    <!-- 加载中状态 -->
    <view
      v-if="loading"
      class="absolute inset-0 flex justify-center items-center sbg-fourth"
    >
      <view class="sar-loading sar-loading--circular"></view>
    </view>

    <!-- 加载失败状态 -->
    <view
      v-if="loadFailed"
      class="absolute inset-0 flex flex-col justify-center items-center sbg-fourth"
      @tap="retry"
    >
      <text class="text-gray-500 mb-2">加载失败</text>
      <text class="text-sm text-primary">点击重试</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
// import { classNames } from '../../utils'

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  width: {
    type: [Number, String],
    default: 0,
  },
  height: {
    type: [Number, String],
    default: 0,
  },
  mode: {
    type: String,
    default: 'aspectFill',
  },
  lazyLoad: {
    type: Boolean,
    default: true,
  },
  imageClass: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['load', 'error'])

// 状态管理
const loading = ref(true)
const loadFailed = ref(false)
const actualWidth = ref(props.width || 300)
const actualHeight = ref(props.height || 225)

// 计算宽高比例的 padding-top
const paddingTop = computed(() => {
  // 如果有明确的宽高，使用它们
  if (props.width && props.height) {
    return (Number(props.height) / Number(props.width)) * 100 + '%'
  }
  // 否则使用实际加载的宽高
  return (actualHeight.value / actualWidth.value) * 100 + '%'
})

// 图片加载成功
const onImageLoad = ({ detail }) => {
  loading.value = false
  loadFailed.value = false

  // 更新实际尺寸
  actualWidth.value = detail.width || actualWidth.value
  actualHeight.value = detail.height || actualHeight.value

  // 触发加载成功事件
  emit('load', {
    detail: {
      width: actualWidth.value,
      height: actualHeight.value,
      success: true,
    },
  })
}

// 图片加载失败
const onImageError = () => {
  loading.value = false
  loadFailed.value = true

  // 触发加载失败事件，但仍然提供尺寸信息
  emit('load', {
    detail: {
      width: actualWidth.value,
      height: actualHeight.value,
      success: false,
    },
  })
}

// 重试加载
const retry = () => {
  loading.value = true
  loadFailed.value = false

  // 创建一个新的图片URL（添加时间戳避免缓存）
  const newSrc = props.src.includes('?')
    ? `${props.src}&_t=${Date.now()}`
    : `${props.src}?_t=${Date.now()}`

  // 创建一个临时Image对象进行预加载
  const img = new Image()
  img.onload = (e) => {
    console.log(e)
    onImageLoad({
      detail: {
        width: img.width,
        height: img.height,
      },
    })
  }
  img.onerror = onImageError
  img.src = newSrc
}
</script>
