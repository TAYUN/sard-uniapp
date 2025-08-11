<template>
  <view class="demo-container">
    <view class="demo-title">瀑布流占位图也失败的演示</view>
    <view class="demo-description">
      测试占位图也加载失败的情况，最终显示文字兜底方案
    </view>

    <sar-waterfall :columns="2" :column-gap="10" :row-gap="10">
      <sar-waterfall-item
        v-for="(item, index) in testList"
        :key="item.id"
        :index="index"
      >
        <template #default="{ onLoad, columnWidth }">
          <image
            :src="item.src"
            :style="{ width: columnWidth + 'px' }"
            mode="widthFix"
            @load="onLoad"
            @error="onLoad"
          />
        </template>
      </sar-waterfall-item>
    </sar-waterfall>

    <view class="test-info">
      <view class="info-title">测试说明：</view>
      <view class="info-item">• 所有图片都会加载失败</view>
      <view class="info-item">• 占位图片也设置为会失败的地址</view>
      <view class="info-item">• 最终应该显示"图片加载失败"文字</view>
      <view class="info-item">• 高度固定为150px</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 测试数据：所有图片都会失败
const testList = ref([
  {
    id: 1,
    src: 'https://invalid-domain-12345.com/image1.jpg',
  },
  {
    id: 2,
    src: 'https://invalid-domain-12345.com/image2.jpg',
  },
  {
    id: 3,
    src: 'https://invalid-domain-12345.com/image3.jpg',
  },
  {
    id: 4,
    src: 'https://invalid-domain-12345.com/image4.jpg',
  },
  {
    id: 5,
    src: 'https://invalid-domain-12345.com/image5.jpg',
  },
  {
    id: 6,
    src: 'https://invalid-domain-12345.com/image6.jpg',
  },
])
</script>

<style scoped>
.demo-container {
  padding: 20px;
}

.demo-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.demo-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
}

.test-info {
  margin-top: 30px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.info-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}

.info-item {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
  line-height: 1.4;
}
</style>
