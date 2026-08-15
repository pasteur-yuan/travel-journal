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
  item.innerHTML = accommodation.innerHTML;
  facts.classList.remove('region-facts', 'region-facts-wide');
  facts.classList.add('region-content-list');
  facts.replaceChildren(item);
});

document.querySelectorAll('.region-card-grid .region-content-card, .region-content-list article, .region-note').forEach((item) => {
  let glowFrame = 0;
  let pendingPointer = null;
  const trackGlow = (event) => {
    pendingPointer = event;
    if (glowFrame) return;
    glowFrame = window.requestAnimationFrame(() => {
      const rect = item.getBoundingClientRect();
      item.style.setProperty('--pointer-x', `${pendingPointer.clientX - rect.left}px`);
      item.style.setProperty('--pointer-y', `${pendingPointer.clientY - rect.top}px`);
      glowFrame = 0;
    });
    item.classList.add('is-pointer-active');
  };
  item.addEventListener('pointerenter', trackGlow);
  item.addEventListener('pointermove', trackGlow);
  item.addEventListener('pointerleave', () => item.classList.remove('is-pointer-active'));
  item.addEventListener('focusin', () => item.classList.add('is-pointer-active'));
  item.addEventListener('focusout', () => {
    if (!item.matches(':hover')) item.classList.remove('is-pointer-active');
  });
});

if (document.querySelector('.region-hero-hokkaido')) {
  const spotsList = document.querySelector('#spots .region-card-grid');
  if (spotsList && spotsList.children.length < 3) {
    const sapporo = document.createElement('article');
    sapporo.className = 'region-content-card';
    sapporo.innerHTML = '<span>札幌</span><h3>城市街景與咖啡</h3><p>從大通公園、街角咖啡到夜晚的城市燈光，感受北海道首府輕鬆而開闊的日常節奏。</p>';
    spotsList.append(sapporo);
  }
  const hokkaidoSpots = document.querySelectorAll('#spots .region-content-card');
  const spotContent = [
    ['小樽', '港町散步與冬日風景', '沿著運河、倉庫街與海岸慢慢散步，感受小樽安靜而帶有懷舊感的城市氣氛。'],
    ['定山溪', '溫泉山谷與雪景', '在山谷、溪流與溫泉之間放慢腳步，記錄北海道冬季自然景色最安靜的一面。']
  ];
  hokkaidoSpots.forEach((spot, index) => {
    const content = spotContent[index];
    if (!content) return;
    const label = spot.querySelector('span');
    const title = spot.querySelector('h3');
    const description = spot.querySelector('p');
    if (label) label.textContent = content[0];
    if (title) title.textContent = content[1];
    if (description) description.textContent = content[2];
  });
  const foodList = document.querySelector('#food .region-content-list');
  if (foodList && foodList.children.length < 3) {
    const sapporoFood = document.createElement('article');
    sapporoFood.innerHTML = '<span>札幌</span><div><h3>湯咖哩與城市餐桌</h3><p>在札幌的街角餐館裡，從香料、湯汁到季節食材，感受北海道日常飲食的溫度。</p></div>';
    foodList.append(sapporoFood);
  }
  const hokkaidoFood = document.querySelectorAll('#food .region-content-list article');
  const foodContent = [
    ['小樽', '海鮮與甜點散步', '沿著運河與老街尋找新鮮海鮮、甜點與咖啡，讓小樽的港町風景延伸到餐桌。'],
    ['定山溪', '溫泉旅館的一餐', '在溫泉山谷裡享用當季料理，讓山林、溪流與旅館餐桌成為旅途的一部分。']
  ];
  hokkaidoFood.forEach((item, index) => {
    const content = foodContent[index];
    if (!content) return;
    const label = item.querySelector('span');
    const title = item.querySelector('h3');
    const description = item.querySelector('p');
    if (label) label.textContent = content[0];
    if (title) title.textContent = content[1];
    if (description) description.textContent = content[2];
  });
  if (foodList) {
    let foodGlowFrame = 0;
    let pendingFood = null;
    foodList.addEventListener('pointermove', (event) => {
      const item = event.target.closest('article');
      if (!item) return;
      pendingFood = { item, event };
      if (foodGlowFrame) return;
      foodGlowFrame = window.requestAnimationFrame(() => {
        const rect = pendingFood.item.getBoundingClientRect();
        pendingFood.item.style.setProperty('--pointer-x', `${pendingFood.event.clientX - rect.left}px`);
        pendingFood.item.style.setProperty('--pointer-y', `${pendingFood.event.clientY - rect.top}px`);
        pendingFood.item.classList.add('is-pointer-active');
        foodGlowFrame = 0;
      });
    });
    foodList.addEventListener('pointerleave', () => {
      foodList.querySelectorAll('.is-pointer-active').forEach((item) => item.classList.remove('is-pointer-active'));
    });
  }
  if (spotsList) {
    let glowFrame = 0;
    let pendingSpot = null;
    spotsList.addEventListener('pointermove', (event) => {
      const spot = event.target.closest('.region-content-card');
      if (!spot) return;
      pendingSpot = { spot, event };
      if (glowFrame) return;
      glowFrame = window.requestAnimationFrame(() => {
        const rect = pendingSpot.spot.getBoundingClientRect();
        pendingSpot.spot.style.setProperty('--pointer-x', `${pendingSpot.event.clientX - rect.left}px`);
        pendingSpot.spot.style.setProperty('--pointer-y', `${pendingSpot.event.clientY - rect.top}px`);
        pendingSpot.spot.classList.add('is-pointer-active');
        glowFrame = 0;
      });
    });
    spotsList.addEventListener('pointerleave', () => {
      spotsList.querySelectorAll('.is-pointer-active').forEach((spot) => spot.classList.remove('is-pointer-active'));
    });
  }
}

const detailItems = [...document.querySelectorAll('#spots .region-content-card, #food .region-content-list article, #stays .region-content-list article, #notes .region-note')];
if (detailItems.length) {
  const modal = document.createElement('div');
  modal.className = 'spot-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = '<div class="spot-modal-backdrop" data-spot-modal-close></div><section class="spot-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="spot-modal-title"><button class="spot-modal-close" type="button" aria-label="關閉旅行內容視窗" data-spot-modal-close>×</button><span class="spot-modal-label" id="spot-modal-label"></span><h2 id="spot-modal-title"></h2><p class="spot-modal-placeholder">小樽的山景、運河與地方酒造，先從這三個地點開始整理。</p><div class="spot-modal-table-wrap"><table class="spot-modal-table"><thead><tr><th scope="col">地名</th><th scope="col">資訊</th><th scope="col">交通方式</th><th scope="col">Google Map</th></tr></thead><tbody><tr><td>天狗山</td><td>登上山頂眺望小樽港與城市街景。</td><td>由小樽站搭乘巴士前往天狗山纜車站。</td><td><a class="spot-modal-map-link" href="#" aria-label="天狗山 Google Map 連結待補充">開啟地圖</a></td></tr><tr><td>小樽運河街道</td><td>沿著運河與倉庫街散步，感受港町風景。</td><td>由小樽站步行前往運河周邊。</td><td><a class="spot-modal-map-link" href="#" aria-label="小樽運河街道 Google Map 連結待補充">開啟地圖</a></td></tr><tr><td>田中酒造</td><td>認識北海道清酒釀造與地方酒文化。</td><td>由小樽站步行或搭乘市區巴士前往。</td><td><a class="spot-modal-map-link" href="#" aria-label="田中酒造 Google Map 連結待補充">開啟地圖</a></td></tr></tbody></table></div></section>';
  document.body.append(modal);
  const title = modal.querySelector('#spot-modal-title');
  const label = modal.querySelector('#spot-modal-label');
  const placeholder = modal.querySelector('.spot-modal-placeholder');
  const tableBody = modal.querySelector('.spot-modal-table tbody');
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
  if (tableBody) {
    tableBody.innerHTML = otaruPlaces.map(([place, info, transport, mapUrl]) => `<tr><td>${place}</td><td>${info}</td><td>${transport}</td><td><a class="spot-modal-map-link" href="${mapUrl}" target="_blank" rel="noopener noreferrer" aria-label="在 Google Maps 開啟${place}">開啟地圖</a></td></tr>`).join('');
  }
  const renderItemTable = (item) => {
    if (!tableBody) return;
    const place = item.querySelector('span')?.textContent?.trim() || '待補充地點';
    const info = item.querySelector('p')?.textContent?.trim() || '待補充資訊';
    const sectionName = item.closest('.region-section')?.id || 'travel';
    if (sectionName === 'spots' && place === '小樽') {
      tableBody.innerHTML = otaruPlaces.map(([otaruPlace, otaruInfo, otaruTransport, mapUrl]) => `<tr><td>${otaruPlace}</td><td>${otaruInfo}</td><td>${otaruTransport}</td><td><a class="spot-modal-map-link" href="${mapUrl}" target="_blank" rel="noopener noreferrer" aria-label="在 Google Maps 開啟${otaruPlace}">開啟地圖</a></td></tr>`).join('');
      return;
    }
    if (sectionName === 'spots' && place === '定山溪') {
      tableBody.innerHTML = jozankeiPlaces.map(([jozankeiPlace, jozankeiInfo, jozankeiTransport, mapUrl]) => `<tr><td>${jozankeiPlace}</td><td>${jozankeiInfo}</td><td>${jozankeiTransport}</td><td><a class="spot-modal-map-link" href="${mapUrl}" target="_blank" rel="noopener noreferrer" aria-label="在 Google Maps 開啟${jozankeiPlace}">開啟地圖</a></td></tr>`).join('');
      return;
    }
    if (sectionName === 'spots' && place === '札幌') {
      tableBody.innerHTML = sapporoPlaces.map(([sapporoPlace, sapporoInfo, sapporoTransport, mapUrl]) => `<tr><td>${sapporoPlace}</td><td>${sapporoInfo}</td><td>${sapporoTransport}</td><td><a class="spot-modal-map-link" href="${mapUrl}" target="_blank" rel="noopener noreferrer" aria-label="在 Google Maps 開啟${sapporoPlace}">開啟地圖</a></td></tr>`).join('');
      return;
    }
    const transport = sectionName === 'stays' ? '待補充住宿位置與移動方式' : sectionName === 'notes' ? '依旅程安排補充' : '待補充前往方式';
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place} 北海道`)}`;
    tableBody.innerHTML = `<tr><td>${place}</td><td>${info}</td><td>${transport}</td><td><a class="spot-modal-map-link" href="${mapUrl}" target="_blank" rel="noopener noreferrer" aria-label="在 Google Maps 開啟${place}">開啟地圖</a></td></tr>`;
  };
  const closeButton = modal.querySelector('.spot-modal-close');
  let previousFocus = null;
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-is-open');
    previousFocus?.focus();
  };
  const openModal = (item) => {
    previousFocus = document.activeElement;
    label.textContent = item.querySelector('span')?.textContent || 'TRAVEL NOTE';
    title.textContent = item.querySelector('h3, strong')?.textContent || item.querySelector('p')?.textContent || '旅行內容';
    if (placeholder) placeholder.textContent = item.querySelector('p')?.textContent || '內容待整理，之後將在這裡加入照片、筆記與旅行資訊。';
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
  if (item && !item.contains(event.relatedTarget)) item.classList.remove('is-pointer-active');
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
