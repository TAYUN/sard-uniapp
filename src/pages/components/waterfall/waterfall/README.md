# 瀑布流组件 (Waterfall Component)

从 sard-uniapp 项目中提取的独立瀑布流组件，支持 Vue 3 和 uni-app。

## 功能特性

- 🌊 **多列瀑布流布局** - 支持自定义列数和间距
- 🎯 **智能定位** - 自动计算每个项目的最佳位置
- 🔄 **动态加载** - 支持懒加载和无限滚动
- 🎨 **平滑动画** - 内置优雅的显示动画效果
- 🛠️ **错误处理** - 完善的图片加载错误处理机制
- 📱 **响应式** - 适配不同屏幕尺寸
- ⚡ **高性能** - 优化的渲染性能和内存使用

## 安装使用

### 1. 复制组件文件

将整个 `waterfall` 目录复制到你的项目中。

### 2. 引入样式

在你的主样式文件中引入：

```scss
@import './waterfall/styles/index.scss';
```

### 3. 注册组件

```typescript
import Waterfall from './waterfall/components/waterfall.vue'
import WaterfallItem from './waterfall/components/waterfall-item.vue'
import WaterfallLoad from './waterfall/components/waterfall-load.vue'
```

## 基本用法

```vue
<template>
  <sar-waterfall :columns="2" :column-gap="16" :row-gap="16" @load="onLoad">
    <sar-waterfall-item v-for="item in items" :key="item.id" :item="item">
      <image :src="item.image" @load="onImageLoad" @error="onImageError" />
    </sar-waterfall-item>

    <sar-waterfall-load v-if="hasMore" @load="loadMore">
      <text>加载更多...</text>
    </sar-waterfall-load>
  </sar-waterfall>
</template>

<script setup>
import { ref } from 'vue'

const items = ref([])
const hasMore = ref(true)

const onLoad = () => {
  // 瀑布流容器加载完成
}

const onImageLoad = (event) => {
  // 图片加载完成
}

const onImageError = (event) => {
  // 图片加载失败
}

const loadMore = () => {
  // 加载更多数据
}
</script>
```

## 组件 API

### Waterfall Props

| 属性           | 类型   | 默认值 | 说明           |
| -------------- | ------ | ------ | -------------- |
| columns        | number | 2      | 列数           |
| columnGap      | number | 16     | 列间距（px）   |
| rowGap         | number | 16     | 行间距（px）   |
| maxRetries     | number | 3      | 最大重试次数   |
| retryDelay     | number | 1000   | 重试延迟（ms） |
| fallbackHeight | number | 200    | 备用高度（px） |

### Waterfall Events

| 事件       | 参数  | 说明         |
| ---------- | ----- | ------------ |
| load       | -     | 容器加载完成 |
| item-load  | item  | 项目加载完成 |
| item-error | error | 项目加载失败 |

### WaterfallItem Props

| 属性              | 类型   | 默认值 | 说明         |
| ----------------- | ------ | ------ | ------------ |
| item              | object | -      | 项目数据     |
| errorHandlingMode | string | 'none' | 错误处理模式 |

### WaterfallLoad Props

| 属性    | 类型   | 默认值 | 说明           |
| ------- | ------ | ------ | -------------- |
| width   | number | 320    | 宽度           |
| height  | number | 240    | 高度           |
| timeout | number | 5000   | 超时时间（ms） |

## 配置

可以通过配置文件自定义默认参数：

```typescript
import { setWaterfallConfig } from './waterfall/config'

setWaterfallConfig({
  columns: 3,
  columnGap: 20,
  rowGap: 20,
})
```

## 目录结构

```
waterfall/
├── components/          # Vue 组件
│   ├── waterfall.vue
│   ├── waterfall-item.vue
│   └── waterfall-load.vue
├── utils/              # 工具函数
│   ├── bem.ts
│   ├── dom.ts
│   ├── string.ts
│   ├── utils.ts
│   ├── useTimeout.ts
│   └── index.ts
├── styles/             # 样式文件
│   ├── base/
│   ├── waterfall.scss
│   ├── waterfall-item.scss
│   ├── waterfall-load.scss
│   ├── variables.scss
│   └── index.scss
├── types/              # 类型定义
│   ├── waterfall.ts
│   ├── waterfall-item.ts
│   └── waterfall-load.ts
├── config/             # 配置文件
│   └── index.ts
├── package.json
└── README.md
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
