<template>
  <view class="demo-container">
    <view class="demo-title">瀑布流真实失败处理演示</view>
    <view class="demo-description">
      测试真实的图片加载失败场景：原图失败 → 占位图 → 最终兜底文字
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
      <view class="info-item">• 正常图片：应该正常显示</view>
      <view class="info-item">• 失败图片：显示占位图片（高度150px）</view>
      <view class="info-item">• 占位图也失败：显示"图片加载失败"文字</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 测试数据：包含正常图片、会失败的图片、占位图也会失败的情况
const testList = ref([
  {
    id: 1,
    src: 'https://picsum.photos/200/300?random=1', // 正常图片
  },
  {
    id: 2,
    src: 'https://invalid-domain-12345.com/image1.jpg', // 会失败，但占位图正常
  },
  {
    id: 3,
    src: 'https://picsum.photos/200/400?random=3', // 正常图片
  },
  {
    id: 4,
    src: 'https://invalid-domain-12345.com/image2.jpg', // 会失败，但占位图正常
  },
  {
    id: 5,
    src: 'https://picsum.photos/200/350?random=5', // 正常图片
  },
  {
    id: 6,
    src: 'https://invalid-domain-12345.com/image3.jpg', // 会失败，但占位图正常
  },
  {
    id: 7,
    src: 'https://picsum.photos/200/280?random=7', // 正常图片
  },
  {
    id: 8,
    src: 'https://invalid-domain-12345.com/image4.jpg', // 会失败，但占位图正常
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
