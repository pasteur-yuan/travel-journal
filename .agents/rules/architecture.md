# 架構與資料流規則

## 適用範圍

修改專案結構、共用 JavaScript、資料來源、script 載入順序、相對路徑，或新增國家／地區頁時必讀。

## 技術架構

- 網站是 GitHub Pages 靜態站：原生 HTML、CSS、Vanilla JavaScript，沒有後端、資料庫、套件管理或打包。
- 網站與測試維持零安裝依賴；不要建立 `package.json`。測試由 Node 內建模組啟動靜態伺服器並透過 CDP 驅動本機 Chrome。
- classic script 必須能在 `file://` 下運作；不要改成會被本機檔案安全限制阻擋的 module 載入方式。
- 外部程式資源只沿用 Font Awesome、amCharts 與 Google Fonts。地圖 CDN 失效時，頁面其他內容仍須可用。

## 主要檔案與責任

```text
index.html                          首頁模板
assets/css/style.css                全站樣式與主題
assets/js/trips.js                  真實旅程與完整行程資料
assets/js/main.js                   首頁 DOM 建立與互動
assets/js/themes.js                 主題定義
assets/js/theme-switcher.js         亮暗切換與狀態保存
assets/js/region-showcase.js        國家頁 showcase 互動
assets/js/region-detail.js          地區頁內容注入、導覽與地點 modal
countries/japan/index.html          日本國家頁模板
countries/japan/<region>/index.html 地區頁模板
tests/regions.mjs                   地區 slug／顯示名與測試涵蓋來源
tests/suites/                       真實瀏覽器測試
tools/generate-region-page.mjs      新地區頁產生器
```

`CLAUDE.md` 可提供歷史背景，但程式、測試與本規則有差異時，以目前可執行程式、測試及使用者最新要求為準。

## 三種頁面模板與 script

| 類型 | 路徑 | 關鍵 script 與順序 | 資產相對深度 |
|---|---|---|---|
| 首頁 | `index.html` | amCharts CDN → `trips.js` → `main.js` → `themes.js` → `theme-switcher.js` | `assets/...` |
| 國家頁 | `countries/<country>/index.html` | `themes.js` → `theme-switcher.js` → `region-showcase.js` | `../../assets/...` |
| 地區頁 | `countries/<country>/<region>/index.html` | `themes.js` → `theme-switcher.js` → `region-detail.js` | `../../../assets/...` |

- `themes.js` 必須先於 `theme-switcher.js`。
- `trips.js` 宣告 `main.js` 使用的全域 `trips`，必須先載入。
- script 放在 `</body>` 前並沿用 classic script；新增頁面時不要任意調換順序。
- 複製對應模板的 DOM、class、可及性屬性與相對路徑，不另建近似模板。

## HTML seed 與執行後 DOM

- HTML 只保留靜態頁面骨架或最小 seed；`main.js` 與 `region-detail.js` 會建立、覆寫或追加實際內容。
- 判斷功能是否完成時，必須在瀏覽器中檢查執行後 DOM。只搜尋原始 HTML 不足以判斷時間軸、住宿清單、modal 或動態內容。
- 動態新增內容要走既有建立器、資料 map、事件代理或 `MutationObserver`，不能手動複製每個事件監聽器。

## 單一來源與同步邊界

- `tests/regions.mjs::REGION_NAMES` 是地區頁 slug 與測試遍歷的權威清單；測試群組都應由它推導，不再各自維護陣列。
- `assets/js/trips.js::trips` 是首頁旅程資料的唯一來源。`main.js` 依它產生 `.timeline-entry`、年份群組、已探索清單、統計與旅程 modal。
- `main.js::travelDestinations` 是地圖 marker、tooltip、高亮與目的連結的同一來源。
- `main.js::countryRegions` 是首頁國家卡片的地區跑馬燈來源；它必須與國家頁 showcase、實際頁面及 `REGION_NAMES` 對齊。
- `main.js::regionImageSlugs`（中文地區名 → 地區頁主視覺檔名，含副檔名）決定時間軸資訊卡與旅程彈窗頂部共用哪張地區頁主視覺（`regionCardImage(trip)` 統一查表）；同樣要與 `REGION_NAMES` 對齊，缺 key 會退回泛用的 `japan.jpg`。新地區頁通常先用 `.svg` 佔位圖，副檔名要跟 `style.css` 的 `.region-hero-<slug>` 一致，不能寫死 `.jpg`。
- 地區頁所有地區共用 `region-detail.js` 的 `regionNames`、`regionSearchNames`、`regionContent`、`stayBaseContent`、`regionAdditionalContent` 與 `regionalVenueData`。不得增加 `if (regionKey === ...)` 式的專屬渲染路徑。
- `regionalVenueData` 固定為「地區 → `spots|food|stays` → 外層項目標籤 → 資料列陣列」。每個項目可以有自己的資料表，但渲染器必須共用。

## 新增頁面檢查點

新增國家：

- 建立 `countries/<country>/index.html` 與需要的地區頁。
- 在 `travelDestinations` 加國家資料，並在首頁增加 `.country-card`。頁面未建立前用非連結的可及性 Coming soon 卡片，不可留失效連結。
- 建立該國家的 showcase 資料與正確相對路徑。

新增日本地區：

- 優先使用並同步維護 `tools/generate-region-page.mjs`，再依現有頁面檢查產物。
- 頁面要有 `region-hero-<slug>`、`overview`／`spots`／`food`／`stays` 四個章節，以及正確 breadcrumb、script 與 favicon 路徑。
- 同步更新 `tests/regions.mjs::REGION_NAMES`、日本 showcase、`main.js::countryRegions`、`main.js::regionImageSlugs`、`style.css` 的 Hero 圖片，以及 `region-detail.js` 所需資料 key。
- `regionNames` 缺 key 時 Hero 英文小標會留下佔位文字；`regionSearchNames` 缺 key 時 fallback 地圖查詢可能錯區。
- 新增的本地照片同步記錄 attribution；不要重新引用歷史 SVG 佔位圖。
