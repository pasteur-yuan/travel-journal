// Shared site behavior can be added here as the template grows.

const worldMap = document.querySelector("#world-map");
const timezoneLabel = document.querySelector("#timezone-label");
const countryTooltip = document.querySelector("#country-tooltip");
const japanMarker = document.querySelector("#japan-marker");
const nightZone = document.querySelector("#night-zone");
const countryStrip = document.querySelector(".country-strip");
const countryCards = [...document.querySelectorAll(".country-card")];
const timelineEntries = document.querySelectorAll(".timeline-entry");
const mapLegend = document.querySelector(".map-legend");
const mapStats = document.querySelector(".map-stats");
const mapControls = document.querySelector(".map-controls");
const mapActions = mapControls ? mapControls.querySelectorAll("[data-map-action]") : [];

document.addEventListener("pointerdown", (event) => {
  const target = event.target;
  if (mapLegend?.contains(target) || mapStats?.contains(target)) return;
  if (document.activeElement === mapLegend || mapLegend?.contains(document.activeElement)) mapLegend?.blur();
  if (document.activeElement === mapStats || mapStats?.contains(document.activeElement)) mapStats?.blur();
}, { passive: true });

const timelineTrack = document.querySelector(".timeline-track");
let timelineScrollFrame = 0;
let timelineSwitchTimer = 0;
const animatePageScrollTo = (target, duration = 1500) => {
  if (timelineScrollFrame) window.cancelAnimationFrame(timelineScrollFrame);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, target);
    return;
  }
  const start = window.scrollY;
  const distance = target - start;
  const startedAt = performance.now();
  const easeInOut = (progress) => progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  const frame = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    window.scrollTo(0, start + distance * easeInOut(progress));
    if (progress < 1) timelineScrollFrame = window.requestAnimationFrame(frame);
    else timelineScrollFrame = 0;
  };
  timelineScrollFrame = window.requestAnimationFrame(frame);
};

if (timelineTrack && timelineEntries.length) {
  const entries = [...timelineEntries];
  const updateTimelineGlow = (group) => {
    const marker = group?.querySelector(".timeline-year-marker");
    if (!group || !marker) return;
    const update = () => timelineTrack.style.setProperty("--timeline-glow-y", `${group.offsetTop + marker.offsetTop + marker.offsetHeight / 2}px`);
    window.requestAnimationFrame(() => window.requestAnimationFrame(update));
  };
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
  const years = Array.from({ length: Math.max(1, currentYear - firstYear + 2) }, (_, index) => firstYear + index);
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
    const isFutureYear = year > currentYear;
    marker.setAttribute("aria-expanded", String(year === activeYear));
    marker.disabled = isFutureYear;
    if (isFutureYear) {
      group.classList.add("is-future");
      marker.setAttribute("aria-label", `${year}，尚未開始`);
    }
    group.append(marker, ...(entriesByYear.get(year) || []));
    marker.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "touch" || isFutureYear) return;
      event.preventDefault();
      marker.click();
      marker.dataset.skipNextClick = "true";
    });
    marker.addEventListener("click", () => {
      if (isFutureYear) return;
      if (marker.dataset.skipNextClick === "true") {
        delete marker.dataset.skipNextClick;
        return;
      }
      const mobileScroll = window.matchMedia("(max-width: 700px)").matches;
      if (!mobileScroll) timelineTrack.classList.add("is-switching");
      timelineTrack.querySelectorAll(".timeline-year-group").forEach((item) => {
        const expanded = item === group;
        item.classList.toggle("is-active", expanded);
        item.querySelector(".timeline-year-marker").setAttribute("aria-expanded", String(expanded));
      });
      timelineEntries.forEach((entry) => entry.classList.remove("is-expanded", "is-dot-collapsed"));
      if (document.activeElement?.closest?.(".timeline-entry")) document.activeElement.blur();
      updateTimelineGlow(group);
      window.clearTimeout(timelineSwitchTimer);
      timelineSwitchTimer = window.setTimeout(() => {
        if (!mobileScroll) timelineTrack.classList.remove("is-switching");
        updateTimelineGlow(group);
        if (mobileScroll) {
          const target = Math.max(0, group.getBoundingClientRect().top + window.scrollY - 24);
          animatePageScrollTo(target, 2100);
        } else {
          centerGroup(group);
        }
      }, mobileScroll ? 180 : 850);
    });
    timelineTrack.append(group);
  });
  const initialGroup = timelineTrack.querySelector(`.timeline-year-group[data-year="${activeYear}"]`);
  if (initialGroup) window.requestAnimationFrame(() => {
    centerGroup(initialGroup, false);
    if (window.matchMedia("(max-width: 700px)").matches) {
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
  const isMobile = () => window.matchMedia("(max-width: 700px)").matches;
  const activateEntryYear = () => {
    const yearGroup = entry.closest(".timeline-year-group");
    if (!yearGroup) return;
    timelineEntries.forEach((item) => item.classList.remove("is-expanded", "is-dot-collapsed"));
    timelineTrack.querySelectorAll(".timeline-year-group").forEach((item) => {
      const active = item === yearGroup;
      item.classList.toggle("is-active", active);
      item.querySelector(".timeline-year-marker")?.setAttribute("aria-expanded", String(active));
    });
    updateTimelineGlow(yearGroup);
    entry.classList.add("is-expanded");
  };
  entry.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse" && !isMobile()) {
      timelineTrack.classList.remove("is-switching");
      entry.classList.add("is-expanded");
    }
  });
  entry.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse" && !isMobile() && !entry.matches(":focus-within")) entry.classList.remove("is-expanded");
  });
  dot?.addEventListener("click", (event) => {
    if (!isMobile()) { event.preventDefault(); return; }
    event.preventDefault();
    event.stopPropagation();
    activateEntryYear();
  });
  entry.addEventListener("click", (event) => {
    const clickedCard = event.target.closest(".timeline-card");
    const clickedDot = event.target.closest(".timeline-dot");
    if (clickedDot) { event.preventDefault(); return; }
    if (isMobile() && (!clickedCard || !entry.classList.contains("is-expanded"))) event.preventDefault();
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
      const setJapanAreaState = (isActive) => {
        areas.mapPolygons.each((polygon) => {
          const id = polygon.dataItem?.dataContext?.id || polygon.dataItem?.dataContext?.name;
          if (id === "JP" || id === "Japan") {
            if (isActive) polygon.states.apply("hover");
            else polygon.states.apply("default");
          }
        });
      };
      // 使用 MapPointSeries 原生的 latitude/longitude 資料欄位，讓 marker
      // 與同一個 MapChart 的投影、縮放及平移保持同步。
      const destinations = chart.series.push(am5map.MapPointSeries.new(root, {}));
      destinations.bullets.push(() => {
        const marker = am5.Container.new(root, { width: 20, height: 20, centerX: am5.p50, centerY: am5.p50, cursorOverStyle: "pointer", interactive: true, interactiveChildren: true });
        const emoji = am5.Label.new(root, { text: "🇯🇵", fontSize: 14, x: 10, y: 10, centerX: am5.p50, centerY: am5.p50, interactive: true, focusable: true, ariaLabel: "日本，東京，UTC+09:00", role: "button" });
        emoji.set("opacity", 0);
        marker.children.push(emoji);
        const showDestinationTooltip = () => {
          if (!countryTooltip) return;
          const point = chart.convert({ longitude: 139.6503, latitude: 35.6762 });
          worldMap.style.setProperty("--country-focus-x", `${point.x}px`);
          worldMap.style.setProperty("--country-focus-y", `${point.y}px`);
          worldMap.classList.add("is-country-focused");
          setJapanAreaState(true);
          countryTooltip.textContent = "🇯🇵 日本 · UTC+09:00";
          placeCountryTooltip(point);
          countryTooltip.classList.add("is-visible");
          countryTooltip.setAttribute("aria-hidden", "false");
          if (timezoneLabel) timezoneLabel.style.opacity = "0";
        };
        const hideDestinationTooltip = () => {
          if (countryTooltip) { countryTooltip.classList.remove("is-visible"); countryTooltip.setAttribute("aria-hidden", "true"); }
          worldMap.classList.remove("is-country-focused");
          setJapanAreaState(false);
          if (timezoneLabel) timezoneLabel.style.opacity = "1";
        };
        marker.events.on("pointerover", showDestinationTooltip);
        marker.events.on("pointerout", hideDestinationTooltip);
        emoji.events.on("pointerover", showDestinationTooltip);
        emoji.events.on("pointerout", hideDestinationTooltip);
        emoji.events.on("focus", showDestinationTooltip);
        emoji.events.on("blur", hideDestinationTooltip);
        marker.events.on("click", () => { window.location.href = "countries/japan/index.html"; });
        return am5.Bullet.new(root, { sprite: marker });
      });
      destinations.pushDataItem({
        name: "日本",
        timezone: "UTC+09:00",
        latitude: 35.6762,
        longitude: 139.6503
      });
      const isMobileMap = () => window.matchMedia("(max-width: 700px)").matches;
      const setMapView = () => {
        chart.set("zoomLevel", isMobileMap() ? 1 : 1.42);
        chart.set("centerGeoPoint", { longitude: 0, latitude: isMobileMap() ? 8 : 3 });
      };
      setMapView();
      window.addEventListener("resize", setMapView, { passive: true });
      if (japanMarker) {
        japanMarker.style.display = "grid";
        const positionJapanMarker = () => {
          const point = chart.convert({ longitude: 139.6503, latitude: 35.6762 });
          japanMarker.style.left = `${point.x}px`;
          japanMarker.style.top = `${point.y}px`;
        };
        const showJapanTooltip = () => {
          const point = chart.convert({ longitude: 139.6503, latitude: 35.6762 });
          worldMap.style.setProperty("--country-focus-x", `${point.x}px`);
          worldMap.style.setProperty("--country-focus-y", `${point.y}px`);
          worldMap.classList.add("is-country-focused");
          setJapanAreaState(true);
          countryTooltip.textContent = "🇯🇵 日本 · UTC+09:00";
          placeCountryTooltip(point);
          countryTooltip.classList.add("is-visible");
          countryTooltip.setAttribute("aria-hidden", "false");
          if (timezoneLabel) timezoneLabel.style.opacity = "0";
        };
        const hideJapanTooltip = () => {
          countryTooltip.classList.remove("is-visible");
          countryTooltip.setAttribute("aria-hidden", "true");
          worldMap.classList.remove("is-country-focused");
          setJapanAreaState(false);
          if (timezoneLabel) timezoneLabel.style.opacity = "1";
        };
        positionJapanMarker();
        chart.events.on("boundschanged", positionJapanMarker);
        japanMarker.addEventListener("pointerenter", showJapanTooltip);
        japanMarker.addEventListener("pointerleave", hideJapanTooltip);
        japanMarker.addEventListener("pointerdown", showJapanTooltip);
        japanMarker.addEventListener("focus", showJapanTooltip);
        japanMarker.addEventListener("blur", hideJapanTooltip);
        japanMarker.addEventListener("click", () => { window.location.href = "countries/japan/index.html"; });
      }
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
