# 地區詳細頁規則

## 適用範圍

修改 `countries/japan/<region>/index.html`、`assets/js/region-detail.js`、地區 Hero／分類導覽／內容項目／地點 modal 或相關 CSS 時必讀。

## 頁面與章節

- 地區頁是單頁章節式結構，內容直接攤平，不建立景點、美食或住宿子頁。
- 目前固定章節為 `overview`、`spots`、`food`、`stays`。旅行筆記與完整行程已移到首頁 `trips.js`／時間軸 modal，不在地區頁保留 `notes` 章節或 `region-notes.js`。
- 所有主要章節留在 DOM 中，不以 tabs 隱藏。
- `overview` 標題是一句摘要；其他導覽文字必須與 JavaScript 執行後的章節標題完全一致。
- `stays` 執行後固定顯示 `STAY`／「住宿」，不顯示獨立交通分類；住宿項目沿用景點／美食的條列結構。

## Hero 與分類導覽

- Hero 使用 `.region-hero-<slug>` 本地圖片、主題色柔邊、窄幅 CSS mask 與適度圓角；不要加明顯白框或固定白色光暈。
- Hero 英文小標由 `region-detail.js::regionNames` 依 class 注入；新增地區必須補 key。
- 入場維持 `is-region-entering`／`is-region-entered` 的中央展開；reduced motion 下取消大幅過場。
- `.region-section-nav` 位於 Hero 下方並 sticky 在 site header 下。頁面向下捲到內容中後段時仍要留在視窗內，且不可遮住 header 或章節標題。
- 導覽使用頁內錨點，不重新載入。點擊時沿用自訂慢速平滑捲動與連續減速，目標扣除 header＋sticky nav 高度。
- `IntersectionObserver` 隨捲動更新目前分類；目前項目使用暖橘色文字與既有玻璃狀態。
- 桌面項目平均分配；手機可水平滑動，但頁面內容仍使用 body 的單一垂直捲動。
- 導覽 hover／focus 顯示無硬邊的 radial 光暈，中心追蹤游標；離開整個導覽列後才隱藏。

## 內容注入

- HTML 是最小 seed，實際內容由 `region-detail.js` 依 `.region-hero-<slug>` 解析出的 `regionKey` 注入；檢查結果要看瀏覽器執行後 DOM。
- 所有地區走相同資料流：`regionContent` 覆寫基本內容，`stayBaseContent` 提供第一筆住宿，`regionAdditionalContent` 追加項目，`regionSearchNames` 提供 fallback 搜尋地區。
- 動態項目使用既有 `createRegionContentItem('card'|'list')`，不要手寫不同 DOM 或另綁事件。
- 景點、美食、住宿統一為編輯式條列卡：左側分類，右側標題與簡述；可用淡 separator，但不能形成整體外框。
- 摘要資訊列與內容卡使用玻璃面板、柔和陰影與游標光斑。動態新增項目必須透過既有事件代理取得 hover、focus、光暈與 modal。

## 地點 modal

- 景點、美食與住宿項目可用滑鼠、Enter 或 Space 開啟同一個 `.spot-modal`。
- 支援 backdrop 點擊、關閉按鈕、Escape，關閉後回復開啟前 focus；開啟時鎖定 body 捲動。
- modal 文字下方是可垂直滑動、隱藏 scrollbar 的四欄資料表，順序固定為「地名、資訊、交通方式、Google Map」。
- 標題列與資料列之間只留一條 separator；資料列彼此不用分隔線。
- 查表只走 `regionalVenueData[regionKey][sectionName][itemLabel]`。每列是 `[名稱, 說明, 交通, 地圖網址?]`；沒有第四欄時以名稱產生通用 Google Maps 搜尋。
- fallback 查詢必須使用目前 `regionKey` 對應的 `regionSearchNames`，絕不可寫死北海道或其他單一地區。
- Google Maps URL 使用 `https://www.google.com/maps/search/?api=1&query=...` 並 encode。桌面新分頁開啟；手機交由系統處理 App／行動網頁。

## 捲動與互動約束

- 不得讓 `.region-detail`、`.region-sections` 或單一 section 再形成第二個垂直捲動容器。
- 光暈座標用 rAF 與 CSS custom properties 更新，不對 `left`／`top` 加 transition。
- hover／focus 浮起不改變其他項目的排版位置；觸控需有 click／tap 替代。
- reduced motion 下停用自訂平滑捲動、光暈追蹤、浮起與 Hero 大幅過渡，但 active、focus 與 modal 功能不變。
