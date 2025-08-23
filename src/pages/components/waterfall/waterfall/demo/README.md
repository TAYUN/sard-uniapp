# 瀑布流组件演示示例

本目录包含了瀑布流组件的完整使用示例，帮助你快速了解和使用组件的各种功能。

## 📁 文件说明

### `basic.vue` - 基础示例

展示瀑布流组件的基本功能：

- ✅ 多列瀑布流布局
- ✅ 动态列数调整（2/3/4列）
- ✅ 懒加载和无限滚动
- ✅ 图片加载状态处理
- ✅ 响应式设计

**适用场景：** 图片展示、商品列表、内容流等基础瀑布流需求

### `advanced.vue` - 高级功能示例

展示瀑布流组件的高级特性：

- ⚡ 实时配置调整（列数、间距等）
- 🔄 错误处理和重试机制
- 📊 加载统计和状态监控
- 🎯 自定义错误模拟
- 🛠️ 动态数据管理

**适用场景：** 需要复杂交互、错误处理、性能监控的高级应用

### `index.html` - 浏览器预览页面

提供组件功能概览和使用指南：

- 📖 组件功能介绍
- 🚀 快速开始指南
- 💡 使用示例代码
- 🎨 视觉效果预览

## 🚀 如何运行示例

### 方法一：在 uni-app 项目中运行

1. **复制组件到项目**

   ```bash
   # 将整个 waterfall 目录复制到你的 uni-app 项目中
   cp -r waterfall/ your-uniapp-project/src/components/
   ```

2. **引入样式**
   在 `App.vue` 或主样式文件中添加：

   ```scss
   @import './components/waterfall/styles/index.scss';
   ```

3. **创建页面**
   在 `pages` 目录下创建新页面，复制示例代码：

   ```vue
   <!-- pages/waterfall-demo/index.vue -->
   <template>
     <Waterfall :columns="2" :column-gap="16">
       <WaterfallItem v-for="item in items" :key="item.id" :item="item">
         <image :src="item.image" />
       </WaterfallItem>
     </Waterfall>
   </template>

   <script setup>
   import Waterfall from '../../components/waterfall/components/waterfall.vue'
   import WaterfallItem from '../../components/waterfall/components/waterfall-item.vue'
   </script>
   ```

4. **配置路由**
   在 `pages.json` 中添加页面配置：
   ```json
   {
     "pages": [
       {
         "path": "pages/waterfall-demo/index",
         "style": {
           "navigationBarTitleText": "瀑布流演示"
         }
       }
     ]
   }
   ```

### 方法二：直接查看代码

1. **查看 HTML 预览**

   ```bash
   # 在浏览器中打开
   open demo/index.html
   ```

2. **查看 Vue 组件代码**
   - `basic.vue` - 基础功能实现
   - `advanced.vue` - 高级功能实现

## 📋 示例功能对比

| 功能特性 | 基础示例 | 高级示例  |
| -------- | -------- | --------- |
| 多列布局 | ✅       | ✅        |
| 动态加载 | ✅       | ✅        |
| 列数调整 | ✅       | ✅ (滑块) |
| 间距调整 | ❌       | ✅        |
| 错误处理 | 基础     | 高级      |
| 重试机制 | ❌       | ✅        |
| 状态监控 | ❌       | ✅        |
| 统计信息 | ❌       | ✅        |
| 错误模拟 | ❌       | ✅        |
| 配置面板 | ❌       | ✅        |

## 🎯 使用建议

### 新手用户

建议从 `basic.vue` 开始：

1. 理解基本的组件结构
2. 学习数据绑定和事件处理
3. 掌握基础配置选项

### 进阶用户

可以参考 `advanced.vue`：

1. 学习错误处理最佳实践
2. 了解性能监控方法
3. 掌握动态配置技巧

### 生产环境

根据实际需求选择功能：

- 简单展示：使用基础功能
- 复杂交互：参考高级功能
- 自定义需求：组合使用各种特性

## 🔧 自定义配置

### 全局配置

```typescript
import { setWaterfallConfig } from './waterfall/config'

// 设置全局默认配置
setWaterfallConfig({
  columns: 3, // 默认列数
  columnGap: 16, // 列间距
  rowGap: 16, // 行间距
  maxRetries: 3, // 最大重试次数
  retryDelay: 1000, // 重试延迟
  fallbackHeight: 200, // 备用高度
})
```

### 组件配置

```vue
<Waterfall
  :columns="columns"
  :column-gap="columnGap"
  :row-gap="rowGap"
  :max-retries="maxRetries"
  :retry-delay="retryDelay"
  :fallback-height="fallbackHeight"
>
  <!-- 内容 -->
</Waterfall>
```

## 🐛 常见问题

### Q: 图片加载失败怎么办？

A: 组件提供了完善的错误处理机制：

- 自动重试（可配置次数和延迟）
- 错误回调事件
- 备用高度设置

### Q: 如何优化性能？

A: 建议的优化策略：

- 使用适当的图片尺寸
- 启用懒加载
- 合理设置重试参数
- 监控加载统计

### Q: 如何自定义样式？

A: 可以通过以下方式：

- 覆盖 CSS 变量
- 自定义 SCSS 样式
- 使用 scoped 样式

## 📞 技术支持

如果在使用过程中遇到问题：

1. 查看组件文档：`../README.md`
2. 检查控制台错误信息
3. 参考示例代码实现
4. 提交 Issue 反馈问题

---

**提示：** 这些示例仅供学习和参考，实际使用时请根据项目需求进行适当调整。
