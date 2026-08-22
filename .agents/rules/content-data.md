# 旅遊內容與資料撰寫規則

## 適用範圍

新增或修改景點、美食、住宿、旅程、交通、Google Maps 連結或第三方圖片時必讀。

## 查證原則

- 先查官方觀光網站、地方觀光協會、店家官方網站、交通業者或住宿業者；官方資料不足時才用可信旅遊資料交叉確認。
- 確認正式名稱、所在地、交通方式與目前是否仍營業。營業時間、休業日、價格、評價與住宿費容易變動，不寫成永久事實。
- 店名、日文專有名詞與地址保留官方寫法；不確定時保留待確認，不編造或錯置到相近地區。
- 最終回覆列出主要資料來源，並說明是熱門／定番整理或使用者提供清單的查證，不宣稱涵蓋所有店家／景點。

## 地區頁內容層級

- 景點外層項目代表地區或城市，例如「小樽」「札幌」「函館」；實際景點放在該項目的 modal 資料列。
- 美食外層項目可以是料理或飲食主題，不必強制歸到城市；每個主題有自己的店家資料列，不得讓所有分類共用同一份清單。
- 住宿外層項目代表住宿地點或區域；實際飯店、旅館、民宿放在 modal，並提供交通與 Google Maps。
- 每個分類可有任意數量，不以三項為上限。只有一個真實項目時，刪除多餘 seed，避免產生 fallback 假資料。
- 地區顯示資料放 `regionContent`、`stayBaseContent` 或 `regionAdditionalContent`；modal 明細放 `regionalVenueData`。不可把不同地區混在無法依 `regionKey` 查找的共用陣列。
- `regionalVenueData` 結構固定為「地區 → `spots|food|stays` → 外層標籤 → `[名稱, 資訊, 交通, 地圖網址?][]`」。外層標籤必須與執行後 DOM 的 `<span>` 文字完全一致。
- 沒有指定地圖 URL 時由名稱產生搜尋；fallback 必須加目前地區名稱，不可指向其他地區。

## 首頁旅程資料

- 真實旅程只寫入 `assets/js/trips.js::trips`，不要同時在首頁 HTML 或地區頁維護副本。
- 每趟旅程包含 `label`、第一天 `date`、`country`、全部 `regions`、`teaser`（保留欄位，不渲染於卡片）、完整 `description` 與按日期排序的 `itinerary`。
- 一趟跨多地區仍是一個 trip；`regions` 列出實際踏過的所有地區，第一項視為時間軸主標籤。
- itinerary 每天包含 `date`、可選 `theme` 與依序排列的 `stops`。每站欄位為 `time`、`place`、可選 `type`、可選 `note`、可選 `transport`。
- `transport` 表示前往下一站的方式與耗時；最後一站通常不填。原始資料沒有交通時保持空白，不補假的箭頭文字。
- `teaser` 欄位保留以維持資料結構完整性，但**目前不渲染於時間軸資訊卡**；資訊卡只顯示 `regions[0]`（地區名）與 `yyyy.mm · 國名` 兩行。`description` 描述整趟行程，用於旅程彈窗標題，不拆成互相矛盾的地區片段。
- 不為展示效果加入虛構 Coming soon 旅程；時間軸、統計與 modal 只反映有資料的真實旅程。

## Google Maps 與圖片

- 通用地圖格式為 `https://www.google.com/maps/search/?api=1&query=...`，查詢字串使用 `encodeURIComponent`。
- 桌面連結使用新分頁並加 `rel="noopener noreferrer"`；手機允許系統優先開啟 Google Maps App，未安裝則回行動網頁。
- 旅遊照片下載到 `assets/images/`，提交第三方照片時更新 `assets/images/ATTRIBUTIONS.md` 的地區、作者、授權與來源。
- 不新增遠端圖片 URL。時間軸既有 Unsplash 圖是 `TASKS.md` 記錄的歷史例外，不得複製成新慣例。
