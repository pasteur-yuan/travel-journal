(function () {
  const savedTheme = localStorage.getItem("travel-journal-theme") || "landscape";
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
  applyTheme(savedTheme);
})();
