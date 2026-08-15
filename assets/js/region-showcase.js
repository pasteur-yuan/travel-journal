const regionShowcase = document.querySelector(".region-showcase");

if (regionShowcase) {
  const backdrop = regionShowcase.querySelector(".region-showcase-backdrop");
  const items = [...regionShowcase.querySelectorAll(".region-showcase-item")];
  const activate = (item) => {
    items.forEach((entry) => entry.classList.toggle("is-active", entry === item));
    if (backdrop) backdrop.style.setProperty("--region-showcase-image", `url("${item.dataset.image}")`);
  };
  items.forEach((item) => {
    item.addEventListener("pointerenter", () => activate(item));
    item.addEventListener("focus", () => activate(item));
  });
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) activate(visible.target);
  }, { threshold: [0.6] });
  items.forEach((item) => observer.observe(item));
}
