// Shared site behavior can be added here as the template grows.

const worldMap = document.querySelector("#world-map");
const timezoneLabel = document.querySelector("#timezone-label");
const countryTooltip = document.querySelector("#country-tooltip");
const nightZone = document.querySelector("#night-zone");
const countryStrip = document.querySelector(".country-strip");
const countryCards = [...document.querySelectorAll(".country-card")];
const timelineEntries = document.querySelectorAll(".timeline-entry");
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

document.addEventListener("pointerdown", (event) => {
  const target = event.target;
  if (mapLegend?.contains(target) || mapStats?.contains(target)) return;
  if (document.activeElement === mapLegend || mapLegend?.contains(document.activeElement)) mapLegend?.blur();
  if (document.activeElement === mapStats || mapStats?.contains(document.activeElement)) mapStats?.blur();
}, { passive: true });

const timelineTrack = document.querySelector(".timeline-track");
let timelineSwitchTimer = 0;
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
// 不必再手動維護三處寫死的內容（原本的 01 國家 / 03 地區已經與實際資料對不上）。
if (datedTimelineEntries.length && (mapLegend || mapStats)) {
  const countries = [...new Set(datedTimelineEntries.map((entry) => entry.dataset.country).filter(Boolean))];
  const regions = new Set(datedTimelineEntries
    .filter((entry) => entry.dataset.country && entry.dataset.region)
    .map((entry) => `${entry.dataset.country} / ${entry.dataset.region}`));
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
    const counts = [[countries.length, "國家"], [regions.size, "地區"], [datedTimelineEntries.length, "旅行節點"]];
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
    if (event.pointerType === "mouse" && !isMobileTimeline() && !entry.matches(":focus-within")) entry.classList.remove("is-expanded");
  });
  dot?.addEventListener("click", (event) => {
    if (!isMobileTimeline()) { event.preventDefault(); return; }
    event.preventDefault();
    event.stopPropagation();
    if (entry.classList.contains("is-expanded")) collapseEntryCard();
    else activateEntryYear();
  });
  entry.addEventListener("click", (event) => {
    const clickedCard = event.target.closest(".timeline-card");
    const clickedDot = event.target.closest(".timeline-dot");
    if (clickedDot) { event.preventDefault(); return; }
    if (isMobileTimeline() && (!clickedCard || !entry.classList.contains("is-expanded"))) event.preventDefault();
  });
});

if (countryStrip) {
  let pointer = null;
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
    });
  });
  countryStrip.addEventListener("scroll", () => {
    syncPointerCard();
    if (document.activeElement?.classList.contains("country-card")) {
      document.activeElement.blur();
    }
  }, { passive: true });
  countryStrip.addEventListener("pointerleave", () => {
    pointer = null;
    countryCards.forEach((item) => item.classList.remove("is-pointer-active"));
  });
}

function updateDayNight() {
  if (!worldMap || !nightZone) return;
  const now = new Date();
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
  const sunLongitude = (12 - utcHours) * 15;
  const nightLongitude = sunLongitude + 180;
  const x = ((((nightLongitude + 180) % 360) + 360) % 360 / 360) * worldMap.clientWidth;
  const targetLeft = x - worldMap.clientWidth * 0.34;
  nightZone.style.left = `${targetLeft}px`;
}

updateDayNight();
window.setInterval(updateDayNight, 60000);

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
      const isMobileMap = () => window.matchMedia("(max-width: 700px)").matches;
      const setMapView = () => {
        chart.set("zoomLevel", isMobileMap() ? 1 : 1.42);
        chart.set("centerGeoPoint", { longitude: 0, latitude: isMobileMap() ? 8 : 3 });
      };
      setMapView();
      window.addEventListener("resize", setMapView, { passive: true });
      // marker 由 travelDestinations 產生，座標透過 chart.convert() 換算，
      // 因此與地圖投影、縮放保持同步。原本 amCharts bullet 與 DOM marker 兩套並存，
      // 其中 bullet 的 emoji 是 opacity 0（看不見），只重複提供一次互動，已合併成這一套。
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
        marker.addEventListener("click", () => { window.location.href = destination.href; });
        worldMap.append(marker);
        return { marker, pointOf };
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
          if (action === "night" && nightZone) nightZone.classList.toggle("is-hidden");
        });
      });
      chart.appear(0, 0);
    });
  }
}
