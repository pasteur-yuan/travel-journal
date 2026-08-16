import { sleep, suite } from "../harness.mjs";

export const cards = suite("首頁 · 國家卡片", async (b, t) => {
  await b.desktop();
  await b.goto("/index.html", { settle: 1200 });

  const shape = await b.eval(`(() => {
    const strip = document.querySelector(".country-strip");
    const cards = [...document.querySelectorAll(".country-card")];
    return {
      count: cards.length,
      linked: cards.filter(c => c.tagName === "A").map(c => c.getAttribute("href")),
      coming: cards.filter(c => c.classList.contains("country-card-coming")).length,
      comingAreLinks: cards.some(c => c.classList.contains("country-card-coming") && c.tagName === "A"),
      everyCardLabelled: cards.every(c => (c.getAttribute("aria-label") || c.textContent || "").trim().length > 0),
      stripScrollable: strip.scrollWidth > strip.clientWidth,
      pageScrollsSideways: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  })()`);

  t.check("卡片列本身可水平捲動", shape.stripScrollable,
    `scrollWidth > clientWidth = ${shape.stripScrollable}`);
  t.check("卡片列不會撐寬整個頁面", !shape.pageScrollsSideways,
    `頁面水平捲動 = ${shape.pageScrollsSideways}`);
  t.check("Coming soon 卡片不是連結（不建立失效連結）", !shape.comingAreLinks,
    `${shape.coming} 張 Coming soon`);
  t.check("已完成的國家卡片連到正確路徑",
    shape.linked.length > 0 && shape.linked.every((h) => h.startsWith("countries/")),
    JSON.stringify(shape.linked));
  t.check("每張卡片都有可讀的名稱或 aria-label", shape.everyCardLabelled);

  const edgeTreatment = await b.eval(`(async () => {
    const strip = document.querySelector(".country-strip");
    const cards = [...document.querySelectorAll(".country-card")];
    const edgeBuffer = 64;
    const settle = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const inspect = () => {
      const bounds = strip.getBoundingClientRect();
      return cards
        .filter((card) => {
          const rect = card.getBoundingClientRect();
          const visible = rect.right > bounds.left && rect.left < bounds.right;
          return visible && (rect.left < bounds.left + edgeBuffer || rect.right > bounds.right - edgeBuffer);
        })
        .map((card) => ({
          name: card.querySelector(".country-name")?.textContent,
          edgeMuted: card.classList.contains("is-edge-shadowless"),
          shadow: getComputedStyle(card).boxShadow
        }));
    };
    strip.style.scrollBehavior = "auto";
    strip.scrollLeft = 0;
    await settle();
    const start = inspect();
    strip.scrollLeft = strip.scrollWidth - strip.clientWidth;
    await settle();
    const end = inspect();
    strip.style.scrollBehavior = "";
    return { start, end };
  })()`);
  const edgeCards = [...edgeTreatment.start, ...edgeTreatment.end];
  t.check("桌面兩端都有可見的邊界卡片", edgeCards.length >= 2, JSON.stringify(edgeTreatment));
  t.check("桌面邊界卡片不保留截斷的陰影線",
    edgeCards.length >= 2 && edgeCards.every((card) => card.edgeMuted && card.shadow === "none"),
    JSON.stringify(edgeTreatment));

  // hover 應套用滑鼠追蹤光暈與 3D 傾斜
  await b.hover(".country-card-japan");
  const hovered = await b.eval(`(() => {
    const c = document.querySelector(".country-card-japan");
    const read = (n) => c.style.getPropertyValue(n);
    return { active: c.classList.contains("is-pointer-active"),
             glowX: read("--card-pointer-x"), tiltX: read("--card-tilt-x"),
             shadowX: read("--card-shadow-x") };
  })()`);
  t.check("hover 卡片會標記 is-pointer-active", hovered.active);
  t.check("hover 會設定滑鼠追蹤光暈座標", hovered.glowX !== "", hovered.glowX);
  t.check("hover 會設定 3D 傾斜角度", hovered.tiltX !== "", hovered.tiltX);
  t.check("hover 會設定陰影位移", hovered.shadowX !== "", hovered.shadowX);

  // 移到另一張卡，前一張必須立即恢復
  await b.hover(".country-card-korea");
  const switched = await b.eval(`(() => ({
    japan: document.querySelector(".country-card-japan").classList.contains("is-pointer-active"),
    korea: document.querySelector(".country-card-korea").classList.contains("is-pointer-active")
  }))()`);
  t.check("移到相鄰卡片時前一張立即恢復", !switched.japan && switched.korea,
    `japan=${switched.japan} korea=${switched.korea}`);

  // 離開卡片列，所有卡片恢復
  await b.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5, button: "none" });
  await b.eval(`document.querySelector(".country-strip").dispatchEvent(new PointerEvent("pointerleave", { bubbles: false }))`);
  await sleep(200);
  t.check("離開卡片列後全部恢復",
    await b.eval(`document.querySelectorAll(".country-card.is-pointer-active").length === 0`));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const cardsMobile = suite("首頁 · 國家卡片（手機版）", async (b, t) => {
  await b.mobile();
  await b.goto("/index.html", { settle: 1200 });

  const res = await b.eval(`(() => {
    const strip = document.querySelector(".country-strip");
    return {
      stripScrollable: strip.scrollWidth > strip.clientWidth,
      pageScrollsSideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      scrollbarHidden: getComputedStyle(strip).scrollbarWidth === "none",
      snap: getComputedStyle(strip).scrollSnapType
    };
  })()`);
  t.check("手機版卡片列可水平滑動", res.stripScrollable);
  t.check("手機版頁面本身不水平捲動", !res.pageScrollsSideways);
  t.check("卡片列使用水平吸附", res.snap.includes("x"), res.snap);
  t.check("手機版不套用桌面端點陰影處理", await b.eval(
    `!document.querySelector(".country-card.is-edge-shadowless")`));

  const swipeFocus = await b.eval(`(async () => {
    const strip = document.querySelector(".country-strip");
    const cards = [...document.querySelectorAll(".country-card")];
    const targetIndex = 4;
    const target = cards[targetIndex];
    strip.style.scrollBehavior = "auto";
    strip.scrollLeft = target.offsetLeft + target.offsetWidth / 2 - strip.clientWidth / 2;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    strip.style.scrollBehavior = "";
    const focusedIndex = cards.findIndex((card) => card.classList.contains("is-mobile-focused"));
    const push = (index) => parseFloat(getComputedStyle(cards[index]).getPropertyValue("--card-push")) || 0;
    return {
      focusedIndex,
      before: push(targetIndex - 1), after: push(targetIndex + 1),
      outerBefore: push(targetIndex - 2), outerAfter: push(targetIndex + 2)
    };
  })()`);
  t.check("滑動後會將目前卡片設為手機焦點", swipeFocus.focusedIndex === 4,
    JSON.stringify(swipeFocus));
  t.check("手機焦點會向左右推開相鄰卡片", swipeFocus.before < 0 && swipeFocus.after > 0,
    JSON.stringify(swipeFocus));
  t.check("切換焦點時只移動直接相鄰卡片，避免整列左右拉扯",
    swipeFocus.outerBefore === 0 && swipeFocus.outerAfter === 0,
    JSON.stringify(swipeFocus));

  await b.goto("/index.html", { settle: 900 });
  await b.eval(`window.mobileJapanFirstTap = null;
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".country-card-japan")) return;
      window.mobileJapanFirstTap = { prevented: event.defaultPrevented };
      event.preventDefault();
    }, { once: true });`);
  await b.tap(".country-card-japan");
  const japanFirstTap = await b.eval(`(() => {
    const tap = window.mobileJapanFirstTap || { prevented: false };
    const strip = document.querySelector(".country-strip").getBoundingClientRect();
    const card = document.querySelector(".country-card-japan").getBoundingClientRect();
    const more = document.querySelector(".country-card-more");
    const windowRect = document.querySelector(".country-meta-window").getBoundingClientRect();
    const arrowRect = document.querySelector(".country-meta-arrow").getBoundingClientRect();
    const moreRect = more?.getBoundingClientRect();
    return {
      ...tap,
      activated: document.querySelector(".country-card-japan").classList.contains("is-mobile-activated"),
      moreOpacity: more ? Number(getComputedStyle(more).opacity) : 0,
      centered: Math.abs((card.left + card.right) / 2 - (strip.left + strip.right) / 2) < 8,
      arrowOnNextLine: arrowRect.top >= windowRect.bottom - 1,
      moreExpandsBeforeArrow: !!moreRect && moreRect.left < arrowRect.left && moreRect.right <= arrowRect.left + 1,
      actionGap: moreRect ? arrowRect.left - moreRect.right : Infinity
    };
  })()`);
  t.check("第一次點擊日本卡不會立即導頁", japanFirstTap.prevented, JSON.stringify(japanFirstTap));
  t.check("第一次點擊日本卡會置中並露出查看更多", japanFirstTap.activated && japanFirstTap.moreOpacity > .9 && japanFirstTap.centered,
    JSON.stringify(japanFirstTap));
  t.check("查看更多會在第二行從箭頭左側展開", japanFirstTap.arrowOnNextLine && japanFirstTap.moreExpandsBeforeArrow,
    JSON.stringify(japanFirstTap));
  t.check("查看更多與箭頭保持緊密間距", japanFirstTap.actionGap <= 8,
    JSON.stringify(japanFirstTap));

  await b.tap(".section-heading");
  const outsideTap = await b.eval(`(() => ({
    focused: document.querySelectorAll(".country-card.is-mobile-focused").length,
    activated: document.querySelectorAll(".country-card.is-mobile-activated").length,
    moreOpacity: Number(getComputedStyle(document.querySelector(".country-card-more")).opacity)
  }))()`);
  t.check("點擊卡片列外會收起手機焦點狀態",
    outsideTap.focused === 0 && outsideTap.activated === 0 && outsideTap.moreOpacity === 0,
    JSON.stringify(outsideTap));

  await b.goto("/index.html", { settle: 900 });
  await b.tap(".country-card-japan");
  await b.tap(".country-card-japan");
  t.check("第二次點擊已展開的日本卡才進入國家頁", await b.eval(
    `window.location.pathname === "/countries/japan/index.html"`));

  await b.goto("/index.html", { settle: 900 });
  await b.tap(".country-card-korea");
  const comingSoonTap = await b.eval(`(() => {
    const strip = document.querySelector(".country-strip").getBoundingClientRect();
    const card = document.querySelector(".country-card-korea").getBoundingClientRect();
    return {
      path: window.location.pathname,
      focused: document.querySelector(".country-card-korea").classList.contains("is-mobile-focused"),
      centered: Math.abs((card.left + card.right) / 2 - (strip.left + strip.right) / 2) < 8
    };
  })()`);
  t.check("Coming soon 卡片點擊後置中但不導頁",
    comingSoonTap.path === "/index.html" && comingSoonTap.focused && comingSoonTap.centered,
    JSON.stringify(comingSoonTap));
  t.check("手機版無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
