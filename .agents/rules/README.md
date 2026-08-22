# `.agents/rules` 使用說明

這個目錄把原本集中在根 `AGENTS.md` 的長篇規格拆成可按任務載入的模組，降低上下文噪音與規則被 32 KiB 上限截斷的風險。

## 載入方式

- Codex 不會自動掃描本目錄；根 `AGENTS.md` 的路由表會要求代理在動手前讀取相關檔案。
- 一個任務可能同時需要多份規則。例如修改地區頁 sticky 導覽，應讀 `design-system.md`、`region-detail.md` 與 `testing.md`。
- `.agents/rules/*.md` 是開發指令文件；`.codex/rules/*.rules` 才是 Codex 沙箱外命令的核准／禁止規則，兩者用途不同。

## 模組索引

- `architecture.md`：技術邊界、頁面模板、script 順序、資料流與新增頁面。
- `design-system.md`：視覺、主題、共用 chrome、響應式、動畫與可及性。
- `homepage.md`：世界地圖、國家卡片、時間軸與旅程 modal。
- `country-showcase.md`：國家頁全視窗地區清單。
- `region-detail.md`：地區頁章節、導覽、內容、地點 modal 與互動。
- `content-data.md`：旅遊資料的來源、分類、結構與撰寫原則。
- `i18n.md`：未來多語系的資料與 UI 規則。
- `testing.md`：修改流程、瀏覽器測試、人工檢查與 GitHub Pages。

## 維護原則

- 穩定且跨全站的規則才放根 `AGENTS.md`；領域細節放本目錄。
- 同一規則只保留一個權威位置，其他檔案以連結引用。
- 不記錄會快速過期的數量或「目前有幾頁」；改指向可執行的單一來源。
- 程式架構改變時，同一次變更更新對應規則；避免把已刪除檔案或舊資料流留在說明裡。
