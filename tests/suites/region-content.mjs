import { sleep, suite } from "../harness.mjs";

export { REGIONS } from "../regions.mjs";
import { REGIONS } from "../regions.mjs";
const SECTIONS = ["overview", "spots", "food", "stays", "notes"];
const page = (r) => `/countries/japan/${r}/index.html`;

export const structure = suite("地區頁 · 結構與資料注入", async (b, t) => {
  await b.desktop();

  for (const region of REGIONS) {
    await b.goto(page(region), { settle: 1000 });
    const info = await b.eval(`(() => {
      const counts = {};
      ${JSON.stringify(SECTIONS)}.forEach(id => {
        const el = document.querySelector("#" + id);
        counts[id] = el ? el.querySelectorAll(
          ".region-content-card, .region-content-list article, .region-note").length : -1;
      });
      const staySection = document.querySelector("#stays");
      return {
        counts,
        sections: ${JSON.stringify(SECTIONS)}.map(id => !!document.querySelector("#" + id)),
        eyebrow: document.querySelector(".region-hero .eyebrow")?.textContent,
        stayHeading: staySection?.querySelector("h2")?.textContent,
        stayEyebrow: staySection?.querySelector(".eyebrow")?.textContent,
        stayIsList: !!staySection?.querySelector(".region-content-list"),
        leftoverFacts: !!staySection?.querySelector(".region-facts-wide"),
        navLinks: [...document.querySelectorAll(".region-section-nav a")].map(a => a.getAttribute("href"))
      };
    })()`);

    t.check(`${region}：五個章節都存在`, info.sections.every(Boolean), JSON.stringify(info.sections));
    t.check(`${region}：分類導覽指向五個章節`,
      JSON.stringify(info.navLinks) === JSON.stringify(SECTIONS.map((s) => `#${s}`)),
      JSON.stringify(info.navLinks));
    t.check(`${region}：Hero 顯示英文地區名`,
      /^[A-Z-]+$/.test(info.eyebrow || ""), info.eyebrow);
    t.check(`${region}：住宿章節已轉為 STAY／住宿`,
      info.stayHeading === "住宿" && info.stayEyebrow === "STAY",
      `${info.stayEyebrow} / ${info.stayHeading}`);
    t.check(`${region}：住宿已轉成條列結構`,
      info.stayIsList && !info.leftoverFacts,
      `list=${info.stayIsList} 殘留 facts=${info.leftoverFacts}`);
    t.check(`${region}：景點／美食／住宿都有內容`,
      info.counts.spots > 0 && info.counts.food > 0 && info.counts.stays > 0,
      JSON.stringify(info.counts));
    t.check(`${region}：無 JS 例外`, b.errors.length === 0, b.errors.join(" | ") || "none");
  }
});

export const glow = suite("地區頁 · 滑鼠追蹤光暈與 focus", async (b, t) => {
  await b.desktop();
  await b.goto(page("tokyo"), { settle: 1200 });

  const target = "#spots .region-content-card";
  await b.hover(target);
  const hovered = await b.eval(`(() => {
    const item = document.querySelector('${target}');
    return { active: item.classList.contains("is-pointer-active"),
             x: item.style.getPropertyValue("--pointer-x"),
             y: item.style.getPropertyValue("--pointer-y") };
  })()`);
  t.check("hover 內容項目會標記 is-pointer-active", hovered.active);
  t.check("hover 會設定光暈座標", hovered.x !== "" && hovered.y !== "", JSON.stringify(hovered));

  // 鍵盤 focus 也要有光暈（觸控裝置的替代路徑）
  const focused = await b.eval(`(() => {
    const item = document.querySelector('#food .region-content-list article');
    item.focus();
    return item.classList.contains("is-pointer-active");
  })()`);
  t.check("鍵盤 focus 也會套用光暈", focused);

  // 動態新增的項目要透過事件代理自動取得光暈。
  // 這裡必須用真實滑鼠事件：事件代理讀的是 event.target，
  // 若改用 document.dispatchEvent 模擬，target 會是 document 而測不出真實行為。
  await b.eval(`(() => {
    const el = document.createElement("article");
    el.id = "dynamic-item";
    el.innerHTML = '<span>測試</span><div><h3>動態項目</h3><p>測試</p></div>';
    document.querySelector("#food .region-content-list").append(el);
  })()`);
  await b.hover("#dynamic-item");
  const dynamic = await b.eval(`(() => {
    const el = document.querySelector("#dynamic-item");
    return { active: el.classList.contains("is-pointer-active"),
             x: el.style.getPropertyValue("--pointer-x") };
  })()`);
  t.check("動態新增的項目自動取得光暈（事件代理）",
    dynamic.active && dynamic.x !== "", JSON.stringify(dynamic));

  // 滑鼠移開後光暈要解除
  await b.moveAway();
  t.check("滑鼠移開後光暈解除",
    await b.eval(`!document.querySelector("#dynamic-item").classList.contains("is-pointer-active")`));

  // 摘要面板也有自己的光暈
  await b.hover("#overview .region-facts");
  const facts = await b.eval(`(() => {
    const el = document.querySelector("#overview .region-facts");
    return { active: el.classList.contains("is-pointer-active"), x: el.style.getPropertyValue("--pointer-x") };
  })()`);
  t.check("摘要資訊面板有滑鼠追蹤光斑", facts.active && facts.x !== "", JSON.stringify(facts));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const nav = suite("地區頁 · 分類導覽", async (b, t) => {
  await b.desktop();
  await b.goto(page("tokyo"), { settle: 1200 });

  t.check("導覽列具備光暈指示器",
    await b.eval(`!!document.querySelector(".region-nav-glass-indicator")`));

  const before = await b.eval("Math.round(window.scrollY)");
  await b.click('.region-section-nav a[href="#food"]');
  // 捲動時長依距離而定（最長 3.2 秒），內容變多時固定 sleep 會提早判斷。
  // 也不能等「捲動位置不再變化」：easing 是 1-(1-p)^20，約七成進度就已視覺靜止，
  // 但收尾的 setActive 與 replaceState 要到動畫真正結束才執行。
  await b.eval(`new Promise((resolve) => {
    const deadline = performance.now() + 4000;
    const tick = () => {
      if (location.hash === "#food" || performance.now() > deadline) resolve(location.hash);
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })`);
  const after = await b.eval(`(() => {
    const nav = document.querySelector(".region-section-nav");
    const header = document.querySelector(".site-header");
    const target = document.querySelector("#food");
    return {
      scrollY: Math.round(window.scrollY),
      targetTop: Math.round(target.getBoundingClientRect().top),
      obstruction: Math.round(header.getBoundingClientRect().height + nav.getBoundingClientRect().height),
      active: [...document.querySelectorAll(".region-section-nav a.is-active")].map(a => a.getAttribute("href")),
      hash: location.hash
    };
  })()`);

  t.check("點分類會捲動到該章節", after.scrollY > before, `${before} → ${after.scrollY}`);
  t.check("章節標題不被 header 與導覽列遮住",
    after.targetTop >= after.obstruction - 8,
    `章節頂端 ${after.targetTop}px，遮蔽高度 ${after.obstruction}px`);
  t.check("目前分類會標記 is-active", after.active.join() === "#food", after.active.join());
  t.check("捲動完成後更新網址 hash", after.hash === "#food", after.hash);

  // 頁面只能有一個垂直捲動容器
  const scrollers = await b.eval(`(() => {
    const all = [...document.querySelectorAll(".region-detail, .region-sections, .region-section")];
    return all.filter(el => el.scrollHeight > el.clientHeight + 1 &&
      ["auto", "scroll"].includes(getComputedStyle(el).overflowY)).length;
  })()`);
  t.check("內容區沒有形成第二個垂直捲動容器", scrollers === 0, `${scrollers} 個`);

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
