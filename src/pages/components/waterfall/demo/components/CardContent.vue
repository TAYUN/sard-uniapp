<template>
  <view class="card-content" v-if="data">
    <image class="card-image" :src="data.imageUrl" mode="widthFix" />
    <view class="card-body">
      <text class="card-title">{{ data.title }}</text>
      <text class="card-description">{{ data.description }}</text>
      <view class="card-tags">
        <text v-for="(tag, index) in data.tags" :key="index" class="card-tag">
          {{ tag }}
        </text>
      </view>
      <view class="card-footer">
        <text class="card-author">{{ data.author }}</text>
        <view class="card-stats">
          <text class="card-likes">❤️ {{ data.likes }}</text>
          <text class="card-comments">💬 {{ data.comments }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
interface CardData {
  id: string
  title: string
  description: string
  imageUrl: string
  tags: string[]
  author: string
  date: string
  likes: number
  comments: number
}

defineProps<{
  data?: CardData
}>()
</script>

<style lang="scss" scoped>
.card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-image {
  width: 100%;
  background: #f0f0f0;
}

.card-body {
  padding: 20rpx;
  flex: 1;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
  line-height: 1.3;
}

.card-description {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
  display: block;
  margin-bottom: 15rpx;
}

.card-tags {
  display: flex;
  gap: 8rpx;
  margin-bottom: 15rpx;
  flex-wrap: wrap;
}

.card-tag {
  font-size: 20rpx;
  color: #007aff;
  background: rgba(0, 122, 255, 0.1);
  padding: 4rpx 8rpx;
  border-radius: 4rpx;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-author {
  font-size: 24rpx;
  color: #999;
}

.card-stats {
  display: flex;
  gap: 15rpx;
}

.card-likes,
.card-comments {
  font-size: 22rpx;
  color: #666;
}
</style>
