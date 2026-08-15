(function () {
  const savedTheme = localStorage.getItem("travel-journal-theme") || "landscape";
  document.querySelectorAll(".theme-menu-panel").forEach((panel) => {
    if (!panel.querySelector('[data-theme="glass"]')) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.theme = "glass";
      button.textContent = themes.glass.name;
      panel.append(button);
    }
  });
  const themeButtons = document.querySelectorAll("[data-theme]");

  function applyTheme(themeKey) {
    const theme = themes[themeKey] || themes.landscape;
    document.body.className = document.body.className
      .replace(/theme-\S+/g, "")
      .trim();
    document.body.classList.add(theme.className);
    themeButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.theme === themeKey));
    });
    localStorage.setItem("travel-journal-theme", themeKey);
  }

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyTheme(button.dataset.theme);
      button.closest("details")?.removeAttribute("open");
    });
  });
  const themeMenus = [...document.querySelectorAll(".theme-menu")];
  themeMenus.forEach((menu) => {
    const summary = menu.querySelector("summary");
    summary?.addEventListener("click", () => {
      summary.classList.remove("is-spinning");
      requestAnimationFrame(() => summary.classList.add("is-spinning"));
    });
    summary?.addEventListener("animationend", () => summary.classList.remove("is-spinning"));
  });
  document.addEventListener("pointerdown", (event) => {
    themeMenus.forEach((menu) => {
      if (!menu.contains(event.target)) menu.removeAttribute("open");
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") themeMenus.forEach((menu) => menu.removeAttribute("open"));
  });
  applyTheme(savedTheme);
})();
