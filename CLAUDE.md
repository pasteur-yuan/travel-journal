# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案性質

純前端靜態旅遊網站，部署於 GitHub Pages（`main` branch 根目錄）。**沒有建置流程、沒有套件管理、沒有測試框架、沒有後端。** 原生 HTML + CSS + Vanilla JS，所有頁面必須能以 `file://` 直接開啟。

`AGENTS.md` 是本專案的設計規範（視覺風格、互動細節、資料撰寫規則），內容遠比本檔詳細；修改視覺或互動前先讀它。本檔只描述**架構與程式運作方式**。

## 開發指令

```bash
# 本機預覽（任一即可）
open index.html                     # 直接以 file:// 開啟
python3 -m http.server 8000         # 靜態伺服器，http://localhost:8000

# 修改後檢查（沒有 lint / test，這是唯一的自動檢查）
git diff --check
```

驗證只能靠瀏覽器手動確認。至少檢查：首頁、日本國家頁，以及 hokkaido / tokyo / nagoya / osaka / ise-shima / fukuoka 六個地區頁。

## 三種頁面模板

| 類型 | 路徑 | 載入的 script | 相對路徑深度 |
|---|---|---|---|
| 首頁 | `index.html` | amCharts CDN ×4 → `main.js` → `themes.js` → `theme-switcher.js` | `assets/...` |
| 國家頁 | `countries/<country>/index.html` | `themes.js` → `theme-switcher.js` → `region-showcase.js` | `../../assets/...` |
| 地區頁 | `countries/<country>/<region>/index.html` | `themes.js` → `theme-switcher.js` → `region-detail.js` | `../../../assets/...` |

新增頁面時複製對應模板的 DOM 結構與 script 順序，不要另寫一套 CSS/JS。

**script 順序是硬性需求**：`themes.js` 宣告全域 `const themes`，`theme-switcher.js` 直接依賴它。所有 script 放在 `</body>` 前、無 `defer`、無 `DOMContentLoaded` 包裝，頂層程式碼即時執行。

## 核心架構：HTML 是 seed，內容由 JS 注入

這是本專案最容易誤判的一點。**地區頁 HTML 只保留最小化的佔位結構，實際內容由 `region-detail.js` 在載入時依地區注入或覆寫。**

- 判斷 HTML 是否「已完成」時，必須看瀏覽器執行後的 DOM，不能只看 HTML 原始碼。
- 例：HTML 裡 `#stays` 章節寫的是「住宿與交通」＋`.region-facts-wide`；`region-detail.js` 會把標題改寫成 `STAY`／「住宿」，並把 facts 轉成 `.region-content-list`。
- 例：地區頁 HTML 仍保留舊版 5 主題 `<details class="theme-menu">` 選單；`theme-switcher.js` 會在執行時把它 `replaceWith` 成單一亮暗切換按鈕。首頁與國家頁已直接寫成新按鈕。修改主題 UI 要同時考慮這兩種輸入。

首頁時間軸同理：`main.js` 讀取 HTML 中 `.timeline-entry[data-date]`，`replaceChildren()` 清空 `.timeline-track` 後，依 `data-date` 推導年份範圍（最早年份 → `max(今年+1, 最晚一筆)`）重建整個年份群組結構。HTML 裡的時間軸只是資料來源。

時間軸項目同時是地圖右上「已探索」清單與右下「旅行足跡」數字的唯一資料來源：`data-country` 決定國家清單與國家數，`data-country` + `data-region` 的組合決定地區數，項目總數即旅行節點數。這三處都是 JS 產生的，不要在 HTML 裡寫死。

## region-detail.js 的資料流

地區身分由 `.region-hero` 上的 `region-hero-<region>` class 決定，解析成 `regionKey`（如 `tokyo`、`ise-shima`）。所有資料 map 都以此為 key：

1. `regionContent[regionKey]` — 覆寫前 N 筆 spots / food，以及 stay、note 文字。
2. `regionAdditionalContent[regionKey]` — 額外 append 的 spots / food / stays / notes。
3. `stayBaseContent[regionKey]` — `#stays` 第一筆項目的內容。
4. 北海道**不在** `regionContent` 中，改由檔案上方一段獨立的 `if (document.querySelector('.region-hero-hokkaido'))` 分支處理（含 `spotContent`、`foodContent` 陣列）。新增北海道內容要改那段，不是改 `regionContent`。

所有動態項目一律透過 `createRegionContentItem(type)`（`'card'` 給 `.region-card-grid`，`'list'` 給 `.region-content-list`）建立，確保 DOM 結構一致。

### Modal 資料表的查表順序

點擊任一內容項目會開啟共用 modal，`renderItemTable(item)` 以「項目 `<span>` 的文字」＋「所屬 section id」決定表格內容，依序嘗試：

1. `regionalVenueData[regionKey][sectionName][place]` — 東京／名古屋／大阪／伊勢志摩／福岡的統一資料來源。
2. 北海道景點專屬陣列：`otaruPlaces`、`jozankeiPlaces`、`sapporoPlaces`，以及 `{旭川, 美瑛, 函館}` 對應的 `asahikawaPlaces` / `bieiPlaces` / `hakodatePlaces`。
3. `hokkaidoFoodPlaces[place]`（`#food`）、`hokkaidoStayPlaces[place]`（`#stays`）。
4. Fallback：單列表格，查詢字串會補上 `regionSearchNames` 對應的地區名（例：`原宿 東京`）。`#notes` 章節不產生地圖連結，欄位顯示 `—`，因為筆記的標籤是年月而非地點。

Google Maps 連結統一使用 `https://www.google.com/maps/search/?api=1&query=<encodeURIComponent(名稱)>`，`target="_blank" rel="noopener noreferrer"`。

## 互動實作慣例

沿用既有模式，不要為單一頁面新寫一套：

- **滑鼠追蹤光暈**：在 `requestAnimationFrame` 中把游標相對座標寫進 `--pointer-x` / `--pointer-y` CSS custom property，由 CSS 的 radial-gradient 使用。絕不對 `left`/`top` 加 transition。同樣模式也用在 `--card-pointer-x`、`--press-x`、`--timeline-pointer-x`、`--map-pointer-x`。
- **事件代理**：`region-detail.js` 底部在 `document` 上代理 `pointermove` / `pointerout` / `focusin` / `focusout`（selector 為 `glowSelector`），所以動態新增的項目自動取得光暈。新增內容時**不要**手動綁事件。
- **MutationObserver**：`region-showcase.js` 監看 `.region-showcase-list`，新加入的 `.region-showcase-item` 會自動綁定背景切換、按壓回彈與頁面轉場。項目必須提供 `data-image` 與 `href`。
- **狀態 class**：`is-active`、`is-expanded`、`is-pointer-active`、`is-pressed`、`is-switching`、`is-page-leaving`、`is-region-entering/entered`、`modal-is-open`。
- **桌機／手機分流**：斷點統一為 `window.matchMedia("(max-width: 700px)")`，時間軸與地圖有完全不同的互動邏輯分支。
- **reduced motion**：`prefers-reduced-motion` 下自訂平滑捲動改為瞬間跳轉、動畫停用。新增動畫必須一併處理。
- **自訂平滑捲動**：不使用 `scroll-behavior`，一律用 `requestAnimationFrame` + 自訂 easing（`main.js` 的 `animatePageScrollTo`、`region-detail.js` 導覽列的 `ease`），並扣除 header + sticky nav 高度。

## 主題系統

`themes.js` 只定義兩個主題：`glass`（`theme-glass`）與 `glass-dark`（`theme-glass-dark`）。`theme-switcher.js` 以 `document.body.className` 的 `theme-*` 前綴切換，狀態存在 `localStorage` 的 `travel-journal-theme`。

`style.css` 仍留有 `theme-ocean` / `theme-phototravel` / `theme-retro` / `theme-city` 的舊變數與規則，**已無程式路徑可觸發**，屬遺留樣式，不要以它們為基準修改配色。

配色透過 `:root` 的 CSS 變數（`--ink`、`--muted`、`--paper`、`--surface`、`--accent`、`--line`）由 body theme class 覆寫；新增樣式一律使用這些變數。

## 首頁世界地圖

amCharts 5 由 CDN 載入（`am5`、`am5map`、`worldTimeZonesHigh`、`worldTimeZoneAreasHigh` geodata），整段包在 `if (window.am5 && window.am5map)` 內——CDN 失效時地圖不出現，但頁面其他部分必須照常運作，修改時要維持這個防護。

marker 由 `main.js` 頂端的 `travelDestinations` 陣列產生：每筆資料建立一個 `<button class="country-marker">`，位置以 `chart.convert()` 換算並在 `boundschanged` 時重新定位，tooltip、地圖多邊形高亮（以 `code`／`mapId` 比對）與點擊連結都來自同一筆資料。新增國家只需在陣列加一筆，不要另外在 HTML 寫死 marker。

夜晚區域 `#night-zone` 由 `updateDayNight()` 依 UTC 時間計算經度後定位，每 60 秒更新一次。

## 新增內容的檢查點

- 新增國家：`countries/<country>/index.html` + `countries/<country>/<region>/index.html`，並在首頁加 `.country-card`（尚未建頁時用非連結的 `<div>`，不可留失效連結）。
- 新增地區頁：需要 `region-hero-<region>` class、五個章節 id（`overview` / `spots` / `food` / `stays` / `notes`），並在 `region-detail.js` 的 `regionNames`、`regionContent`、`stayBaseContent`、`regionalVenueData` 補上對應 key。
- 圖片放 `assets/images/`，不依賴圖片 CDN。
- GitHub Pages 大小寫敏感，路徑大小寫必須與檔案系統完全一致。
