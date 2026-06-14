(() => {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  // Sticky nav background + scroll-to-top button
  const toTop = document.getElementById('toTop');
  const onScroll = () => {
    const y = window.scrollY;
    if (y > 30) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
    if (toTop) {
      if (y > 400) toTop.classList.add('show');
      else toTop.classList.remove('show');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Mobile menu toggle
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });

  // Close mobile menu on link click
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Reveal-on-scroll
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // small stagger when several reveal at once
          setTimeout(() => entry.target.classList.add('in'), i * 60);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // Animated counters for stats
  const counters = document.querySelectorAll('.stat__num');
  const animateCount = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    if (!target) return;
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * target).toLocaleString() + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString() + suffix;
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const countObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => countObs.observe(c));
  } else {
    counters.forEach(animateCount);
  }

  // Current year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Lightbox for project screenshots
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbCaption = document.getElementById('lightboxCaption');
  const lbClose = document.getElementById('lightboxClose');
  const lbPrev = document.getElementById('lightboxPrev');
  const lbNext = document.getElementById('lightboxNext');
  let lbSet = [];
  let lbIdx = 0;

  const renderLb = () => {
    const img = lbSet[lbIdx];
    if (!img) return;
    lbImg.src = img.src;
    lbImg.alt = img.alt || '';
    lbCaption.textContent = img.alt || '';
  };
  const openLb = (set, idx) => {
    lbSet = set; lbIdx = idx;
    lb.hidden = false;
    // next frame so transition runs
    requestAnimationFrame(() => {
      lb.classList.add('open');
      document.body.classList.add('lightbox-open');
    });
    renderLb();
    const multi = lbSet.length > 1;
    lbPrev.style.display = multi ? '' : 'none';
    lbNext.style.display = multi ? '' : 'none';
  };
  const closeLb = () => {
    lb.classList.remove('open');
    document.body.classList.remove('lightbox-open');
    setTimeout(() => { lb.hidden = true; lbImg.src = ''; }, 350);
  };
  const step = (dir) => {
    if (!lbSet.length) return;
    lbIdx = (lbIdx + dir + lbSet.length) % lbSet.length;
    renderLb();
  };

  // Wire up: each gallery's images form one set
  document.querySelectorAll('[data-gallery]').forEach((gal) => {
    const imgs = Array.from(gal.querySelectorAll('.gallery__img'));
    imgs.forEach((img, i) => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        openLb(imgs, i);
      });
    });
  });

  lbClose.addEventListener('click', closeLb);
  lbPrev.addEventListener('click', () => step(-1));
  lbNext.addEventListener('click', () => step(1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  // Image carousel(s) for project covers
  document.querySelectorAll('[data-gallery]').forEach((gal) => {
    const imgs = gal.querySelectorAll('.gallery__img');
    const dots = gal.querySelectorAll('.gallery__dot');
    if (imgs.length < 2) return;
    let idx = 0, timer;

    const show = (n) => {
      idx = (n + imgs.length) % imgs.length;
      imgs.forEach((el, i) => el.classList.toggle('is-active', i === idx));
      dots.forEach((el, i) => el.classList.toggle('is-active', i === idx));
    };
    const start = () => { timer = setInterval(() => show(idx + 1), 3500); };
    const stop = () => clearInterval(timer);

    dots.forEach((d, i) => d.addEventListener('click', () => { show(i); stop(); start(); }));
    gal.addEventListener('mouseenter', stop);
    gal.addEventListener('mouseleave', start);
    start();
  });

  // Typing animation on hero subtitle
  const typed = document.getElementById('typed');
  const caret = document.querySelector('.caret');
  if (typed && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const text = typed.dataset.text || '';
    let i = 0;
    const tick = () => {
      typed.textContent = text.slice(0, i);
      if (i < text.length) {
        i++;
        setTimeout(tick, 65);
      } else if (caret) {
        // stop blinking after a moment
        setTimeout(() => caret.style.animation = 'none', 1800);
      }
    };
    setTimeout(tick, 600);
  } else if (typed) {
    typed.textContent = typed.dataset.text || '';
  }

  // Particle background in hero
  const canvas = document.getElementById('particles');
  if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(80, Math.floor((w * h) / 14000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.6,
        a: Math.random() * 0.5 + 0.2,
        hue: Math.random() < 0.5 ? '99,102,241' : '139,92,246',
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // links between near particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.hypot(dx, dy);
          if (d < 120) {
            ctx.strokeStyle = `rgba(139,92,246,${0.12 * (1 - d / 120)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      // dots
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.fillStyle = `rgba(${p.hue},${p.a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();
  }
})();
