<!-- 我的想法 -->

## waterfall.vue

items存放所有已经排列完的项目
pendingItms存放待排列的项目
columns用于维护两个列的高度

addItem添加项目到到pendingItems
processQueue负责从pendingItems取出项目进行排版，排版完成后添加到items中，并更新columns高度
