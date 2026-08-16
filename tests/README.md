# 測試

以真實瀏覽器驗證互動、呈現與動畫的行為測試。**零依賴**：使用 Node 內建的
HTTP 伺服器與 WebSocket，直接透過 Chrome DevTools Protocol 驅動 headless Chrome，
不需要 `npm install`，與這個專案「無建置流程」的定位一致。

## 執行

```bash
node tests/run.mjs              # 全部
node tests/run.mjs timeline     # 只跑檔名或群組名稱含關鍵字的
node tests/run.mjs 手機版        # 中文關鍵字也可以
```

需求：Node 22 以上（要有內建的 `WebSocket`）與 Google Chrome。
Chrome 不在預設路徑時，用環境變數指定：

```bash
CHROME_PATH="/path/to/chrome" node tests/run.mjs
```

離線環境下 amCharts、Font Awesome、Google Fonts 無法載入，
地圖 marker 相關檢查會標記為「略過」而非失敗，其餘測試照常執行。

## 檔案結構

```text
tests/
├── harness.mjs        # 靜態伺服器、Chrome 啟動、CDP 封裝、斷言記錄
├── run.mjs            # 執行器
└── suites/
    ├── pages.mjs            # 全站載入、資源路徑、內部連結、可及性
    ├── home-map.mjs         # 世界地圖 marker、時區 tooltip、已探索與旅行足跡
    ├── home-cards.mjs       # 國家卡片的光暈、3D 傾斜、卡片列捲動
    ├── timeline-desktop.mjs # 桌面版時間軸
    ├── timeline-mobile.mjs  # 手機版時間軸、FLIP 滑動、殘留 hover、reduced-motion
    ├── timeline-data.mjs    # 新增旅程資料時的樣板行為與邊界
    ├── country-showcase.mjs # 國家頁地區清單、動態新增、按壓回彈
    ├── region-content.mjs   # 地區頁結構、資料注入、光暈、分類導覽
    ├── region-modal.mjs     # 內容彈窗、鍵盤操作、Google Maps 連結
    └── theme.mjs            # 亮暗主題切換與記憶
```

## 撰寫新測試

```js
import { suite } from "../harness.mjs";

export const example = suite("群組名稱", async (b, t) => {
  await b.desktop();                    // 或 b.mobile()
  await b.goto("/index.html");
  await b.hover(".country-card-japan"); // 真實滑鼠事件
  t.check("斷言名稱", 條件, "失敗時顯示的細節");
});
```

`b` 的常用方法：`desktop()`、`mobile()`、`reducedMotion()`、`goto()`、`eval()`、
`hover()`、`click()`、`tap()`、`press()`、`focus()`、`scrollIntoView()`、`moveAway()`；
`b.errors` 收集頁面內未攔截的 JS 例外，`b.failedRequests` 收集載入失敗的資源。

## 兩個容易踩到的陷阱

**量測捲動位置前要先靜置。** `hover()`／`click()`／`tap()` 預設會先
`scrollIntoView`，那個位移會被誤算成受測程式造成的捲動。要量捲動時，
先呼叫 `scrollIntoView()` 靜置，再用 `tap(sel, { scroll: false })`。

**驗證事件代理要用真實滑鼠事件。** 代理讀的是 `event.target`；
若用 `document.dispatchEvent()` 模擬，`target` 會是 `document` 而測不出真實行為。
改用 `b.hover()` 送出真的 `Input.dispatchMouseEvent`。

## 這套測試涵蓋與不涵蓋的

涵蓋：DOM 狀態、CSS 計算值、捲動位置、動畫中途取樣（位移是否遞減）、
鍵盤操作、focus 行為、資源載入、連結有效性。

**不涵蓋**：實機觸控手感、視覺外觀是否好看、真實 iOS Safari 的
殘留 `:hover`（測試以真實滑鼠移入重現該狀態，機制相同但不是同一個瀏覽器）。
這幾項仍需實機確認。
