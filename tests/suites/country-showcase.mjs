import { sleep, suite } from "../harness.mjs";

const PAGE = "/countries/japan/index.html";

export const showcase = suite("國家頁 · 地區 showcase", async (b, t) => {
  await b.desktop();
  await b.goto(PAGE, { settle: 1200 });

  const shape = await b.eval(`(() => {
    const items = [...document.querySelectorAll(".region-showcase-item")];
    const list = document.querySelector(".region-showcase-list");
    return {
      count: items.length,
      allLinks: items.every(i => i.tagName === "A" && i.getAttribute("href")),
      allHaveImage: items.every(i => !!i.dataset.image),
      arrowsAsIcons: items.every(i => !!i.querySelector(".region-showcase-arrow i")),
      bound: items.every(i => i.dataset.showcaseBound === "true"),
      activeCount: items.filter(i => i.classList.contains("is-active")).length,
      listScrolls: list.scrollHeight > list.clientHeight + 1,
      pageScrolls: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1
    };
  })()`);

  t.check("地區項目由 HTML 列出", shape.count >= 2, `${shape.count} 個`);
  t.check("每個項目都是可聚焦的連結", shape.allLinks);
  t.check("每個項目都有背景圖資料", shape.allHaveImage);
  t.check("箭頭自動換成 Font Awesome 圖示", shape.arrowsAsIcons);
  t.check("所有項目都已綁定互動", shape.bound);
  t.check("同時只有一個項目是 active", shape.activeCount === 1, `${shape.activeCount} 個`);
  t.check("外層頁面不上下捲動（只有清單內部捲動）", !shape.pageScrolls,
    `頁面捲動=${shape.pageScrolls}、清單捲動=${shape.listScrolls}`);

  // hover 切換背景
  const second = ".region-showcase-item:nth-of-type(2)";
  await b.hover(second);
  const afterHover = await b.eval(`(() => {
    const item = document.querySelector('${second}');
    const backdrop = document.querySelector(".region-showcase-backdrop");
    return {
      active: item.classList.contains("is-active"),
      image: backdrop.style.getPropertyValue("--region-showcase-image"),
      expected: item.dataset.image,
      others: [...document.querySelectorAll(".region-showcase-item.is-active")].length
    };
  })()`);
  t.check("hover 項目會標記 is-active", afterHover.active);
  t.check("hover 項目會切換背景圖",
    afterHover.image.includes(afterHover.expected.split("/").pop()),
    `${afterHover.image} vs ${afterHover.expected}`);
  t.check("切換後仍只有一個 active", afterHover.others === 1, `${afterHover.others} 個`);

  // 滑鼠追蹤光暈
  const glow = await b.eval(`(() => {
    const item = document.querySelector('${second}');
    const r = item.getBoundingClientRect();
    document.querySelector(".region-showcase").dispatchEvent(new PointerEvent("pointermove", {
      clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true }));
    return new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() =>
      res({ x: item.style.getPropertyValue("--pointer-x"), y: item.style.getPropertyValue("--pointer-y") }))));
  })()`);
  t.check("項目套用滑鼠追蹤光暈座標", glow.x !== "" && glow.y !== "", JSON.stringify(glow));

  // 按壓回彈
  const press = await b.eval(`(() => {
    const item = document.querySelector('${second}');
    const r = item.getBoundingClientRect();
    item.dispatchEvent(new PointerEvent("pointerdown", {
      clientX: r.left + 20, clientY: r.top + 20, bubbles: true, pointerId: 1 }));
    const read = (n) => item.style.getPropertyValue(n);
    const result = { pressed: item.classList.contains("is-pressed"),
                     x: read("--press-x"), radius: read("--press-radius"), rotate: read("--press-rotate") };
    item.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
    return result;
  })()`);
  t.check("按壓會進入 is-pressed 狀態", press.pressed);
  t.check("按壓會產生隨機的液態變形參數",
    press.x !== "" && press.radius !== "" && press.rotate !== "", JSON.stringify(press));
  t.check("放開後解除按壓狀態",
    await b.eval(`!document.querySelector('${second}').classList.contains("is-pressed")`));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const showcaseDynamic = suite("國家頁 · 動態新增地區項目", async (b, t) => {
  await b.desktop();
  await b.goto(PAGE, { settle: 1200 });

  const added = await b.eval(`(async () => {
    const list = document.querySelector(".region-showcase-list");
    const el = document.createElement("a");
    el.className = "region-showcase-item";
    el.id = "dynamic-region";
    el.dataset.image = "../../assets/images/osaka.jpg";
    el.href = "osaka/index.html";
    el.innerHTML = '<span class="region-showcase-index">99</span>' +
      '<span><h3>動態地區</h3><p>測試</p></span>' +
      '<span class="region-showcase-arrow" aria-hidden="true">↗</span>';
    list.append(el);
    await new Promise(r => setTimeout(r, 400));
    return {
      bound: el.dataset.showcaseBound === "true",
      arrowIcon: !!el.querySelector(".region-showcase-arrow i")
    };
  })()`);

  t.check("MutationObserver 自動綁定新項目", added.bound);
  t.check("新項目自動取得箭頭圖示", added.arrowIcon);

  // 新項目也要能切換背景
  await b.hover("#dynamic-region");
  const active = await b.eval(`(() => ({
    active: document.querySelector("#dynamic-region").classList.contains("is-active"),
    image: document.querySelector(".region-showcase-backdrop").style.getPropertyValue("--region-showcase-image")
  }))()`);
  t.check("新項目 hover 可切換背景",
    active.active && active.image.includes("osaka"), JSON.stringify(active));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const showcaseMobile = suite("國家頁 · 手機版", async (b, t) => {
  await b.mobile();
  await b.goto(PAGE, { settle: 1200 });

  const res = await b.eval(`(() => {
    const list = document.querySelector(".region-showcase-list");
    return {
      listScrolls: list.scrollHeight > list.clientHeight + 1,
      pageScrollsSideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      descriptionsVisible: [...document.querySelectorAll(".region-showcase-item p")]
        .every(p => getComputedStyle(p).opacity === "1")
    };
  })()`);
  t.check("手機版地區清單仍維持內部捲動", res.listScrolls);
  t.check("手機版不產生水平捲動", !res.pageScrollsSideways);
  t.check("手機版地區描述直接可見", res.descriptionsVisible);
  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
