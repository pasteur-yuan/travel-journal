// 地區頁清單的單一來源。新增地區頁時只改這裡，各測試群組會自動涵蓋。
export const REGION_NAMES = {
  hokkaido: "北海道", tokyo: "東京", tochigi: "栃木", nagoya: "名古屋", osaka: "大阪",
  "ise-shima": "伊勢志摩", fukuoka: "福岡",
  kumamoto: "熊本", miyazaki: "宮崎", gifu: "岐阜", kagoshima: "鹿兒島",
  oita: "大分", saga: "佐賀", kyoto: "京都", kobe: "神戶", nagano: "長野",
  kagawa: "香川", kanagawa: "神奈川", yokkaichi: "四日市・鈴鹿",
  ehime: "愛媛", kochi: "高知", ishikawa: "石川", toyama: "富山",
  shizuoka: "靜岡", yamanashi: "山梨", shiga: "滋賀", okayama: "岡山",
  shimane: "島根", nagasaki: "長崎", fukui: "福井"
};

export const REGIONS = Object.keys(REGION_NAMES);

// fallback 的地圖查詢會補上地區名，用來檢查連結沒有指向別的地區。
// 這裡列出實際寫進 regionSearchNames 的字串（與頁面顯示名稱不一定相同）。
export const REGION_SEARCH_NAMES = {
  ...REGION_NAMES, yokkaichi: "三重", ishikawa: "金澤"
};

export const regionPage = (region) => `/countries/japan/${region}/index.html`;
