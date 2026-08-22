// Shared site behavior can be added here as the template grows.

const worldMap = document.querySelector("#world-map");
const timezoneLabel = document.querySelector("#timezone-label");
const countryTooltip = document.querySelector("#country-tooltip");
const nightZones = [...document.querySelectorAll(".night-zone")];
const countryStrip = document.querySelector(".country-strip");
const countryCards = [...document.querySelectorAll(".country-card")];

// 中文地區名 → 地區頁 slug，讓時間軸資訊卡背景圖能依 trip.regions[0] 換成
// 對應地區頁已經在用的主視覺（assets/images/<slug>.jpg），不用另外準備一套圖庫。
// 跟 region-detail.js 的 regionNames（slug → 中文名，方向相反）與 tests/regions.mjs
// 的 REGION_NAMES 是同一份地區清單的三份副本，新增地區頁時三處都要同步更新。
const regionImageSlugs = {
  '北海道': 'hokkaido', '東京': 'tokyo', '栃木': 'tochigi', '名古屋': 'nagoya',
  '大阪': 'osaka', '伊勢志摩': 'ise-shima', '福岡': 'fukuoka', '熊本': 'kumamoto',
  '宮崎': 'miyazaki', '岐阜': 'gifu', '鹿兒島': 'kagoshima', '大分': 'oita',
  '佐賀': 'saga', '京都': 'kyoto', '神戶': 'kobe', '長野': 'nagano',
  '香川': 'kagawa', '神奈川': 'kanagawa', '四日市・鈴鹿': 'yokkaichi', '愛媛': 'ehime',
  '高知': 'kochi', '石川': 'ishikawa', '富山': 'toyama', '靜岡': 'shizuoka',
  '山梨': 'yamanashi', '滋賀': 'shiga', '岡山': 'okayama', '島根': 'shimane',
  '長崎': 'nagasaki'
};
// 依 trip.regions[0] 查對應地區頁的主視覺，時間軸資訊卡與旅程彈窗共用同一份
// 圖，換地區時兩處要一起換。查不到對應 slug（地區還沒收錄，或非日本旅程）
// 就退回 japan.jpg，不留空白背景。回傳值可以直接指定成 CSS 的 background 值：
// url() 的相對路徑是相對「引用它的樣式表」（assets/css/style.css）解析，不是
// 相對 index.html，所以要跟 style.css 既有的 .region-hero-<slug> 一樣用
// ../images/，不能寫 assets/images/。
const regionCardImage = (trip) => `url("../images/${regionImageSlugs[trip.regions[0]] || "japan"}.jpg")`;

// 時間軸節點從 trips.js 的全域 trips 動態產生，不再手寫在 index.html 裡——
// 新增一趟旅程只要在 trips.js 加一筆，這裡會自動長出對應節點，不用碰 HTML。
// trips 裡沒有的假資料／示範節點一律不存在，時間軸只反映真的有行程資料的旅程。
const buildTimelineEntry = (trip) => {
  const entry = document.createElement("div");
  entry.className = trip.country.includes("日本") ? "timeline-entry timeline-entry-japan" : "timeline-entry";
  entry.dataset.date = trip.date || "";
  entry.dataset.country = trip.country;
  // 逗號分隔的地區 tag 字串：一趟旅程可能踏過多個地區，「已探索」「旅行足跡」
  // 的地區數要能反映真實數字，即使時間軸上只顯示一個節點。
  entry.dataset.regions = trip.regions.join(",");
  entry.tabIndex = 0;
  entry.setAttribute("role", "button");
  // 單筆 date 缺失或無法解析不能讓整個 trips.map() 拋例外、拖垮其餘旅程——
  // 沿用原本「單一筆 data-date 有問題只略過那一筆」的容錯，下面
  // datedTimelineEntries 的篩選邏輯之後會把這筆從時間軸排除掉。
  const dateOk = trip.date && Number.isFinite(new Date(trip.date).getFullYear());
  const [year, month] = dateOk ? trip.date.split("-") : ["", ""];
  const countryName = trip.country.split(" ").pop();
  entry.setAttribute("aria-label", `${year}年${Number(month)}月，${countryName}${trip.regions.join("、")}`);
  const dot = document.createElement("span");
  dot.className = "timeline-dot";
  dot.setAttribute("aria-hidden", "true");
  const card = document.createElement("span");
  card.className = "timeline-card";
  card.style.setProperty("--timeline-card-image", regionCardImage(trip));
  const code = document.createElement("span");
  code.className = "timeline-code";
  code.textContent = `${year}.${month} · ${trip.country}`;
  // <strong> 只放第一個地區（regions 陣列的順序視為「主要地區」在前）：
  // .timeline-card 的 strong 是 1.7rem 大字，卡片本身只有約 190px 寬，
  // 完整地區清單仍然在 dataset.regions／aria-label 裡，不影響地區數統計。
  const regionLabel = document.createElement("strong");
  regionLabel.textContent = trip.regions[0];
  card.append(regionLabel, code);
  entry.append(dot, card);
  // 掛在節點上供點擊／鍵盤開啟彈窗時直接取用，不用另外查表。
  entry.trip = trip;
  return entry;
};
const timelineEntries = trips.map(buildTimelineEntry);
const mapLegend = document.querySelector(".map-legend");
const mapStats = document.querySelector(".map-stats");
const mapControls = document.querySelector(".map-controls");
const mapActions = mapControls ? mapControls.querySelectorAll("[data-map-action]") : [];

// 地圖上的旅行目的地。新增國家只要在這裡加一筆，marker、時區 tooltip、
// 地圖區塊高亮與點擊連結都會自動產生。code / mapId 用來比對時區地圖的多邊形。
const travelDestinations = [
  {
    code: "JP", mapId: "Japan", flag: "🇯🇵", name: "日本",
    timezone: "UTC+09:00", latitude: 35.6762, longitude: 139.6503,
    href: "countries/japan/index.html"
  }
];

// 國家卡片跑馬燈的地區清單，是這份文字的單一資料來源。
// 新增／移除 countries/<國家>/<地區>/index.html 時要同步更新這裡，
// 並比照該國家頁 showcase 清單與 tests/regions.mjs 的 REGION_NAMES——
// 三處都要一致，跑馬燈才不會顯示還沒建立的地區，也不會漏掉已完成的頁面。
const countryRegions = {
  japan: [
    "北海道", "東京", "栃木", "名古屋", "大阪", "伊勢志摩", "福岡",
    "熊本", "宮崎", "岐阜", "鹿兒島", "大分", "佐賀", "京都", "神戶", "長野",
    "香川", "神奈川", "四日市・鈴鹿", "愛媛", "高知", "石川", "富山",
    "靜岡", "山梨", "滋賀", "岡山", "島根", "長崎"
  ]
};

// 「已探索」與「旅行足跡」原本只靠 CSS :hover／:focus-within 展開，觸控裝置
// 沒有 hover、且 .map-legend 過去沒有 tabindex 也拿不到 focus-within，等於
// 手機／鍵盤完全展開不了。改成點擊／Enter／Space 明確切換 is-expanded class，
// 疊加在既有的 hover／focus-within 樣式上（不是取代）：滑鼠移開後 hover 消失，
// 但點擊釘住的展開狀態會留著，兩者互不衝突。
[mapLegend, mapStats].forEach((el) => {
  if (!el) return;
  el.addEventListener("click", () => {
    const expanded = el.classList.toggle("is-expanded");
    el.setAttribute("aria-expanded", String(expanded));
  });
  el.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const expanded = el.classList.toggle("is-expanded");
    el.setAttribute("aria-expanded", String(expanded));
  });
});

document.addEventListener("pointerdown", (event) => {
  const target = event.target;
  if (mapLegend?.contains(target) || mapStats?.contains(target)) return;
  if (document.activeElement === mapLegend || mapLegend?.contains(document.activeElement)) mapLegend?.blur();
  if (document.activeElement === mapStats || mapStats?.contains(document.activeElement)) mapStats?.blur();
  mapLegend?.classList.remove("is-expanded");
  mapLegend?.setAttribute("aria-expanded", "false");
  mapStats?.classList.remove("is-expanded");
  mapStats?.setAttribute("aria-expanded", "false");
}, { passive: true });

const timelineTrack = document.querySelector(".timeline-track");
let timelineSwitchTimer = 0;
// 這裡刻意不像 isMobileCountryStrip／isMobileMap 一樣加 (hover: none)。
// 手機版的差異不是「有沒有 hover」，而是整段換成垂直堆疊排版（.timeline-track
// 從 display:flex 橫向捲動改成 display:block 垂直清單），只在 max-width:700px
// 的 CSS 裡才有對應樣式；平板寬度沒有這組 CSS，若讓 isMobileTimeline() 在平板
// 也回傳 true，JS 會照垂直清單的假設去量測／鎖定高度、跑 FLIP 動畫，但畫面其實
// 還是桌面版的橫向排版，兩者對不上，實測會讓時間軸整段看起來空白（年份都在，
// 底下的旅程卡片消失）。桌面版的橫向捲動本來就是 overflow-x:auto + scroll-snap，
// 觸控滑動原生就能用，不需要靠這個旗標切換手機版邏輯才能操作。
const isMobileTimeline = () => window.matchMedia("(max-width: 700px)").matches;

// 手機版年份群組的位移來自 display 切換，CSS transition 接不到。
// 以 FLIP 記錄切換前後的位置差：先用 transform 把群組移回原位，
// 再放手讓它沿慢速煞停的曲線滑到新位置。
// 頁面本身完全不捲動——捲動會讓標題與時間軸以外的內容整塊位移，比年份自己移動更突兀。
const glideYearGroups = (update) => {
  const groups = timelineTrack ? [...timelineTrack.querySelectorAll(".timeline-year-group")] : [];
  if (!groups.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return;
  }
  const before = groups.map((group) => group.getBoundingClientRect().top);
  update();
  // 先讀完所有新位置再寫入 transform，避免讀寫交錯觸發多次 layout。
  const deltas = groups.map((group, index) => before[index] - group.getBoundingClientRect().top);
  const shifted = groups.filter((group, index) => {
    if (Math.abs(deltas[index]) < 1) return false;
    group.classList.add("is-gliding");
    group.style.transform = `translateY(${deltas[index]}px)`;
    return true;
  });
  if (!shifted.length) return;
  window.requestAnimationFrame(() => shifted.forEach((group) => {
    group.classList.remove("is-gliding");
    group.style.transform = "";
  }));
};

// 時間軸光點對齊目前年份標記的垂直中心。宣告在模組層級，
// 讓年份切換與圓點展開兩段邏輯都能取用。
const updateTimelineGlow = (group) => {
  const marker = group?.querySelector(".timeline-year-marker");
  if (!timelineTrack || !group || !marker) return;
  const update = () => timelineTrack.style.setProperty("--timeline-glow-y", `${group.offsetTop + marker.offsetTop + marker.offsetHeight / 2}px`);
  window.requestAnimationFrame(() => window.requestAnimationFrame(update));
};

// 單一筆 data-date 缺失或無法解析，會讓年份計算變成 NaN、years 變成空陣列，
// 整條時間軸就會消失。先濾掉並在 console 指出是哪一筆，其餘項目照常顯示。
const datedTimelineEntries = [...timelineEntries].filter((entry) => {
  if (Number.isFinite(new Date(entry.dataset.date).getFullYear())) return true;
  console.warn("時間軸項目的 data-date 缺少或無法解析，已略過：", entry);
  return false;
});

// 「已探索」清單與「旅行足跡」數字改由時間軸項目推導：新增一次旅行就會自動更新，
// 不必再手動維護寫死的內容。地區數改用 tag 方式統計（見 buildTimelineEntry 的
// dataset.regions）：一趟旅程即使橫跨多個地區、時間軸上只顯示一個節點，
// 地區數仍要反映真實踏過的地區，不是「節點數」。
if (datedTimelineEntries.length && (mapLegend || mapStats)) {
  const countries = [...new Set(datedTimelineEntries.map((entry) => entry.dataset.country).filter(Boolean))];
  const regions = new Set(datedTimelineEntries
    .flatMap((entry) => (entry.dataset.regions || "").split(",").filter(Boolean)));
  const pad = (value) => String(value).padStart(2, "0");
  const cell = (nodes) => {
    const span = document.createElement("span");
    span.append(...nodes);
    return span;
  };
  if (mapLegend && countries.length) {
    mapLegend.replaceChildren(
      mapLegend.querySelector(".map-legend-label"),
      ...countries.map((country) => cell([country]))
    );
  }
  if (mapStats) {
    const counts = [[countries.length, "國家"], [regions.size, "地區"]];
    mapStats.replaceChildren(
      mapStats.querySelector(".map-stats-label"),
      ...counts.map(([value, name]) => {
        const number = document.createElement("b");
        number.textContent = pad(value);
        return cell([number, ` ${name}`]);
      })
    );
  }
}

if (timelineTrack && datedTimelineEntries.length) {
  const entries = datedTimelineEntries;
  entries.forEach((entry) => {
    entry.addEventListener("pointermove", (event) => {
      const card = entry.querySelector(".timeline-card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--timeline-pointer-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--timeline-pointer-y", `${event.clientY - rect.top}px`);
    });
  });
  const entryYears = entries.map((entry) => new Date(entry.dataset.date).getFullYear());
  const firstYear = Math.min(...entryYears);
  const currentYear = new Date().getFullYear();
  // 年份軸必須涵蓋所有資料，並固定預留下一年。只算到今年的話，
  // 更晚的旅程不會有對應群組，會在 replaceChildren() 後被靜默丟棄。
  const lastYear = Math.max(currentYear + 1, ...entryYears);
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
  const entriesByYear = new Map(years.map((year) => [year, []]));
  entries.forEach((entry) => {
    const year = new Date(entry.dataset.date).getFullYear();
    if (!entriesByYear.has(year)) entriesByYear.set(year, []);
    entriesByYear.get(year).push(entry);
  });
  const activeYear = currentYear;
  timelineTrack.replaceChildren();
  const centerGroup = (group, smooth = true) => {
    const target = group.offsetLeft + group.offsetWidth / 2 - timelineTrack.clientWidth / 2;
    timelineTrack.scrollTo({ left: Math.max(0, target), behavior: smooth ? "smooth" : "auto" });
  };
  years.forEach((year, yearIndex) => {
    const group = document.createElement("section");
    group.className = `timeline-year-group ${yearIndex % 2 === 0 ? "cards-down" : "cards-up"}${year === activeYear ? " is-active" : ""}`;
    group.dataset.year = year;
    const marker = document.createElement("button");
    marker.className = "timeline-year-marker";
    marker.type = "button";
    marker.textContent = year;
    // 只有「尚未開始且沒有任何旅程」的預留年份不可點擊；
    // 已經排定行程的未來年份仍要能展開，否則項目會被鎖在收合狀態裡看不到。
    const isFutureYear = year > currentYear && !(entriesByYear.get(year) || []).length;
    marker.setAttribute("aria-expanded", String(year === activeYear));
    marker.disabled = isFutureYear;
    if (isFutureYear) {
      group.classList.add("is-future");
      marker.setAttribute("aria-label", `${year}，尚未開始`);
    }
    group.append(marker, ...(entriesByYear.get(year) || []));
    // 只綁定 click：頁面已設定 width=device-width，行動裝置沒有點擊延遲需要繞過。
    // 先前用 pointerdown 觸發 marker.click() 再以旗標略過原生 click 的做法，
    // 會在切換年份造成版面位移、原生 click 因此未送達時留下殘留旗標，讓下一次要點兩下。
    marker.addEventListener("click", () => {
      if (isFutureYear) return;
      const mobile = isMobileTimeline();
      if (!mobile) timelineTrack.classList.add("is-switching");
      const switchYear = () => {
        timelineTrack.querySelectorAll(".timeline-year-group").forEach((item) => {
          const expanded = item === group;
          item.classList.toggle("is-active", expanded);
          item.querySelector(".timeline-year-marker").setAttribute("aria-expanded", String(expanded));
        });
        // 一併收折所有旅程資訊卡，包含原本展開年份裡由圓點展開的卡片。
        timelineEntries.forEach((entry) => entry.classList.remove("is-expanded", "is-dot-collapsed"));
        if (document.activeElement?.closest?.(".timeline-entry")) document.activeElement.blur();
      };
      if (mobile) glideYearGroups(switchYear);
      else switchYear();
      updateTimelineGlow(group);
      if (mobile) return;
      window.clearTimeout(timelineSwitchTimer);
      timelineSwitchTimer = window.setTimeout(() => {
        timelineTrack.classList.remove("is-switching");
        updateTimelineGlow(group);
        centerGroup(group);
      }, 850);
    });
    timelineTrack.append(group);
  });
  // 年份收合會讓文件變短。使用者若正停在頁面底部，瀏覽器會把捲動位置往上夾，
  // 看起來就像畫面自己滑動。先量出最高的一種年份配置並預留起來，
  // 讓切換年份與展開資訊卡都不改變文件總高度。
  const lockTimelineHeight = () => {
    if (!isMobileTimeline()) {
      timelineTrack.style.minHeight = "";
      return;
    }
    const groups = [...timelineTrack.querySelectorAll(".timeline-year-group")];
    const restoreActive = groups.find((group) => group.classList.contains("is-active"));
    const restoreExpanded = timelineTrack.querySelector(".timeline-entry.is-expanded");
    timelineTrack.style.minHeight = "";
    let tallest = 0;
    groups.forEach((group) => {
      groups.forEach((item) => item.classList.toggle("is-active", item === group));
      const firstEntry = group.querySelector(".timeline-entry");
      firstEntry?.classList.add("is-expanded");
      tallest = Math.max(tallest, timelineTrack.scrollHeight);
      firstEntry?.classList.remove("is-expanded");
    });
    groups.forEach((item) => item.classList.toggle("is-active", item === restoreActive));
    restoreExpanded?.classList.add("is-expanded");
    timelineTrack.style.minHeight = `${tallest}px`;
  };
  lockTimelineHeight();
  let heightLockTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(heightLockTimer);
    heightLockTimer = window.setTimeout(lockTimelineHeight, 200);
  }, { passive: true });

  const initialGroup = timelineTrack.querySelector(`.timeline-year-group[data-year="${activeYear}"]`);
  if (initialGroup) window.requestAnimationFrame(() => {
    centerGroup(initialGroup, false);
    if (isMobileTimeline()) {
      updateTimelineGlow(initialGroup);
    }
  });
}

if (mapStats && timezoneLabel) {
  const hideTimezone = () => { timezoneLabel.style.opacity = "0"; };
  const showTimezone = () => { timezoneLabel.style.opacity = "1"; };
  mapStats.addEventListener("pointerenter", hideTimezone);
  mapStats.addEventListener("focusin", hideTimezone);
  mapStats.addEventListener("pointerleave", () => {
    if (!mapStats.matches(":focus-within")) showTimezone();
  });
  mapStats.addEventListener("focusout", () => {
    if (!mapStats.matches(":hover")) showTimezone();
  });
}

// 旅程彈窗：比照地區頁原本旅行筆記的 .spot-modal 樣式，資訊卡展開後點擊卡片
// （或鍵盤聚焦後按 Enter／Space）開啟，顯示該趟旅程完整的時間軸式停留點清單。
// 不需要地區頁 modal 的四欄表格（.spot-modal-table-wrap），只有行程軌跡。
const tripModal = document.createElement("div");
tripModal.className = "spot-modal";
tripModal.setAttribute("aria-hidden", "true");
tripModal.innerHTML = '<div class="spot-modal-backdrop" data-spot-modal-close></div><section class="spot-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="trip-modal-title"><button class="spot-modal-close" type="button" aria-label="關閉旅程視窗" data-spot-modal-close>×</button><div class="spot-modal-hero"><span class="spot-modal-label" id="trip-modal-label"></span><h2 id="trip-modal-title"></h2></div><div class="spot-modal-itinerary"></div></section>';
document.body.append(tripModal);
const tripModalHero = tripModal.querySelector(".spot-modal-hero");
const tripModalLabel = tripModal.querySelector("#trip-modal-label");
const tripModalTitle = tripModal.querySelector("#trip-modal-title");
const tripModalItinerary = tripModal.querySelector(".spot-modal-itinerary");
const tripModalCloseButton = tripModal.querySelector(".spot-modal-close");

// 一天的停留點清單：時間、地名、類型（可能是空字串，原始資料本來就有些項目
// 沒填類型）、備註，最後用 transport 串到下一個停留點；最後一站沒有 transport
// 就不畫連接線，符合「移動那欄是箭頭上的文字，沒有它箭頭只是裝飾」。
const tripStopTypeIcon = { 交通: "fa-route", 美食: "fa-utensils", 住宿: "fa-bed" };
const renderTripItineraryStop = (stop, isLast) => {
  const icon = tripStopTypeIcon[stop.type] ? `<i class="fa-solid ${tripStopTypeIcon[stop.type]}" aria-hidden="true"></i>` : "";
  const typeTag = stop.type ? `<span class="spot-modal-itinerary-type">${icon}${stop.type}</span>` : "";
  const noteText = stop.note ? `<p class="spot-modal-itinerary-note">${stop.note}</p>` : "";
  const stopHtml = `<li class="spot-modal-itinerary-stop"><span class="spot-modal-itinerary-time">${stop.time}</span><div class="spot-modal-itinerary-body"><strong class="spot-modal-itinerary-place">${stop.place}</strong>${typeTag}${noteText}</div></li>`;
  if (isLast || !stop.transport) return stopHtml;
  return `${stopHtml}<li class="spot-modal-itinerary-connector" aria-hidden="true"><span>${stop.transport}</span></li>`;
};
// dayIndex／daysArray 只用來顯示「DAY 01 / 11」這種序號（daysArray 借用 .map 原生傳入
// 的第三個參數取總天數，不必另外傳），方便在左右翻頁時知道目前在第幾天，不影響資料本身。
const renderTripItineraryDay = (day, dayIndex, daysArray) => {
  const total = daysArray.length > 1 ? ` / ${daysArray.length}` : "";
  const dayLabel = `<span class="spot-modal-itinerary-day-index">DAY ${String(dayIndex + 1).padStart(2, "0")}${total}</span>`;
  const themeHtml = day.theme ? `<span class="spot-modal-itinerary-theme">${day.theme}</span>` : "";
  const stopsHtml = day.stops.map((stop, index) => renderTripItineraryStop(stop, index === day.stops.length - 1)).join("");
  return `<div class="spot-modal-itinerary-day"><div class="spot-modal-itinerary-date">${dayLabel}${day.date}${themeHtml}</div><ol class="spot-modal-itinerary-stops">${stopsHtml}</ol></div>`;
};
// 行程軌跡改成左右翻頁：一次只看一天，跟 .country-strip／.timeline-track 同一套
// 「原生水平捲動＋scroll-snap＋scrollTo」慣例，不是另外刻一套輪播元件。天數只有一天時
// 沒有頁可翻，不畫按鈕。
const renderTripItinerary = (days) => {
  const daysHtml = days.map(renderTripItineraryDay).join("");
  if (days.length <= 1) return `<div class="spot-modal-itinerary-days">${daysHtml}</div>`;
  return `<button class="spot-modal-itinerary-nav" type="button" data-itinerary-prev aria-label="上一天"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button><div class="spot-modal-itinerary-days">${daysHtml}</div><button class="spot-modal-itinerary-nav" type="button" data-itinerary-next aria-label="下一天"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>`;
};
// 目前頁的按鈕啟用／停用狀態靠這兩個參照更新；modal 每次開啟都會重建整段 DOM，
// 所以每次都要重新抓元素、重新綁事件，不能只綁一次。
let tripItineraryPrevButton = null;
let tripItineraryNextButton = null;
const initTripItineraryPager = () => {
  const daysContainer = tripModalItinerary.querySelector(".spot-modal-itinerary-days");
  const days = [...daysContainer.children];
  tripItineraryPrevButton = tripModalItinerary.querySelector("[data-itinerary-prev]");
  tripItineraryNextButton = tripModalItinerary.querySelector("[data-itinerary-next]");
  if (!tripItineraryPrevButton || !tripItineraryNextButton || days.length <= 1) return;
  let current = 0;
  const syncButtons = () => {
    tripItineraryPrevButton.disabled = current === 0;
    tripItineraryNextButton.disabled = current === days.length - 1;
  };
  // 每一天都是 flex: 0 0 100% 的等寬頁面，用 clientWidth 算捲動位置即可，
  // 不能用 day.offsetLeft——它是相對最近的 positioned 祖先（.spot-modal-dialog），
  // 不是相對這個捲動容器本身，直接拿來設 scrollLeft 會跳過頭。
  const goTo = (index) => {
    current = Math.max(0, Math.min(index, days.length - 1));
    daysContainer.scrollTo({
      left: current * daysContainer.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });
    syncButtons();
  };
  tripItineraryPrevButton.addEventListener("click", () => goTo(current - 1));
  tripItineraryNextButton.addEventListener("click", () => goTo(current + 1));
  // 滑動／拖曳捲動不會經過 goTo()，捲動停下來後用離目前 scrollLeft 最近的那一天
  // 校正頁碼與按鈕狀態。
  let settleTimer = 0;
  daysContainer.addEventListener("scroll", () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      current = Math.round(daysContainer.scrollLeft / daysContainer.clientWidth);
      syncButtons();
    }, 120);
  });
  syncButtons();
};

// 貼頂的日期列預設沒有背景（融入版面），只有該天內容真的往上捲、
// 底下開始有文字要被擋住時才補上會淡出的霧面背景，靜止時才不會看起來像一塊色塊。
const initTripItineraryStickyDates = () => {
  [...tripModalItinerary.querySelectorAll(".spot-modal-itinerary-day")].forEach((day) => {
    const dateEl = day.querySelector(".spot-modal-itinerary-date");
    day.addEventListener("scroll", () => {
      dateEl.classList.toggle("is-pinned", day.scrollTop > 0);
    });
  });
};

let tripModalPreviousFocus = null;
let tripModalOpenedByKeyboard = false;
const closeTripModal = (byKeyboard = false) => {
  tripModal.classList.remove("is-open");
  tripModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-is-open");
  timelineEntries.forEach((entry) => entry.classList.remove("is-expanded"));
  const focusTarget = tripModalPreviousFocus;
  tripModalPreviousFocus = null;
  if (byKeyboard || tripModalOpenedByKeyboard) {
    focusTarget?.focus();
  } else {
    focusTarget?.focus();
    focusTarget?.blur();
  }
  tripModalOpenedByKeyboard = false;
};
const openTripModal = (trip, byKeyboard = false) => {
  if (!trip) return;
  tripModalOpenedByKeyboard = byKeyboard;
  tripModalPreviousFocus = document.activeElement;
  timelineEntries.forEach((entry) => entry.classList.remove("is-expanded"));
  tripModalHero.style.setProperty("--spot-modal-image", regionCardImage(trip));
  tripModalLabel.textContent = trip.label;
  tripModalTitle.textContent = trip.teaser;
  tripModalItinerary.innerHTML = renderTripItinerary(trip.itinerary);
  initTripItineraryPager();
  initTripItineraryStickyDates();
  tripModal.classList.add("is-open");
  tripModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-is-open");
  tripModalCloseButton.focus();
};
tripModal.addEventListener("click", (event) => {
  if (event.target.matches("[data-spot-modal-close]")) closeTripModal(false);
});
document.addEventListener("keydown", (event) => {
  if (!tripModal.classList.contains("is-open")) return;
  if (event.key === "Escape") { closeTripModal(true); return; }
  if (event.key === "ArrowLeft" && !tripItineraryPrevButton?.disabled) tripItineraryPrevButton?.click();
  if (event.key === "ArrowRight" && !tripItineraryNextButton?.disabled) tripItineraryNextButton?.click();
});

// 卡片預設用 :hover／:focus-visible 顯示，觸控裝置沒有 hover，不管寬度多寬
// 都需要「點圓點來顯示／收起卡片」這條路徑才看得到內容——這跟 isMobileTimeline()
// 決定的垂直堆疊排版是兩件事：桌面版橫向排版本身就撐得下 .is-expanded 直接生效
// （見 style.css 第 210 行等未被 700px 媒體查詢包住的規則），只是原本點圓點的
// 邏輯整個被 isMobileTimeline() 擋住，平板寬度會落到「沒有 hover 也點不到」。
const timelineTapReveal = () => isMobileTimeline() || window.matchMedia("(hover: none)").matches;
timelineEntries.forEach((entry) => {
  const dot = entry.querySelector(".timeline-dot");
  const activateEntryYear = () => {
    const yearGroup = entry.closest(".timeline-year-group");
    if (!yearGroup) return;
    glideYearGroups(() => {
      timelineEntries.forEach((item) => item.classList.remove("is-expanded", "is-dot-collapsed"));
      timelineTrack.querySelectorAll(".timeline-year-group").forEach((item) => {
        const active = item === yearGroup;
        item.classList.toggle("is-active", active);
        item.querySelector(".timeline-year-marker")?.setAttribute("aria-expanded", String(active));
      });
      entry.classList.add("is-expanded");
    });
    updateTimelineGlow(yearGroup);
  };
  // 第二次點擊同一個圓點只收回自己的資訊卡：年份群組維持展開，
  // 卡片回到第一次點擊前的 3rem 佔位高度，圓點位置與時間軸線不會被往上推。
  const collapseEntryCard = () => {
    glideYearGroups(() => {
      entry.classList.remove("is-expanded");
      entry.classList.add("is-dot-collapsed");
    });
  };
  entry.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse" && !isMobileTimeline()) {
      timelineTrack.classList.remove("is-switching");
      entry.classList.add("is-expanded");
    }
  });
  entry.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse" && !isMobileTimeline()) entry.classList.remove("is-expanded");
  });
  dot?.addEventListener("click", (event) => {
    if (!timelineTapReveal()) { event.preventDefault(); return; }
    event.preventDefault();
    event.stopPropagation();
    if (entry.classList.contains("is-expanded")) collapseEntryCard();
    else activateEntryYear();
  });
  // 資訊卡展開後點擊卡片本身開啟旅程彈窗；卡片還沒展開前點到（理論上不會發生，
  // 因為 CSS 讓未展開的卡片 pointer-events: none）就只當作展開，不開彈窗。
  entry.addEventListener("click", (event) => {
    const clickedCard = event.target.closest(".timeline-card");
    const clickedDot = event.target.closest(".timeline-dot");
    if (clickedDot) return;
    if (clickedCard && entry.classList.contains("is-expanded")) openTripModal(entry.trip);
  });
  // 鍵盤：Tab 聚焦到節點時 CSS 的 :focus-visible 已經讓卡片可見，
  // 這時按 Enter／Space 直接開彈窗，不用像觸控裝置那樣先「展開」再「開啟」兩步。
  entry.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openTripModal(entry.trip, true);
  });
});

if (countryStrip) {
  let pointer = null;
  let edgeShadowFrame = 0;
  let mobileFocusFrame = 0;
  let mobileActivatedCard = null;
  let mobileCenteringCard = null;
  let mobileCenterTarget = 0;
  let mobileFocusSuspended = false;
  // (hover: none) 涵蓋所有寬度、方向的觸控裝置（含較寬的橫向平板），詳見上方
  // isMobileTimeline 的說明。
  const isMobileCountryStrip = () => window.matchMedia("(max-width: 700px), (hover: none)").matches;
  countryCards.filter((card) => card.tagName === "A").forEach((card) => {
    const meta = card.querySelector(".country-meta");
    if (!meta) return;
    const countryKey = card.getAttribute("href")?.match(/^countries\/([^/]+)\//)?.[1];
    const regions = countryKey && countryRegions[countryKey];
    const track = meta.querySelector(".country-meta-track");
    if (regions?.length && track) {
      meta.setAttribute("aria-label", regions.join("、"));
      const text = `${regions.join("・")}　`;
      [...track.children].forEach((span) => { span.textContent = text; });
      // 22 秒對應原本 6 個地區、22 個字的跑馬燈基準速度，依實際字數等比例延長，
      // 避免地區一多，文字捲得比讀得完還快。
      const baseSecondsPerChar = 22 / 22;
      track.style.animationDuration = `${(baseSecondsPerChar * text.length).toFixed(1)}s`;
    }
    let action = meta.querySelector(".country-meta-action");
    let arrow = meta.querySelector(".country-meta-arrow");
    if (!action) {
      action = document.createElement("span");
      action.className = "country-meta-action";
      action.setAttribute("aria-hidden", "true");
      if (!arrow) {
        arrow = document.createElement("span");
        arrow.className = "country-meta-arrow";
        arrow.textContent = "→";
      }
      action.append(arrow);
      meta.append(action);
    }
    if (!action.querySelector(".country-card-more")) {
      const more = document.createElement("span");
      more.className = "country-card-more";
      more.textContent = "查看更多";
      action.prepend(more);
    }
  });
  const syncEdgeCardShadows = () => {
    edgeShadowFrame = 0;
    if (!window.matchMedia("(min-width: 701px)").matches) {
      countryCards.forEach((card) => card.classList.remove("is-edge-shadowless"));
      return;
    }
    const stripRect = countryStrip.getBoundingClientRect();
    const edgeBuffer = 64;
    countryCards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      card.classList.toggle("is-edge-shadowless",
        rect.left < stripRect.left + edgeBuffer || rect.right > stripRect.right - edgeBuffer);
    });
  };
  const scheduleEdgeCardShadowSync = () => {
    if (!edgeShadowFrame) edgeShadowFrame = window.requestAnimationFrame(syncEdgeCardShadows);
  };
  const setMobileFocusedCard = (card) => {
    countryCards.forEach((item) => {
      item.classList.toggle("is-mobile-focused", item === card);
      item.classList.toggle("is-mobile-activated", item === mobileActivatedCard && item === card);
    });
  };
  const clearMobileCardFocus = () => {
    if (mobileFocusFrame) window.cancelAnimationFrame(mobileFocusFrame);
    mobileFocusFrame = 0;
    mobileActivatedCard = null;
    mobileCenteringCard = null;
    // 如果點卡片列外側時，前一次點擊觸發的置中捲動動畫還沒跑完，動畫殘留的
    // scroll 事件會繼續呼叫 syncMobileFocusedCard，把剛清除的焦點狀態又補回來。
    // 用旗標暫時忽略這些殘留同步，直到卡片列上有新的觸控（點擊或滑動）才恢復。
    mobileFocusSuspended = true;
    countryCards.forEach((card) => card.classList.remove("is-mobile-focused", "is-mobile-activated"));
  };
  const centerMobileCard = (card) => {
    const target = Math.max(0, Math.min(
      card.offsetLeft + card.offsetWidth / 2 - countryStrip.clientWidth / 2,
      countryStrip.scrollWidth - countryStrip.clientWidth
    ));
    mobileCenteringCard = card;
    mobileCenterTarget = target;
    countryStrip.scrollTo({
      left: target,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });
    scheduleMobileFocusSync();
  };
  const syncMobileFocusedCard = () => {
    mobileFocusFrame = 0;
    if (!isMobileCountryStrip()) {
      mobileActivatedCard = null;
      mobileCenteringCard = null;
      countryCards.forEach((card) => card.classList.remove("is-mobile-focused", "is-mobile-activated"));
      return;
    }
    if (mobileFocusSuspended) return;
    const focusX = countryStrip.scrollLeft + countryStrip.clientWidth / 2;
    const focusedCard = countryCards.reduce((closest, card) => {
      const center = card.offsetLeft + card.offsetWidth / 2;
      const closestCenter = closest.offsetLeft + closest.offsetWidth / 2;
      return Math.abs(center - focusX) < Math.abs(closestCenter - focusX) ? card : closest;
    }, countryCards[0]);
    const selectedCard = mobileCenteringCard || focusedCard;
    if (!mobileCenteringCard && mobileActivatedCard && mobileActivatedCard !== focusedCard) {
      mobileActivatedCard = null;
    }
    setMobileFocusedCard(selectedCard);
    if (mobileCenteringCard && Math.abs(countryStrip.scrollLeft - mobileCenterTarget) < 2) {
      mobileCenteringCard = null;
    }
  };
  const scheduleMobileFocusSync = () => {
    if (!mobileFocusFrame) mobileFocusFrame = window.requestAnimationFrame(syncMobileFocusedCard);
  };
  const syncPointerCard = () => {
    if (!pointer) return;
    const element = document.elementFromPoint(pointer.x, pointer.y);
    const card = element?.closest?.(".country-card");
    countryCards.forEach((item) => item.classList.toggle("is-pointer-active", item === card));
  };
  countryStrip.addEventListener("pointermove", (event) => {
    pointer = { x: event.clientX, y: event.clientY };
    if (event.pointerType !== "mouse") return;
    syncPointerCard();
    const activeCard = event.target.closest?.(".country-card");
    if (activeCard) {
      const rect = activeCard.getBoundingClientRect();
      activeCard.style.setProperty("--card-pointer-x", `${event.clientX - rect.left + rect.width * .18}px`);
      activeCard.style.setProperty("--card-pointer-y", `${event.clientY - rect.top + rect.height * .18}px`);
      activeCard.style.setProperty("--card-shadow-x", `${(event.clientX - rect.left - rect.width / 2) * .035}px`);
      activeCard.style.setProperty("--card-shadow-y", `${(event.clientY - rect.top - rect.height / 2) * .035}px`);
      activeCard.style.setProperty("--card-tilt-x", `${((event.clientX - rect.left) / rect.width - .5) * 7}deg`);
      activeCard.style.setProperty("--card-tilt-y", `${((event.clientY - rect.top) / rect.height - .5) * -7}deg`);
    }
    scheduleEdgeCardShadowSync();
    if (event.pointerType === "mouse" && document.activeElement?.classList.contains("country-card")) {
      document.activeElement.blur();
    }
  });
  countryCards.forEach((card) => {
    card.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse") return;
      pointer = { x: event.clientX, y: event.clientY };
      if (event.pointerType === "mouse" && document.activeElement?.classList.contains("country-card")) {
        document.activeElement.blur();
      }
      countryCards.forEach((item) => item.classList.toggle("is-pointer-active", item === card));
      scheduleEdgeCardShadowSync();
    });
    card.addEventListener("focus", () => {
      if (!isMobileCountryStrip()) return;
      setMobileFocusedCard(card);
    });
  });
  countryStrip.addEventListener("click", (event) => {
    if (!isMobileCountryStrip()) return;
    const card = event.target.closest?.(".country-card");
    if (!card || !countryStrip.contains(card)) return;
    const canNavigate = card.tagName === "A";
    if (canNavigate && card === mobileActivatedCard && card.classList.contains("is-mobile-activated")) return;
    event.preventDefault();
    mobileActivatedCard = canNavigate ? card : null;
    setMobileFocusedCard(card);
    // 置中與焦點樣式同時開始，讓被點擊的鄰居接手時同步推開原本的焦點卡片。
    centerMobileCard(card);
  });
  countryStrip.addEventListener("pointerdown", () => {
    // 卡片列上有新的觸控（點擊或滑動起點），代表使用者重新開始互動，
    // 解除 clearMobileCardFocus() 留下的暫停旗標，恢復正常的焦點同步。
    mobileFocusSuspended = false;
  }, { passive: true });
  document.addEventListener("pointerdown", (event) => {
    if (!isMobileCountryStrip()) return;
    const card = event.target.closest?.(".country-card");
    if (card && countryStrip.contains(card)) return;
    clearMobileCardFocus();
  }, { passive: true });
  countryStrip.addEventListener("scroll", () => {
    syncPointerCard();
    scheduleEdgeCardShadowSync();
    scheduleMobileFocusSync();
    if (document.activeElement?.classList.contains("country-card")) {
      document.activeElement.blur();
    }
  }, { passive: true });
  countryStrip.addEventListener("pointerleave", () => {
    pointer = null;
    countryCards.forEach((item) => item.classList.remove("is-pointer-active"));
    scheduleEdgeCardShadowSync();
  });
  window.addEventListener("resize", scheduleEdgeCardShadowSync, { passive: true });
  window.addEventListener("resize", scheduleMobileFocusSync, { passive: true });
  scheduleEdgeCardShadowSync();
}

function updateDayNight(now = new Date()) {
  if (!worldMap || !nightZones.length) return;
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
  const sunLongitude = (12 - utcHours) * 15;
  const nightLongitude = sunLongitude + 180;
  const mapWidth = worldMap.clientWidth;
  const x = ((((nightLongitude + 180) % 360) + 360) % 360 / 360) * mapWidth;
  const targetLeft = x - mapWidth * 0.34;
  // 遮罩跨過世界地圖的日期變更線時，同一片夜晚會在另一側補位，
  // 並由 night-zone-viewport 裁切，因此既沒有空白也不會滲出地圖。
  nightZones.forEach((zone) => {
    const offset = Number(zone.dataset.nightZoneOffset || 0);
    zone.style.left = `${targetLeft + mapWidth * offset}px`;
  });
}

updateDayNight();
window.setInterval(updateDayNight, 60000);
window.addEventListener("resize", () => updateDayNight(), { passive: true });

if (worldMap && timezoneLabel) {
  const placeCountryTooltip = (point) => {
    if (!countryTooltip) return;
    const gap = 12;
    const width = countryTooltip.offsetWidth;
    const height = countryTooltip.offsetHeight;
    const left = Math.min(Math.max(point.x + 14, gap), worldMap.clientWidth - width - gap);
    const top = Math.min(Math.max(point.y - 18, height + gap), worldMap.clientHeight - gap);
    countryTooltip.style.left = `${left}px`;
    countryTooltip.style.top = `${top}px`;
    countryTooltip.style.transform = "translate(0, -100%)";
  };
  worldMap.addEventListener("pointermove", (event) => {
    const bounds = worldMap.getBoundingClientRect();
    worldMap.style.setProperty("--map-pointer-x", `${event.clientX - bounds.left}px`);
    worldMap.style.setProperty("--map-pointer-y", `${event.clientY - bounds.top}px`);
    worldMap.classList.add("is-pointer-active");
    const longitude = ((event.clientX - bounds.left) / bounds.width) * 360 - 180;
    const offset = Math.round(longitude / 15);
    const sign = offset >= 0 ? "+" : "−";
    timezoneLabel.textContent = `UTC ${sign}${String(Math.abs(offset)).padStart(2, "0")}:00`;
    timezoneLabel.style.left = `${Math.min(Math.max(event.clientX - bounds.left + 14, 12), bounds.width - 110)}px`;
    timezoneLabel.style.top = `${Math.min(Math.max(event.clientY - bounds.top - 42, 12), bounds.height - 48)}px`;
  });
  worldMap.addEventListener("pointerenter", () => {
    if (!worldMap.querySelector(".map-stats:hover, .map-legend:hover")) timezoneLabel.style.opacity = "1";
  });
  worldMap.addEventListener("pointerleave", () => {
    timezoneLabel.style.opacity = "0";
    worldMap.classList.remove("is-pointer-active");
  });

  if (window.am5 && window.am5map) {
    am5.ready(() => {
      const root = am5.Root.new("timezone-chart");
      root._logo?.dispose();
      root.setThemes([]);
      const chart = root.container.children.push(am5map.MapChart.new(root, {
        panX: "none", panY: "none", pinchZoom: false, projection: am5map.geoMercator(), wheelY: "none"
      }));
      const zones = chart.series.push(am5map.MapPolygonSeries.new(root, { geoJSON: am5geodata_worldTimeZonesHigh }));
      zones.mapPolygons.template.setAll({ fill: am5.color(0xaebfbd), fillOpacity: 0.12, stroke: am5.color(0x7c9998), strokeOpacity: 0.28, strokeWidth: 0.6, interactive: false });
      zones.mapPolygons.template.states.create("hover", { fill: am5.color(0xf3faf8), fillOpacity: 0.18, stroke: am5.color(0xffffff), strokeOpacity: 0.92, strokeWidth: 1.25, scale: 1.008, shadowColor: am5.color(0x344b4d), shadowBlur: 15, shadowOffsetY: 4, shadowOpacity: 0.32 });
      const areas = chart.series.push(am5map.MapPolygonSeries.new(root, { geoJSON: am5geodata_worldTimeZoneAreasHigh }));
      areas.mapPolygons.template.setAll({ fill: am5.color(0xc8c2ae), fillOpacity: 0.52, stroke: am5.color(0x8b9189), strokeOpacity: 0.52, strokeWidth: 0.7, interactive: true });
      areas.mapPolygons.template.states.create("hover", { fill: am5.color(0xfff5d1), fillOpacity: 0.24, stroke: am5.color(0xfff8dc), strokeOpacity: 0.98, strokeWidth: 1.35, scale: 1.01, shadowColor: am5.color(0x5a503d), shadowBlur: 17, shadowOffsetY: 5, shadowOpacity: 0.36 });
      const setCountryAreaState = (destination, isActive) => {
        areas.mapPolygons.each((polygon) => {
          const context = polygon.dataItem?.dataContext;
          const id = context?.id || context?.name;
          if (id === destination.code || id === destination.mapId) {
            polygon.states.apply(isActive ? "hover" : "default");
          }
        });
      };
      // (hover: none) 涵蓋所有寬度、方向的觸控裝置（含較寬的橫向平板），詳見
      // isMobileTimeline 的說明；地圖的兩段式 marker 點擊、時區多邊形停用原生
      // 互動，平板橫向也要一致套用，不能因為畫面比 700px 寬就退回桌面版邏輯。
      const isMobileMap = () => window.matchMedia("(max-width: 700px), (hover: none)").matches;
      const setMapView = () => {
        const mobile = isMobileMap();
        chart.set("zoomLevel", mobile ? 1 : 1.42);
        chart.set("centerGeoPoint", { longitude: 0, latitude: mobile ? 8 : 3 });
        // 手機版地圖只保留國家 icon 可互動，時區多邊形不接手原生手勢，
        // 才不會攔截手指在地圖上下滑動、原本該由頁面接手的捲動。
        areas.mapPolygons.template.set("interactive", !mobile);
      };
      setMapView();
      window.addEventListener("resize", setMapView, { passive: true });
      // marker 由 travelDestinations 產生，座標透過 chart.convert() 換算，
      // 因此與地圖投影、縮放保持同步。原本 amCharts bullet 與 DOM marker 兩套並存，
      // 其中 bullet 的 emoji 是 opacity 0（看不見），只重複提供一次互動，已合併成這一套。
      // 手機版採兩段式觸控：第一次點擊只固定顯示該國 tooltip，第二次點擊同一個
      // icon 才轉導；改點別的 icon 則換成顯示新 tooltip，不會誤觸轉導。桌面版
      // 維持原本 hover／focus 立即顯示、click 立即轉導的行為，不受這裡影響。
      let mobilePinnedMarker = null;
      let mobilePinnedHide = null;
      const markers = travelDestinations.map((destination) => {
        const marker = document.createElement("button");
        marker.className = "country-marker";
        marker.type = "button";
        marker.textContent = destination.flag;
        marker.setAttribute("aria-label", `${destination.name}，${destination.timezone}`);
        const pointOf = () => chart.convert({ longitude: destination.longitude, latitude: destination.latitude });
        const showTooltip = () => {
          if (!countryTooltip) return;
          const point = pointOf();
          worldMap.style.setProperty("--country-focus-x", `${point.x}px`);
          worldMap.style.setProperty("--country-focus-y", `${point.y}px`);
          worldMap.classList.add("is-country-focused");
          setCountryAreaState(destination, true);
          countryTooltip.textContent = `${destination.flag} ${destination.name} · ${destination.timezone}`;
          placeCountryTooltip(point);
          countryTooltip.classList.add("is-visible");
          countryTooltip.setAttribute("aria-hidden", "false");
          if (timezoneLabel) timezoneLabel.style.opacity = "0";
        };
        const hideTooltip = () => {
          if (countryTooltip) {
            countryTooltip.classList.remove("is-visible");
            countryTooltip.setAttribute("aria-hidden", "true");
          }
          worldMap.classList.remove("is-country-focused");
          setCountryAreaState(destination, false);
          if (timezoneLabel) timezoneLabel.style.opacity = "1";
        };
        marker.addEventListener("pointerenter", showTooltip);
        marker.addEventListener("pointerleave", hideTooltip);
        marker.addEventListener("pointerdown", showTooltip);
        marker.addEventListener("focus", showTooltip);
        marker.addEventListener("blur", hideTooltip);
        marker.addEventListener("click", (event) => {
          if (isMobileMap()) {
            if (mobilePinnedMarker !== marker) {
              event.preventDefault();
              if (mobilePinnedHide) mobilePinnedHide();
              mobilePinnedMarker = marker;
              mobilePinnedHide = hideTooltip;
              showTooltip();
              return;
            }
            mobilePinnedMarker = null;
            mobilePinnedHide = null;
          }
          window.location.href = destination.href;
        });
        worldMap.append(marker);
        return { marker, pointOf };
      });
      document.addEventListener("pointerdown", (event) => {
        if (!isMobileMap() || !mobilePinnedMarker) return;
        if (event.target.closest?.(".country-marker")) return;
        mobilePinnedHide?.();
        mobilePinnedMarker = null;
        mobilePinnedHide = null;
      });
      const positionMarkers = () => markers.forEach(({ marker, pointOf }) => {
        const point = pointOf();
        marker.style.left = `${point.x}px`;
        marker.style.top = `${point.y}px`;
      });
      positionMarkers();
      chart.events.on("boundschanged", positionMarkers);
      mapActions.forEach((button) => {
        button.addEventListener("click", () => {
          const action = button.dataset.mapAction;
          if (action === "reset") {
            setMapView();
          }
          if (action === "night" && nightZones.length) {
            nightZones.forEach((zone) => zone.classList.toggle("is-hidden"));
          }
        });
      });
      chart.appear(0, 0);
    });
  }
}
