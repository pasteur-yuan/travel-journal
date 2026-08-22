// 首頁時間軸與旅程彈窗的唯一資料來源。取代先前的 region-notes.js——旅行筆記
// 不再顯示在地區頁，改成在首頁時間軸點擊資訊卡時開彈窗顯示。跟 themes.js
// 同一類：純 classic script、宣告全域 const，不用 type="module"（file:// 直接
// 開啟時 Chrome 會擋掉 module script）。main.js 會依這份資料動態產生時間軸節點，
// 不再手寫在 index.html 裡——之後新增一趟旅程，只要在這裡加一筆。
//
// 每筆是一個 trip：
//   label       時間軸卡片與彈窗上顯示的年月標籤，例如 '2026 / 03'
//   date        行程第一天的日期，時間軸用來推算年份分組
//   country     國旗＋國名，例如 '🇯🇵 日本'（跟「已探索」清單既有格式一致）
//   regions     這趟旅程實際踏過的地區 tag 陣列（可以不只一個），供「已探索」
//               「旅行足跡」的地區數統計使用；不代表地圖上會依地區拆開顯示
//   teaser      時間軸卡片展開時顯示的短句（.timeline-card 固定高度、
//               overflow:hidden、justify-content:end，太長會把上面的日期／
//               地區名擠出可視範圍），控制在跟舊資料同等長度（約 10 字）
//   description 彈窗標題顯示的完整一句話敘述，涵蓋整趟行程，不是單一地區的片段
//   itinerary   完整行程，「天」的陣列，依日期依序排列，不依地區拆分——
//               即使同一趟旅程橫跨多個地區，也是同一份連貫清單。每天依序列出
//               停留點；stops 裡的 transport 是前往下一個停留點的方式與耗時，
//               最後一站沒有 transport（原始資料本來就沒有，不是漏填）。
const trips = [
  {
    label: '2026 / 03',
    date: '2026-03-21',
    country: '🇯🇵 日本',
    regions: ['福岡', '大分', '佐賀'],
    teaser: '博多市區與湯布院溫泉',
    description: '從博多市區出發，安排湯布院溫泉街的一日遠足，回程路上也在新鳥栖稍作停留，收進這趟九州行程裡。',
    itinerary: [
      { date: '2026-03-21', theme: '', stops: [
        { time: '11:15', place: '福岡國際機場', type: '交通', note: '抵達；停留2小時', transport: '21分' },
        { time: '13:36', place: 'Bread, Espresso & Hakata &&', type: '美食', note: '午餐；停留1小時', transport: '10分' },
        { time: '14:46', place: '博多阪急', type: '', note: '停留2小時', transport: '6分' },
        { time: '16:52', place: 'check-in博多微笑飯店', type: '住宿', note: '停留1小時30分', transport: '3分' },
        { time: '18:25', place: '博多牛雜鍋前田屋 博多店', type: '美食', note: '晚餐；停留1小時', transport: '19分' },
        { time: '19:44', place: '天神地下街', type: '', note: '停留1小時', transport: '18分' },
        { time: '21:02', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '' },
      ] },
      { date: '2026-03-22', theme: '', stops: [
        { time: '08:00', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '36分' },
        { time: '09:36', place: '太宰府前表参道', type: '', note: '停留1小時', transport: '6分' },
        { time: '10:42', place: '太宰府天滿宮', type: '', note: '停留1小時', transport: '9分' },
        { time: '11:51', place: '天開稲荷社', type: '', note: '停留1小時', transport: '自訂 0分' },
        { time: '12:51', place: '鬼焼き瓦そばKAGURA 蕎麥麵店', type: '美食', note: '停留1小時', transport: '7分' },
        { time: '13:58', place: '寶滿宮 竈門神社', type: '', note: '停留1小時', transport: '9分' },
        { time: '15:07', place: '宝満山登山口 (九州自然歩道)', type: '', note: '停留1小時', transport: '自訂 0分' },
        { time: '16:07', place: '太宰府', type: '', note: '停留1小時', transport: '33分' },
        { time: '17:40', place: '博多爐端 魚男', type: '', note: '停留1小時', transport: '8分' },
        { time: '18:48', place: '警固公園', type: '', note: '停留1小時', transport: '17分' },
        { time: '20:05', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '' },
      ] },
      { date: '2026-03-23', theme: '', stops: [
        { time: '08:00', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '自訂 0分' },
        { time: '09:00', place: '746-1 Kanamaru', type: '', note: '停留1小時', transport: '自訂 0分' },
        { time: '10:00', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '' },
      ] },
      { date: '2026-03-24', theme: '', stops: [
        { time: '08:00', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '21分' },
        { time: '09:21', place: '福岡城', type: '', note: '停留1小時', transport: '3分' },
        { time: '10:24', place: '舞鶴公園', type: '', note: '停留1小時', transport: '27分' },
        { time: '11:51', place: '福岡塔', type: '', note: '停留2小時', transport: '36分' },
        { time: '14:27', place: 'MARK IS 福岡Momochi', type: '', note: '停留2小時', transport: '17分' },
        { time: '16:44', place: '博多水炊鍋専門 橙', type: '', note: '停留2小時', transport: '22分' },
        { time: '19:06', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '' },
      ] },
      { date: '2026-03-25', theme: '', stops: [
        { time: '08:00', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '39分' },
        { time: '09:39', place: 'フレスポ鳥栖 大型購物中心', type: '', note: '停留1小時', transport: '64分' },
        { time: '11:43', place: '柳川川下り 松月乗船場', type: '', note: '停留1小時', transport: '7分' },
        { time: '12:50', place: '元祖本吉屋 本店', type: '', note: '停留1小時', transport: '77分' },
        { time: '15:07', place: 'AMU PLAZA博多', type: '', note: '停留2小時', transport: '14分' },
        { time: '17:21', place: '麵屋兼虎 天神本店', type: '', note: '停留1小時', transport: '9分' },
        { time: '18:30', place: '天神中央公園', type: '', note: '停留1小時', transport: '17分' },
        { time: '19:47', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '' },
      ] },
      { date: '2026-03-26', theme: '', stops: [
        { time: '08:00', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '8分' },
        { time: '09:08', place: '住吉神社', type: '', note: '停留1小時', transport: '自訂 0分' },
        { time: '10:08', place: '櫛田神社', type: '', note: '停留1小時', transport: '14分' },
        { time: '11:22', place: 'アミュエスト 博多 大型購物中心', type: '', note: '停留1小時', transport: '6分' },
        { time: '12:28', place: 'Shin-Shin 博多拉麵 KITTE博多店', type: '美食', note: '停留1小時', transport: '18分' },
        { time: '13:46', place: '名產鶴乃子 石村萬盛堂 本店', type: '', note: '停留1小時', transport: '17分' },
        { time: '15:03', place: 'The Full Full Hakata', type: '', note: '停留1小時', transport: '8分' },
        { time: '16:11', place: 'THE FLAVOR DESIGN®︎ STORE "FUKUOKA"', type: '', note: '停留2小時', transport: '12分' },
        { time: '18:23', place: 'Nikuichi (Yakuin Store)', type: '', note: '停留2小時', transport: '20分' },
        { time: '20:43', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '' },
      ] },
      { date: '2026-03-27', theme: '', stops: [
        { time: '08:00', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '116分' },
        { time: '13:36', place: '門司港車站', type: '', note: '停留1小時', transport: '3分' },
        { time: '14:39', place: 'Princess Phi Phi', type: '', note: '停留1小時', transport: '21分' },
        { time: '16:00', place: '和布刈 第2 展望台', type: '', note: '停留1小時', transport: '62分' },
        { time: '18:02', place: '平尾天婦羅 原田店', type: '', note: '停留1小時', transport: '26分' },
        { time: '19:28', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '' },
      ] },
      { date: '2026-03-28', theme: '', stops: [
        { time: '08:00', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '15分' },
        { time: '09:15', place: '柳橋連合市場', type: '', note: '停留1小時', transport: '11分' },
        { time: '10:26', place: '福岡市動植物園', type: '', note: '停留2小時', transport: '20分' },
        { time: '12:46', place: '海鮮とおむすび', type: '', note: '停留1小時', transport: '5分' },
        { time: '13:51', place: '白金茶房', type: '', note: '停留1小時', transport: '14分' },
        { time: '15:05', place: '大濠公園', type: '', note: '停留2小時', transport: '17分' },
        { time: '17:22', place: '炉端とおでん 呼炉凪来 天神店', type: '', note: '停留2小時', transport: '20分' },
        { time: '19:42', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '' },
      ] },
      { date: '2026-03-29', theme: '', stops: [
        { time: '08:00', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '150分' },
        { time: '11:30', place: '史奴比茶屋', type: '美食', note: '停留1小時', transport: '4分' },
        { time: '12:34', place: '由布釜飯 「心」金鱗湖本店', type: '', note: '停留1小時', transport: '5分' },
        { time: '13:39', place: '湯布院昭和館', type: '', note: '停留1小時', transport: '7分' },
        { time: '14:46', place: '金鱗湖', type: '', note: '停留1小時', transport: '148分' },
        { time: '18:14', place: '購物中心KITTE', type: '', note: '停留1小時', transport: '6分' },
        { time: '19:20', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '' },
      ] },
      { date: '2026-03-30', theme: '', stops: [
        { time: '08:00', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '15分' },
        { time: '09:15', place: '大丸 福岡天神店', type: '', note: '停留2小時', transport: '12分' },
        { time: '11:27', place: 'The Full Full Hakata', type: '', note: '停留1小時', transport: '15分' },
        { time: '12:42', place: 'Iwataya Main Store', type: '', note: '停留1小時', transport: '10分' },
        { time: '13:52', place: 'THE FLAVOR DESIGN®︎ STORE "FUKUOKA"', type: '', note: '停留1小時', transport: '13分' },
        { time: '15:05', place: 'BiVi Fukuoka', type: '', note: '停留2小時', transport: '6分' },
        { time: '17:11', place: '挽肉與米 (今泉)', type: '', note: '停留1小時', transport: '22分' },
        { time: '18:33', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '' },
      ] },
      { date: '2026-03-31', theme: '', stops: [
        { time: '08:00', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '自訂 0分' },
        { time: '09:00', place: '櫻井神社', type: '', note: '停留1小時', transport: '自訂 0分' },
        { time: '10:00', place: '櫻井二見浦 夫婦岩', type: '', note: '停留1小時', transport: '3分' },
        { time: '11:03', place: 'Itoshima Seafood Restaurant Futamigaura', type: '美食', note: '停留1小時', transport: '6分' },
        { time: '12:09', place: 'Palm Beach Restaurant', type: '美食', note: '停留1小時', transport: '自訂 0分' },
        { time: '13:09', place: '博多', type: '', note: '停留1小時', transport: '18分' },
        { time: '14:27', place: 'Mina 天神', type: '', note: '停留2小時', transport: '17分' },
        { time: '16:44', place: '水炊.雞肉料理 とりまぶし', type: '', note: '停留2小時', transport: '9分' },
        { time: '18:53', place: '博多站前微笑飯店', type: '住宿', note: '停留1小時', transport: '' },
      ] },
    ]
  }
];
