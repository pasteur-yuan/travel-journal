# TASKS

待辦清單。每一項都寫明**需要提供什麼**與**會寫進哪裡**，提供內容後可直接施工。

現況：28 個地區頁、389 列地點資料、754 項測試通過。

---

## 1. 內容資料

### 1.1 旅行筆記的行程軌跡
**狀態**：欄位已設計、放置方式已定（點筆記卡開 modal 顯示），模組尚未實作，等真實資料。

需要提供：以「一天」為單位的行程。每天一組，每個停留點依序寫。

| 欄位 | 必要 | 範例 |
|---|---|---|
| 日期 | ✓ | `2025-06-14` |
| 當天主題 | | `城下町與大須` |
| 時間 | ✓ | `09:30` |
| 地名 | ✓ | `名古屋城` |
| 所在地 | | `中區本丸` |
| 類型 | | 景點／美食／住宿／交通 |
| 一句話備註 | | `先看本丸御殿再繞金鯱橫丁` |
| **到下一站的移動方式＋耗時** | | `地下鐵 15 分`、`步行 8 分` |

最後一站不需要填移動方式。移動那欄是箭頭上的文字，沒有它箭頭只是裝飾。

→ 寫進 `region-detail.js` 新增的 `regionItineraries[地區][筆記標籤]`

---

### 1.2 各地區的美食（含已提供的 273 筆候選）— ✅ 已完成
273 筆候選全部逐一查證所在地、正確店名與營業狀態並分類寫入，含最後 6 筆你提供 Google Maps 連結後補查的結果。

**22 個新地區**：47 筆確認落在 14 個地區內，已寫入 `regionContent[地區].food` 與 `regionalVenueData[地區].food`：kobe 7／kyoto 10／miyazaki 6／kumamoto 4／kanagawa 4／kagoshima 3／oita 3（2 主題，由布まぶし心兩分店併一組）／gifu 2／kagawa 2／kochi 2／saga 1／ehime 1／shizuoka 1／ishikawa 1。kochi、kanagawa、saga、ehime、shizuoka、ishikawa 因分店數少，已依規範刪除 HTML 樣板多餘的佔位卡，避免產生 fallback 假資料列。

13 筆同名多分店候選依「離主要大車站最近」的原則選定分店並寫入：Kurumi→鎌倉店(kanagawa)、鯛壽司→京都河原町店(kyoto)、若松屋→熊本川尻店(kumamoto)、Unatatsu→愛媛松山店(ehime)、cafe&bar anthem→神戶元町店(kobe)、スヌーピー茶屋→京都嵐山店(kyoto，比由布院、高山都近車站)、Grateful's→神戶須磨店(kobe，出站即到)、Yakiniku Rinn→熱海店(shizuoka)、若大将→金澤店(ishikawa，岡山店最近車站要 3 公里)、Nigirimeshi→京都舞鶴店(kyoto)、魚がし日本一→港未來店(kanagawa)、日本酒原価酒蔵→橫濱本店(kanagawa)、Original Pancake House→熊本站店(kumamoto，車站直結)。

最後 6 筆你提供 Google Maps 連結後，解出真實店名並確認地點：雪洞（余市らあ麺、Le Musée 主廚監修的鯡魚拉麵）→ hokkaido、Tsunagokoro（綱ごころ，薩摩川內屋台居酒屋）→ kagoshima、Musashi（黒毛和牛博多牛まぶし武蔵，博多站前和牛丼）→ fukuoka、凱裡（牡蠣×海老かいり渋谷2号店）→ tokyo、Amihama Shokudo（あみ浜食堂，土佐市浜燒吃到飽）→ kochi、Tsujiya Shijogokomachiten（京都炭火串焼つじや四条御幸町店）→ kyoto。三筆落在 22 地區清單內（kagoshima、kochi、kyoto），三筆屬既有地區（hokkaido、fukuoka、tokyo）。

**既有 6 個地區**：其餘約 220 筆確認地點落在既有的 hokkaido／tokyo／nagoya／osaka／fukuoka／ise-shima 範圍內，已依區域或料理主題分組寫入：hokkaido +14（札幌拉麵四天王、薄野燒肉燒鳥、白石關東煮、大通三明治、小樽・余市拉麵與和牛等）／tokyo +32（上野、淺草、阿佐谷高圓寺、新宿赤坂六本木、澀谷惠比壽、目黑祐天寺、池袋、大塚、下北澤、人形町愛宕、蒲田、新木場東大和、一頭買和牛連鎖等）／nagoya +5／osaka +4／ise-shima +1（併入既有「海女料理」主題，未另開新卡）／fukuoka +26（北九州、久留米八女柳川、天神大名、博多站前、柳橋市場、糸島、薬院、天神壽司街、太宰府大濠、大宮飯糰）。

**零命中地區**：yokkaichi、nagano、yamanashi、shiga、shimane、nagasaki——273 筆裡沒有任何一筆查證後落在這六個地區，需要新的候選名單才能補上美食章節。

執行規則（供未來新候選參考）：每筆先以官方店家／觀光資料確認，依所在地寫進 `regionContent[地區].food` 與 `regionalVenueData[地區].food`。外層項目可依料理主題或城市建立，但每個項目的 modal 資料表不可混用不同地區或店家的資料；所在地不明的店家先保留在待確認清單，不寫入網站。完整原始名單見附錄 A.2。

---

### 1.3 各地區的住宿（含已提供的 26 間飯店）
**狀態**：22 個新地區頁的住宿全部顯示「待補充」；已收到 26 間飯店候選名單，尚未逐筆確認所在地、交通方式、是否仍營業與所屬地區。

執行規則：先以官方飯店／業者網站確認名稱與所在地，再依目前地區頁的 `regionKey` 分類。每筆需寫進 `stayBaseContent[地區]`、`regionAdditionalContent[地區].stays` 與 `regionalVenueData[地區].stays`；modal 資料表維持「地名、資訊、交通方式、Google Map」四欄。若所在地尚未有對應地區頁，先列為待建地區，不臆測併入鄰近地區。完整原始名單見附錄 A.1。

---

### 1.4 22 個新地區的旅行筆記
**狀態**：同上，筆記標籤是「待補充」。

需要提供：年月 ＋ 一段敘述。有行程軌跡資料的話一併給（見 1.1）。

→ 寫進 `regionContent[地區].note`、`regionAdditionalContent[地區].notes`

---

### 1.5 無法確認的地點 — ✅ 已完成
提供地址後 17 筆全部就位（資料列 389 → 405）。新開的卡片：大阪「本町」、富山「朝日町」、大分「國東」、靜岡「濱松」「富士宮」、名古屋「春日井」；神奈川因此有了第一筆住宿資料。

過程中修正三個誤判：

- **白絲瀑布不是重複**，是福岡糸島與靜岡富士宮兩個同名的不同瀑布，兩筆都收錄了。
- **柳川的熊野神社就是中山大藤所在地**（大藤在其境內），已在資訊欄註明關聯。
- **杉ノ原放牧場在佐賀唐津加部島**，與田島神社同島，兩筆併在「唐津」卡片下。

`𢲡抬𢲡撸神社` 是大阪西區立賣堀的 **サムハラ神社**——社名以四個罕用漢字書寫，所以在多數環境會顯示成亂碼；站上採用日文寫法。

**仍需補充**：下列三筆我只能寫出最低限度的描述，因為手上沒有更多資訊，寧可寫得薄也不編造。有內容再告訴我。

- 本福寺（久留米）— 目前僅「久留米市的寺院。」
- Yoroshi Cosmetics（淺草）— 目前僅「淺草的化妝品店。」
- 海風美術店（二見）— 目前僅「二見興玉神社境內的店鋪。」

---

### 1.6 名古屋城天守閣的現況
**狀態**：站上目前照你原文寫「可登城參觀天守閣」。

據我所知天守閣自 2018 年 5 月起停止入場（本丸御殿正常開放）。請確認要保留原文或改寫。

→ `regionalVenueData.nagoya.spots['名古屋站']` 第一列

---

### 1.7 Daitsu Park 的日文名稱
**狀態**：地圖連結目前是 `Daitsu Park 清須市` 的查詢字串，命中率沒把握。

→ `regionalVenueData.nagoya.spots['清洲']` 第二列的地圖網址

---

### 1.8 首頁時間軸的旅程
**狀態**：時間軸只有 5 筆（北海道、東京、福岡、首爾、南島），但站上已有 28 個地區頁。

首頁右下「旅行足跡」的國家數與地區數是由時間軸項目推導的，所以現在顯示的數字反映不出實際內容。

需要提供：每趟旅程的日期、國家、地區。

→ 寫進 `index.html` 的 `.timeline-entry`（需要 `data-date`、`data-country`、`data-region` 三個屬性）

## 附錄 A：已提供、待查證與分區的候選清單

### A.1 住宿（26 筆）

- 皇家花園CANVAS酒店 福岡中洲
- BEB5門司港 by 星野集團
- 清水漾
- 名古屋榮弗爾札飯店
- 有馬溫泉 月光園游月山莊
- The Royal Park Canvas - Nagoya
- seven x seven 糸島
- 福岡瑪麗諾亞渡假村
- Kitayuzawa Morino Soraniwa
- 虹夕諾雅 輕井澤
- 福岡中洲川端威斯特酒店
- HOTEL CLAD
- Tobu Hotel Levant Tokyo
- 星野度假村 界 霧島
- Nazuna Hakone Miyanoshita
- 星野集團 界 鬼怒川
- AMANEK BEPPU YULA-RE Beppu Hotel
- S-Peria Hotel Kyōto
- 鬼怒川御苑溫泉酒店
- Il Palazzo飯店
- VESSEL HOTEL CAMPANA SUSUKINO
- 福岡休雷蓋特酒店
- VESSEL INN SAPPORO NAKAJIMA PARK
- Hakone Kowakien Yunessun
- HEAVENLY SPA GECCA(ヘブンリースパ ゲッカ)伊豆北川温泉 望水
- HIDEOUT Suite at Tune Stay

### A.2 美食（273 筆）

#### 海鮮（37 筆）

Yakigaki House (Grilled Oyster House)、日本酒バル ほのか 梅田店、Shellfish beach baking buffet Amihama Shokudo、珍満食堂、磯料理 星倉、Onigiri Gorichan Nankai Namba Station、鐵板燒 天神內臟 博多一番街、木津市場、大衆酒場 牡蠣る。赤坂店、すし酒場 FUJIYAMA TOKYO 秋葉原本店、Fishing Port Restaurant Kawagoe、Kanizanmai Shinjuku-ten、うに丼専門店 凪〜nagi〜、Aiyo Kita 1-jo Store、Kaisendon Umedo Sapporo Store、和牛海鮮一樂道頓堀店、壽司酒吧 FUJIYAMA TOKYO 新宿東口店、蟹 寿司 和牛自助餐廳 心齋橋 丸花、Kanimatsuri Crab Restaurant、Tsukiji Unitora Nakadori、Janbo-tsuribune Tsurikichi in Shinsekai、仙臺 牡蠣女将、大坂涮涮火煱、海三昧 おさしみ家、海鮮とおむすび、牡蠣小屋 浜太郎、Kanizanmai Nagoya Sakae、Itoshima Seafood Restaurant Futamigaura、柳橋連合市場、新鳥栖 道の市場、難陀、Yoichiya、Shihachi Sengyoten Takuki COMICHI、かにざんまい横浜東戸塚店、海女小屋 八幡窯、Kyoto KANI-GIN Kawaramachi Store、Yoichiya Uni Specialty Restaurant-Otaru Canal

#### 燒肉（57 筆）

燒肉 Aburu。大塚店、飛騨牛焼肉 伏見屋 本店、烤羊肉 羊八 札幌本店、Yuji、Yakiniku Rinn、Yakiniku Restaurant Sanpōen、焼肉・光陽、王十里、由布釜飯「心」金鱗湖本店、由布釜飯「心」湯布院站前店、焼き肉 凡、骨付鳥 一鶴 高松店、焼肉 九chan 西新店、竹中肉店、Musashi Oasis Kita、Yakinikunoryuen Kokura Honten、Kobe Beef Wagyu House Wagyu Kingdom namba yakiniku、焼肉・ホルモン武士道 大阪梅田のすみっこ店、厚切り牛タン食べ放題 焼肉一心たん助 上野本店、Yakiniku Fujimoto Umeda Ohatsutenjin、Daifukuen、Kobe Beef Yakiniku Okatora Sannomiya、Torikai Sohonke Sakae Lachic store、Hida Beef Family Bakuro Ichidai Nagoya Sakae、燒肉 飛騨牛一頭家 馬喰一代 名古屋WEST、Tsujiya Shijogokomachiten、Niku no Yamasho、和食居酒屋 地雞炭火燒 粹仙、一頭牛燒肉 房家、SATOブリアン、USHIGORO S. GINZA、燒肉Happy、板前燒肉 一光 千日前店、YAKINIKU PONGA PREMIUM、Wagyu Yakiniku Ushio in ginza、烤肉荷爾蒙 襷 愛宕店、銀しゃり 焼肉 直球 薬院店、YAKITORI Torikizoku Tenjin Oyafuko Dori Store、燒肉King 福岡清水店、炭燒地雞 山藏、Yakiniku Rikimaru Ikebukuro、黒毛和牛 博多和牛まぶし 武蔵【天神店】、燒肉INOUE 銀座店、とり澤 銀座、板前燒肉一牛 東心齋橋店、燒鳥店 鳥次、Kawaya Gion、藥院燒肉NIKUICHI、Yakiniku AGITO HIRAO、和牛黒澤 堺町通り店、Lilac、札幌啤酒花園、個室焼肉つばめ本店、成吉思汗 達摩 本店、Sapporo Jingisukan shirokuma sapporo honten、Yakiniku Inoue Ginza、達摩成吉思汗烤肉 本店

#### 鰻魚飯（20 筆）

熱田蓬萊軒(松阪屋店)、Unagi Kushiyaki Izumo、Unami、Nakamuraya、Kawatoyo Narita、鮮魚 魚豊、熱田蓬萊軒 神宮店、Sushi Works Minami Koshigaya、Hitsumabushi Bincho、若松屋、元祖本吉屋 本店、昼だけうなぎ屋 池袋店、鰻のエイト キャナルシティ博多店、とり澤 銀座、Unatetsu Ikebukuro Honten、Kabuto、Unatatsu、Hozenji Yamakazu、鰻魚四代目菊川 中洲春吉店、うなぎや

#### 拉麵（35 筆）

Nouilles Japonaise Tokuichi、雪洞、八幡炒麵、若大拉麵、拉麺神社『蓮』〜青龍〜、神戶豚骨拉麵 賀正軒 元町店、Narutoya Sakae、Ramen Nishiki Sui、Hanzo Seimen、Karamenya Masumoto Miyazaki Honten、Shinjiko Shijimi Chuka Soba Kohaku Honten、AFURI辛紅 新宿SUBNADE、博多屋台幸龍、Obanzai Nishinakasu MIYAMA、博多らーめんShinShin 古門戸町店、燒豚拉麵 三條、博多一幸舍 博多本店、Junteuchi Men to Mirai、Ramen Break Beats、Kombu-to-Men Kiichi、麵屋Gaga 天神店、Aidaya、桂花拉麵、暖暮 博多中洲店、博多拉麵 ShinShin 天神本店、麵屋兼虎 天神本店、一蘭拉麵 總本店、一蘭 太宰府參道店、麵屋 彩未、信玄拉麵、蝦味拉麵 一幻 總本店、Sumire Nakanoshima Main Store、初代拉麵店、RAMEN ICHI、Mahoro

#### 丼飯（8 筆）

札幌海鮮丼 丼兵衛 場外市場店、Tuna and Rice KURODAHAN、Musashi、Kichi Kichi Omurice、Tempura Miya、Shokudo Mitsu、DAIMYOぶたまぶし、あか牛丼専門店 ごとう屋阿蘇店

#### 咖啡廳（24 筆）

JWT cafe / 薬院、cafe &bar anthem、Rond sucré cafe(ロンシュクレカフェ)、Bucyo Coffee、Tsubame Bread & Milk Meieki Branch、Ito Coffee、Konparu Osu、八十八良葉舍 淺草、THE ROASTERY by NOZY COFFEE、Ocean House、OYATUYA.U、史奴比茶屋、Original Pancake House、白金茶房、Inception Osaka、Forest Cafe Midori no Oto、Blue Roof、Bread, Espresso & Hakata &&、Fuk Coffee、森彥咖啡、Saera 咖啡與三明治店、菓子と喫茶 SIROYA、Ine Cafe、SIROYA

#### 壽司（20 筆）

Sushi｜Yurakucho Kakida｜Tokyo、Hamazushi Shinshiro、Hakata Sushi Tsugu、博多 壽司 貴山、博多 壽司 桃之木、Sushikaito Kandaten、鯛壽司、德兵衛回転寿司 Oasis21店、Sushi Senmon Store Shimbashi Kadohei、Sakana no ISHISAKA、Kakida Sushi Shiodome、Tachiguisushi KAKIDA Sakura Stage Shibuya、日本料理 茜坂大沼 赤坂、Itsumi、鮪魚相馬水產 銀座店、壽司 魚がし日本一、葫蘆壽司、Sushi Senpachi、迴轉壽司 Toriton 豐平店、迴轉壽司 Toriton 圓山店

#### 漢堡（3 筆）

Texas King Burger、Shogun Burger Shinjuku、Love This Burger

#### 洋食（9 筆）

Heikenosato Miyazakishinbepputen、Ogura Honten、Grateful's、FIGO watanabedori、Yellow Noritakeshinmachi、Yoshoku no Fuji、Salmon Noodle 3.0、Meat & Cheese Forne、Bar Panorama

#### 甜點（12 筆）

PLUS 天神本店 ヨーグルト×アサイーカフェ、Shuna gelato&smoothies 糸島本店、フルーツパフェ 果物屋cafe マルイ、Kurumi、艾許奶油 Échiré Nagoya、弁才天 大福、Ginza Orions、GENDY銀座店、壽壽喜園 淺草本店、Asakusa Chaya Tabanenoshi、葫蘆最中.銅鑼燒 千成もなか本舗、吉備子屋-桃鈴

#### 關東煮（4 筆）

Tsunagokoro、武-日式關東煮與清酒吧(新宿西口店)、關東煮店Takeshi 難波WALK店、關東煮屋たけし 名古屋榮店

#### 餃子（3 筆）

Gyōza Go Jyuu Ban、餃子坊 豚八戒、Marusho-gyoza-ten Hanna

#### 烏龍麵（5 筆）

Miyake、金比羅烏龍麵參道店(本店)、Handmade Udon Godaisan、咖哩烏龍麵 misono、Menya ISHII

#### 居酒屋（20 筆）

Edomae Kisen、Hiroshima Sakaba、Furaibo Nishiki Shichikenchodoriten、Zaru-Yaki Kobayashi Poultry (Shinbashi Branch)、Nihonshu Genka Sakagura、Meat sometimes lemon sour、Izumo Ikebukuro、凱裡、SAKE MARKET Shinjuku、Kisuimaru Tenjin、Futoppara Tenjin、大衆しゃぶしゃぶ勝治上野御徒町店、Hirochan、沼津港 海將、Masuda Oden & Seafood Ueno、博多爐端 魚男、Isono、炭火鳥焼 蔵鵡 本邸、串焼き おでん 安、章魚燒和威士忌蘇打 狸小路本店

#### 飯糰（2 筆）

Zen Yameya、Nigirimeshi

#### 大阪燒（3 筆）

Tsunekawa、鉄板焼き居酒屋｜焼き酒場 金DARUMA(ダルマ)平尾店、お好み焼き・焼きそば 二代目ぼん太

#### 火鍋（11 筆）

WAGYU NINJA、黑豬蒸籠料理 華蓮、博多牛腸鍋 一鷹 博多本店、Hakatamotsunabemaedaya Sohonten、元祖牛腸鍋 樂天地 天神本店、水炊名店 鳥田 博多本店、牛腸鍋 一藤、博多水炊鍋専門 橙、博多牛雜鍋前田屋 博多店、博多牛腸鍋大山 總店、Junidanya Hanamikoji Street

---

## 2. 素材

### 2.1 22 張新地區的主視覺照片 — ✅ 已完成
22 張漸層 SVG 佔位圖已全部改為下載到 `assets/images/` 的真實地標照片，並同步更新 `style.css` 的 `.region-hero-<slug>` 與 `countries/japan/index.html` 的 `data-image`。

照片涵蓋熊本城、高千穗峽、櫻島、伏見稻荷、立山連峰、白鬚神社與對馬和多都美神社等各地代表景觀；作者、授權與原始來源都記錄於 `assets/images/ATTRIBUTIONS.md`。

### 2.2 時間軸卡片的日本照片
**狀態**：`.timeline-entry-japan .timeline-card` 的背景圖是全站唯一仍指向 Unsplash CDN 的圖片，與 AGENTS.md 的「圖片優先下載至 `assets/images/`」不一致。

→ 放進 `assets/images/`，我改 `style.css`

---

## 3. 校對

### 3.1 地點的描述與交通方式
**狀態**：站上 185 筆地點的「資訊」與「交通方式」兩欄是我依既有知識撰寫的，**未經線上查證**。

AGENTS.md 要求確認名稱、所在地、交通方式與是否仍營業。最容易過時的是車站名與路線（例：名古屋城站 2023 年才由市役所站更名）。

建議優先抽查：交通方式欄、以及標示「直結」「步行前往」的距離描述。

---

## 4. 程式（等你決定何時做）

- [ ] **全站平板版響應式畫面與手機操作邏輯** — 為首頁、國家頁與全部地區詳細頁建立平板 breakpoint（橫向與直向皆涵蓋）的專屬排版，確保 header、世界地圖、國家卡片列、時間軸、地區 showcase、sticky 分類導覽、內容項目與 modal 在平板尺寸皆不溢出、不被裁切且易於觸控。平板一律採用與手機版相同的操作邏輯：以 tap／click 取代 hover-only 行為、卡片列與分類列可自然滑動、首頁地圖 marker 先顯示 tooltip 再次點擊才轉導、時區地圖區域不攔截頁面垂直手勢；不可因較寬畫面退回桌面版 hover／直接轉導邏輯。需以常見平板橫直 viewport、亮暗主題、鍵盤操作與 `prefers-reduced-motion` 進行三種頁面回歸測試。
- [x] **手機版首頁世界地圖改為 marker 優先操作** — ✅ 完成。三個子問題：(1) 手機版原本點一下 marker 就直接轉導，改成兩段式：`main.js` 新增 `mobilePinnedMarker`／`mobilePinnedHide` 共用狀態，`click` 時若點的不是目前固定的那個 marker，`preventDefault()` 並只顯示 tooltip（同時收起前一個 marker 的固定狀態，避免兩個國家同時亮著）；點同一個已固定的 marker 才真的轉導。另加 `document` 層級的 `pointerdown` 代理，點地圖以外的地方會收起固定狀態，不留下卡住的 tooltip。(2) 手機版時區多邊形不應保留原生互動（「只保留已探索國家的可點擊 icon」），`setMapView()`（原本只依 viewport 調整縮放／置中）改成同時把 `areas.mapPolygons.template` 的 `interactive` 依 `isMobileMap()` 切換，resize 時跟著重算；桌面版維持 `interactive: true`，滑到國家領土本身仍會有原生 hover 高亮，不影響既有桌面行為。（`panX`／`panY`／`pinchZoom` 本來就已關閉，地圖底層原本就不可拖曳縮放，這部分不用動。）(3) 手指在非 marker 區域上下滑動被地圖攔截、無法捲動頁面——追查發現是 amCharts5 在 canvas 上對 `touchstart` 呼叫 `preventDefault()`（不是任何專案自己的程式碼）。第一版先補上 `touch-action: pan-y` 與 `user-select: none`，這是這類問題的標準解法，但**你在真機上實測後回報：timezone 已經點不到了，但非 marker 區域上下滑動仍然無法捲動**——`touch-action` 沒能讓瀏覽器的 compositor 略過 amCharts5 的 `preventDefault()` 直接接手捲動。改用更直接的做法：`@media (max-width: 700px) { #timezone-chart { pointer-events: none; } }`，讓整層 canvas 完全跳出瀏覽器的 hit-test，事件根本不會派送到 amCharts5 的監聽器，自然不會有東西可以呼叫 `preventDefault()`；marker 是 `#world-map` 底下的另一組 DOM 元素（`#timezone-chart` 的手足節點，不是子節點），不受影響，點擊互動照常運作，桌面版原生 hover 高亮也不受影響（只在手機斷點關閉）。這次除了計算樣式，也直接送出一段觸控拖曳序列驗證頁面「真的會捲動」（不是只驗證 CSS 屬性值），因為前一版的 touch-action 計算值檢查即使修法在真機上失效，計算值本身仍然會顯示 `pan-y`，測試照樣通過但實際沒用——這是本輪的教訓，之後類似的手勢／捲動修正都要優先寫「量測真實效果」的斷言，不能只驗證意圖是否正確設定。新增測試「首頁 · 世界地圖（手機版兩段式 marker）」共 10 項：`touch-action`／`user-select`／`pointer-events` 計算值、手機版多邊形皆非 interactive、第一次點擊只顯示 tooltip 不轉導、第二次點擊才轉導、點地圖外側會收起固定狀態、**手指在非 marker 區域滑動頁面確實會捲動**（送出觸控序列後直接量測 `scrollY`）；「首頁 · 世界地圖」也補一項桌面版點擊立即轉導的回歸測試。已用還原修正的方式確認新測試會因為這些問題而變紅（其中兩段式觸控的回歸測試是直接讓測試群組中斷，因為還原後第一次點擊就轉導離開了地圖所在的頁面；`pointer-events` 那次則是計算值與 `scrollY` 兩項斷言直接失敗）。**捲動這項現在已經是可驗證、不再仰賴真機確認的修正**。**一個已知限制**：「改點另一個 icon 時改顯示新 tooltip」目前的邏輯已用程式碼審查確認正確（`mobilePinnedHide` 會在切換時被呼叫，清掉舊 marker 的區域高亮），但因為目前 `travelDestinations` 只有日本一筆資料，沒有第二個 marker 可以實際測試切換情境，等之後新增國家後應該補上這項測試。過程中也發現一個**與本次改動無關的既有問題**：桌面版鍵盤 Tab 聚焦到 marker 時不會顯示 tooltip（`focus` 監聽器有掛，但實測沒有效果，在還原到修改前的版本上也是同樣結果），維持「桌面既有…行為維持不變」的範圍沒有動它，但值得之後另外處理。
- [x] **首頁國家圖卡跑馬燈同步地區子頁** — ✅ 完成。原本跑馬燈是寫死在 `index.html` 的「北海道・東京・名古屋・大阪・伊勢志摩・福岡」六個地區，28 個地區頁都建好後從未更新過。改成 `main.js` 新增的 `countryRegions` 資料表（單一資料來源），頁面載入時動態改寫 `.country-meta-track` 的可視文字與 `aria-label`；跑馬燈字數變長，改成依實際字數等比例延長動畫秒數（原本 22 秒對應 22 個字），避免地區一多捲得比讀得完還快。Coming soon 卡片沒有 `<a>` 標籤，不受影響。新增測試「首頁 · 國家卡片跑馬燈同步地區子頁」，直接掃描 `countries/japan/` 實際資料夾（不是拿另一份手寫清單互相比對）與國家頁 showcase 清單，確認三處一致；已用還原修正的方式確認測試會因為這個問題而變紅。
- [x] **手機版邊界拉動出現白底** — ✅ 完成，真機已確認左右方向不再閃白。根因分兩層：第一層是全站只有 `body` 設了主題背景、`html` 從未設背景，已修（`theme-switcher.js` 同步 class 到 `html`，`style.css` 背景規則擴大成 `html.theme-glass, body.theme-glass` 等）。**真機測試後回報上下方向（首頁、地區頁）仍會閃白，國家頁沒有這個問題**，追出第二層更深的根因：`html.theme-glass`／`html.theme-glass-dark` 的 `background` 簡寫只列了漸層（`radial-gradient`／`linear-gradient`，也就是 `background-image`），沒有另外寫顏色，所以 `background-color` 的計算值其實是初始值 `transparent`；iOS 橡皮筋回彈畫的是 `background-color`，不是 `background-image`，漸層本身在回彈時根本不會被畫出來，因此透出瀏覽器預設白底。國家頁沒這個問題是因為它手機版用的是 `body.region-page { background: #1d2425 }`——純色簡寫本身就會設定 `background-color`，不會落回 transparent。修法：在 `html.theme-glass`／`html.theme-glass-dark` 兩條規則各補一行明確的 `background-color`（`#f1f0ed`／`#1d2022`，對齊各自漸層的基底色），不動漸層本身、不動任何捲動容器或 `overscroll-behavior`。「全站 · 主題切換」測試補一項斷言：桌機三種頁面的 html 背景色不可為 `rgba(0, 0, 0, 0)`；已用還原修正的方式確認這項斷言會因為這個問題而變紅（之前的 9 項斷言只驗證 html／body 兩邊的計算值互相一致，沒驗證「一致的是不是都透明」，所以沒抓到這一層）。上下方向的修正邏輯已用同樣的方式驗證，但**實機視覺確認仍待你**：亮／暗兩種主題、首頁與地區頁分別拉到頁面最上與最下確認。
- [x] **測試執行器平行化** — ✅ 完成。244s → 82s（3.0×）。群組分散到多個獨立 Chrome、共用單一靜態伺服器；輸出以原始順序緩衝後逐一沖出，順序與序列執行完全一致。預設 jobs 為核心數一半（上限 6），`--jobs=N` / `TEST_JOBS` 可覆寫。`jobs=8` 實測會因 CPU 競爭出現 flaky（捲動位置漂 3px），因此逐像素斷言捲動位置或在動畫中途取樣的三個群組標記 `{ serial: true }`，於平行階段之後獨佔執行。
- [ ] **旅行筆記行程軌跡模組** — 欄位與放置方式已定，等 1.1 的資料
- [ ] **全站 i18n 多語系** — 以繁中為預設、英文為第一個新增語言；建立共用翻譯字典與語言切換控制，將頁首、導覽、分類、按鈕、modal 與動態注入內容的 UI 文案改由 key 取用，使用 `localStorage` 記憶選擇並以瀏覽器語言作首次預設。國家、地區與地點資料需保留各語系名稱／描述欄位；完成後檢查鍵盤可及性、頁面標題與 `lang` 屬性。初期共用 HTML 結構，未來英文內容成熟且需要 SEO 時，再評估改為 `/en/` 的獨立靜態路徑與 `hreflang`。
- [ ] **CSS media query 合併** — 12 個 `max-width: 700px` 區塊、11 個 `prefers-reduced-motion`，最長一行 2,315 字元。合併會改變宣告順序，是唯一有實質風險的重構，需逐塊合併＋每次跑測試與截圖比對
- [ ] **3 個失效 class** — `hero-cover`、`region-card-action`、`region-card-featured`，夾在共用 selector 裡，與上一項一起處理
- [x] **地區頁 HTML 樣板化** — ✅ 改用風險較低的兩件事取代完整模板引擎（不管 client-side 還是 build-time，都會加深 JS 依賴或帶來「產生後又被手改」的漂移風險）：
  1. `tools/generate-region-page.mjs`——零依賴 Node 小腳本，新增地區頁時產生骨架，取代複製貼上手改；完全不碰 28 個既有檔案，寫完會列出還需要手動補的其他檔案（`region-detail.js` 的四個 map、國家頁 showcase、CSS 背景、`tests/regions.mjs`）。
  2. `tests/suites/region-html-skeleton.mjs`（「地區頁 · HTML 骨架一致性」）——直接讀 28 個地區頁的原始檔案比對骨架（doctype、head、breadcrumb、hero class、五個 section 的 id／編號／固定文字、footer、script 順序），不開瀏覽器所以跑不到 1 秒；卡片數量、overview 敘述等會隨真實內容變動的部分刻意不檢查。

  寫測試時就抓到一個真的存在的漂移：原本 6 個完整地區頁（hokkaido/tokyo/nagoya/osaka/ise-shima/fukuoka）的「STAY & MOVE」用未跳脫的 `&`，其餘 22 個新地區頁用 `&amp;`——兩種瀏覽器都會正常顯示，不是 render bug，但源碼不一致，已統一成 `&amp;`。這就是這次要防的那類問題：不是省字數，是抓「新舊模板不小心長得不一樣」。

  過程中額外發現一組跟這項任務無關、疑似既有的測試失敗（「首頁 · 國家卡片（手機版）」的兩項換手/收合斷言），退回上一個 commit（`6c5c9cf`）重跑一樣會失敗，確認不是這次改動造成的，先未處理。
