# Travel Journal AI 開發指南

本檔是專案根目錄的核心指令與規則路由器。Travel Journal 是部署於 GitHub Pages 的純前端旅遊網站，目標是維持「暖色液態玻璃旅行檔案館」的視覺與一致、可驗證的原生互動。

## 開始工作前：載入相關規則

Codex 會自動載入根目錄的 `AGENTS.md`，但**不會自動載入** `.agents/rules/*.md`。開始修改前，依任務範圍完整讀取下表中的規則；同時符合多列時全部讀取。若不確定範圍，至少讀取 `architecture.md` 與 `testing.md`。

| 任務範圍 | 必讀規則 |
|---|---|
| 專案結構、資料流、新增頁面、共用模組、路徑 | `.agents/rules/architecture.md` |
| CSS、主題、頁首／頁尾、響應式、動畫、可及性 | `.agents/rules/design-system.md` |
| 首頁地圖、國家卡片、旅行時間軸、旅程 modal | `.agents/rules/homepage.md` |
| 國家頁、日本地區 showcase | `.agents/rules/country-showcase.md` |
| 地區頁、分類導覽、內容注入、地點 modal | `.agents/rules/region-detail.md` |
| 景點／美食／住宿／旅程資料的查詢與撰寫 | `.agents/rules/content-data.md` |
| 多語系或任何可翻譯文案 | `.agents/rules/i18n.md` |
| 程式、樣式、模板、素材或測試的任何修改 | `.agents/rules/testing.md` |

`.agents/rules/` 是本專案用來分割長篇開發指令的文件目錄，不是 Codex 的命令核准機制。官方的命令規則位於 `.codex/rules/*.rules`，兩者不可混用。目錄用途與維護方式見 `.agents/rules/README.md`。

## 不可違反的專案邊界

- 使用原生 HTML、CSS 與 Vanilla JavaScript；不引入 React、Vue、Angular 或其他前端框架。
- 網站沒有後端、資料庫或建置流程，必須能從靜態檔案部署，也必須能以 `file://` 或簡單靜態伺服器開啟。
- 不新增 `package.json` 或需要安裝的網站／測試依賴，除非使用者明確要求。測試只使用 Node 內建模組與本機 Chrome。
- 優先沿用既有 CSS custom properties、DOM 結構、共用建立器與事件代理；不要為單一國家、地區或項目複製一套近似邏輯。
- 所有相對路徑以實際頁面深度為準；GitHub Pages 大小寫敏感，不可寫入本機絕對路徑或敏感資訊。
- 旅遊照片放在 `assets/images/`。新增第三方照片時，同步在 `assets/images/ATTRIBUTIONS.md` 記錄地區、作者、授權與原始來源；不可再新增圖片 CDN 例外。
- Font Awesome、amCharts 與 Google Fonts 是目前允許的外部程式／字型資源；新增其他外部依賴前先取得使用者同意。

## 先認清單一資料來源

- 地區 slug 與測試涵蓋清單：`tests/regions.mjs` 的 `REGION_NAMES`。不要在規則文件寫死地區數或頁面數。
- 首頁真實旅程與完整行程：`assets/js/trips.js` 的 `trips`；`main.js` 依此建立時間軸、已探索清單與旅行足跡統計。
- 地圖國家 marker：`assets/js/main.js` 的 `travelDestinations`。
- 國家卡片的地區跑馬燈：`assets/js/main.js` 的 `countryRegions`，需與實際頁面、國家頁 showcase 及 `tests/regions.mjs` 對齊。
- 地區名稱、摘要與景點／美食／住宿內容：`assets/js/region-detail.js` 的共用資料 map。
- 地點 modal 資料：`regionalVenueData`，結構固定為「地區 → 分類 → 項目標籤 → 資料列」。不得為個別地區新增專屬陣列或渲染分支。
- `TASKS.md` 是待辦與資料缺口，不是已完成規格；除非使用者要求執行，不要順手實作其中項目。

## 工作方式

修改前：

- 先執行 `git status --short`，辨識並保留使用者尚未提交的修改。
- 先以 `rg` 搜尋既有 class、id、資料 key、建立器與測試，確認執行後 DOM，而非只看 HTML seed。
- 只處理本次要求；發現過時註解或相鄰問題時可回報，不要無關重構。

修改時：

- 三種頁面模板共用既有 DOM、CSS 與 JavaScript；新增同類頁面時複製正確模板，不另造平行實作。
- 動態內容必須沿用共用建立器、事件代理與資料 map，不能只讓初始 seed 正常。
- 互動必須同時考慮滑鼠、鍵盤、觸控與 `prefers-reduced-motion`。
- 規格與目前程式／測試衝突時，先查明哪一方過時；不要靠固定數量或歷史敘述猜測。

修改後：

```bash
git diff --check
node tests/run.mjs
```

完整驗證細節見 `.agents/rules/testing.md`。文件專用變更可不跑瀏覽器測試，但仍需執行 `git diff --check` 並檢查所有規則連結存在。

## 維護這套指令

- 根 `AGENTS.md` 只放所有任務都需要的硬性限制、單一來源與路由，目標維持精簡並低於 Codex 預設 32 KiB 指令上限。
- 頁面或領域專屬規則放進對應 `.agents/rules/*.md`，同一規則只寫一次。
- 不在規則中記錄測試通過數、頁面數、資料列數或一次性修正歷史；這些易變資訊放 `TASKS.md`、測試輸出或版本紀錄。
- 新增規則時描述「適用範圍、必須維持的行為、驗證方式」，避免只記錄當時的實作故事。
- 若新增規則模組，必須同步更新本檔路由表與 `.agents/rules/README.md`。
