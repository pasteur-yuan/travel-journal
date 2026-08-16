document.body.classList.add('is-region-entering');
window.requestAnimationFrame(() => {
  document.body.classList.add('is-region-entered');
  window.setTimeout(() => document.body.classList.remove('is-region-entering', 'is-region-entered'), 900);
});

const regionNav = document.querySelector('.region-section-nav');

const regionHero = document.querySelector('.region-hero');
if (regionHero) {
  const regionNames = {
    'region-hero-hokkaido': 'HOKKAIDO',
    'region-hero-tokyo': 'TOKYO',
    'region-hero-nagoya': 'NAGOYA',
    'region-hero-osaka': 'OSAKA',
    'region-hero-ise-shima': 'ISE-SHIMA',
    'region-hero-fukuoka': 'FUKUOKA'
  };
  const regionClass = [...regionHero.classList].find((name) => regionNames[name]);
  const eyebrow = regionHero.querySelector('.eyebrow');
  if (eyebrow && regionClass) eyebrow.textContent = regionNames[regionClass];
}

// fallback 的地圖查詢字串要用項目實際所在的地區。原本寫死「北海道」，
// 讓其他五個地區只要沒有對應的 venue 資料，就會產生指向北海道的錯誤連結。
const regionSearchNames = {
  'region-hero-hokkaido': '北海道',
  'region-hero-tokyo': '東京',
  'region-hero-nagoya': '名古屋',
  'region-hero-osaka': '大阪',
  'region-hero-ise-shima': '伊勢志摩',
  'region-hero-fukuoka': '福岡'
};
const currentRegionSearchName = regionHero
  && regionSearchNames[[...regionHero.classList].find((name) => regionSearchNames[name])] || '';

document.querySelectorAll('.region-facts-wide').forEach((facts) => {
  const section = facts.closest('.region-section');
  const heading = section?.querySelector('h2');
  if (heading) heading.textContent = '住宿';
  const eyebrow = section?.querySelector('.eyebrow');
  if (eyebrow) eyebrow.textContent = 'STAY';
  if (section) section.classList.add('region-stays-section');
  const accommodation = facts.querySelector('div');
  if (!accommodation) return;
  const item = document.createElement('article');
  item.innerHTML = `<span>住宿</span><div><h3>${accommodation.querySelector('strong')?.textContent || '住宿安排'}</h3><p>補充住宿地點、旅館選擇與移動方式。</p></div>`;
  facts.classList.remove('region-facts', 'region-facts-wide');
  facts.classList.add('region-content-list');
  facts.replaceChildren(item);
});

// 共用內容項目模板：所有動態新增的景點與列表項目都從同一個結構開始。
const createRegionContentItem = (type = 'list') => {
  const item = document.createElement('article');
  if (type === 'card') {
    item.className = 'region-content-card';
    item.innerHTML = '<span></span><h3></h3><p></p>';
  } else {
    item.className = 'region-content-list-item';
    item.innerHTML = '<span></span><div><h3></h3><p></p></div>';
  }
  return item;
};

const regionContent = {
  hokkaido: {
    spots: [
      ['小樽', '港町散步與冬日風景', '沿著運河、倉庫街與海岸慢慢散步，感受小樽安靜而帶有懷舊感的城市氣氛。'],
      ['定山溪', '溫泉山谷與雪景', '在山谷、溪流與溫泉之間放慢腳步，記錄北海道冬季自然景色最安靜的一面。'],
      ['札幌', '城市街景與咖啡', '從大通公園、街角咖啡到夜晚的城市燈光，感受北海道首府輕鬆而開闊的日常節奏。']
    ],
    food: [
      ['小樽海鮮', '海鮮與甜點散步', '沿著運河與老街尋找新鮮海鮮、甜點與咖啡，讓小樽的港町風景延伸到餐桌。官方推薦的小樽三角市場也適合安排成早晨的第一站。'],
      ['溫泉會席', '溫泉旅館的一餐', '在山谷與溫泉之間享用當季料理，從北海道蔬菜、山菜到河川與海產，感受旅館餐桌的季節變化。'],
      ['札幌湯咖哩', '湯咖哩與北海道海味', '札幌是湯咖哩的發源地，也能在二條市場、狸小路一帶找到海鮮丼、成吉思汗烤肉與乳製甜點。'],
      ['帝王蟹', '札幌蟹料理與海鮮放題', '以北海道帝王蟹為主角，安排一餐海鮮吃到飽，難陀位於薄野附近，適合搭配札幌夜間行程。'],
      ['迴轉壽司', '北海道海鮮的日常餐桌', '以北海道在地魚介為主角，從北見發源的 Triton 到根室花丸，體驗高品質且親切的迴轉壽司。']
    ],
    stay: '札幌市區・定山溪溫泉旅館',
    note: ['2024 / 01', '從這裡開始累積北海道的旅行記憶。']
  },
  tokyo: {
    spots: [
      ['淺草', '寺院、老街與隅田川', '從雷門、仲見世通一路走到淺草寺，在江戶風情與隅田川河岸之間感受東京最經典的下町日常。'],
      ['東京站', '車站建築與皇居散步', '從東京站丸之內側延伸到皇居外苑，將歷史建築、商業街區與城市天際線放在同一段散步裡。'],
      ['澀谷', '街角人流與當代文化', '穿過澀谷十字路口，沿著代代木公園與表參道延伸探索，感受東京快速卻充滿細節的城市節奏。']
    ],
    food: [
      ['築地場外市場', '海鮮與市場早餐', '以新鮮海鮮、玉子燒與壽司開啟一天，從市場攤位看見東京餐桌與港口生活的連結。'],
      ['銀座', '精緻餐桌與老店', '在銀座的老舖、喫茶店與小餐館之間慢慢選一餐，感受東京成熟而講究的飲食文化。'],
      ['上野', '居酒屋與街區小吃', '沿著阿美橫町尋找串燒、拉麵與下酒菜，讓熱鬧的人聲成為旅行中最自然的背景。']
    ],
    stay: '上野・淺草一帶', note: ['2025 / 04', '以淺草、澀谷與上野為軸線，記錄東京街區在不同時間裡呈現的表情。']
  },
  nagoya: {
    spots: [
      ['名古屋站', '城下町與城市歷史', '從名古屋站前往名古屋城，將金鯱、本丸御殿與城下町歷史放進同一段城市散步。'],
      ['熱田', '古社與城市綠意', '以熱田神宮為主軸，在市中心的大樹與參道之間感受名古屋日常裡的信仰風景。'],
      ['榮', '電視塔與城市夜景', '從久屋大通公園一路走到 MIRAI TOWER，白天看城市軸線，夜裡欣賞榮的燈光。']
    ],
    food: [
      ['味噌豬排', '濃郁味噌與名古屋餐桌', '以赤味噌調成的醬汁搭配酥脆豬排，是認識名古屋地方口味最直接的一餐。'],
      ['手羽先', '街角居酒屋的香氣', '在居酒屋裡用胡椒與甘辛醬汁收尾，配上一杯飲料，感受名古屋夜晚輕鬆的用餐節奏。'],
      ['鰻魚飯三吃', '一碗飯的三種風景', '先品原味、再加入佐料，最後以茶泡飯收尾，讓同一份鰻魚呈現不同層次的香氣。']
    ],
    stay: '名古屋站・榮一帶', note: ['2025 / 06', '以名古屋城、熱田神宮與榮為主線，將城下町歷史與中部城市生活放在同一段旅程裡。']
  },
  osaka: {
    spots: [
      ['難波', '霓虹招牌與河岸夜色', '以難波為中心沿著道頓堀川散步，看固力果招牌與街邊人潮交錯。'],
      ['大阪城周邊', '城郭、公園與四季風景', '從大阪城公園走向天守閣，在寬闊綠地與歷史遺構之間理解大阪的城市骨架。'],
      ['日本橋', '電器街與次文化巡遊', '在日本橋的商店、街角與小店之間慢慢探索，觀察大阪日常與次文化並存的節奏。']
    ],
    food: [
      ['章魚燒', '大阪街頭的熱騰騰滋味', '現點現做的章魚燒搭配醬汁與柴魚片，是在道頓堀街頭邊走邊吃的經典體驗。'],
      ['大阪燒', '鐵板上的地方日常', '把高麗菜、麵糊與配料放上鐵板，從翻面與分享的過程感受大阪飲食文化的親切感。'],
      ['串炸', '新世界的下酒菜', '在新世界一帶選幾串炸物，搭配清爽醬汁與熱鬧街景，體驗大阪庶民餐桌的節奏。']
    ],
    stay: '難波・心齋橋一帶', note: ['2025 / 09', '從道頓堀的夜色走到大阪城的晨光，記錄一座城市在歷史與庶民生活之間的反差。']
  },
  'ise-shima': {
    spots: [
      ['伊勢', '古社參拜與森林參道', '從外宮到內宮沿著參道慢慢前進，在神宮林的安靜氣息裡感受伊勢志摩最核心的文化風景。'],
      ['志摩', '英虞灣的島嶼全景', '以橫山展望台與英虞灣為主軸，讓海岸線與山林成為旅途中的開闊背景。'],
      ['鳥羽', '海洋生物與珍珠之鄉', '在鳥羽認識伊勢志摩的海洋文化，從水族館的生物展演延伸到沿海城市的生活記憶。']
    ],
    food: [
      ['赤福餅', '參道上的經典甜點', '在伊勢參拜後以赤福餅作為甜點，讓柔軟麻糬與紅豆餡成為記住伊勢的味道。'],
      ['伊勢烏龍', '柔軟麵體與濃郁醬汁', '以粗軟麵條搭配甘辛醬汁，簡單卻很有地方性，是旅途中適合慢慢吃的一碗熱食。'],
      ['海女料理', '海岸與當季海味', '從牡蠣、伊勢龍蝦到海藻，透過海女小屋與海鮮料理理解伊勢志摩和大海之間的關係。']
    ],
    stay: '伊勢市站・鳥羽一帶', note: ['2025 / 11', '沿著神宮、老街與英虞灣移動，把伊勢志摩的信仰、海岸與餐桌串成一段慢旅。']
  },
  fukuoka: {
    spots: [
      ['太宰府', '古社與參道文化', '沿著參道走向太宰府天滿宮，在梅枝餅香氣、古樹與神社建築之間感受福岡近郊的歷史厚度。'],
      ['博多', '博多的守護與祭典', '以櫛田神社與博多舊市街為主軸，從山笠展示與街區細節認識福岡地方文化。'],
      ['百道濱', '海濱城市的高空視野', '以福岡塔與百道濱為主軸，在海風與夜景之間看見福岡開闊的一面。']
    ],
    food: [
      ['博多豚骨拉麵', '濃郁湯頭與細麵', '在博多街角享用一碗豚骨拉麵，從細麵、湯頭到替玉體驗福岡最具代表性的飲食文化。'],
      ['明太子', '海味與博多伴手禮', '以明太子搭配白飯或定食，感受福岡海港城市在餐桌上留下的鹹香記憶。'],
      ['中洲屋台', '夜晚的流動餐桌', '沿著中洲與那珂川尋找屋台，在小桌與陌生人共享的短暫時光裡，感受福岡夜晚的親近感。']
    ],
    stay: '博多站・天神一帶', note: ['2026 / 02', '從博多市區一路走到太宰府與海濱，記錄福岡在歷史、飲食與港灣風景之間的連續性。']
  }
};

const regionKey = regionHero && [...regionHero.classList].find((name) => name.startsWith('region-hero-'))?.replace('region-hero-', '');
const currentRegionContent = regionContent[regionKey];
if (currentRegionContent) {
  const updateItems = (selector, values) => {
    const list = document.querySelector(selector);
    if (!list) return;
    while (list.children.length < values.length) {
      list.append(createRegionContentItem(list.matches('.region-card-grid') ? 'card' : 'list'));
    }
    [...list.children].slice(0, values.length).forEach((item, index) => {
      const [label, title, description] = values[index];
      item.querySelector('span').textContent = label;
      item.querySelector('h3').textContent = title;
      item.querySelector('p').textContent = description;
    });
  };
  updateItems('#spots .region-card-grid', currentRegionContent.spots);
  updateItems('#food .region-content-list', currentRegionContent.food);
  const stay = document.querySelector('#stays .region-content-list article h3');
  if (stay) stay.textContent = currentRegionContent.stay;
  const note = document.querySelector('#notes .region-note');
  if (note) {
    note.querySelector('span').textContent = currentRegionContent.note[0];
    note.querySelector('p').textContent = currentRegionContent.note[1];
  }
}

const stayBaseContent = {
  hokkaido: ['札幌', '札幌市區與定山溪溫泉', '札幌適合以車站、大通與薄野作為城市據點；想放慢步調時，可安排定山溪溫泉旅館。'],
  tokyo: ['新宿', '新宿城市住宿', '以新宿作為交通據點，方便前往澀谷、淺草、上野與東京近郊。'],
  nagoya: ['名古屋站', '名古屋站周邊住宿', '以名古屋站作為中部旅行基地，適合串連市區、熱田神宮與周邊城市。'],
  osaka: ['難波', '難波與心齋橋住宿', '住在難波一帶可步行前往道頓堀、心齋橋與日本橋，適合大阪市區旅行。'],
  'ise-shima': ['伊勢市', '伊勢市站周邊住宿', '以伊勢市站作為參拜與移動據點，方便前往伊勢神宮、外宮與內宮。'],
  fukuoka: ['博多', '博多站周邊住宿', '博多站連結新幹線、地鐵與機場，適合串連太宰府、天神與福岡市區。']
};
const baseStay = stayBaseContent[regionKey];
const baseStayItem = document.querySelector('#stays .region-content-list article');
if (baseStay && baseStayItem) {
  baseStayItem.querySelector('span').textContent = baseStay[0];
  baseStayItem.querySelector('h3').textContent = baseStay[1];
  baseStayItem.querySelector('p').textContent = baseStay[2];
}

// 可持續擴充的地區資料：不再限制景點、美食、住宿或筆記只能有三筆。
const regionAdditionalContent = {
  hokkaido: {
    spots: [['旭川', '動物園與北國城市', '以旭山動物園為主軸，延伸探索旭川的城市生活與道北自然風景。'], ['美瑛', '丘陵與青池風景', '沿著美瑛丘陵、白金青池與田園道路移動，感受北海道開闊而安靜的色彩。'], ['函館', '港灣與山城夜景', '從函館山、元町街區到朝市，記錄道南城市的海港風景與異國歷史。']],
    food: [['成吉思汗烤肉', '北海道羊肉餐桌', '以鐵鍋烤羊肉搭配蔬菜，感受北海道最具代表性的在地料理。'], ['海鮮丼', '漁港的新鮮滋味', '在市場或海港城市品嚐海膽、鮭魚卵與季節海產，讓旅程連結北海道的漁業文化。'], ['北海道乳製甜點', '鮮乳與奶油的香氣', '從霜淇淋、布丁到起司蛋糕，將北海道豐富乳製品融入旅途中的甜點時間。']],
    stays: [['函館・湯之川溫泉', '海港與溫泉的住宿節奏', '以函館市區或湯之川溫泉為據點，適合串連函館山、朝市與道南景點。'], ['富良野・美瑛', '丘陵與花田之間', '適合安排景觀旅館、民宿或農場住宿，搭配自駕慢慢探索丘陵風景。']],
    notes: [['2024 / 02', '在雪景、溫泉與海港城市之間移動，記錄北海道冬季的不同層次。'], ['2024 / 07', '從富良野、美瑛到函館，將花田、青池與夜景收進同一趟旅程。']]
  },
  tokyo: {
    spots: [['押上', '城市與河岸的高空視角', '從押上一路探索東京晴空塔與隅田川周邊，看見傳統下町與現代城市並存的風景。'], ['原宿', '都市森林裡的參道', '穿過原宿旁的大片森林，感受東京少見的安靜與季節變化。']],
    food: [['江戶前壽司', '東京的細緻海味', '從市場壽司到江戶前料理，觀察東京如何把新鮮海產轉化成精緻的日常餐桌。'], ['東京拉麵', '街角湯頭與麵香', '在不同街區比較醬油、鹽味與豚骨湯頭，讓拉麵成為探索東京的方法。']],
    stays: [['新宿', '交通便利的城市據點', '適合串連西側市區、展望台與夜生活，前往各區也十分方便。'], ['淺草・上野', '下町風景與慢旅行', '適合喜歡步行、寺院、商店街與老街氛圍的旅程。']],
    notes: [['2025 / 05', '在山手線與地鐵之間穿梭，記錄東京街區從清晨到深夜的節奏。'], ['2025 / 10', '把東京的展望台、神社與市場串成一條城市散步路線。']]
  },
  nagoya: {
    spots: [['長久手', '動畫世界的森林散步', '以愛知的森林與場景為背景，適合安排完整一天慢慢探索吉卜力公園。'], ['名古屋港', '移動與工業的歷史', '從港區博物館與工業設施認識名古屋與中部地區的製造文化。'], ['大須', '老街商店街的活力', '從大須觀音延伸出的商店街，美食、電器與動漫店家聚集，適合安排半天慢慢逛。'], ['德川園', '大名庭園的四季', '尾張德川家留下的日式庭園，適合放慢腳步走一圈，在城市裡看季節變化。'], ['清洲', '信長起點的城與河岸', '從復原的清洲城眺望五條川，在名古屋近郊尋找織田信長早年的城下風景。'], ['常滑・知多', '陶之小鎮與環湖梅林', '沿著常滑的窯場煙囪與招財貓散步，再往知多的佐布里池走一段環湖賞梅路線。'], ['長島', '海灣邊的花與購物', '把長島的大型 Outlet 與四季花園排進同一天，是名古屋出發的日歸行程。']],
    food: [['名古屋雞翅', '甘辛胡椒的夜晚滋味', '以香脆雞翅搭配甘辛醬汁與胡椒，是名古屋居酒屋常見的下酒菜。'], ['小倉吐司', '喫茶店的早餐文化', '在名古屋喫茶店以烤吐司搭配紅豆餡，感受地方早餐文化的悠閒節奏。']],
    stays: [['榮', '公園與商業街區之間', '適合安排購物、餐飲與夜景行程，步行即可抵達多個市中心景點。'], ['金山', '跨城市移動的交通據點', '適合需要前往熱田、機場或周邊城市的行程。']],
    notes: [['2025 / 07', '在名古屋城與熱田神宮之間，尋找城市歷史仍留在日常裡的痕跡。'], ['2025 / 08', '從榮的夜景到喫茶店早餐，記錄名古屋不急著展示的生活感。']]
  },
  osaka: {
    spots: [['天保山', '大阪灣的海洋世界', '以海遊館、摩天輪與大阪灣為主軸，適合安排完整的港灣行程。'], ['梅田', '高樓之上的城市全景', '從梅田空中庭園眺望大阪市區，在日落與夜色之間感受關西大城市的尺度。']],
    food: [['箱壽司', '大阪傳統的押壽司', '以醋飯與魚料壓製成形，從壽司的另一種樣貌認識大阪飲食文化。'], ['狐貍烏龍麵', '關西湯頭的溫柔滋味', '以清爽高湯搭配豆皮，是適合在街區散步中補充的一碗日常熱食。']],
    stays: [['梅田', '北區的交通與夜景', '適合串連大阪站、梅田商圈與北區景點，雨天移動也相對方便。'], ['天王寺・阿倍野', '南大阪的城市觀景', '可串連阿倍野展望台、天王寺公園與新世界，適合多樣化行程。']],
    notes: [['2025 / 10', '沿著大阪城、梅田與道頓堀移動，觀察歷史景點與商業街區的強烈反差。'], ['2025 / 12', '把章魚燒、串炸與深夜街景整理成一段屬於大阪的城市記憶。']]
  },
  'ise-shima': {
    spots: [['伊勢內宮前', '參道旁的老街散步', '在伊勢神宮內宮前沿著御蔭橫丁散步，尋找地方工藝、伴手禮與傳統小吃。'], ['二見浦', '夫妻岩與海岸信仰', '在海岸看夫妻岩與鳥居，感受伊勢志摩獨特的海洋信仰風景。'], ['多氣', '職人工坊與美食村', '在多氣的複合設施裡集合工坊、餐廳與溫泉，適合在參拜行程之外放慢節奏停留一日。']],
    food: [['伊勢龍蝦', '志摩海岸的季節海味', '以伊勢志摩沿海鮮味為主角，安排一餐海鮮料理，認識半島與海的關係。'], ['松阪牛', '三重縣的精緻肉料理', '將松阪牛納入伊勢志摩旅程，從壽喜燒、燒肉或牛排體驗三重縣的代表食材。']],
    stays: [['鳥羽', '海景與水族館之間', '適合串連鳥羽水族館、珍珠島與鳥羽灣，選擇海景旅館可放慢旅行節奏。'], ['志摩・賢島', '英虞灣的度假風景', '適合安排展望台、遊船與海岸度假住宿，讓行程保留更多留白。']],
    notes: [['2025 / 12', '從伊勢神宮一路走到御蔭橫丁，記錄參拜、老街與地方餐桌的連續性。'], ['2026 / 01', '在鳥羽與志摩的海岸線之間移動，將海女文化與英虞灣風景放進旅記。']]
  },
  fukuoka: {
    spots: [['博多', '城市裡的水岸商場', '以博多運河城、商店與表演空間串起市區，適合安排購物與夜間散步。'], ['糸島', '海岸與白色鳥居', '沿著海岸欣賞櫻井二見浦與白色鳥居，感受福岡近郊適合慢慢移動的自然風景。']],
    food: [['水炊き', '雞湯鍋的溫暖餐桌', '以雞肉與蔬菜熬製湯頭，適合在福岡晚餐時感受九州料理的溫度。'], ['博多明太子', '鹹香海味與白飯', '從定食、飯糰到伴手禮，明太子是認識博多飲食文化的重要味道。']],
    stays: [['天神', '購物與屋台的城市中心', '適合串連天神商圈、中洲與福岡市區景點，晚間步行也很方便。'], ['糸島', '海岸邊的慢旅行', '適合安排一晚海邊民宿或旅宿，搭配咖啡店、海岸與夕陽行程。']],
    notes: [['2026 / 03', '從博多站出發，將神社、屋台與海港風景整理成一段福岡城市散步。'], ['2026 / 04', '沿著糸島海岸慢慢移動，在市區之外記錄福岡更寬闊的藍色風景。']]
  }
};

const additionalContent = regionAdditionalContent[regionKey];
if (additionalContent) {
  const appendItems = (selector, values, type) => {
    const list = document.querySelector(selector);
    if (!list) return;
    values.forEach(([label, title, description]) => {
      const item = createRegionContentItem(type);
      if (type === 'card') {
        item.querySelector('span').textContent = label;
        item.querySelector('h3').textContent = title;
        item.querySelector('p').textContent = description;
      } else {
        item.querySelector('span').textContent = label;
        item.querySelector('h3').textContent = title;
        item.querySelector('p').textContent = description;
      }
      list.append(item);
    });
  };
  appendItems('#spots .region-card-grid', additionalContent.spots, 'card');
  appendItems('#food .region-content-list', additionalContent.food, 'list');
  appendItems('#stays .region-content-list', additionalContent.stays, 'list');
  const notesSection = document.querySelector('#notes > div');
  if (notesSection && !notesSection.querySelector('.region-content-list')) {
    const notesList = document.createElement('div');
    notesList.className = 'region-content-list';
    const existingNote = notesSection.querySelector('.region-note');
    if (existingNote) notesList.append(existingNote);
    notesSection.append(notesList);
  }
  appendItems('#notes .region-content-list', additionalContent.notes, 'list');
}

const detailItems = [...document.querySelectorAll('#spots .region-content-card, #food .region-content-list article, #stays .region-content-list article, #notes .region-note, #notes .region-content-list article')];
if (detailItems.length) {
  const modal = document.createElement('div');
  modal.className = 'spot-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = '<div class="spot-modal-backdrop" data-spot-modal-close></div><section class="spot-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="spot-modal-title"><button class="spot-modal-close" type="button" aria-label="關閉旅行內容視窗" data-spot-modal-close>×</button><span class="spot-modal-label" id="spot-modal-label"></span><h2 id="spot-modal-title"></h2><p class="spot-modal-placeholder"></p><div class="spot-modal-table-wrap"><table class="spot-modal-table"><thead><tr><th scope="col">地名</th><th scope="col">資訊</th><th scope="col">交通方式</th><th scope="col">Google Map</th></tr></thead><tbody></tbody></table></div></section>';
  document.body.append(modal);
  const title = modal.querySelector('#spot-modal-title');
  const label = modal.querySelector('#spot-modal-label');
  const placeholder = modal.querySelector('.spot-modal-placeholder');
  const tableBody = modal.querySelector('.spot-modal-table tbody');
  const tableWrap = modal.querySelector('.spot-modal-table-wrap');
  const otaruPlaces = [
    ['小樽運河', '小樽最具代表性的港町地標，沿岸可欣賞石造倉庫與散步風景。', '由小樽站步行前往。', 'https://www.google.com/maps/search/?api=1&query=小樽運河'],
    ['天狗山', '眺望小樽市區與小樽港的代表景點，也適合欣賞夜景。', '由小樽站搭乘巴士或前往纜車站。', 'https://www.google.com/maps/search/?api=1&query=小樽天狗山'],
    ['堺町通', '集中玻璃工藝、甜點、海產與伴手禮店的經典街區。', '由小樽站步行約 15 分鐘。', 'https://www.google.com/maps/search/?api=1&query=小樽堺町通り'],
    ['小樽音樂盒堂', '充滿復古氣氛的音樂盒商店，位於堺町通一帶。', '由小樽站步行前往堺町通。', 'https://www.google.com/maps/search/?api=1&query=小樽オルゴール堂'],
    ['北一硝子', '代表小樽玻璃工藝的商店與展示空間。', '由小樽站步行或搭乘市區巴士。', 'https://www.google.com/maps/search/?api=1&query=北一硝子小樽'],
    ['舊手宮線', '保留鐵道遺跡的散步路線，串連車站與運河周邊。', '由小樽站步行前往。', 'https://www.google.com/maps/search/?api=1&query=旧手宮線小樽'],
    ['田中酒造 龜甲藏', '歷史悠久的酒藏，可認識北海道清酒與地方釀造文化。', '由小樽站步行或搭乘市區巴士。', 'https://www.google.com/maps/search/?api=1&query=田中酒造亀甲蔵'],
    ['小樽水族館', '位於祝津地區，適合安排半日的海洋生物參觀行程。', '由小樽站搭乘前往祝津的巴士。', 'https://www.google.com/maps/search/?api=1&query=おたる水族館'],
    ['小樽貴賓館／舊青山別邸', '了解小樽鰊漁業興盛時期的歷史建築與地方文化。', '由小樽站搭乘巴士前往祝津方向。', 'https://www.google.com/maps/search/?api=1&query=小樽貴賓館旧青山別邸']
  ];
  const jozankeiPlaces = [
    ['定山源泉公園', '以溫泉街的源泉與足湯為主題的休憩公園，適合短暫停留。', '由定山溪溫泉街步行前往。', 'https://www.google.com/maps/search/?api=1&query=定山源泉公園'],
    ['二見吊橋', '橫跨豐平川的紅色吊橋，是溪谷景色與秋葉季節的代表拍攝點。', '由定山溪溫泉街步行前往二見公園。', 'https://www.google.com/maps/search/?api=1&query=定山溪二見吊橋'],
    ['定山溪散步路線', '串連二見公園、二見吊橋、河童淵與赤岩之澗的溪谷散步路線。', '由定山溪溫泉街步行進入散步路線。', 'https://www.google.com/maps/search/?api=1&query=定山溪散步路線'],
    ['白絲瀑布', '溪谷中的瀑布景觀，四季都有不同的水色與森林氣氛。', '由定山溪溫泉街搭乘巴士或自駕前往。', 'https://www.google.com/maps/search/?api=1&query=定山溪白絲瀑布'],
    ['定山溪神社', '位於溫泉街附近的神社，可感受定山溪的地方歷史與山林氛圍。', '由定山溪溫泉街步行前往。', 'https://www.google.com/maps/search/?api=1&query=定山溪神社'],
    ['豐平峽大壩', '以峽谷、水壩與季節景色聞名，秋季紅葉尤其受到推薦。', '由定山溪溫泉街搭乘接駁車或自駕前往。', 'https://www.google.com/maps/search/?api=1&query=豐平峽大壩'],
    ['定山溪大壩', '可從展望台與下游園地欣賞水庫與山谷景觀。', '由定山溪溫泉街搭乘巴士或自駕前往。', 'https://www.google.com/maps/search/?api=1&query=定山溪大壩'],
    ['河童淵', '定山溪散步路線中的溪谷景點，延伸地方流傳的河童傳說。', '由二見吊橋一帶步行前往。', 'https://www.google.com/maps/search/?api=1&query=定山溪河童淵'],
    ['定山寺寶物殿', '認識定山溪開湯歷史與地方寺院文化的室內景點。', '由定山溪溫泉街步行前往。', 'https://www.google.com/maps/search/?api=1&query=定山寺寶物殿']
  ];
  const sapporoPlaces = [
    ['大通公園', '札幌市中心的代表性公園，串連市區景觀與四季活動。', '搭乘地下鐵至大通站。', 'https://www.google.com/maps/search/?api=1&query=札幌大通公園'],
    ['北海道神宮', '札幌重要的神社與綠地，適合感受開拓歷史與季節景色。', '搭乘地下鐵至圓山公園站後步行。', 'https://www.google.com/maps/search/?api=1&query=北海道神宮'],
    ['藻岩山', '從標高 531 公尺的山頂眺望札幌市區與夜景。', '搭乘市電或巴士前往藻岩山纜車站。', 'https://www.google.com/maps/search/?api=1&query=札幌藻岩山纜車'],
    ['札幌羊之丘展望台', '以開闊草原與札幌市景聞名的城市近郊展望台。', '由地下鐵福住站轉乘巴士。', 'https://www.google.com/maps/search/?api=1&query=札幌羊之丘展望台'],
    ['狸小路商店街', '擁有悠久歷史的拱廊商店街，集合購物、餐飲與地方生活。', '搭乘地下鐵至大通站或薄野站後步行。', 'https://www.google.com/maps/search/?api=1&query=狸小路商店街'],
    ['札幌市鐘樓', '札幌開拓時期的重要歷史建築，也是市中心的經典地標。', '由大通站或札幌站步行前往。', 'https://www.google.com/maps/search/?api=1&query=札幌市時計台'],
    ['札幌電視塔', '位於大通公園東端，可從展望台俯瞰札幌市區。', '搭乘地下鐵至大通站。', 'https://www.google.com/maps/search/?api=1&query=札幌電視塔'],
    ['札幌啤酒博物館', '在歷史建築中認識北海道啤酒與札幌啤酒的發展故事。', '由札幌站搭乘巴士或步行前往。', 'https://www.google.com/maps/search/?api=1&query=札幌啤酒博物館'],
    ['白色戀人公園', '結合甜點工廠、花園與體驗活動的札幌代表景點。', '搭乘地下鐵至宮之澤站後步行。', 'https://www.google.com/maps/search/?api=1&query=白色戀人公園']
  ];
  const asahikawaPlaces = [
    ['旭山動物園', '以行動展示聞名的旭川代表景點，可近距離觀察北國動物。', '由旭川站搭乘巴士前往。', 'https://www.google.com/maps/search/?api=1&query=旭山動物園'],
    ['旭川市旭山動物園周邊', '適合將動物園與旭川市區、拉麵村安排成一日行程。', '由旭川站搭乘市區巴士或自駕。', 'https://www.google.com/maps/search/?api=1&query=旭川市旭山動物園']
  ];
  const bieiPlaces = [
    ['白金青池', '池水與森林交織出的美瑛代表性藍色風景。', '由美瑛站搭乘巴士或自駕前往。', 'https://www.google.com/maps/search/?api=1&query=白金青池'],
    ['四季彩之丘', '以丘陵花田與季節景色聞名，冬季也有雪上活動。', '由美瑛站搭乘巴士或自駕前往。', 'https://www.google.com/maps/search/?api=1&query=四季彩之丘']
  ];
  const hakodatePlaces = [
    ['函館山', '從山頂眺望港灣與街區燈火的代表性夜景景點。', '由函館市電或巴士前往纜車站。', 'https://www.google.com/maps/search/?api=1&query=函館山'],
    ['函館朝市', '集結海鮮、烏賊與海鮮丼的函館代表市場。', '由函館站步行前往。', 'https://www.google.com/maps/search/?api=1&query=函館朝市'],
    ['五稜郭公園', '星形城郭與季節景色交織的歷史公園。', '搭乘函館市電至五稜郭公園前站。', 'https://www.google.com/maps/search/?api=1&query=五稜郭公園']
  ];
  const hokkaidoFoodPlaces = {
    '小樽海鮮': [
      ['滝波食堂', '小樽三角市場內的人氣海鮮食堂，可品嚐海鮮丼與季節魚介。', '由 JR 小樽站步行前往三角市場。', 'https://www.google.com/maps/search/?api=1&query=滝波食堂小樽'],
      ['小樽政壽司', '小樽代表性的壽司店，適合品嚐北海道海膽、鮭魚卵與季節魚料。', '由小樽站步行前往堺町通一帶。', 'https://www.google.com/maps/search/?api=1&query=小樽政壽司']
    ],
    '溫泉會席': [
      ['定山溪第一寶亭留 翠山亭', '定山溪溫泉旅館，提供以北海道當季食材為主的會席料理。', '由札幌站或大通站搭乘定山溪方向巴士。', 'https://www.google.com/maps/search/?api=1&query=定山溪第一寶亭留翠山亭'],
      ['定山溪鶴雅度假村 森之謌', '以山林度假為主題，提供自助餐與北海道食材料理。', '由札幌市區搭乘巴士或自駕前往。', 'https://www.google.com/maps/search/?api=1&query=定山溪鶴雅度假村森之謌']
    ],
    '札幌湯咖哩': [
      ['GARAKU', '札幌人氣湯咖哩店，以豐富香料與柔嫩雞腿肉聞名。', '由大通站或薄野站步行前往。', 'https://www.google.com/maps/search/?api=1&query=札幌湯咖哩GARAKU'],
      ['Soup Curry Suage4', '以炭烤串燒配料與清爽湯頭呈現札幌湯咖哩。', '位於札幌市中心，從薄野站步行前往。', 'https://www.google.com/maps/search/?api=1&query=Soup+Curry+Suage4+札幌'],
      ['奧芝商店 實家', '以每天熬煮大量蝦頭製作元祖鮮蝦湯底，是札幌湯咖哩的代表店家。', '由札幌大通站步行約 5 分鐘。', 'https://www.google.com/maps/search/?api=1&query=奥芝商店実家店札幌'],
      ['奧芝商店 站前創成寺店', '位於札幌站附近的分店，同樣提供招牌蝦高湯湯咖哩，適合搭配車站周邊行程。', '由 JR 札幌站步行約 2 分鐘，位於北 4 條西 1 丁目地下街。', 'https://www.google.com/maps/search/?api=1&query=奥芝商店駅前創成寺店札幌']
    ],
    '帝王蟹': [
      ['難陀', '札幌薄野的海鮮自助餐廳，提供帝王蟹、毛蟹、雪蟹、壽司與北海道海鮮。', '地下鐵東豐線豐水薄野站 4 號出口步行約 1 分鐘。', 'https://www.google.com/maps/search/?api=1&query=海鮮バイキング難陀札幌'],
      ['札幌螃蟹本家 札幌站前本店', '以帝王蟹、毛蟹與雪蟹料理為主的札幌蟹料理名店。', '由 JR 札幌站南口步行前往。', 'https://www.google.com/maps/search/?api=1&query=札幌かに本家札幌駅前本店']
    ],
    '成吉思汗烤肉': [
      ['成吉思汗だるま', '札幌代表性的成吉思汗烤羊肉店，適合品嚐羊肉與札幌夜生活。', '由薄野站步行前往。', 'https://www.google.com/maps/search/?api=1&query=成吉思汗だるま札幌'],
      ['札幌啤酒園', '在歷史建築與啤酒氛圍中享用成吉思汗烤肉。', '由札幌站搭乘巴士或步行前往。', 'https://www.google.com/maps/search/?api=1&query=札幌啤酒園成吉思汗']
    ],
    '海鮮丼': [
      ['二條市場 大磯', '札幌二條市場內的海鮮食堂，使用市場新鮮魚介製作海鮮丼。', '由大通站步行約 7 分鐘。', 'https://www.google.com/maps/search/?api=1&query=二条市場大磯札幌'],
      ['札幌場外市場 北のグルメ亭', '札幌中央卸賣市場場外的人氣海鮮食堂，可品嚐海膽、鮭魚卵與螃蟹。', '由 JR 桑園站步行或搭乘巴士前往。', 'https://www.google.com/maps/search/?api=1&query=北のグルメ亭札幌']
    ],
    '北海道乳製甜點': [
      ['六花亭 札幌本店', '北海道代表性的甜點品牌，可品嚐奶油、巧克力與季節甜點。', '由 JR 札幌站步行前往。', 'https://www.google.com/maps/search/?api=1&query=六花亭札幌本店'],
      ['北菓樓 札幌本館', '以北海道乳製品與年輪蛋糕、泡芙等甜點聞名。', '由大通站步行前往。', 'https://www.google.com/maps/search/?api=1&query=北菓樓札幌本館']
    ],
    '迴轉壽司': [
      ['回転寿司 トリトン 厚別店', '源自北見的北海道迴轉壽司品牌，以新鮮魚介與份量感受到旅客喜愛。', '由 JR 森林公園站或新札幌一帶搭乘巴士前往。', 'https://www.google.com/maps/search/?api=1&query=回転寿司トリトン厚別店'],
      ['根室花丸 JR Tower Stellar Place 店', '根室發源的迴轉壽司品牌，使用根室與北海道各地的季節魚介。', '與 JR 札幌站直結，位於 Stellar Place 6 樓。', 'https://www.google.com/maps/search/?api=1&query=根室花まるJRタワーステラプレイス店']
    ]
  };
  const hokkaidoStayPlaces = {
    '札幌': [
      ['JR INN 札幌', '札幌站步行圈的實用型住宿，適合重視交通與早餐的旅程。', '由 JR 札幌站步行前往。', 'https://www.google.com/maps/search/?api=1&query=JR+INN札幌'],
      ['Vessel Hotel Campana Susukino', '薄野地區的中價位住宿選擇，適合安排市區美食與夜生活。', '由薄野站步行前往。', 'https://www.google.com/maps/search/?api=1&query=Vessel+Hotel+Campana+Susukino'],
      ['JR Tower Hotel Nikko Sapporo', '與札幌站直結，適合需要便利交通與市區景觀的行程。', '與 JR 札幌站直結。', 'https://www.google.com/maps/search/?api=1&query=JR塔日航札幌']
    ],
    '札幌市區・定山溪溫泉旅館': [
      ['定山溪ビューホテル', '定山溪溫泉區的大型溫泉旅館，適合想兼顧泡湯與相對容易抵達的旅客。', '由札幌市區搭乘定山溪方向巴士。', 'https://www.google.com/maps/search/?api=1&query=定山溪ビューホテル'],
      ['JR INN 札幌', '若以札幌為主要住宿據點，可用市區飯店搭配定山溪一日往返。', '由 JR 札幌站步行前往。', 'https://www.google.com/maps/search/?api=1&query=JR+INN札幌']
    ],
    '函館・湯之川溫泉': [
      ['JR INN 函館', '與函館站相連的實用型住宿，適合朝市、電車與函館市區行程。', '與 JR 函館站直結。', 'https://www.google.com/maps/search/?api=1&query=JR+INN函館'],
      ['湯之川王子飯店 渚亭', '湯之川溫泉區的海景溫泉旅館，適合把泡湯安排進函館旅程。', '由函館站搭乘市電至湯之川站。', 'https://www.google.com/maps/search/?api=1&query=湯之川プリンスホテル渚亭']
    ],
    '富良野・美瑛': [
      ['JR Mobile Inn 富良野', '適合自駕旅客的簡潔住宿，方便安排富良野、美瑛與周邊景點。', '由富良野站或自駕前往。', 'https://www.google.com/maps/search/?api=1&query=JRモバイルイン富良野'],
      ['富良野 Natulux Hotel', '位於富良野站附近，適合以大眾交通串連市區與花田行程。', '由 JR 富良野站步行前往。', 'https://www.google.com/maps/search/?api=1&query=富良野ナチュラクスホテル'],
      ['美瑛町民宿與旅館', '美瑛觀光協會整理的住宿選擇，適合依車站、景觀與自駕需求比較。', '由美瑛站或旭川機場轉乘巴士前往。', 'https://www.google.com/maps/search/?api=1&query=美瑛住宿']
    ]
  };
  // 地點資料一律以「地區 → 分類 → 項目標籤 → 資料列」的結構查詢。
  // 北海道原本散在外面的專屬陣列也併進來，讓六個地區走同一條查表路徑。
  const regionalVenueData = {
    hokkaido: {
      spots: {
        '小樽': otaruPlaces, '定山溪': jozankeiPlaces, '札幌': sapporoPlaces,
        '旭川': asahikawaPlaces, '美瑛': bieiPlaces, '函館': hakodatePlaces
      },
      food: hokkaidoFoodPlaces,
      stays: hokkaidoStayPlaces
    },
    tokyo: {
      spots: {
        '淺草': [['淺草寺', '東京最具代表性的下町寺院與觀光景點。', '由淺草站步行前往。'], ['雷門與仲見世通', '連結寺院、老街與伴手禮店的經典散步路線。', '由淺草站步行前往。']],
        '東京站': [['東京站丸之內站舍', '保存歷史外觀的東京代表性車站建築。', '由東京站丸之內南口步行前往。'], ['皇居外苑', '從東京站延伸出的城市綠地與歷史景觀。', '由東京站步行前往。']],
        '澀谷': [['SHIBUYA SKY', '澀谷站上方的露天展望空間。', '由澀谷站步行前往。']]
      },
      food: {
        '築地場外市場': [['築地場外市場', '集結海鮮、壽司與市場早餐的東京代表市場。', '由築地市場站步行前往。'], ['壽司大', '築地市場內知名壽司店。', '由築地市場站步行前往。']],
        '銀座': [['銀座 久兵衛', '銀座代表性的江戶前壽司店。', '由銀座站步行前往。'], ['資生堂パーラー', '銀座老字號洋食與甜點店。', '由銀座站步行前往。']],
        '江戶前壽司': [['壽司大', '以築地新鮮魚介為主的壽司名店。', '由築地市場站步行前往。']]
      },
      stays: {
        '新宿': [['JR九州飯店 Blossom 新宿', '新宿站附近的實用型住宿，適合城市移動。', '由新宿站南口步行前往。'], ['東急Stay 新宿', '適合長住與有洗衣需求的旅客。', '由新宿三丁目站步行前往。']],
        '上野・淺草一帶': [['相鐵FRESA INN 上野御徒町', '交通便利的實用型市區住宿。', '由上野御徒町站步行前往。'], ['THE GATE HOTEL 雷門 by HULIC', '可欣賞淺草與東京晴空塔景色。', '由淺草站步行前往。']]
      }
    },
    nagoya: {
      spots: {
        '名古屋站': [
          ['名古屋城', '中區本丸的名古屋地標城堡，以金鯱聞名，可登城參觀天守閣。', '由名城線名古屋城站步行前往。'],
          ['金鯱橫丁 義直區', '中區三之丸、名古屋城正門旁的美食街，以重現江戶時代街景為主題。', '由名城線名古屋城站步行前往，位於名古屋城正門側。', 'https://www.google.com/maps/search/?api=1&query=金シャチ横丁 義直ゾーン'],
          ['TOYOTA產業技術紀念館', '西區則武新町的科學技術館，位於豐田發源地，展示紡織機與汽車技術的演進。', '由名鐵名古屋本線栄生站步行前往。', 'https://www.google.com/maps/search/?api=1&query=トヨタ産業技術記念館'],
          ['LE LABO（高島屋 Gate Tower Mall）', '中村區名駅、名古屋站直結購物中心內的香水專門店。', '由名古屋站直結的 Gate Tower Mall 前往。', 'https://www.google.com/maps/search/?api=1&query=LE LABO ゲートタワーモール'],
          ['AEON MALL Nagoya Noritake Garden', '西區則武新町、鄰近則武花園森林的大型購物中心。', '由名古屋站步行前往，或由東山線亀島站步行前往。', 'https://www.google.com/maps/search/?api=1&query=イオンモール Nagoya Noritake Garden']
        ],
        '熱田': [['熱田神宮', '名古屋市中心的重要神社與森林參道。', '由名鐵神宮前站步行前往。']],
        '榮': [
          ['中部電力 MIRAI TOWER', '以久屋大通與展望台為主軸的名古屋城市地標。', '由榮站步行前往。'],
          ['Oasis 21', '東區東桜的榮地區地標建築，屋頂「水之宇宙船」是可步行的空中步道，館內並有哈利波特商店。', '由榮站或久屋大通站步行前往。', 'https://www.google.com/maps/search/?api=1&query=オアシス21'],
          ['Central Park', '中區錦的久屋大通公園地下街購物商場。', '由久屋大通站或榮站直結前往。', 'https://www.google.com/maps/search/?api=1&query=名古屋 セントラルパーク 地下街'],
          ['LACHIC', '中區榮的時尚購物中心，以生活雜貨與時尚品牌聞名。', '由榮站或矢場町站步行前往。', 'https://www.google.com/maps/search/?api=1&query=ラシック 名古屋']
        ],
        '名古屋港': [
          ['名古屋港水族館', '港區港町的大型水族館，以虎鯨與企鵝館聞名。', '由名港線名古屋港站步行前往。'],
          ['日本樂高樂園', '港區金城埠頭的 LEGOLAND Japan，適合親子同遊。', '由あおなみ線金城ふ頭站步行前往。', 'https://www.google.com/maps/search/?api=1&query=レゴランド・ジャパン']
        ],
        '大須': [['大須商店街', '中區大須最有活力的老街商店街，美食、電器與動漫店家聚集。', '由大須觀音站或上前津站步行前往。', 'https://www.google.com/maps/search/?api=1&query=大須商店街']],
        '德川園': [['德川園', '東區徳川町的日式庭園，原為尾張德川家的宅邸庭園，四季皆有不同景致。', '由大曾根站步行前往。', 'https://www.google.com/maps/search/?api=1&query=徳川園']],
        '清洲': [
          ['清洲城', '愛知縣清須市的城堡，是織田信長早年的居城，復原天守閣可眺望五條川。', '由 JR 清洲站或名鐵新清洲站步行前往。', 'https://www.google.com/maps/search/?api=1&query=清洲城'],
          ['Daitsu Park', '清須市內的社區公園，位於清洲城周邊。', '由 JR 清洲站或名鐵新清洲站步行前往。', 'https://www.google.com/maps/search/?api=1&query=Daitsu Park 清須市']
        ],
        '常滑・知多': [
          ['常滑招財貓通', '愛知縣常滑市的常滑燒陶藝小鎮，沿路擺滿大型招財貓與老窯場煙囪。', '由名鐵常滑線常滑站步行前往。', 'https://www.google.com/maps/search/?api=1&query=とこなめ招き猫通り'],
          ['佐布里池 梅林', '愛知縣知多市的賞梅名所，環湖步道旁種有約 6000 株梅樹。', '由名鐵朝倉站轉乘巴士前往。', 'https://www.google.com/maps/search/?api=1&query=佐布里池梅林']
        ],
        '長島': [
          ['三井 OUTLET PARK 爵士之夢長島', '三重縣桑名市長島町的東海地區最大 Outlet，鄰近長島溫泉樂園。', '由名古屋站搭乘直達巴士前往，或由桑名站轉乘巴士。', 'https://www.google.com/maps/search/?api=1&query=三井アウトレットパーク ジャズドリーム長島'],
          ['名花之里', '三重縣桑名市長島町的四季花卉庭園，以冬季點燈祭聞名。', '由名古屋站搭乘直達巴士前往。', 'https://www.google.com/maps/search/?api=1&query=なばなの里']
        ]
      },
      food: {'味噌豬排': [['矢場とん 矢場町本店', '名古屋代表性的味噌豬排名店。', '由矢場町站步行前往。']], '名古屋雞翅': [['世界の山ちゃん 本店', '以胡椒香氣與甘辛醬汁聞名的雞翅店。', '由榮站步行前往。']], '鰻魚飯三吃': [['熱田蓬萊軒 本店', '鰻魚飯三吃的代表老店。', '由熱田神宮西站步行前往。']]},
      stays: {'名古屋站・榮一帶': [['名古屋JR Gate Tower Hotel', '與名古屋站相連，適合城市與中部周邊旅行。', '與 JR 名古屋站直結。'], ['名古屋萬豪Associa酒店', '車站共構的完整型住宿選擇。', '與 JR 名古屋站直結。']], '榮': [['Richmond Hotel 名古屋納屋橋', '適合市中心觀光的實用型住宿。', '由伏見站步行前往。'], ['Hotel Forza 名古屋榮', '以舒適與實用為主的智慧型飯店，提供早餐與多種放鬆設備，適合名古屋市區旅行。', '由地下鐵名城線矢場町站 5、6 號出口步行約 5 分鐘。', 'https://www.google.com/maps/search/?api=1&query=ホテルフォルツァ名古屋栄']]}
    },
    osaka: {
      spots: {'難波': [['道頓堀戎橋', '大阪最具代表性的霓虹與河岸街景。', '由難波站步行前往。']], '大阪城周邊': [['大阪城天守閣', '大阪歷史與城市公園的核心景點。', '由森之宮站步行前往。']], '天保山': [['海遊館', '以環太平洋展示聞名的大阪灣水族館。', '由大阪港站步行前往。']], '梅田': [['梅田空中庭園', '從高樓展望台欣賞大阪市區與夜景。', '由大阪站步行前往。']]},
      food: {'章魚燒': [['たこ焼道楽わなか 千日前本店', '大阪人氣章魚燒店。', '由難波站步行前往。']], '大阪燒': [['美津の', '道頓堀老字號大阪燒店。', '由難波站步行前往。']], '串炸': [['串かつだるま 新世界總本店', '新世界代表性的串炸店。', '由動物園前站步行前往。']], '箱壽司': [['箱壽司 吉野鯗', '大阪傳統押壽司的代表店家，可品嚐鯖魚、穴子等箱壽司。', '由大阪上本町站或谷町九丁目站步行前往。']]},
      stays: {'難波・心齋橋一帶': [['Hotel The Flag 心齋橋', '適合大阪市中心散步與美食行程。', '由心齋橋站步行前往。'], ['APA Hotel 難波心齋橋', '交通便利的市區型住宿。', '由難波站步行前往。']], '梅田': [['Hotel Hankyu RESPIRE 大阪', '大阪站周邊的大型實用住宿。', '由大阪站步行前往。']]}
    },
    'ise-shima': {
      spots: {'伊勢': [['伊勢神宮 內宮', '伊勢志摩最核心的參拜景點。', '由伊勢市站搭乘巴士前往。']], '志摩': [['橫山展望台', '俯瞰英虞灣與島嶼群的展望台。', '由賢島站搭乘巴士或自駕前往。']], '鳥羽': [['鳥羽水族館', '展示豐富海洋生物的鳥羽代表景點。', '由鳥羽站步行前往。']], '多氣': [['VISON', '多氣郡多氣町的大型美食觀光複合設施，集結職人工坊、餐廳與溫泉旅館。', '由近鐵松阪站轉乘巴士前往，自駕可由伊勢自動車道多氣勢和交流道直達。', 'https://www.google.com/maps/search/?api=1&query=VISON 多気']]},
      food: {'赤福餅': [['赤福本店', '伊勢參道上的代表性赤福餅老店。', '由內宮前巴士站步行前往。']], '伊勢烏龍': [['ふくすけ', '御蔭橫丁內的人氣伊勢烏龍店。', '由內宮前巴士站步行前往。']], '海女料理': [['海女小屋 相差かまど', '體驗海女文化與當季海產料理。', '由鳥羽站轉乘巴士前往。']]},
      stays: {'伊勢市站・鳥羽一帶': [['伊勢神泉', '位於伊勢市站前，適合參拜行程的溫泉住宿。', '由伊勢市站步行前往。'], ['鳥羽シーサイドホテル', '面向鳥羽灣的海景溫泉住宿。', '由鳥羽站搭乘接駁車或巴士前往。']], '鳥羽': [['鳥羽國際飯店', '鳥羽灣旁的經典海景住宿。', '由鳥羽站搭乘接駁車前往。']]}
    },
    fukuoka: {
      spots: {'太宰府': [['太宰府天滿宮', '福岡近郊最具代表性的歷史神社。', '由西鐵太宰府站步行前往。']], '博多': [['櫛田神社', '博多祇園山笠的重要神社。', '由櫛田神社前站步行前往。']], '百道濱': [['福岡塔', '從海濱高塔眺望福岡市區與博多灣。', '由西新站轉乘巴士前往。']]},
      food: {'博多豚骨拉麵': [['一蘭總本店', '博多豚骨拉麵的代表性店家。', '由中洲川端站步行前往。']], '明太子': [['ふくや 博多店', '福岡明太子的知名品牌與伴手禮店。', '由博多站步行前往。']], '中洲屋台': [['中洲屋台街', '沿著那珂川體驗福岡夜晚的屋台餐桌。', '由中洲川端站步行前往。']]},
      stays: {'博多站・天神一帶': [['JR九州飯店 Blossom 博多中央', '博多站附近的實用型住宿，適合市區與近郊移動。', '由博多站步行前往。'], ['THE BLOSSOM HAKATA Premier', '位於博多核心區，適合以步行探索市區。', '由櫛田神社前站步行前往。']], '天神': [['福岡天神東急REI酒店', '適合購物、屋台與市中心散步的住宿。', '由天神站步行前往。']]}
    }
  };
  const mapSearchUrl = (query) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  const mapCell = (name, href) => href
    ? `<td><a class="spot-modal-map-link" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="在 Google Maps 開啟${name}">開啟地圖</a></td>`
    : '<td>—</td>';
  // 所有資料列都由這裡產生，避免每個查表分支各自複製一份相同的樣板。
  const renderRows = (rows) => rows.map(([name, info, transport, mapUrl]) =>
    `<tr><td>${name}</td><td>${info}</td><td>${transport}</td>${mapCell(name, mapUrl || mapSearchUrl(name))}</tr>`
  ).join('');

  const renderItemTable = (item) => {
    if (!tableBody) return;
    const place = item.querySelector('span')?.textContent?.trim() || '待補充地點';
    const info = item.querySelector('p')?.textContent?.trim() || '待補充資訊';
    const sectionName = item.closest('.region-section')?.id || 'travel';

    const rows = regionalVenueData[regionKey]?.[sectionName]?.[place];
    if (rows) {
      tableBody.innerHTML = renderRows(rows);
      if (tableWrap) tableWrap.hidden = false;
      return;
    }

    // 旅行筆記的標籤是年月而不是地點，資料表的四個欄位沒有一欄填得出真實內容，
    // 硬填只會產生看起來像資料的假資料。實際行程資料就緒前，這裡不顯示資料表。
    if (sectionName === 'notes') {
      tableBody.innerHTML = '';
      if (tableWrap) tableWrap.hidden = true;
      return;
    }

    // 沒有對應地點資料時的 fallback：查詢字串必須帶入項目實際所在的地區。
    const transport = sectionName === 'stays' ? '待補充住宿位置與移動方式' : '待補充前往方式';
    const href = mapSearchUrl(`${place} ${currentRegionSearchName}`.trim());
    tableBody.innerHTML = `<tr><td>${place}</td><td>${info}</td><td>${transport}</td>${mapCell(place, href)}</tr>`;
    if (tableWrap) tableWrap.hidden = false;
  };
  const closeButton = modal.querySelector('.spot-modal-close');
  let previousFocus = null;
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-is-open');
    const focusTarget = previousFocus;
    previousFocus = null;
    focusTarget?.focus();
    focusTarget?.blur();
    focusTarget?.classList.add('modal-just-closed');
    detailItems.forEach((item) => item.classList.remove('is-pointer-active'));
    if (activeGlowItem) activeGlowItem.classList.remove('is-pointer-active');
    activeGlowItem = null;
  };
  const openModal = (item) => {
    previousFocus = document.activeElement;
    label.textContent = item.querySelector('span')?.textContent || 'TRAVEL NOTE';
    // 旅行筆記只有 span + p，標題會落在 p 上；此時不要再把同一段文字重複成內文。
    const headingText = item.querySelector('h3, strong')?.textContent?.trim();
    const bodyText = item.querySelector('p')?.textContent?.trim();
    title.textContent = headingText || bodyText || '旅行內容';
    if (placeholder) {
      placeholder.textContent = headingText ? bodyText || '' : '';
      placeholder.hidden = !placeholder.textContent;
    }
    renderItemTable(item);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-is-open');
    closeButton.focus();
  };
  detailItems.forEach((item) => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) return;
      openModal(item);
    });
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openModal(item); }
    });
  });
  modal.addEventListener('click', (event) => {
    if (event.target.matches('[data-spot-modal-close]')) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
}

document.querySelectorAll('.region-facts:not(.region-facts-wide)').forEach((facts) => {
  let glowFrame = 0;
  let pendingPointer = null;
  const updateGlass = (event) => {
    pendingPointer = event;
    if (glowFrame) return;
    glowFrame = window.requestAnimationFrame(() => {
      const rect = facts.getBoundingClientRect();
      facts.style.setProperty('--pointer-x', `${pendingPointer.clientX - rect.left}px`);
      facts.style.setProperty('--pointer-y', `${pendingPointer.clientY - rect.top}px`);
      glowFrame = 0;
    });
    facts.classList.add('is-pointer-active');
  };
  facts.addEventListener('pointerenter', updateGlass);
  facts.addEventListener('pointermove', updateGlass);
  facts.addEventListener('pointerleave', () => facts.classList.remove('is-pointer-active'));
  facts.addEventListener('focusin', () => facts.classList.add('is-pointer-active'));
  facts.addEventListener('focusout', () => {
    if (!facts.matches(':hover')) facts.classList.remove('is-pointer-active');
  });
});

// 使用事件代理，讓之後動態新增的內容項目也自動擁有滑鼠追蹤光暈。
const glowSelector = '.region-card-grid .region-content-card, .region-content-list article, .region-note';
let delegatedGlowFrame = 0;
let delegatedGlowTarget = null;
let activeGlowItem = null;
document.addEventListener('pointermove', (event) => {
  const item = event.target.closest?.(glowSelector);
  if (!item) return;
  if (activeGlowItem && activeGlowItem !== item) activeGlowItem.classList.remove('is-pointer-active');
  activeGlowItem = item;
  delegatedGlowTarget = { item, event };
  if (delegatedGlowFrame) return;
  delegatedGlowFrame = window.requestAnimationFrame(() => {
    const rect = delegatedGlowTarget.item.getBoundingClientRect();
    delegatedGlowTarget.item.style.setProperty('--pointer-x', `${delegatedGlowTarget.event.clientX - rect.left}px`);
    delegatedGlowTarget.item.style.setProperty('--pointer-y', `${delegatedGlowTarget.event.clientY - rect.top}px`);
    delegatedGlowTarget.item.classList.add('is-pointer-active');
    delegatedGlowFrame = 0;
  });
});
document.addEventListener('pointerout', (event) => {
  const item = event.target.closest?.(glowSelector);
  if (item && !item.contains(event.relatedTarget)) {
    item.classList.remove('is-pointer-active', 'modal-just-closed');
  }
});
document.addEventListener('focusin', (event) => {
  const item = event.target.closest?.(glowSelector);
  if (item) item.classList.add('is-pointer-active');
});
document.addEventListener('focusout', (event) => {
  const item = event.target.closest?.(glowSelector);
  if (item && !item.matches(':hover')) item.classList.remove('is-pointer-active');
});

if (regionNav) {
  const links = [...regionNav.querySelectorAll('a')];
  const glassIndicator = document.createElement('span');
  glassIndicator.className = 'region-nav-glass-indicator';
  glassIndicator.setAttribute('aria-hidden', 'true');
  regionNav.append(glassIndicator);
  const moveIndicator = (link, pointerEvent = null) => {
    const navRect = regionNav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const glowSize = 192;
    const pointerX = pointerEvent ? pointerEvent.clientX : linkRect.left + linkRect.width / 2;
    const pointerY = pointerEvent ? pointerEvent.clientY : linkRect.top + linkRect.height / 2;
    const x = Math.max(linkRect.left, Math.min(pointerX, linkRect.right)) - navRect.left + regionNav.scrollLeft - glowSize / 2;
    const y = Math.max(linkRect.top, Math.min(pointerY, linkRect.bottom)) - navRect.top - glowSize / 2;
    glassIndicator.style.transform = `translate(${x}px, ${y}px)`;
    glassIndicator.classList.add('is-visible');
  };
  const trackPointer = (link, event) => {
    const rect = link.getBoundingClientRect();
    link.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
    link.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
    moveIndicator(link, event);
  };
  links.forEach((link) => {
    link.addEventListener('pointerenter', (event) => trackPointer(link, event));
    link.addEventListener('pointermove', (event) => trackPointer(link, event));
    link.addEventListener('focus', () => moveIndicator(link));
  });
  regionNav.addEventListener('pointermove', (event) => {
    const link = document.elementFromPoint(event.clientX, event.clientY)?.closest('a');
    if (link && links.includes(link)) trackPointer(link, event);
  });
  regionNav.addEventListener('pointerleave', () => glassIndicator.classList.remove('is-visible'));
  const sections = links.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  let isProgrammaticScroll = false;
  const setActive = (section) => links.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${section.id}`));
  const observer = new IntersectionObserver((entries) => {
    if (isProgrammaticScroll) return;
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActive(visible.target);
  }, { rootMargin: '-20% 0px -65% 0px', threshold: [0, .2, .6] });
  sections.forEach((section) => observer.observe(section));
  links.forEach((link) => link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    isProgrammaticScroll = true;
    setActive(target);

    const header = document.querySelector('.site-header');
    const offset = (header?.getBoundingClientRect().height || 0) + regionNav.getBoundingClientRect().height + 18;
    const start = window.scrollY;
    const end = Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset);
    const distance = Math.abs(end - start);
    const duration = Math.min(3200, Math.max(1400, distance * 1.35));
    const startTime = performance.now();
    // 前段快速移動，接近目標時逐漸減速，製造自然的煞車感。
    const ease = (progress) => 1 - ((1 - progress) ** 20);
    const scroll = (time) => {
      const progress = Math.min(1, (time - startTime) / duration);
      window.scrollTo(0, start + (end - start) * ease(progress));
      if (progress < 1) window.requestAnimationFrame(scroll);
      else {
        isProgrammaticScroll = false;
        setActive(target);
        history.replaceState(null, '', link.getAttribute('href'));
      }
    };
    window.requestAnimationFrame(scroll);
  }));
}
