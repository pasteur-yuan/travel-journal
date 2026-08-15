// Shared site behavior can be added here as the template grows.

const worldMap = document.querySelector("#world-map");
const timezoneLabel = document.querySelector("#timezone-label");
const nightZone = document.querySelector("#night-zone");

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
      chart.set("zoomLevel", 1.42);
      chart.set("centerGeoPoint", { longitude: 0, latitude: 3 });
      chart.appear(900, 100);
    });
  }
}
