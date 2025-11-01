// script.js — Mobile nav, header shrink, GSAP reveals, matrix rain, smooth scroll
document.addEventListener('DOMContentLoaded', () => {
  /* ------------------ Elements ------------------ */
  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');
  const header = document.getElementById('siteHeader');
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  const internalLinks = Array.from(document.querySelectorAll('a[href^="#"]'));

  /* ------------------ Mobile menu toggle ------------------ */
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!expanded));
      mobileNav.classList.toggle('show');
    });

    // Close mobile nav when a link is clicked for UX
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('show');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ------------------ Header shrink on scroll (debounced) ------------------ */
  (function initHeaderScroll() {
    const SCROLL_THRESHOLD = 80;
    let ticking = false;

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY || window.pageYOffset;
          if (y > SCROLL_THRESHOLD) header.classList.add('header-scrolled');
          else header.classList.remove('header-scrolled');
          ticking = false;
        });
        ticking = true;
      }
    }

    document.addEventListener('scroll', onScroll, { passive: true });
    // run once to set initial state
    if ((window.scrollY || window.pageYOffset) > SCROLL_THRESHOLD) header.classList.add('header-scrolled');
  })();

  /* ------------------ Smooth scroll for internal links ------------------ */
  internalLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();

      // close mobile nav if open (mobile UX)
      if (mobileNav && mobileNav.classList.contains('show')) {
        mobileNav.classList.remove('show');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
      }

      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ------------------ GSAP reveal animations (if available) ------------------ */
  (function initGSAPReveal() {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      try {
        gsap.registerPlugin(ScrollTrigger);
        revealEls.forEach(el => {
          gsap.fromTo(el, { autoAlpha: 0, y: 20 }, {
            duration: 0.85,
            autoAlpha: 1,
            y: 0,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            }
          });
        });
      } catch (err) {
        // If GSAP fails, fallback to simple class reveal
        revealEls.forEach(el => el.classList.add('visible'));
        console.warn('GSAP init failed, falling back to CSS reveals.', err);
      }
    } else {
      // Fallback: use IntersectionObserver to add .visible class
      if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              obs.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12 });
        revealEls.forEach(el => obs.observe(el));
      } else {
        // last fallback
        revealEls.forEach(el => el.classList.add('visible'));
      }
    }
  })();

  /* ------------------ Matrix-style rain (canvas) ------------------ */
  (function matrixRain() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let width = 0, height = 0, columns = 0, drops = [], fontSize = 14;
    // Characters set (mix of katakana + alnum for matrix vibe)
    const chars = 'アカサタナハマヤラワガザダバパイキシチニヒミリ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(rect.width, window.innerWidth);
      height = Math.min(Math.max(rect.height, window.innerHeight * 0.45), 900); // cap height
      canvas.width = Math.floor(width * devicePixelRatio);
      canvas.height = Math.floor(height * devicePixelRatio);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      fontSize = Math.max(12, Math.min(20, Math.floor(width / 80)));
      ctx.font = `${fontSize}px monospace`;
      columns = Math.floor(width / fontSize);
      drops = new Array(columns).fill(0).map(() => Math.floor(Math.random() * height / fontSize));
    }

    function draw() {
      // translucent bg to create trailing effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, width, height);

      // bright neon for chars; render shadow for softer glow
      ctx.fillStyle = 'rgba(0,255,204,0.95)';

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        // reset drop randomly after it passes bottom
        if (y > height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }

      requestAnimationFrame(draw);
    }

    // initialize and handle resize (throttled)
    resize();
    let rTO;
    window.addEventListener('resize', () => {
      clearTimeout(rTO);
      rTO = setTimeout(resize, 120);
    });

    draw();
  })();

  /* ------------------ Accessibility: keyboard close for mobile nav ------------------ */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (mobileNav && mobileNav.classList.contains('show')) {
        mobileNav.classList.remove('show');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
      }
    }
  }, false);

  /* ------------------ End DOMContentLoaded ------------------ */
});