const regionShowcase = document.querySelector(".region-showcase");

if (regionShowcase) {
  const backdrop = regionShowcase.querySelector(".region-showcase-backdrop");
  let items = [...regionShowcase.querySelectorAll(".region-showcase-item")];
  items.forEach((item) => {
    const arrow = item.querySelector(".region-showcase-arrow");
    if (arrow) arrow.innerHTML = '<i class="fa-solid fa-location-arrow" aria-hidden="true"></i>';
  });
  const activate = (item) => {
    items.forEach((entry) => entry.classList.toggle("is-active", entry === item));
    if (backdrop) backdrop.style.setProperty("--region-showcase-image", `url("${item.dataset.image}")`);
  };
  const bindItem = (item) => {
    if (item.dataset.showcaseBound === "true") return;
    item.dataset.showcaseBound = "true";
    const arrow = item.querySelector(".region-showcase-arrow");
    if (arrow) arrow.innerHTML = '<i class="fa-solid fa-location-arrow" aria-hidden="true"></i>';
    item.addEventListener("pointerenter", () => activate(item));
    item.addEventListener("focus", () => activate(item));
    item.addEventListener("pointerdown", (event) => {
      const rect = item.getBoundingClientRect();
      const random = (min, max) => Math.round(min + Math.random() * (max - min));
      const radius = `${random(38, 58)}% ${random(42, 62)}% ${random(40, 60)}% ${random(44, 64)}% / ${random(40, 60)}% ${random(44, 64)}% ${random(38, 58)}% ${random(42, 62)}%`;
      item.style.setProperty("--press-x", `${event.clientX - rect.left}px`);
      item.style.setProperty("--press-y", `${event.clientY - rect.top}px`);
      item.style.setProperty("--press-radius", radius);
      item.style.setProperty("--press-rotate", `${random(-12, 12)}deg`);
      item.style.setProperty("--press-scale-x", (0.88 + Math.random() * 0.2).toFixed(2));
      item.style.setProperty("--press-width", `${random(11, 18)}rem`);
      item.style.setProperty("--press-height", `${random(6, 11)}rem`);
      item.style.setProperty("--press-skew", `${random(-8, 8)}deg`);
      item.classList.add("is-pressed");
      item.setPointerCapture?.(event.pointerId);
    });
    item.addEventListener("pointermove", (event) => {
      if (!item.classList.contains("is-pressed")) return;
      const rect = item.getBoundingClientRect();
      item.style.setProperty("--press-x", `${event.clientX - rect.left}px`);
      item.style.setProperty("--press-y", `${event.clientY - rect.top}px`);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
      item.addEventListener(eventName, () => item.classList.remove("is-pressed"));
    });
  };
  items.forEach(bindItem);
  const list = regionShowcase.querySelector(".region-showcase-list");
  if (list) {
    const itemObserver = new MutationObserver((mutations) => {
      mutations.flatMap((mutation) => [...mutation.addedNodes])
        .filter((node) => node.nodeType === 1)
        .flatMap((node) => [node, ...node.querySelectorAll?.(".region-showcase-item") || []])
        .filter((node) => node.matches?.(".region-showcase-item"))
        .forEach((item) => { bindItem(item); items = [...regionShowcase.querySelectorAll(".region-showcase-item")]; observer.observe(item); });
    });
    itemObserver.observe(list, { childList: true, subtree: true });
  }
  let glowFrame = 0;
  let pendingGlow = null;
  regionShowcase.addEventListener("pointermove", (event) => {
    const item = event.target.closest(".region-showcase-item");
    if (!item) return;
    pendingGlow = { item, x: event.clientX, y: event.clientY };
    if (glowFrame) return;
    glowFrame = window.requestAnimationFrame(() => {
      const rect = pendingGlow.item.getBoundingClientRect();
      pendingGlow.item.style.setProperty("--pointer-x", `${pendingGlow.x - rect.left}px`);
      pendingGlow.item.style.setProperty("--pointer-y", `${pendingGlow.y - rect.top}px`);
      glowFrame = 0;
    });
  });
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) activate(visible.target);
  }, { threshold: [0.6] });
  items.forEach((item) => observer.observe(item));
}
