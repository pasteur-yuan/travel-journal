# 首頁規則

## 適用範圍

修改 `index.html`、`assets/js/trips.js`、`assets/js/main.js`，或首頁地圖、國家卡片、旅行時間軸及旅程 modal 時必讀。視覺修改另讀 `design-system.md`，程式修改另讀 `testing.md`。

## 世界時區地圖

- Hero 使用 amCharts 世界時區資料。整段初始化必須保留 `window.am5 && window.am5map` 防護；CDN 失效時其他首頁內容仍可顯示。
- marker 一律由 `main.js::travelDestinations` 產生，不在 HTML 寫死，也不為單一國家另做分支。每筆資料同時提供國旗、名稱、時區、經緯度、目標頁、`code` 與 `mapId`。
- marker 位置透過地理投影／`chart.convert()` 計算並在 bounds 改變時更新；不可用只適合單一螢幕的像素偏移。日本以東京座標為定位基準。
- 只有已加入的國家顯示 marker。未 focus 時是小型 emoji；hover／focus 顯示 emoji、國名與時區，並同步 tooltip、多邊形高亮與連結。
- tooltip 可浮出地圖內容層但不能被容器切掉；離開地圖或 focus 到固定資訊框時隱藏。
- 夜晚區域保留三份跨日期變更線的遮罩與柔邊低對比陰影；三份在時間更新、resize 與顯示切換時必須一起處理。地圖本身不播放多餘載入動畫，夜晚遮罩可由中央向左右展開。
- 地圖邊界貼齊容器，紐西蘭等邊緣小國仍要可見。

固定資訊元件：

- 左上顯示 `MY TRAVEL WORLD`／`世界那麼大`。
- 右上「已探索」與右下「旅行足跡」收合時只顯示標籤，hover、focus 或點擊後垂直展開。
- 資訊框寬度固定、內容置中，只以高度、透明度與少量垂直位移展開；不做水平滑入或縮放。
- 兩個資訊框使用 `role="button"`、`tabindex="0"`、`aria-expanded`，支援 click、Enter、Space 與點外收合，且彼此狀態獨立。
- 清單與統計由有效旅程推導，不在 HTML 維護另一份國家／地區數字。

## 國家卡片列

- 使用 `.country-strip` 水平獨立捲動與 `.country-card` 固定基礎寬度。卡片增加時不得撐寬整頁，桌面與手機都隱藏原生 scrollbar。
- 已完成國家使用 `<a>`；未建目標頁的 Coming soon 使用非連結可及性卡片，不建立失效 href。
- 卡片使用本地國家照片、深色漸層與白色文字。hover／focus 可 scale、3D 傾斜、推開鄰居、加光暈與陰影，但不得被容器裁切或碰撞。
- 離開卡片要立即恢復，新卡片順暢接手 focus；卡片自己的 z-index、陰影與光暈位於互動層上方。
- 桌面維持既有游標傾斜、鄰居推擠與邊緣陰影同步；不要用 layout width 改變製造推擠。
- 手機維持 scroll-snap 與兩段式操作：第一次 tap 置中並顯示「查看更多」，第二次才導航；滑動後依最接近容器中心的卡片更新焦點。觸控滑動只捲動，不觸發桌面 hover／3D。
- 新增卡片沿用既有 class、國家代碼、名稱、狀態與可及性屬性；`.country-meta-action` 等由既有 `main.js` 初始化補齊。

## 旅程資料與時間軸

`assets/js/trips.js::trips` 是唯一旅程來源。每筆資料：

- `label`：顯示年月。
- `date`：第一天日期，用於年份分組。
- `country`：國旗與國名。
- `regions`：實際踏過的地區陣列，第一筆是卡片主地區，完整陣列用於統計與可及性名稱。
- `teaser`：旅程彈窗的標題文字，建議 10 字內、根據這趟實際踏過的地點簡短描述；不渲染於時間軸資訊卡。
- `description`：整趟旅程的完整摘要，保留於資料結構但目前不渲染。
- `itinerary`：依日期排列的 day 陣列；每個 stop 包含時間、地名、類型、備註及前往下一站的 `transport`。

**時間軸資訊卡 DOM 結構**：`buildTimelineEntry()` 產生的 `.timeline-card` 內容順序為：
1. `<strong>` — `regions[0]`（主地區名，大字，卡片左下角）
2. `<span class="timeline-code">` — `yyyy.mm · 🇯🇵 國名`

卡片以 `flex-direction: column; justify-content: end; align-items: flex-start` 對齊，地區名在下方靠左。不要在 `<strong>` 與 `<span>` 之間插入額外文字元素。

卡片背景圖依 `regions[0]` 換成對應地區頁主視覺，不是全日本共用一張：`main.js` 的 `regionCardImage(trip)` 用 `regionImageSlugs`（中文地區名 → slug）查出 slug，回傳 `url("../images/<slug>.jpg")`；查不到就退回 `japan.jpg`。**要寫 `../images/<slug>.jpg`，不能寫 `assets/images/<slug>.jpg`**——自訂屬性裡的相對路徑是相對 `style.css` 解析，不是相對 `index.html`。

`regionCardImage()` 同時餵給資訊卡（`--timeline-card-image`）與旅程彈窗頂部（`--spot-modal-image`，`.spot-modal-hero` 包住彈窗的 label／h2，只有首頁旅程彈窗有這層，地區頁地點彈窗不受影響），換地區時兩處自動一起換，讓從資訊卡點進去的彈窗視覺上是同一張圖的延伸。

規則：

- `main.js` 由 `trips` 動態建立 `.timeline-entry`；不要在 `index.html` 手寫旅程節點或假資料。
- 單筆 `date` 無法解析時，只略過該筆並在 console 提示，不能讓整條時間軸消失。
- 年份範圍從最早有效旅程到 `max(今年 + 1, 最晚旅程年份)`；無旅程的未來預留年份不可展開，有排程的未來年份可以展開。
- 同一時間只展開一個年份。線段連續，所有點位於同一條水平線；下一預留年份維持最右。
- 「已探索」國家與「旅行足跡」地區數由有效旅程的 `country`／`regions` 推導。一趟跨多地區仍只有一個時間軸節點，但每個地區都計入統計。

桌面互動：

- 點年份時平順移到主要視覺位置並收合其他卡片；不得因切換年份自動觸發卡片 hover。
- 只有滑鼠移到旅程點（`:hover`）或鍵盤 Tab 聚焦（`:focus-visible`）或點觸圓點（`.is-expanded`）時顯示卡片；未觸發任一條件則卡片完全隱藏（`visibility: hidden`）。
- **禁止使用 `:focus-within` 控制卡片 `visibility`**：程式關閉 modal 後會呼叫 `focusTarget?.blur()`，`:focus-within` 會在此時意外讓卡片重新顯示一截。
- 年份群組的卡片交替向下／向上展開，向上卡片不可遮住標題，時間軸容器要保留完整浮出空間。
- 點已展開卡片或以鍵盤 Enter／Space 開啟旅程 modal。

手機互動：

- 700px 以下改用垂直時間軸；年份或圓點操作時頁面本身完全不捲動。
- 年份群組因 `display` 變更產生的位移使用既有 FLIP：上方群組不動，下方群組沿慢速煞停曲線移動。
- 時間軸鎖定所有年份配置中的最大必要高度，避免收合後文件變短造成瀏覽器夾動 scroll position。
- 圓點第一次 tap 展開該卡，第二次只收回卡片、光點與浮起狀態，不收折年份群組；收回後保留原始佔位高度。
- 觸控殘留 `:hover` 不能控制展開；觸控狀態只由 `is-expanded` 或鍵盤 focus 決定，hover 規則限於 `(hover: hover)`。

## 旅程 modal

- modal 顯示整趟 `itinerary`，跨地區行程仍維持一份按日期排序的連續清單。
- 每站依序顯示時間、地名、類型、備註與前往下一站的交通；最後一站沒有 `transport` 時不編造。
- `.spot-modal-itinerary` 用 `flex: 1; min-height: 0` 撐滿對話框剩餘高度，不能寫死 `height`（會在對話框底部留空白）。這需要 `.spot-modal-dialog` 是定值 `height`（不是 `min-height`）——只有 `min-height` 時 `flex: 1` 沒有邊界可撐，會退化成用內容高度撐開對話框，實測會爆到兩千多 px。`.spot-modal-table-wrap`（地區頁地點彈窗）是平行、互斥顯示的另一條路徑，維持寫死高度，不受影響。
- 天數用左右翻頁瀏覽，不是上下捲動：`.spot-modal-itinerary-days` 一次顯示一天，原生水平捲動＋`scroll-snap-type: x mandatory`，左右按鈕與 `ArrowLeft`／`ArrowRight` 都呼叫同一個 `goTo(index)`；換頁目標用 `index * clientWidth`，不要用子元素的 `offsetLeft`（相對 `.spot-modal-dialog` 量，不是相對捲動容器，會算錯）。只有一天時不畫按鈕。
- 單日站數多時 `.spot-modal-itinerary-day` 自己垂直捲動，`.spot-modal-itinerary-date`（DAY 徽章＋日期）用 `position: sticky; top: 0` 貼在最上面。背景不是固定存在——預設沒有背景，`scrollTop > 0` 時才加 `is-pinned`（霧面背景＋blur＋往下淡出），避免靜止畫面上出現一條突兀的色塊。
- 支援背景點擊、關閉按鈕、Escape；開啟後 focus 進入 modal，關閉後還原原焦點。
- modal 開啟時鎖定頁面捲動；樣式與地區頁 modal 共用現有 class，不另造相似視窗系統。
- **開關 modal 時必須清除所有節點的 `.is-expanded`**：`openTripModal()` 與 `closeTripModal()` 都呼叫 `timelineEntries.forEach(e => e.classList.remove('is-expanded'))`。
- **關閉 modal 的焦點還原策略**：鍵盤（Escape / Enter／Space）關閉時保留 `focusTarget.focus()`，滑鼠點擊關閉按鈕時額外呼叫 `focusTarget.blur()`，避免 `:focus` 狀態讓已收折的卡片殘留。`openTripModal` 接受 `byKeyboard` 旗標（預設 `false`），鍵盤觸發時傳 `true`。
