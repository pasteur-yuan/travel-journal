// Shared site behavior can be added here as the template grows.

const worldMap = document.querySelector("#world-map");
const timezoneLabel = document.querySelector("#timezone-label");
const countryTooltip = document.querySelector("#country-tooltip");
const japanMarker = document.querySelector("#japan-marker");
const nightZone = document.querySelector("#night-zone");
const countryStrip = document.querySelector(".country-strip");
const countryCards = [...document.querySelectorAll(".country-card")];
const timelineEntries = document.querySelectorAll(".timeline-entry");
const mapStats = document.querySelector(".map-stats");
const mapControls = document.querySelector(".map-controls");
const mapActions = mapControls ? mapControls.querySelectorAll("[data-map-action]") : [];

const timelineTrack = document.querySelector(".timeline-track");
let timelineScrollFrame = 0;
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
  years.forEach((year) => {
    const group = document.createElement("section");
    group.className = `timeline-year-group${year === activeYear ? " is-active" : ""}`;
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
    marker.addEventListener("click", () => {
      if (isFutureYear) return;
      timelineTrack.classList.add("is-switching");
      timelineTrack.querySelectorAll(".timeline-year-group").forEach((item) => {
        const expanded = item === group;
        item.classList.toggle("is-active", expanded);
        item.querySelector(".timeline-year-marker").setAttribute("aria-expanded", String(expanded));
      });
      const mobileScroll = window.matchMedia("(max-width: 700px)").matches;
      window.setTimeout(() => {
        timelineTrack.classList.remove("is-switching");
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
  if (initialGroup) window.requestAnimationFrame(() => centerGroup(initialGroup, false));
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
  dot?.addEventListener("click", (event) => {
    if (!window.matchMedia("(max-width: 700px)").matches) return;
    event.preventDefault();
    event.stopPropagation();
    const wasExpanded = entry.classList.contains("is-expanded");
    timelineEntries.forEach((item) => item.classList.remove("is-expanded", "is-dot-collapsed"));
    if (!wasExpanded) {
      entry.classList.add("is-expanded");
    } else {
      entry.classList.add("is-dot-collapsed");
    }
  });
  entry.addEventListener("click", (event) => {
    const clickedCard = event.target.closest(".timeline-card");
    const isExpanded = entry.classList.contains("is-expanded");
    const isMobile = window.matchMedia("(max-width: 700px)").matches;
    if (isMobile && entry.matches("a") && (!clickedCard || !isExpanded)) {
      event.preventDefault();
    }
    if (isMobile) {
      const wasExpanded = isExpanded;
      timelineEntries.forEach((item) => item.classList.remove("is-expanded"));
      if (!wasExpanded) {
        entry.classList.add("is-expanded");
      }
    }
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
  nightZone.style.left = `${x - worldMap.clientWidth * 0.34}px`;
}

updateDayNight();
window.setInterval(updateDayNight, 60000);

if (worldMap && timezoneLabel) {
  worldMap.addEventListener("pointermove", (event) => {
    const bounds = worldMap.getBoundingClientRect();
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
      zones.mapPolygons.template.setAll({ fill: am5.color(0x76b9b4), fillOpacity: 0.16, stroke: am5.color(0x709997), strokeOpacity: 0.34, strokeWidth: 0.6, interactive: true });
      zones.mapPolygons.template.states.create("hover", { fill: am5.color(0xe78350), fillOpacity: 0.62 });
      const areas = chart.series.push(am5map.MapPolygonSeries.new(root, { geoJSON: am5geodata_worldTimeZoneAreasHigh }));
      areas.mapPolygons.template.setAll({ fill: am5.color(0xd8cda9), fillOpacity: 0.86, stroke: am5.color(0x668b84), strokeOpacity: 0.78, strokeWidth: 0.7, interactive: true });
      areas.mapPolygons.template.states.create("hover", { fill: am5.color(0xf09a55), fillOpacity: 0.95 });
      // 使用 MapPointSeries 原生的 latitude/longitude 資料欄位，讓 marker
      // 與同一個 MapChart 的投影、縮放及平移保持同步。
      const destinations = chart.series.push(am5map.MapPointSeries.new(root, {}));
      destinations.bullets.push(() => {
        const marker = am5.Container.new(root, { width: 20, height: 20, centerX: am5.p50, centerY: am5.p50, cursorOverStyle: "pointer", interactive: true, interactiveChildren: true });
        const emoji = am5.Label.new(root, { text: "🇯🇵", fontSize: 14, x: 10, y: 10, centerX: am5.p50, centerY: am5.p50, interactive: true, focusable: true, ariaLabel: "日本，東京，UTC+09:00", role: "button" });
        marker.children.push(emoji);
        const showDestinationTooltip = () => {
          if (!countryTooltip) return;
          const point = chart.convert({ longitude: 139.6503, latitude: 35.6762 });
          countryTooltip.textContent = "🇯🇵 日本 · UTC+09:00";
          countryTooltip.style.left = `${point.x}px`;
          countryTooltip.style.top = `${point.y}px`;
          countryTooltip.classList.add("is-visible");
          countryTooltip.setAttribute("aria-hidden", "false");
          if (timezoneLabel) timezoneLabel.style.opacity = "0";
        };
        const hideDestinationTooltip = () => {
          if (countryTooltip) { countryTooltip.classList.remove("is-visible"); countryTooltip.setAttribute("aria-hidden", "true"); }
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
        const positionJapanMarker = () => {
          const point = chart.convert({ longitude: 139.6503, latitude: 35.6762 });
          japanMarker.style.left = `${point.x}px`;
          japanMarker.style.top = `${point.y}px`;
        };
        const showJapanTooltip = () => {
          const point = chart.convert({ longitude: 139.6503, latitude: 35.6762 });
          countryTooltip.textContent = "🇯🇵 日本 · UTC+09:00";
          countryTooltip.style.left = `${point.x}px`;
          countryTooltip.style.top = `${point.y}px`;
          countryTooltip.classList.add("is-visible");
          countryTooltip.setAttribute("aria-hidden", "false");
          if (timezoneLabel) timezoneLabel.style.opacity = "0";
        };
        const hideJapanTooltip = () => {
          countryTooltip.classList.remove("is-visible");
          countryTooltip.setAttribute("aria-hidden", "true");
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
      chart.appear(900, 100);
    });
  }
}
