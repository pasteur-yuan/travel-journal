const regionNav = document.querySelector('.region-section-nav');

if (regionNav) {
  const links = [...regionNav.querySelectorAll('a')];
  const glassIndicator = document.createElement('span');
  glassIndicator.className = 'region-nav-glass-indicator';
  glassIndicator.setAttribute('aria-hidden', 'true');
  regionNav.append(glassIndicator);
  const moveIndicator = (link, pointerEvent = null) => {
    const navRect = regionNav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const width = Math.min(92, Math.max(58, linkRect.width * .72));
    const height = Math.min(54, Math.max(38, linkRect.height * 1.15));
    const pointerX = pointerEvent ? pointerEvent.clientX : linkRect.left + linkRect.width / 2;
    const pointerY = pointerEvent ? pointerEvent.clientY : linkRect.top + linkRect.height / 2;
    const x = Math.max(linkRect.left, Math.min(pointerX, linkRect.right)) - navRect.left + regionNav.scrollLeft - width / 2;
    const y = Math.max(linkRect.top, Math.min(pointerY, linkRect.bottom)) - navRect.top - height / 2;
    glassIndicator.style.width = `${width}px`;
    glassIndicator.style.height = `${height}px`;
    glassIndicator.style.transform = `translate(${x}px, ${y}px)`;
    glassIndicator.classList.add('is-visible');
  };
  links.forEach((link) => {
    const trackPointer = (event) => {
      const rect = link.getBoundingClientRect();
      link.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
      link.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
      moveIndicator(link, event);
    };
    link.addEventListener('pointerenter', trackPointer);
    link.addEventListener('pointermove', trackPointer);
    link.addEventListener('focus', () => moveIndicator(link));
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
