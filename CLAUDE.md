# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案性質

純前端靜態旅遊網站，部署於 GitHub Pages（`main` branch 根目錄）。**沒有建置流程、沒有套件管理、沒有後端。** 原生 HTML + CSS + Vanilla JS，所有頁面必須能以 `file://` 直接開啟。

唯一的例外是 `tests/`：一套零依賴的瀏覽器行為測試（Node 內建 HTTP server + WebSocket 直接驅動 Chrome DevTools Protocol）。它只在本機執行，不影響部署，也不引入 `package.json`。

`AGENTS.md` 現在是規則路由器（原生給 Codex 用，Claude Code 不會自動載入），實際設計規範拆到 `.agents/rules/*.md`（architecture / design-system / homepage / country-showcase / region-detail / content-data / i18n / testing 八份）。修改視覺或互動前，依 `AGENTS.md` 的任務對照表找到對應規則檔讀取——不要只讀 `AGENTS.md` 本身就以為拿到全部細節。`TASKS.md` 是待辦清單與資料缺口，不是已完成規格；除非使用者要求執行，不要把裡面項目當成分派工作直接動手實作。本檔只描述**架構與程式運作方式**。

## 開發指令

```bash
# 本機預覽（任一即可）
open index.html                     # 直接以 file:// 開啟
python3 -m http.server 8000         # 靜態伺服器，http://localhost:8000

# 自動測試（需 Node 22+ 與 Google Chrome）
node tests/run.mjs                  # 全部：39 個群組、涵蓋 29 個地區頁，約 125 秒
node tests/run.mjs timeline         # 只跑檔名或群組名稱含關鍵字的
node tests/run.mjs 手機版            # 中文關鍵字也可以
node tests/run.mjs --jobs=1         # 完全序列（約 240 秒），除錯時較好讀
CHROME_PATH="/path/to/chrome" node tests/run.mjs

git diff --check
```

測試涵蓋 DOM 狀態、CSS 計算值、捲動位置、動畫中途取樣、鍵盤與 focus 行為、資源載入、連結有效性。**不涵蓋**實機觸控手感與視覺美感，這些仍要手動確認：首頁、日本國家頁，以及至少 hokkaido / tokyo / nagoya / osaka / ise-shima / fukuoka 六個內容最完整的地區頁。

改動互動或動畫時，除了「測試通過」，還要確認**測試會因為這個改動而失敗**——把修正還原一次，看它有沒有紅。細節見 `tests/README.md`（含三個容易踩到的 CDP 陷阱）。

測試群組會分散到多個 Chrome 平行執行，輸出順序仍與序列執行一致。新增**會斷言捲動位置或動畫中途狀態**的群組時，要標記 `{ serial: true }`，否則 CPU 競爭會讓它偶發性失敗。

## 三種頁面模板

| 類型 | 路徑 | 載入的 script | 相對路徑深度 |
|---|---|---|---|
| 首頁 | `index.html` | amCharts CDN ×4 → `trips.js` → `main.js` → `themes.js` → `theme-switcher.js` | `assets/...` |
| 國家頁 | `countries/<country>/index.html` | `themes.js` → `theme-switcher.js` → `region-showcase.js` | `../../assets/...` |
| 地區頁 | `countries/<country>/<region>/index.html` | `themes.js` → `theme-switcher.js` → `region-detail.js` | `../../../assets/...` |

新增頁面時複製對應模板的 DOM 結構與 script 順序，不要另寫一套 CSS/JS。

**script 順序是硬性需求**：`themes.js` 宣告全域 `const themes`，`theme-switcher.js` 直接依賴它；`trips.js` 宣告全域 `const trips`，`main.js` 直接依賴它，同一模式。所有 script 放在 `</body>` 前、無 `defer`、無 `DOMContentLoaded` 包裝，頂層程式碼即時執行。

所有頁面的 `<title>` 統一是「出去玩」，並掛同一個 `assets/images/favicon.svg`（依深度調整相對路徑）。頁面身分靠 breadcrumb 呈現，不靠 title。

## 核心架構：HTML 是 seed，內容由 JS 注入

這是本專案最容易誤判的一點。**HTML 只保留最小化的佔位結構，實際內容由 JS 在載入時注入或覆寫。判斷 HTML 是否「已完成」時必須看瀏覽器執行後的 DOM，不能只看原始碼。**

**地區頁**：`region-detail.js` 依地區注入內容。例：HTML 裡 `#stays` 章節寫的是「住宿與交通」＋`.region-facts-wide`，執行後標題被改寫成 `STAY`／「住宿」，facts 轉成 `.region-content-list`。

**首頁時間軸**：跟其他頁面不同，這裡連 HTML seed 都沒有——`.timeline-track` 是空的，`main.js` 依 `assets/js/trips.js` 的全域 `trips` 陣列建立 `.timeline-entry[data-date]`，`replaceChildren()` 清空 `.timeline-track` 後，依 `data-date` 推導年份範圍（最早年份 → `max(今年+1, 最晚一筆)`）重建整個年份群組結構。細節見下面「首頁時間軸與旅程彈窗」一節。

時間軸項目同時是地圖右上「已探索」清單與右下「旅行足跡」數字的唯一資料來源：`data-country` 決定國家清單與國家數，`data-regions`（複數、逗號分隔，一個節點可能標記多個地區）決定地區數。這兩處都是 JS 產生的，不要在 HTML 裡寫死。

**首頁國家卡片**：`main.js` 會為每張 `<a class="country-card">` 補上 `.country-meta-action` 與 `.country-card-more`（「查看更多」）。HTML 已經有就沿用，沒有就建立——新增國家卡片時不必自己寫這段。`<div>` 形式的 coming soon 卡片不會被加。

## region-detail.js 的資料流

地區身分由 `.region-hero` 上的 `region-hero-<region>` class 決定，解析成 `regionKey`（如 `tokyo`、`ise-shima`）。**所有地區走完全相同的程式路徑**，沒有任何地區有專屬分支或專屬陣列。所有資料 map 都以 `regionKey` 為 key：

1. `regionContent[regionKey]` — 覆寫前 N 筆 spots / food，以及 stay 文字。
2. `stayBaseContent[regionKey]` — `#stays` 第一筆項目的內容。
3. `regionAdditionalContent[regionKey]` — 額外 append 的 spots / food / stays。
4. `regionSearchNames[regionKey]` — 查地圖時補在關鍵字後面的地區名。

地區頁只有四個章節（`overview` / `spots` / `food` / `stays`）。旅行筆記與行程軌跡不在地區頁上，改成在首頁時間軸點擊旅程節點時開彈窗顯示，資料來源是 `assets/js/trips.js`，見下面「首頁時間軸與旅程彈窗」一節。

所有動態項目一律透過 `createRegionContentItem(type)`（`'card'` 給 `.region-card-grid`，`'list'` 給 `.region-content-list`）建立，確保 DOM 結構一致。

### Modal 資料表的查表順序

點擊任一內容項目會開啟共用 modal，`renderItemTable(item)` 以「項目 `<span>` 的文字」＋「所屬 section id」查表：

1. `regionalVenueData[regionKey][sectionName][place]` — 全部地區統一的資料來源，結構固定是「地區 → 分類 → 項目標籤 → 資料列陣列」。每筆資料列是 `[名稱, 說明, 交通, 地圖網址?]`，第四欄省略時自動以名稱產生 Google Maps 查詢。
2. Fallback：單列表格，查詢字串補上 `regionSearchNames[regionKey]`（例：`原宿 東京`）。

Google Maps 連結統一由 `mapSearchUrl()` 產生（`https://www.google.com/maps/search/?api=1&query=<encodeURIComponent(名稱)>`），儲存格統一由 `mapCell()` 產生（`target="_blank" rel="noopener noreferrer"`）。渲染統一走 `renderRows()`——不要為單一地區另寫渲染函式。

**內容深度落差**：目前共 29 個地區頁，資料量從北海道的 78 列到單一景點地區的 4 列不等，量少的地區較常落到 fallback。這是**資料撰寫**的差距，不是程式差異；補內容就是往 `regionalVenueData` 加項目。

新地區頁的主視覺目前是 `assets/images/<slug>.svg` 的程式產生漸層佔位圖，取得實拍照片後直接替換同名檔案並改 CSS 的副檔名即可。

## 互動實作慣例

沿用既有模式，不要為單一頁面新寫一套：

- **滑鼠追蹤光暈**：在 `requestAnimationFrame` 中把游標相對座標寫進 `--pointer-x` / `--pointer-y` CSS custom property，由 CSS 的 radial-gradient 使用。絕不對 `left`/`top` 加 transition。同樣模式也用在 `--card-pointer-x`、`--press-x`、`--timeline-pointer-x`、`--map-pointer-x`。
- **事件代理**：`region-detail.js` 底部在 `document` 上代理 `pointermove` / `pointerout` / `focusin` / `focusout`（selector 為 `glowSelector`），所以動態新增的項目自動取得光暈。新增內容時**不要**手動綁事件。
- **MutationObserver**：`region-showcase.js` 監看 `.region-showcase-list`，新加入的 `.region-showcase-item` 會自動綁定背景切換、按壓回彈與 IntersectionObserver。項目必須提供 `data-image` 與 `href`。
- **狀態 class**：`is-active`、`is-expanded`、`is-pointer-active`、`is-pressed`、`is-releasing`、`is-switching`、`is-gliding`、`is-hidden`、`is-edge-shadowless`、`is-mobile-focused`、`is-mobile-activated`、`is-region-entering/entered`、`modal-is-open`。
- **桌機／手機分流**：斷點統一為 `window.matchMedia("(max-width: 700px)")`，時間軸、地圖與國家卡片列有完全不同的互動邏輯分支。
- **reduced motion**：`prefers-reduced-motion` 下捲動改為瞬間跳轉、動畫停用。新增動畫必須一併處理，且要有對應測試。
- **捲動**：容器內的捲動（時間軸橫向、國家卡片列）用原生 `scrollTo({ behavior: "smooth" })`；整頁捲動只有地區頁導覽列在用，是 `requestAnimationFrame` + 自訂 easing（`region-detail.js` 的 `ease`），並扣除 header + sticky nav 高度。**手機版時間軸點年份或點節點時，頁面完全不捲動**——這是刻意的，捲動會讓時間軸以外的內容整塊位移。**任何容器內捲動（`overflow-x`/`overflow-y: auto`）都要加對應軸向的 `overscroll-behavior: contain`**（`.country-strip`、`.region-showcase-list`、`.spot-modal-itinerary-days`／`-day`、`.spot-modal-table-wrap`／`tbody` 皆是），不然捲到底之後剩餘的捲動量會外溢（scroll chaining）到背景頁面——modal 開著時尤其明顯，`body.modal-is-open { overflow: hidden }` 不會連帶擋住這個。新增容器內捲動時要一併加，並用 `getComputedStyle(el).overscrollBehaviorX/Y` 斷言。
- **FLIP**：`display` 切換造成的位移 CSS transition 接不到，改用 FLIP（`main.js` 的 `glideYearGroups`）：記錄前後位置差 → 用 transform 移回原位 → 下一幀放手滑到新位置。

進入地區頁時 `region-detail.js` 會加上 `is-region-entering` / `is-region-entered`，Hero 以 clip-path 由中央展開。國家頁**沒有**離場轉場（曾經有一版 `.page-transition-layer`，已移除）。

## 主題系統

`themes.js` 只定義兩個主題：`glass`（`theme-glass`）與 `glass-dark`（`theme-glass-dark`）。`theme-switcher.js` 以 `document.body.className` 的 `theme-*` 前綴切換，狀態存在 `localStorage` 的 `travel-journal-theme`。所有頁面的切換按鈕都是同一個 `.theme-toggle`，HTML 裡直接寫好，JS 只負責換 icon 與 aria 狀態。

配色透過 `:root` 的 CSS 變數（`--ink`、`--muted`、`--paper`、`--surface`、`--accent`、`--line`）由 body theme class 覆寫；新增樣式一律使用這些變數，不要寫死顏色。

## 首頁世界地圖

amCharts 5 由 CDN 載入（`am5`、`am5map`、`worldTimeZonesHigh`、`worldTimeZoneAreasHigh` geodata），整段包在 `if (window.am5 && window.am5map)` 內——CDN 失效時地圖不出現，但頁面其他部分必須照常運作，修改時要維持這個防護。

marker 由 `main.js` 頂端的 `travelDestinations` 陣列產生：每筆資料建立一個 `<button class="country-marker">`，位置以 `chart.convert()` 換算並在 `boundschanged` 時重新定位，tooltip、地圖多邊形高亮（以 `code`／`mapId` 比對）與點擊連結都來自同一筆資料。新增國家只需在陣列加一筆，不要另外在 HTML 寫死 marker。

**夜晚區域是三份**：`.night-zone-viewport`（`overflow: hidden`）裡有三個 `.night-zone`，`data-night-zone-offset` 為 `0` / `-1` / `1`。`updateDayNight()` 依 UTC 時間算出經度後，把三份各偏移一個地圖寬度定位——遮罩跨過日期變更線時由另一側補位，既不留空白也不滲出地圖圓角外。每 60 秒與 resize 時更新。修改時三份要一起處理（例：`data-map-action="night"` 的切換是 `forEach` 全部 toggle）。

## 首頁時間軸與旅程彈窗

時間軸節點完全由 `assets/js/trips.js` 的全域 `trips` 陣列動態產生（`main.js` 的 `buildTimelineEntry()`），`index.html` 的 `.timeline-track` 本身是空的——不再像其他區塊那樣有「HTML seed、JS 覆寫」的兩階段，是純粹從資料建 DOM。新增一趟旅程只要在 `trips.js` 加一筆，不用碰 `index.html`；`trips.js` 裡沒有的旅程，時間軸上就不會有對應節點，不會出現示範用的假資料。

每個 trip 是 `{ label, date, country, regions, teaser, description, itinerary }`：`regions` 是這趟旅程實際踏過的地區 tag 陣列（可以不只一個，例如一趟行程橫跨多個地區時**不會**拆成多個節點，時間軸上仍是一個節點，`itinerary` 也是同一份連貫清單、不依地區拆分）；`teaser` 不渲染於資訊卡（卡片固定高度、`overflow: hidden`，額外文字會把上方元素擠出可視範圍），但會顯示為旅程彈窗的標題——建議 10 字內，根據這趟旅程實際踏過的地點簡短描述；`description` 保留於資料結構但目前不渲染，供未來需要完整敘述時使用。

**時間軸資訊卡 DOM 結構**：`.timeline-card` 內容固定為兩個子元素，不可多加：
1. `<strong>` — `regions[0]`（主地區名，大字，卡片左下角）
2. `<span class="timeline-code">` — `yyyy.mm · 🇯🇵 國名`

卡片以 `flex-direction: column; justify-content: end; align-items: flex-start` 靠左下對齊，`<strong>` 在下方。`<strong>` 只顯示 `regions[0]`（視為主要地區），完整地區清單仍在 `dataset.regions`（逗號分隔）裡供統計使用。

**卡片背景圖依 `regions[0]` 換成對應地區頁的主視覺**，不是整個日本共用一張圖：`main.js` 的 `regionCardImage(trip)` 用檔案頂端的 `regionImageSlugs`（中文地區名 → 地區頁 slug）查出 slug，回傳可以直接指定給 CSS 的 `url("../images/<slug>.jpg")` 字串；查不到對應 slug（地區還沒收錄，或非日本旅程）就退回 `japan.jpg`。**`url()` 要寫 `../images/<slug>.jpg`，不能寫 `assets/images/<slug>.jpg`**——CSS 自訂屬性裡的 `url()` 是相對「引用它的那條規則所在的樣式表」（`assets/css/style.css`）解析，不是相對 `index.html`，跟 style.css 既有的 `.region-hero-<slug>` 用同一種相對路徑，寫成從網站根目錄算的路徑會 404（真的踩過這個坑）。`regionImageSlugs` 是 `region-detail.js` 的 `regionNames`（方向相反）與 `tests/regions.mjs` 的 `REGION_NAMES` 之外，第三份需要同步的地區清單。

`regionCardImage()` 的結果同時餵給兩個地方，換地區時兩處會一起換：`buildTimelineEntry()` 寫進 `.timeline-card` 的 `--timeline-card-image`（`style.css` 的 `.timeline-entry-japan .timeline-card` 用 `var(--timeline-card-image, none)` 讀出來），`openTripModal()` 寫進 `.spot-modal-hero` 的 `--spot-modal-image`（`.spot-modal-hero` 讀 `var(--spot-modal-image, none)`）。`.spot-modal-hero` 是包住彈窗 `.spot-modal-label`／`h2` 的容器，只有首頁旅程彈窗（`main.js` 建立的 `tripModal`）有這層，地區頁的地點彈窗沒有、不受影響；用負 `margin`（`calc(-1 * var(--spot-modal-pad-y/x))`）把背景圖拉到跟 `.spot-modal-dialog` 一樣的邊界與圓角，深色漸層蓋版跟 `.timeline-card` 同一組數值，讓從資訊卡點進來的彈窗視覺上是同一張圖的延伸。

**卡片顯示控制**：CSS 選擇器只允許使用 `:hover`、`:focus-visible` 與 `.is-expanded` 三種觸發條件。**禁止使用 `:focus-within` 控制 `visibility`**——程式關閉 modal 後會呼叫 `focusTarget?.blur()` 以清除焦點殘留，`:focus-within` 會在此時意外讓已收折的卡片重新浮出一截。

**點擊行為**：桌面版 hover／觸控裝置點圓點展開資訊卡是既有行為，不受這裡影響；資訊卡在展開狀態下被點擊（或節點聚焦後按 Enter／Space）才會開啟彈窗，顯示完整行程——彈窗樣式與資料流搬自地區頁原本的旅行筆記彈窗（`.spot-modal` + `.spot-modal-itinerary`，`renderTripItinerary`／`renderTripItineraryDay`／`renderTripItineraryStop` 對應搬過來），差別是首頁彈窗不需要地區頁 modal 的四欄表格。所有節點一律是 `<div>`（不是 `<a>`），點擊不會導航到國家或地區頁。

**行程軌跡要撐滿對話框剩餘高度**：`.spot-modal-itinerary` 是 `flex: 1; min-height: 0`，不是寫死的 `height`，不然對話框底部會留一塊沒被捲動區用到的空白（手機版尤其明顯，實際被使用者回報過）。**這需要 `.spot-modal-dialog` 用定值 `height: min(760px, calc(100svh - 3rem))`，不能只有 `min-height`**：`flex: 1` 子元素要撐滿，父層必須有明確高度可以撐；只有 `min-height` 時，瀏覽器算 `flex: 1` 子元素的「假設尺寸」會退回用內容本身的高度（因為父層高度不定），而內容又是可捲動、理論上沒有上限的停留點清單，結果對話框被撐到兩千多 px、整個爆版（實際踩過這個坑）。`.spot-modal-table-wrap`（地區頁地點彈窗用的表格容器）仍然是寫死高度，沒有這個問題——它跟 `.spot-modal-itinerary` 是兩條平行、互斥顯示的路徑，改一邊不影響另一邊。

**行程軌跡是左右翻頁，不是上下捲動**：`.spot-modal-itinerary-days` 一次只顯示一天，用原生水平捲動＋`scroll-snap-type: x mandatory` 換頁，跟 `.country-strip`／`.timeline-track` 同一套「原生捲動＋`scrollTo`」慣例；左右各一顆 `.spot-modal-itinerary-nav` 按鈕，捲到頭尾時對應按鈕 `disabled`，也支援鍵盤 `ArrowLeft`／`ArrowRight`（`document` keydown 直接呼叫按鈕的 `.click()`，尊重 `disabled`）與滑動手勢。換頁目標一律用 `current * daysContainer.clientWidth` 計算——**不能用 `day.offsetLeft`**，它是相對最近的 positioned 祖先 `.spot-modal-dialog`，不是相對捲動容器本身，直接拿來設 `scrollLeft` 會算錯目標頁（雖然 `mandatory` snap 常常會自行校正回最近的合法頁面，掩蓋這個錯誤，寫測試時容易誤判「看起來正常」）。天數只有一天時不畫按鈕。每天的 `.spot-modal-itinerary-day-index` 徽章文字是「DAY 01 / 11」，天數為 1 時不顯示分母。單日站數多、`.spot-modal-itinerary-day` 本身要垂直捲動時，`.spot-modal-itinerary-date`（DAY 徽章＋日期那一列）用 `position: sticky; top: 0` 貼在該天最上面，不會被捲出畫面。背景是**捲動才出現**，不是固定貼一塊色塊：預設沒有背景（融入版面），`initTripItineraryStickyDates()` 監聽每個 `.spot-modal-itinerary-day` 的 `scroll`，`scrollTop > 0` 時才幫 `.spot-modal-itinerary-date` 加上 `is-pinned`（半透明霧面背景＋`backdrop-filter` 模糊＋往下淡出的 `mask-image`），捲回頂端時移除。一開始就給不透明背景會在靜止畫面上長出一條與周圍格格不入的色塊——這是實際踩到、被使用者回報過的問題，不要走回頭路。

**modal 開關與焦點管理**：`openTripModal(trip, byKeyboard)` 與 `closeTripModal(byKeyboard)` 都會先呼叫 `timelineEntries.forEach(e => e.classList.remove('is-expanded'))` 清除所有卡片展開狀態。關閉時：鍵盤（Escape）關閉只還原 `focusTarget.focus()`；滑鼠點擊關閉按鈕則在 `focus()` 之後再呼叫 `blur()`，防止節點殘留 `:focus` 狀態讓卡片重新顯示。`byKeyboard` 旗標由呼叫端傳入（keydown 事件傳 `true`，click 事件傳 `false`）。

**「已探索」／「旅行足跡」統計**：`mapLegend`／`mapStats` 一樣是由 `datedTimelineEntries` 推導，國家沿用 `dataset.country`（含國旗＋國名）去重；地區數改成把每個節點的 `dataset.regions` 攤平、去重計算——不是「節點數」，一趟旅程即使橫跨多個地區、時間軸上只有一個節點，地區數仍要反映真實數字。「旅行節點」這個統計已經拿掉，`.map-stats` 現在只有「國家」「地區」兩格。

## 首頁國家卡片列

`.country-strip` 桌機與手機是兩套互動：

- **桌機**：hover／`is-pointer-active` 觸發 3D 傾斜與鄰居推擠（`--card-push`）。`is-edge-shadowless` 由 `syncEdgeCardShadows()` 在 rAF 中計算，讓貼近容器左右 64px 內的卡片去掉陰影，避免陰影溢出邊界；只在 `min-width: 701px` 生效。
- **手機**：橫向 scroll-snap。點卡片**不會直接導航**——第一下把卡片置中並標記 `is-mobile-focused` / `is-mobile-activated`（展開「查看更多」），第二下才前往。捲動時 `syncMobileFocusedCard()` 以「最接近容器中心」重算焦點，點卡片列以外的地方會清除焦點。

新增國家卡片只要照既有 `.country-card` 結構寫，兩套互動與「查看更多」都會自動套用。

## 已知的遺留物

- `style.css` 仍有 `hero-cover`、`region-card-action`、`region-card-featured` 三個沒有對應 HTML 的 class，因為它們夾在共用 selector 裡，單獨拔除的風險大於收益。
- `@media (max-width: 700px)` 有 18 個區塊、`prefers-reduced-motion` 有 13 個，且有少數重複宣告（例：`.region-showcase-item` 的 `grid-template-columns` 在手機版被宣告兩次，後者勝出）。合併會改變宣告順序，要做的話得逐塊合併並每次跑測試 + 截圖比對。

## 新增內容的檢查點

- 新增國家：`countries/<country>/index.html` + `countries/<country>/<region>/index.html`，在 `main.js` 的 `travelDestinations` 加一筆，並在首頁加 `.country-card`（尚未建頁時用非連結的 `<div>`，不可留失效連結）。
- 新增地區頁：需要 `region-hero-<region>` class、四個章節 id（`overview` / `spots` / `food` / `stays`），並在 `region-detail.js` 的 `regionNames`、`regionSearchNames`、`regionContent`、`regionalVenueData` 補上對應 key（`stayBaseContent` 只有已累積住宿資料的地區才需要）；另外要在 `countries/japan/index.html` 加 showcase 項目、`style.css` 加 `.region-hero-<region>` 背景、`main.js` 的 `regionImageSlugs` 補上中文名對 slug 的一筆（時間軸資訊卡背景圖要用），以及 `tests/regions.mjs` 的 `REGION_NAMES`——測試群組的地區清單全部由那一份推導。
- 新增一趟旅程：在 `assets/js/trips.js` 的 `trips` 加一筆（`label`／`date`／`country`／`regions`／`teaser`／`description`／`itinerary`），首頁時間軸節點與旅程彈窗會自動出現，不用碰 `index.html`。`teaser` 是旅程彈窗的標題文字，建議 10 字內、根據這趟實際踏過的地點簡短描述；`description` 欄位仍需填寫以維持資料完整性，但目前不渲染。卡片本身只顯示主地區名（`regions[0]`）與 `yyyy.mm · 🇯🇵 國名`，不受這兩個欄位影響。
- 景點卡片只有一張時，記得刪掉 HTML 樣板裡第二張佔位卡；沒刪的話它會產生一列 fallback 假資料與無意義的地圖查詢。
- 圖片放 `assets/images/`，不依賴圖片 CDN。
- GitHub Pages 大小寫敏感，路徑大小寫必須與檔案系統完全一致。
