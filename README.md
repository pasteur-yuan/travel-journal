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
└── countries/
    └── japan/
        ├── index.html              # 日本總覽
        ├── hokkaido/index.html     # 北海道
        ├── tokyo/index.html        # 東京
        ├── nagoya/index.html       # 名古屋
        ├── osaka/index.html        # 大阪
        ├── ise-shima/index.html    # 伊勢志摩
        └── fukuoka/index.html      # 福岡
```

新增國家或地區時，依 `countries/<country>/index.html` 與 `countries/<country>/<region>/index.html` 的階層建立。

## 本機預覽

可直接用瀏覽器開啟 `index.html`，或使用任意靜態檔案伺服器預覽。

## GitHub Pages

將 repository 的 Pages Source 設定為 `main` branch 的根目錄即可發布。
