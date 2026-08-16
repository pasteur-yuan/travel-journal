# Travel Journal

以 GitHub Pages 發布的純前端靜態旅行網站。

## 專案結構

```text
.
├── index.html                      # 首頁：世界地圖、國家卡片、旅行時間軸
├── AGENTS.md                       # 設計與內容規範
├── CLAUDE.md                       # 架構說明
├── assets/
│   ├── css/style.css               # 全站共用樣式與主題
│   ├── images/                     # 本地圖片資源
│   └── js/
│       ├── main.js                 # 首頁地圖、時間軸與國家卡片
│       ├── themes.js               # 主題定義
│       ├── theme-switcher.js       # 亮暗主題切換
│       ├── region-showcase.js      # 國家頁地區清單
│       └── region-detail.js        # 地區頁內容、導覽與彈窗
├── countries/
│   └── japan/
│       ├── index.html              # 日本總覽
│       ├── hokkaido/index.html     # 北海道
│       ├── tokyo/index.html        # 東京
│       ├── nagoya/index.html       # 名古屋
│       ├── osaka/index.html        # 大阪
│       ├── ise-shima/index.html    # 伊勢志摩
│       └── fukuoka/index.html      # 福岡
└── tests/
    ├── harness.mjs                 # 靜態伺服器、Chrome 啟動、CDP 封裝
    ├── run.mjs                     # 測試執行器
    └── suites/                     # 各頁面的行為測試
```

新增國家或地區時，依 `countries/<country>/index.html` 與 `countries/<country>/<region>/index.html` 的階層建立。

## 本機預覽

可直接用瀏覽器開啟 `index.html`，或使用任意靜態檔案伺服器預覽。

## 測試

以真實瀏覽器驗證互動、呈現與動畫的行為測試。零依賴，不需要 `npm install`：

```bash
node tests/run.mjs              # 全部
node tests/run.mjs timeline     # 只跑名稱含關鍵字的群組
```

需求：Node 22 以上與 Google Chrome。測試只在本機執行，不影響 GitHub Pages 的部署。
細節見 `tests/README.md`。

## GitHub Pages

將 repository 的 Pages Source 設定為 `main` branch 的根目錄即可發布。
