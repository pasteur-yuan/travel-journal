# 國家頁地區 Showcase 規則

## 適用範圍

修改 `countries/japan/index.html`、`assets/js/region-showcase.js`、showcase 相關 CSS，或新增國家頁地區入口時必讀。

## 版面

- 國家頁使用全視窗 editorial showcase，不改成一般多欄卡片網格。
- header 以下的背景、國家資訊與地區清單整合在同一個 viewport 區塊；外層頁面不可上下滾動。
- 桌面左側顯示英文／中文國名，右側顯示全部地區。右側 `.region-showcase-list` 是唯一垂直捲動容器，可視高度約五項。
- 手機改為上下排列，但清單仍在自己的區域內垂直捲動，不讓 body 產生第二條捲軸。
- 清單項目保留足夠最小高度與上下內距，標題、描述、箭頭不能因固定高度或 overflow 被裁切。
- 清單左右留出光暈、陰影與放大的安全空間；不可用硬邊、遮罩或容器邊界切斷效果。可隱藏 scrollbar。
- 第一項從頂端開始；最上與最下不顯示外框分隔線，中間項目可有淡分隔。

## 項目與互動

- 每個 `.region-showcase-item` 使用原生 `<a>`，整列可點擊、可鍵盤 focus。
- 必須提供 `href`、`data-image`、標題、描述與箭頭容器；背景圖片是 `assets/images/<slug>.jpg` 本地資產。
- hover、focus 或目前項目切換背景、提高文字對比並顯示箭頭，不造成其他項目水平跳動。
- `region-showcase.js` 統一處理背景切換、游標光暈、局部按壓回彈與導航 icon；新增項目依靠既有 `MutationObserver` 自動取得互動，不手動綁一套事件。
- 按壓效果局部作用於游標附近，不讓整列同步下陷。游標位置以 rAF 更新 CSS custom properties，不對位置加追趕 transition。
- 國家頁沒有離場轉場；進入地區頁的銜接由地區頁 Hero 入場動畫負責，不重新加入 `.page-transition-layer`。
- `prefers-reduced-motion` 下停用背景切換動畫、大幅位移與文字過場，但連結、focus 與目前項目狀態仍要清楚。

## 新增地區入口

- 展示項目、實際 `countries/japan/<slug>/index.html`、`main.js::countryRegions` 與 `tests/regions.mjs::REGION_NAMES` 必須一致。
- `data-image` 與 `.region-hero-<slug>` 使用同名本地 JPG；第三方照片同步更新 `assets/images/ATTRIBUTIONS.md`。
- 舊 SVG 僅是歷史佔位物，不可重新引用。
