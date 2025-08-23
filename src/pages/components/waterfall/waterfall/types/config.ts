export const defaultConfig = {
  waterfall: {
    columns: 2,
    columnGap: 16,
    rowGap: 16,
    maxRetries: 1, // 最大重试次数
    retryDelay: 1000, // 重试延迟(ms)
    fallbackHeight: 200, // 加载失败时的备用高度
  },
}
