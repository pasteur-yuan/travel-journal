const regionNav = document.querySelector('.region-section-nav');

document.querySelectorAll('.region-facts-wide').forEach((facts) => {
  const section = facts.closest('.region-section');
  const heading = section?.querySelector('h2');
  if (heading) heading.textContent = '住宿';
  const eyebrow = section?.querySelector('.eyebrow');
  if (eyebrow) eyebrow.textContent = 'STAY';
  if (section) section.classList.add('region-stays-section');
  const accommodation = facts.querySelector('div');
  if (!accommodation) return;
  const item = document.createElement('article');
  item.innerHTML = accommodation.innerHTML;
  facts.classList.remove('region-facts', 'region-facts-wide');
  facts.classList.add('region-content-list');
  facts.replaceChildren(item);
});

document.querySelectorAll('.region-card-grid .region-content-card, .region-content-list article, .region-note').forEach((item) => {
  let glowFrame = 0;
  let pendingPointer = null;
  const trackGlow = (event) => {
    pendingPointer = event;
    if (glowFrame) return;
    glowFrame = window.requestAnimationFrame(() => {
      const rect = item.getBoundingClientRect();
      item.style.setProperty('--pointer-x', `${pendingPointer.clientX - rect.left}px`);
      item.style.setProperty('--pointer-y', `${pendingPointer.clientY - rect.top}px`);
      glowFrame = 0;
    });
    item.classList.add('is-pointer-active');
  };
  item.addEventListener('pointerenter', trackGlow);
  item.addEventListener('pointermove', trackGlow);
  item.addEventListener('pointerleave', () => item.classList.remove('is-pointer-active'));
  item.addEventListener('focusin', () => item.classList.add('is-pointer-active'));
  item.addEventListener('focusout', () => {
    if (!item.matches(':hover')) item.classList.remove('is-pointer-active');
  });
});

if (document.querySelector('.region-hero-hokkaido')) {
  const spotsList = document.querySelector('#spots .region-card-grid');
  if (spotsList && spotsList.children.length < 3) {
    const sapporo = document.createElement('article');
    sapporo.className = 'region-content-card';
    sapporo.innerHTML = '<span>札幌</span><h3>城市街景與咖啡</h3><p>從大通公園、街角咖啡到夜晚的城市燈光，感受北海道首府輕鬆而開闊的日常節奏。</p>';
    spotsList.append(sapporo);
  }
  const hokkaidoSpots = document.querySelectorAll('#spots .region-content-card');
  const spotContent = [
    ['小樽', '港町散步與冬日風景', '沿著運河、倉庫街與海岸慢慢散步，感受小樽安靜而帶有懷舊感的城市氣氛。'],
    ['定山溪', '溫泉山谷與雪景', '在山谷、溪流與溫泉之間放慢腳步，記錄北海道冬季自然景色最安靜的一面。']
  ];
  hokkaidoSpots.forEach((spot, index) => {
    const content = spotContent[index];
    if (!content) return;
    const label = spot.querySelector('span');
    const title = spot.querySelector('h3');
    const description = spot.querySelector('p');
    if (label) label.textContent = content[0];
    if (title) title.textContent = content[1];
    if (description) description.textContent = content[2];
  });
  if (spotsList) {
    let glowFrame = 0;
    let pendingSpot = null;
    spotsList.addEventListener('pointermove', (event) => {
      const spot = event.target.closest('.region-content-card');
      if (!spot) return;
      pendingSpot = { spot, event };
      if (glowFrame) return;
      glowFrame = window.requestAnimationFrame(() => {
        const rect = pendingSpot.spot.getBoundingClientRect();
        pendingSpot.spot.style.setProperty('--pointer-x', `${pendingSpot.event.clientX - rect.left}px`);
        pendingSpot.spot.style.setProperty('--pointer-y', `${pendingSpot.event.clientY - rect.top}px`);
        pendingSpot.spot.classList.add('is-pointer-active');
        glowFrame = 0;
      });
    });
    spotsList.addEventListener('pointerleave', () => {
      spotsList.querySelectorAll('.is-pointer-active').forEach((spot) => spot.classList.remove('is-pointer-active'));
    });
  }
}

document.querySelectorAll('.region-facts:not(.region-facts-wide)').forEach((facts) => {
  let glowFrame = 0;
  let pendingPointer = null;
  const updateGlass = (event) => {
    pendingPointer = event;
    if (glowFrame) return;
    glowFrame = window.requestAnimationFrame(() => {
      const rect = facts.getBoundingClientRect();
      facts.style.setProperty('--pointer-x', `${pendingPointer.clientX - rect.left}px`);
      facts.style.setProperty('--pointer-y', `${pendingPointer.clientY - rect.top}px`);
      glowFrame = 0;
    });
    facts.classList.add('is-pointer-active');
  };
  facts.addEventListener('pointerenter', updateGlass);
  facts.addEventListener('pointermove', updateGlass);
  facts.addEventListener('pointerleave', () => facts.classList.remove('is-pointer-active'));
  facts.addEventListener('focusin', () => facts.classList.add('is-pointer-active'));
  facts.addEventListener('focusout', () => {
    if (!facts.matches(':hover')) facts.classList.remove('is-pointer-active');
  });
});

if (regionNav) {
  const links = [...regionNav.querySelectorAll('a')];
  const glassIndicator = document.createElement('span');
  glassIndicator.className = 'region-nav-glass-indicator';
  glassIndicator.setAttribute('aria-hidden', 'true');
  regionNav.append(glassIndicator);
  const moveIndicator = (link, pointerEvent = null) => {
    const navRect = regionNav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const glowSize = 192;
    const pointerX = pointerEvent ? pointerEvent.clientX : linkRect.left + linkRect.width / 2;
    const pointerY = pointerEvent ? pointerEvent.clientY : linkRect.top + linkRect.height / 2;
    const x = Math.max(linkRect.left, Math.min(pointerX, linkRect.right)) - navRect.left + regionNav.scrollLeft - glowSize / 2;
    const y = Math.max(linkRect.top, Math.min(pointerY, linkRect.bottom)) - navRect.top - glowSize / 2;
    glassIndicator.style.transform = `translate(${x}px, ${y}px)`;
    glassIndicator.classList.add('is-visible');
  };
  const trackPointer = (link, event) => {
    const rect = link.getBoundingClientRect();
    link.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
    link.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
    moveIndicator(link, event);
  };
  links.forEach((link) => {
    link.addEventListener('pointerenter', (event) => trackPointer(link, event));
    link.addEventListener('pointermove', (event) => trackPointer(link, event));
    link.addEventListener('focus', () => moveIndicator(link));
  });
  regionNav.addEventListener('pointermove', (event) => {
    const link = document.elementFromPoint(event.clientX, event.clientY)?.closest('a');
    if (link && links.includes(link)) trackPointer(link, event);
  });
  regionNav.addEventListener('pointerleave', () => glassIndicator.classList.remove('is-visible'));
  const sections = links.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  let isProgrammaticScroll = false;
  const setActive = (section) => links.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${section.id}`));
  const observer = new IntersectionObserver((entries) => {
    if (isProgrammaticScroll) return;
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActive(visible.target);
  }, { rootMargin: '-20% 0px -65% 0px', threshold: [0, .2, .6] });
  sections.forEach((section) => observer.observe(section));
  links.forEach((link) => link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    isProgrammaticScroll = true;
    setActive(target);

    const header = document.querySelector('.site-header');
    const offset = (header?.getBoundingClientRect().height || 0) + regionNav.getBoundingClientRect().height + 18;
    const start = window.scrollY;
    const end = Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset);
    const distance = Math.abs(end - start);
    const duration = Math.min(3200, Math.max(1400, distance * 1.35));
    const startTime = performance.now();
    // 前段快速移動，接近目標時逐漸減速，製造自然的煞車感。
    const ease = (progress) => 1 - ((1 - progress) ** 20);
    const scroll = (time) => {
      const progress = Math.min(1, (time - startTime) / duration);
      window.scrollTo(0, start + (end - start) * ease(progress));
      if (progress < 1) window.requestAnimationFrame(scroll);
      else {
        isProgrammaticScroll = false;
        setActive(target);
        history.replaceState(null, '', link.getAttribute('href'));
      }
    };
    window.requestAnimationFrame(scroll);
  }));
}
