# TASKS

待辦清單。每一項都寫明**需要提供什麼**與**會寫進哪裡**，提供內容後可直接施工。

現況：29 個地區頁、514 列地點資料、1205 項測試通過（另有 6 項略過，見 1.1）

---

## 1. 內容資料

### 1.1 旅行筆記的行程軌跡 — ✅ 模組已實作，資料目前是空的、等你逐趟加回來
你提供「去趣行程總覽.md」（5 趟行程、304 列原始資料）後，模組與資料曾經一次全部做完，但你回報「呈現起來怪怪的」，決定資料清空重來、改成一趟一趟加，方便逐次確認。**模組（資料結構、modal 渲染、CSS、測試）維持完整保留，只有資料被清空**——`regionItineraries[地區][筆記標籤]` 現在每個地區都是空物件 `{}`。

**做法**（模組本身，跟資料是否填入無關）：查表方式比照 `regionalVenueData`：用筆記卡的標籤（年 / 月）當 key，值是「天」的陣列，每天依序列出停留點。有資料時 modal 改顯示時間軸式的「時間 → 地名 → 類型 → 備註 → 到下一站的交通方式」清單，取代原本四欄表格；沒有資料的筆記維持原樣（表格與時間軸都隱藏，不編造內容）。

**加資料的方式**：一次給一趟（或一天）即可，不用一次補齊全部。格式見下方表格。如果同一趟旅程橫跨多個地區，或同一天橫跨兩個地區，模組會依實際地點正確拆開到各自的地區——上一輪處理「去趣行程總覽.md」時已經驗證過這個邏輯沒問題（例如 2025 年 4-5 月九州行程同時觸及熊本、宮崎、大分、福岡；熊本出發去宮崎高千穗再回熊本的單日跨地區也拆得開），所以之後補資料不需要重新設計，照著同一份表格格式給即可。

**過程中發現並保留的兩個 bug 修正**（跟資料無關，不受這次清空影響）：
- `#notes` 底下有兩個直接子 div（區塊編號「05」與實際內容），原本 `regionAdditionalContent[地區].notes` 的插入邏輯寫 `document.querySelector('#notes > div')` 只會抓到第一個（編號 div），導致附加筆記全部插到編號 div 裡、排到第一則筆記（`regionContent[地區].note`）前面。已修正成抓 `.region-note` 的父層。
- 筆記切到有行程資料的項目時，`tbody` 沒有清空前一個項目留下的資料列（表格本身是隱藏的、使用者看不到，但 DOM 裡確實殘留）。已修正。

測試維持 3 個群組：「旅行筆記卡片順序」（驗證第一則筆記排在附加筆記之前，跟是否有行程資料無關，全部通過）、「旅行筆記行程軌跡」與「旅行筆記行程軌跡可及性」（不寫死是哪個地區哪個標籤，改成逐一搜尋有行程資料的筆記；目前資料是空的，這兩個群組共 6 項斷言會顯示「略過」而不是失敗，等你補回至少一筆資料後會自動開始真正驗證）。「地區頁 · Google Maps 連結」的「筆記顯示停留點清單」那項斷言同樣改成資料存在時才檢查，否則略過。全站測試 1205 通過、6 略過（略過的全部是這批跟資料有關的斷言，非 bug）。

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

→ 寫進 `region-detail.js` 的 `regionItineraries[地區][筆記標籤]`

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

### 1.3 各地區的住宿（含已提供的 26 間飯店）— ✅ 已完成
24 間已確認為日本旅宿的候選已依實際所在地寫入住宿卡片與 modal 四欄資料；栃木（日光／鬼怒川）原本沒有地區頁，已新增頁面與國家頁入口。`清水漾`位於台南、`Hakone Kowakien Yunessun`為溫泉遊樂設施而非旅宿，因此未錯置到日本住宿清單。

實作規則：以 `stayBaseContent` 或 `regionAdditionalContent[地區].stays` 建立住宿卡片，並以 `regionalVenueData[地區].stays` 提供 modal 的「地名、資訊、交通方式、Google Map」四欄；若所在地沒有對應地區頁，先新增地區頁並同步更新國家頁清單、`tests/regions.mjs` 等既有定義。完整原始名單見附錄 A.1。

---

### 1.4 所有地區的旅行筆記
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
**狀態**：時間軸只有 5 筆（北海道、東京、福岡、首爾、南島），但站上已有 29 個地區頁。

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

- [x] **主題切換按鈕動畫期間防止重複觸發** — ✅ 完成。根因：`applyTheme()` 每次呼叫都會立即改 body/html 的主題 class，但圖示翻轉（420ms）與整段旋轉解鎖（1800ms）各自用獨立的 `setTimeout` 排程；連續點擊時，第二次呼叫會立即把主題 class 切回去，圖示卻還停在第一次動畫排定的中途狀態，兩者對不上（實測：第二次點擊後 100ms，`dark:false` 但 `iconState` 仍是 `dark`）。修法：`theme-switcher.js` 新增 `isSwitching` 旗標，`click` 監聽器一開頭就 `if (isSwitching) return;`；動畫進行中另外加上 `aria-disabled="true"`，動畫結束（1800ms 的既有 timer）時一併清除旗標與屬性。由於 `applyTheme()` 現在只會在「未鎖定」時被呼叫，不會再有重疊的動畫排程。同時發現：原本的動畫完全沒有檢查 `prefers-reduced-motion`（style.css 裡 `.theme-toggle.is-switching .theme-icon` 沒有對應的 reduced-motion 覆寫），這正是題目要求「維持 prefers-reduced-motion 下的即時切換」要防的情況，所以一併補上：`applyTheme()` 內判斷 `matchMedia("(prefers-reduced-motion: reduce)")`，成立時走「無動畫、無鎖定期」的即時分支（跟頁面首次套用主題共用同一條路徑）。鍵盤（Enter／Space）與觸控 tap 都是透過原生 `click` 事件觸發，同一個 `isSwitching` 檢查就涵蓋，不需要另外寫。新增測試「全站 · 主題切換按鈕防連點」共 11 項：動畫中立即鎖定（`aria-disabled`／`is-switching`）、動畫中的第二次點擊被忽略且狀態/圖示/`localStorage` 三者不跳動、動畫結束後解鎖且三者一致、解鎖後下一次點擊正常生效、觸控 tap 走一樣的忽略邏輯、reduced motion 下兩次連續點擊都立即生效（沒有鎖定期）。已用還原修正的方式確認會變紅（6/11 項失敗，包含「動畫中第二次點擊被忽略」直接顯示出跳動的 iconState）。
- [x] **首頁「已探索」與「旅行足跡」點擊切換收折** — ✅ 完成。根因：兩個資訊框原本只靠 CSS `:hover`／`:focus-within` 展開，完全沒有點擊邏輯；`.map-legend`（已探索）過去連 `tabindex` 都沒有，鍵盤／觸控完全無法讓它展開，`.map-stats`（旅行足跡）雖有 `tabindex="0"` 但仍要仰賴瀏覽器對純 `<div>` 觸控後自動 focus 的不穩定行為。修法：兩個元素都補上 `role="button"`、`tabindex="0"`、初始 `aria-expanded="false"`；`main.js` 新增 click／keydown（Enter、Space）監聽器，切換 `is-expanded` class 與 `aria-expanded`，疊加在既有 `:hover`／`:focus-within` 樣式上而不是取代——`style.css` 把所有 `:hover`／`:focus-within` 選擇器群組都加上 `.is-expanded`，滑鼠移開後 hover 預覽消失，但點擊釘住的展開狀態會留著。點擊資訊框以外的地方沿用既有的 `document` 層級 `pointerdown` 代理（原本只負責 blur），一併清除兩者的 `is-expanded`／`aria-expanded`。兩個資訊框完全獨立、互不影響彼此狀態；tooltip 避讓（`.world-map:has(.map-legend:hover) .timezone-label` 等隱藏時區標籤的規則）也同步加上 `.is-expanded` 條件，維持既有避讓邏輯不變。新增測試「首頁 · 已探索與旅行足跡點擊收折」共 14 項：初始收折、點擊展開／再點收折、鍵盤 Enter／Space、點外側收折兩者皆收、兩者互不干擾、純 hover 不設定 `aria-expanded`（確認沒有取代既有 hover 行為）、手機版 tap 開合；已用還原修正的方式確認會變紅（11/14 項失敗）。
- [x] **全站平板版響應式畫面與手機操作邏輯** — ✅ 完成。做法是先在無頭 Chrome 用常見平板尺寸（iPad 768×1024／1024×768、iPad Pro 11" 834×1194／1194×834）實測首頁、國家頁、地區頁三種模板，量測每個具名元件（header、世界地圖、國家卡片列、時間軸、地區 showcase、sticky 分類導覽、內容項目、modal）的實際 `getBoundingClientRect()` 是否超出 viewport，而不是憑空補一套「平板專屬設計」——**結果只有國家頁的 `.region-showcase` 真的會溢出**，其餘元件在整個平板範圍（701–1199px）都已經用桌面版 CSS 正常顯示，沒有溢出或裁切，補上不必要的平板樣式只會增加沒被驗證過的複雜度。

**問題 1（版面）**：`.region-showcase` 桌機版是兩欄 `grid-template-columns: minmax(240px, .8fr) minmax(480px, 1.4fr)`，兩欄最小寬度加起來是 720px；701px 起的平板可用內容寬度塞不下，實測 768px 寬時溢出 85px，且直到約 1200px 寬才自然消失（不是原本估算的 1100px，欄間 gap 用 `clamp(2rem,8vw,8rem)` 隨寬度變動，手算會低估）。修法：新增 `@media (min-width: 701px) and (max-width: 1199px)`，沿用手機版「兩欄 grid 改單欄 flex 堆疊」的結構化做法（單欄天生不會有雙欄最小寬度衝突），但保留比手機版寬鬆、平板專屬的尺寸（不是照搬手機版數值）。

**問題 2（互動邏輯）**：`isMobileTimeline`／`isMobileCountryStrip`／`isMobileMap` 原本純用 `matchMedia("(max-width: 700px)")` 判斷，橫向平板常態性超過 700px（iPad Pro 11 橫向 1194px），純寬度判斷會讓橫向平板整套掉回桌面版 hover／立即轉導邏輯——這正是題目明確禁止的情況。三個函式改成 `matchMedia("(max-width: 700px), (hover: none)")`：`(hover: none)` 代表裝置沒有滑鼠、只能觸控，不論寬度多寬、不論橫向直向都成立，橫向平板才不會因為畫面較寬就退回桌面版邏輯；窄的桌面視窗（有滑鼠但被縮小）仍靠寬度那半邊抓到，維持原本行為。這個做法沿用專案既有慣例（`card.addEventListener("pointerenter", (event) => { if (event.pointerType !== "mouse") return; ...})` 與 `@media (max-width: 700px) and (hover: none)` 的「觸控裝置殘留 hover 防護」規則，兩者都已經用 `hover`/`pointerType` 而非純寬度分辨觸控裝置）。修改後用 debug script 追查一次誤判：橫向平板點國家卡片測試最初失敗，一度懷疑是 CSS／JS 斷點對不上，實際量測後發現是測試腳本自己的問題——`.country-strip` 的兩段式點擊邏輯（`is-mobile-focused`／`centerMobileCard`）本來就寫在跟寬度無關的基礎 CSS 裡，不受 700px 斷點限制，是我的測試沒有先把卡片列捲進可視範圍，觸控座標打在畫面外，補上 `scrollIntoView` 後就正常。

`tests/harness.mjs` 新增 `tablet({ landscape })` 輔助方法（預設 iPad 直向 768×1024，`landscape:true` 換橫向 1024×768，含觸控與 `hover:none`）。新增測試檔 `tests/suites/tablet.mjs` 共 29 項：三種頁面 × 橫直平板不產生頁面水平捲動、`.region-showcase` 不溢出裁切（橫直各測）、橫向平板（刻意選比舊斷點寬的尺寸）測試地圖 marker 與國家卡片的兩段式觸控仍然生效而非退回桌面版立即轉導、三種頁面 × 橫直平板的亮暗主題切換與鍵盤 Tab 聚焦、`prefers-reduced-motion` 正確套用。已用還原修正的方式確認會變紅（5 項失敗：3 項溢出斷言 + marker 兩段式觸控退回立即轉導導致的斷言失敗與測試群組中斷）。全站測試 1185/1185 通過，含桌機／手機既有測試皆未受影響（`.desktop()`／`.mobile()` 分別維持 `hover:hover`／`hover:none`，不受這次改動影響）。**上線後你回報：平板版首頁世界地圖按住上下拖曳沒辦法捲動頁面，跟手機版不一樣**，追出兩個追加問題：

(5) `#timezone-chart` 的 `pointer-events: none`（讓地圖 canvas 完全跳出 hit-test、觸控拖曳才不會被攔截）當時只掛在 `@media (max-width: 700px)`，沒有跟著 `isMobileMap()` 一起補 `(hover: none)`，平板寬度直接漏接。改成 `@media (max-width: 700px), (hover: none)`，跟 JS 那邊的條件對齊。

(6) 順手排查同一類問題時，發現 `isMobileTimeline()` 當初也被我改成一樣的 `(hover: none)` 條件，但這個改法對時間軸是錯的：`.timeline-track` 手機版切換成 `display: block` 垂直清單的 CSS 只掛在 `max-width: 700px`，平板寬度沒有對應樣式，畫面其實還是桌面版 `display: flex` 橫向排版；JS 卻誤以為要照手機版垂直清單的假設去運作——`lockTimelineHeight()` 會把 `minHeight` 鎖成量測橫向排版量出來的錯誤小數值，一載入畫面就整段被壓扁，年份都在、底下的旅程卡片全部消失。改回純寬度判斷（`isMobileTimeline()` 只認 700px，不加 `hover: none`），桌面版橫向排版＋原生 `overflow-x:auto` 捲動本來就對觸控友善，不需要靠這個旗標切換手機版邏輯。但改回純寬度後，「點時間軸圓點展開卡片」的邏輯又會被同一個旗標擋住（原本只有手機版寬度會走這條路），導致平板觸控使用者沒有 hover、也點不到圓點，永遠看不到卡片內容——這個問題新增獨立的 `timelineTapReveal()`（`isMobileTimeline() || (hover: none)`）只用在「點圓點展開／收合」這一組互動上，其餘結構性判斷（要不要用 FLIP 動畫、要不要鎖高度）維持用 `isMobileTimeline()`。兩者分開處理是因為前者是「有沒有 hover」的問題（跟寬度無關，桌面版橫向排版本身就撐得下 `.is-expanded` 直接生效），後者是「排版是垂直堆疊還是橫向捲動」的結構性問題（純粹跟著 CSS 斷點走）——這正是這次踩到的坑：把兩種不同性質的判斷用同一個旗標處理，各自都會在平板寬度出錯。

新增測試「平板 · 地圖與時間軸在平板上的觸控」共 6 項：地圖 `pointer-events` 計算值與真實觸控拖曳後 `scrollY` 是否改變、時間軸維持桌面版橫向排版、頁面載入時沒有套用手機版專用的高度鎖定（直接量 `minHeight` 是否為空字串，精準對應到 `lockTimelineHeight()` 這個根因，不是只驗證「有沒有壞掉」的表面症狀）、點時間軸圓點可展開卡片。已用還原修正的方式確認會變紅（3 項失敗，`minHeight` 顯示壞掉時量到的 `302px`）。全站測試 1191/1191 通過。
- [ ] **地區頁 modal 長文字不可重疊** — 修正地區頁景點、美食、住宿與旅行筆記開啟的共用 modal：標題、說明文字及四欄資料表的內容過長時，必須在自身欄位內正常換行或捲動，不能與相鄰欄位或元素重疊、溢出或被裁切。需涵蓋桌面、手機、平板、亮暗主題與長中日英文混合文字，並新增瀏覽器回歸測試驗證文字容器的可視範圍與表格橫／直向捲動行為。
- [ ] **地區頁分類導覽列捲動後固定在頁首** — 修正地區頁的 `.region-section-nav`：頁面向下捲動超過 Hero 後，導覽列必須維持在 viewport 正上方、位於 sticky header 下方，不可跟著內容捲離畫面。需確認桌面、手機與平板皆可用，手機版仍可橫向滑動，且不遮住章節標題或影響既有目前分類高亮／錨點平滑捲動；新增實際捲動位置的瀏覽器回歸測試。
- [x] **手機版首頁世界地圖改為 marker 優先操作** — ✅ 完成。三個子問題：(1) 手機版原本點一下 marker 就直接轉導，改成兩段式：`main.js` 新增 `mobilePinnedMarker`／`mobilePinnedHide` 共用狀態，`click` 時若點的不是目前固定的那個 marker，`preventDefault()` 並只顯示 tooltip（同時收起前一個 marker 的固定狀態，避免兩個國家同時亮著）；點同一個已固定的 marker 才真的轉導。另加 `document` 層級的 `pointerdown` 代理，點地圖以外的地方會收起固定狀態，不留下卡住的 tooltip。(2) 手機版時區多邊形不應保留原生互動（「只保留已探索國家的可點擊 icon」），`setMapView()`（原本只依 viewport 調整縮放／置中）改成同時把 `areas.mapPolygons.template` 的 `interactive` 依 `isMobileMap()` 切換，resize 時跟著重算；桌面版維持 `interactive: true`，滑到國家領土本身仍會有原生 hover 高亮，不影響既有桌面行為。（`panX`／`panY`／`pinchZoom` 本來就已關閉，地圖底層原本就不可拖曳縮放，這部分不用動。）(3) 手指在非 marker 區域上下滑動被地圖攔截、無法捲動頁面——追查發現是 amCharts5 在 canvas 上對 `touchstart` 呼叫 `preventDefault()`（不是任何專案自己的程式碼）。第一版先補上 `touch-action: pan-y` 與 `user-select: none`，這是這類問題的標準解法，但**你在真機上實測後回報：timezone 已經點不到了，但非 marker 區域上下滑動仍然無法捲動**——`touch-action` 沒能讓瀏覽器的 compositor 略過 amCharts5 的 `preventDefault()` 直接接手捲動。改用更直接的做法：`@media (max-width: 700px) { #timezone-chart { pointer-events: none; } }`，讓整層 canvas 完全跳出瀏覽器的 hit-test，事件根本不會派送到 amCharts5 的監聽器，自然不會有東西可以呼叫 `preventDefault()`；marker 是 `#world-map` 底下的另一組 DOM 元素（`#timezone-chart` 的手足節點，不是子節點），不受影響，點擊互動照常運作，桌面版原生 hover 高亮也不受影響（只在手機斷點關閉）。這次除了計算樣式，也直接送出一段觸控拖曳序列驗證頁面「真的會捲動」（不是只驗證 CSS 屬性值），因為前一版的 touch-action 計算值檢查即使修法在真機上失效，計算值本身仍然會顯示 `pan-y`，測試照樣通過但實際沒用——這是本輪的教訓，之後類似的手勢／捲動修正都要優先寫「量測真實效果」的斷言，不能只驗證意圖是否正確設定。新增測試「首頁 · 世界地圖（手機版兩段式 marker）」共 10 項：`touch-action`／`user-select`／`pointer-events` 計算值、手機版多邊形皆非 interactive、第一次點擊只顯示 tooltip 不轉導、第二次點擊才轉導、點地圖外側會收起固定狀態、**手指在非 marker 區域滑動頁面確實會捲動**（送出觸控序列後直接量測 `scrollY`）；「首頁 · 世界地圖」也補一項桌面版點擊立即轉導的回歸測試。已用還原修正的方式確認新測試會因為這些問題而變紅（其中兩段式觸控的回歸測試是直接讓測試群組中斷，因為還原後第一次點擊就轉導離開了地圖所在的頁面；`pointer-events` 那次則是計算值與 `scrollY` 兩項斷言直接失敗）。**捲動這項現在已經是可驗證、不再仰賴真機確認的修正**。(4) 上線後你又回報：手機版左右拖曳時右半邊會出現黑底、整頁卡在拖到一半的位置回不去——追查發現是 `.world-map` 的滑鼠追蹤光暈（`::after`／`::before`，18rem 寬）透過 `--map-pointer-x` 直接讀游標相對座標、沒有上限夾制，手指靠近地圖右側時光暈本體會整個推出 390px 的手機版 viewport 外；`.world-map` 本身沒有設 `overflow: hidden`，因此撐大了 `document.documentElement.scrollWidth`，瀏覽器就把左右拖曳當成頁面橫向捲動處理，且沒有任何機制會把 `scrollX` 撥回 0，所以卡住。這個 overflow 本來就存在，先前沒被發現是因為 amCharts5 在 `touchstart` 呼叫 `preventDefault()`——那次連帶擋掉了包含橫向在內的所有預設觸控行為；改成 `pointer-events: none` 後，橫向拖曳的預設行為也一併被放行，才讓這個潛在問題浮出來。修法兩層：`.world-map` 補上 `overflow: hidden`，把光暈裁在卡片圓角內（根因）；`html, body` 補上 `overflow-x: hidden` 作為最後一道防線，全站本來就沒有任何頁面設計成會左右捲動。新增 2 項測試：左右拖曳時 `document.documentElement.scrollWidth` 不可超過 `clientWidth`、拖曳結束後 `scrollX` 要回到 0；已用還原修正的方式確認第一項會變紅（`scrollWidth` 變成 413 vs `clientWidth` 390）。**一個已知限制**：「改點另一個 icon 時改顯示新 tooltip」目前的邏輯已用程式碼審查確認正確（`mobilePinnedHide` 會在切換時被呼叫，清掉舊 marker 的區域高亮），但因為目前 `travelDestinations` 只有日本一筆資料，沒有第二個 marker 可以實際測試切換情境，等之後新增國家後應該補上這項測試。過程中也發現一個**與本次改動無關的既有問題**：桌面版鍵盤 Tab 聚焦到 marker 時不會顯示 tooltip（`focus` 監聽器有掛，但實測沒有效果，在還原到修改前的版本上也是同樣結果），維持「桌面既有…行為維持不變」的範圍沒有動它，但值得之後另外處理。
- [x] **首頁國家圖卡跑馬燈同步地區子頁** — ✅ 完成。原本跑馬燈是寫死在 `index.html` 的「北海道・東京・名古屋・大阪・伊勢志摩・福岡」六個地區，28 個地區頁都建好後從未更新過。改成 `main.js` 新增的 `countryRegions` 資料表（單一資料來源），頁面載入時動態改寫 `.country-meta-track` 的可視文字與 `aria-label`；跑馬燈字數變長，改成依實際字數等比例延長動畫秒數（原本 22 秒對應 22 個字），避免地區一多捲得比讀得完還快。Coming soon 卡片沒有 `<a>` 標籤，不受影響。新增測試「首頁 · 國家卡片跑馬燈同步地區子頁」，直接掃描 `countries/japan/` 實際資料夾（不是拿另一份手寫清單互相比對）與國家頁 showcase 清單，確認三處一致；已用還原修正的方式確認測試會因為這個問題而變紅。
- [x] **手機版邊界拉動出現白底** — ✅ 完成，真機已確認左右方向不再閃白。根因分兩層：第一層是全站只有 `body` 設了主題背景、`html` 從未設背景，已修（`theme-switcher.js` 同步 class 到 `html`，`style.css` 背景規則擴大成 `html.theme-glass, body.theme-glass` 等）。**真機測試後回報上下方向（首頁、地區頁）仍會閃白，國家頁沒有這個問題**，追出第二層更深的根因：`html.theme-glass`／`html.theme-glass-dark` 的 `background` 簡寫只列了漸層（`radial-gradient`／`linear-gradient`，也就是 `background-image`），沒有另外寫顏色，所以 `background-color` 的計算值其實是初始值 `transparent`；iOS 橡皮筋回彈畫的是 `background-color`，不是 `background-image`，漸層本身在回彈時根本不會被畫出來，因此透出瀏覽器預設白底。國家頁沒這個問題是因為它手機版用的是 `body.region-page { background: #1d2425 }`——純色簡寫本身就會設定 `background-color`，不會落回 transparent。修法：在 `html.theme-glass`／`html.theme-glass-dark` 兩條規則各補一行明確的 `background-color`（`#f1f0ed`／`#1d2022`，對齊各自漸層的基底色），不動漸層本身、不動任何捲動容器或 `overscroll-behavior`。「全站 · 主題切換」測試補一項斷言：桌機三種頁面的 html 背景色不可為 `rgba(0, 0, 0, 0)`；已用還原修正的方式確認這項斷言會因為這個問題而變紅（之前的 9 項斷言只驗證 html／body 兩邊的計算值互相一致，沒驗證「一致的是不是都透明」，所以沒抓到這一層）。上下方向的修正邏輯已用同樣的方式驗證，但**實機視覺確認仍待你**：亮／暗兩種主題、首頁與地區頁分別拉到頁面最上與最下確認。
- [x] **測試執行器平行化** — ✅ 完成。244s → 82s（3.0×）。群組分散到多個獨立 Chrome、共用單一靜態伺服器；輸出以原始順序緩衝後逐一沖出，順序與序列執行完全一致。預設 jobs 為核心數一半（上限 6），`--jobs=N` / `TEST_JOBS` 可覆寫。`jobs=8` 實測會因 CPU 競爭出現 flaky（捲動位置漂 3px），因此逐像素斷言捲動位置或在動畫中途取樣的三個群組標記 `{ serial: true }`，於平行階段之後獨佔執行。
- [x] **旅行筆記行程軌跡模組** — ✅ 模組完成，資料目前是空的、等你逐趟加回來，細節見 1.1
- [ ] **全站 i18n 多語系** — 以繁中為預設、英文為第一個新增語言；建立共用翻譯字典與語言切換控制，將頁首、導覽、分類、按鈕、modal 與動態注入內容的 UI 文案改由 key 取用，使用 `localStorage` 記憶選擇並以瀏覽器語言作首次預設。國家、地區與地點資料需保留各語系名稱／描述欄位；完成後檢查鍵盤可及性、頁面標題與 `lang` 屬性。初期共用 HTML 結構，未來英文內容成熟且需要 SEO 時，再評估改為 `/en/` 的獨立靜態路徑與 `hreflang`。
- [ ] **CSS media query 合併** — 18 個 `max-width: 700px` 區塊、11 個 `prefers-reduced-motion`，最長一行 2,315 字元。合併會改變宣告順序，是唯一有實質風險的重構，需逐塊合併＋每次跑測試與截圖比對
- [ ] **3 個失效 class** — `hero-cover`、`region-card-action`、`region-card-featured`，夾在共用 selector 裡，與上一項一起處理
- [x] **地區頁 HTML 樣板化** — ✅ 改用風險較低的兩件事取代完整模板引擎（不管 client-side 還是 build-time，都會加深 JS 依賴或帶來「產生後又被手改」的漂移風險）：
  1. `tools/generate-region-page.mjs`——零依賴 Node 小腳本，新增地區頁時產生骨架，取代複製貼上手改；完全不碰既有的地區頁檔案，寫完會列出還需要手動補的其他檔案（`region-detail.js` 的四個 map、國家頁 showcase、CSS 背景、`tests/regions.mjs`）。
  2. `tests/suites/region-html-skeleton.mjs`（「地區頁 · HTML 骨架一致性」）——直接讀全部地區頁（目前 29 個）的原始檔案比對骨架（doctype、head、breadcrumb、hero class、五個 section 的 id／編號／固定文字、footer、script 順序），不開瀏覽器所以跑不到 1 秒；卡片數量、overview 敘述等會隨真實內容變動的部分刻意不檢查。

  寫測試時就抓到一個真的存在的漂移：原本 6 個完整地區頁（hokkaido/tokyo/nagoya/osaka/ise-shima/fukuoka）的「STAY & MOVE」用未跳脫的 `&`，其餘 22 個新地區頁用 `&amp;`——兩種瀏覽器都會正常顯示，不是 render bug，但源碼不一致，已統一成 `&amp;`。這就是這次要防的那類問題：不是省字數，是抓「新舊模板不小心長得不一樣」。

  過程中額外發現一組跟這項任務無關、疑似既有的測試失敗（「首頁 · 國家卡片（手機版）」的兩項換手/收合斷言），退回上一個 commit（`6c5c9cf`）重跑一樣會失敗，確認不是這次改動造成的，先未處理。
