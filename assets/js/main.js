// Shared site behavior can be added here as the template grows.

const worldMap = document.querySelector("#world-map");
const timezoneLabel = document.querySelector("#timezone-label");
const nightZone = document.querySelector("#night-zone");
const countryStrip = document.querySelector(".country-strip");
const countryCards = [...document.querySelectorAll(".country-card")];
const timelineEntries = document.querySelectorAll(".timeline-entry");
const mapStats = document.querySelector(".map-stats");
const mapControls = document.querySelector(".map-controls");
const mapActions = mapControls ? mapControls.querySelectorAll("[data-map-action]") : [];

const timelineTrack = document.querySelector(".timeline-track");
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
      window.setTimeout(() => {
        centerGroup(group);
        timelineTrack.classList.remove("is-switching");
      }, 850);
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
  entry.addEventListener("click", (event) => {
    if (window.matchMedia("(max-width: 700px)").matches) {
      const wasExpanded = entry.classList.contains("is-expanded");
      timelineEntries.forEach((item) => item.classList.remove("is-expanded"));
      if (!wasExpanded) {
        entry.classList.add("is-expanded");
        if (!entry.matches("a")) event.preventDefault();
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
    syncPointerCard();
    if (event.pointerType === "mouse" && document.activeElement?.classList.contains("country-card")) {
      document.activeElement.blur();
    }
  });
  countryCards.forEach((card) => {
    card.addEventListener("pointerenter", (event) => {
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
      root.setThemes([]);
      const chart = root.container.children.push(am5map.MapChart.new(root, {
        panX: "translateX", panY: "translateY", projection: am5map.geoMercator(), wheelY: "none"
      }));
      const zones = chart.series.push(am5map.MapPolygonSeries.new(root, { geoJSON: am5geodata_worldTimeZonesHigh }));
      zones.mapPolygons.template.setAll({ fill: am5.color(0x76b9b4), fillOpacity: 0.16, stroke: am5.color(0x709997), strokeOpacity: 0.34, strokeWidth: 0.6, interactive: true });
      zones.mapPolygons.template.states.create("hover", { fill: am5.color(0xe78350), fillOpacity: 0.62 });
      const areas = chart.series.push(am5map.MapPolygonSeries.new(root, { geoJSON: am5geodata_worldTimeZoneAreasHigh }));
      areas.mapPolygons.template.setAll({ fill: am5.color(0xd8cda9), fillOpacity: 0.86, stroke: am5.color(0x668b84), strokeOpacity: 0.78, strokeWidth: 0.7, interactive: true });
      areas.mapPolygons.template.states.create("hover", { fill: am5.color(0xf09a55), fillOpacity: 0.95 });
      // 使用 GeoJSON Point，讓標記與地圖圖層共用完全相同的投影轉換。
      const destinations = chart.series.push(am5map.MapPointSeries.new(root, {
        geoJSON: {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            properties: { name: "日本", timezone: "UTC+09:00" },
            geometry: { type: "Point", coordinates: [139.6503, 35.6762] }
          }]
        }
      }));
      destinations.bullets.push(() => {
        const marker = am5.Container.new(root, { centerX: am5.p50, centerY: am5.p50, cursorOverStyle: "pointer", interactiveChildren: true });
        const emoji = am5.Label.new(root, { text: "🇯🇵", fontSize: 14, centerX: am5.p50, centerY: am5.p50 });
        const label = am5.Label.new(root, { text: "🇯🇵 日本 · UTC+09:00", fontSize: 12, x: 16, centerY: am5.p50, opacity: 0, fill: am5.color(0xf7fbf7), background: am5.RoundedRectangle.new(root, { fill: am5.color(0x24454a), fillOpacity: 0.94, cornerRadiusTL: 8, cornerRadiusTR: 8, cornerRadiusBL: 8, cornerRadiusBR: 8 }), paddingLeft: 7, paddingRight: 7, paddingTop: 4, paddingBottom: 4 });
        marker.children.push(emoji); marker.children.push(label);
        marker.events.on("pointerover", () => { label.animate({ key: "opacity", to: 1, duration: 150 }); if (timezoneLabel) timezoneLabel.style.opacity = "0"; });
        marker.events.on("pointerout", () => { label.animate({ key: "opacity", to: 0, duration: 150 }); if (timezoneLabel) timezoneLabel.style.opacity = "1"; });
        marker.events.on("click", () => { window.location.href = "countries/japan/index.html"; });
        return am5.Bullet.new(root, { sprite: marker });
      });
      chart.set("zoomLevel", 1.42);
      chart.set("centerGeoPoint", { longitude: 0, latitude: 3 });
      mapActions.forEach((button) => {
        button.addEventListener("click", () => {
          const action = button.dataset.mapAction;
          if (action === "reset") {
            chart.set("zoomLevel", 1.42);
            chart.set("centerGeoPoint", { longitude: 0, latitude: 3 });
          }
          if (action === "night" && nightZone) nightZone.classList.toggle("is-hidden");
        });
      });
      chart.appear(900, 100);
    });
  }
}
