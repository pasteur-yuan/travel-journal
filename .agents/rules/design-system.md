# 全站設計、響應式與可及性規則

## 適用範圍

修改 CSS、共用頁首／頁尾、主題、字型、版面、動畫、hover／focus／touch 行為或任何 UI 元件時必讀。

## 視覺方向

網站定位是「暖色液態玻璃旅行檔案館」：安靜、具有編輯感與旅行手帳氣質，不是訂票或旅遊電商介面。

- 使用大量留白、低彩度暖灰米色背景、深色藍灰文字與暖橘色重點。
- 立體感來自半透明表面、backdrop blur、內側高光、細微位移、低對比陰影與追蹤游標的 radial glow。
- 使用細邊線、柔邊與適度圓角；避免厚重黑框、硬直角、大面積純白光暈、刺眼黃色外框或高飽和彩色 UI。
- 互動要有慢速煞停與銜接感，不能突然跳動、彈跳、水平重排或讓相鄰內容碰撞。
- 圖片與地圖可以沉浸，但文字、tooltip 與控制項必須維持清楚對比。

## 字型與色彩

- 主字型使用 Google Fonts `Huninn`；fallback 為 `Noto Sans TC`、`PingFang TC`、`Microsoft JhengHei`。
- 標題可用較重字重；正文、tooltip 與小尺寸 UI 使用一般或中等字重。襯線字體只可局部用於未來長篇旅記，不套用到導航、地圖或小 UI。
- 優先使用既有 CSS custom properties，不在元件中散落新的硬編碼色：

```css
--ink: #24313a;
--muted: #69757d;
--paper: #f7f5f0;
--surface: #ffffff;
--accent: #c96f4a;
--line: #e5e0d8;
```

- 全站只維護 `glass` 與 `glass-dark` 兩種明暗狀態。新增或調整主題時，同步處理背景、主要／次要文字、表面、邊線、強調色、地圖與 modal 可讀性。
- 右上角維持單一圓形 `.theme-toggle`，使用現有 Font Awesome 圖示與 `aria-pressed`，不改成展開式主題選單。

## 共用頁面 chrome

- 首頁 header：可回首頁的「出去玩」品牌與右側主題切換。
- 國家／地區頁 breadcrumb：`出去玩 / 國家 / 地區`。品牌使用 `fa-plane-up` 並連回首頁，層級以 `/` 分隔，目前頁面使用 `aria-current="page"`。
- 不在右上角重複加入「回首頁」文字按鈕。
- header 使用 sticky、半透明與 backdrop blur，且不可遮住內容；手機版可換行，但主題按鈕要保持易於觸控。
- 模板維持 `<html lang="zh-Hant">`、`<title>出去玩</title>` 與依頁面深度引用的本地 `assets/images/favicon.svg`。favicon 固定是一般 emoji `🧳`，不用遠端 icon 或 Font Awesome 取代。
- 視覺目標的 footer 文案是 `Every journey leaves a trace.`；目前模板／測試若仍是 `Travel Journal`，只能在明確的 footer 遷移任務中一次同步所有模板、產生器與測試，不要順手改一部分。

## 液態玻璃互動

- 游標追蹤光暈以 `requestAnimationFrame` 更新 CSS custom properties，例如 `--pointer-x`／`--pointer-y`、`--card-pointer-x` 或 `--timeline-pointer-x`。
- 不對光暈的 `left`／`top` 使用追趕式 transition；位置跟手，只有 opacity、scale、shadow 等屬性可平滑過渡。
- hover／focus 的浮起與按壓回彈不能改變排版尺寸或造成相鄰元件位移。需要推擠時使用既有 transform／CSS 變數並保留固定佔位。
- 動態新增項目也必須取得相同互動；優先使用既有事件代理與 `MutationObserver`。

## 響應式與捲動

- 桌面內容最大寬度約 1100px 並置中；手機使用較小水平內距，任何元件都不可讓整頁水平捲動。
- 地圖、Hero、卡片與時間軸必須依容器縮放，不用只適合單一 viewport 的像素偏移定位重要內容。
- 頁面只保留一個主要垂直捲動容器；需要內部捲動的元件必須明確限定方向與高度，並加對應軸向的 `overscroll-behavior: contain`（不加的話捲到底會外溢到背景頁面，modal 開著時尤其明顯，`body.modal-is-open { overflow: hidden }` 不會連帶擋住）。
- 手機上的橫向清單保留自然 `pan-x`、scroll-snap、鍵盤焦點並隱藏原生 scrollbar；觸控滑動不可誤觸發滑鼠 3D 或 hover 狀態。
- hover-only 功能一定要有 focus、click 或 tap 替代。判斷觸控操作時不要只依 viewport 寬度；若行為取決於有無 hover，使用 `(hover: none)` 或 pointer type。

## 可及性與 reduced motion

- 優先使用原生 `<a>`、`<button>`、`<details>`；整列可點擊時讓原生互動元素涵蓋整列。
- icon-only 控制項必須有明確 `aria-label` 或 `title`；純裝飾 icon／emoji 使用 `aria-hidden="true"`。
- 保留清楚的 `:focus-visible`，並確保鍵盤、Enter、Space、Escape 與 focus 還原符合元件語意。
- 文字與背景需有足夠對比，尤其是圖片遮罩、地圖 tooltip、玻璃卡片與暗色主題。
- 所有自訂平滑捲動、光暈追蹤、大幅位移、Hero 過場與 hover 動畫都要處理 `prefers-reduced-motion`；降低動態時仍要保留狀態與功能。
