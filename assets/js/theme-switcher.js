(function () {
  const savedTheme = localStorage.getItem("travel-journal-theme") === "glass-dark" ? "glass-dark" : "glass";
  const iconMarkup = '<svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g class="theme-icon-sun"><circle cx="12" cy="12" r="4.2"></circle><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"></path></g><path class="theme-icon-moon" d="M15.8 3.6a8.7 8.7 0 1 0 4.6 15.9A8.2 8.2 0 1 1 15.8 3.6Z"></path></svg>';
  const themeToggle = document.querySelector("[data-theme-toggle]");
  let iconSwapTimer;

  function applyTheme(themeKey) {
    const theme = themes[themeKey] || themes.glass;
    document.body.className = document.body.className
      .replace(/theme-\S+/g, "")
      .trim();
    document.body.classList.add(theme.className);
    if (themeToggle) {
      const isDark = themeKey === "glass-dark";
      if (!themeToggle.querySelector(".theme-icon")) themeToggle.innerHTML = iconMarkup;
      themeToggle.setAttribute("aria-label", isDark ? "切換為亮色液態玻璃" : "切換為暗色液態玻璃");
      themeToggle.title = isDark ? "切換亮色主題" : "切換暗色主題";
      themeToggle.setAttribute("aria-pressed", String(isDark));
      clearTimeout(iconSwapTimer);
      const updateIcon = () => themeToggle.setAttribute("data-icon-state", isDark ? "dark" : "light");
      if (themeToggle.dataset.ready === "true") {
        themeToggle.classList.add("is-switching");
        iconSwapTimer = window.setTimeout(() => {
          updateIcon();
        }, 420);
        window.setTimeout(() => themeToggle.classList.remove("is-switching"), 1800);
      } else {
        updateIcon();
        themeToggle.dataset.ready = "true";
      }
    }
    localStorage.setItem("travel-journal-theme", themeKey);
  }

  themeToggle?.addEventListener("click", () => {
    applyTheme(document.body.classList.contains("theme-glass-dark") ? "glass" : "glass-dark");
  });
  applyTheme(savedTheme);
})();
