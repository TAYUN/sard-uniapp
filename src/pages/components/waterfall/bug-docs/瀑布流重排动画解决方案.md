# 瀑布流重排动画解决方案

## 问题描述

原始问题：瀑布流重排时，所有项目几乎同时从 `visible: false` 变为 `visible: true`，然后同时启动 100ms 延迟，导致动画效果不明显。

## 解决方案

### 1. 错开动画时间

**核心思路**：为每个项目设置不同的动画延迟时间，创建波浪式的入场效果。

**实现方式**：

- 在 `processQueue` 函数中，为每个项目计算动画延迟
- 基于处理顺序和列位置计算延迟时间
- 使用 `setTimeout` 控制项目的可见性时机

```typescript
// 设置动画延迟，基于处理顺序和列位置
const baseDelay = processedCount * 20 // 基础延迟：每个项目20ms
const columnDelay = targetColumnIndex * 10 // 列延迟：不同列稍微错开
item.animationDelay = baseDelay + columnDelay

// 延迟设置可见状态，创建错开的动画效果
setTimeout(
  () => {
    item.visible = true
  },
  Math.min(item.animationDelay || 0, 500),
) // 最大延迟不超过500ms
```

### 2. 优化动画效果

**视觉改进**：

- 初始状态：向下偏移30px，缩放到0.9
- 最终状态：正常位置，缩放到1.0
- 使用 cubic-bezier 缓动函数，创建更自然的动画

```scss
@include bem(waterfall-item) {
  @include b() {
    opacity: 0;
    transform: translateY(30px) scale(0.9); // 初始状态
    transition:
      opacity var(--sar-waterfall-duration) cubic-bezier(0.25, 0.46, 0.45, 0.94),
      transform var(--sar-waterfall-duration)
        cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  @include m(show) {
    opacity: 1;
    transform: translateY(0) scale(1); // 最终状态
  }
}
```

### 3. 动画时间配置

**持续时间**：0.4s（相比原来的0.3s更流畅）
**延迟计算**：

- 基础延迟：每个项目20ms
- 列延迟：每列额外10ms
- 最大延迟：500ms（避免过长等待）

### 4. 代码结构优化

**类型定义更新**：

```typescript
export interface WaterfallItemInfo {
  // ... 其他属性
  animationDelay?: number // 动画延迟时间（毫秒）
}
```

**组件逻辑分离**：

- 父组件（waterfall.vue）：负责计算延迟时间和控制显示时机
- 子组件（waterfall-item.vue）：负责动画效果的具体实现

### 5. 演示页面

创建了专门的动画演示页面 `ReflowAnimation.vue`，包含：

- 列数切换按钮（2列、3列、4列）
- 手动重排按钮
- 美化的项目卡片样式
- 实时动画效果展示

## 效果特点

1. **波浪式入场**：项目按处理顺序依次出现，形成流畅的波浪效果
2. **列间错开**：不同列的项目有轻微的时间差，增加视觉层次
3. **自然缓动**：使用 cubic-bezier 缓动函数，动画更自然
4. **性能优化**：最大延迟限制，避免过长的等待时间
5. **响应式适配**：支持不同列数的动态切换

## 使用方式

```vue
<template>
  <sar-waterfall :columns="columns" @load="onLoad">
    <sar-waterfall-item
      v-for="(item, index) in list"
      :key="index"
      :index="index"
    >
      <template #default="{ onLoad }">
        <!-- 项目内容 -->
      </template>
    </sar-waterfall-item>
  </sar-waterfall>
</template>
```

## 技术要点

1. **时间控制**：通过 `setTimeout` 精确控制每个项目的显示时机
2. **状态管理**：使用响应式数据管理项目的可见性和动画状态
3. **性能考虑**：限制最大延迟时间，避免影响用户体验
4. **兼容性**：支持多端（H5、小程序、APP）的动画效果

这个解决方案有效解决了原始问题，创建了流畅、自然的瀑布流重排动画效果。
