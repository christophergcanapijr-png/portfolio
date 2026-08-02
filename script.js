(() => {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sticky nav background + scroll-to-top button
  const toTop = document.getElementById('toTop');
  const onScroll = () => {
    const y = window.scrollY;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    document.documentElement.style.setProperty('--scroll-progress', scrollable > 0 ? Math.min(y / scrollable, 1) : 0);
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

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.focus();
    }
  });

  // Keep the navigation synced with the section currently in view.
  const sectionLinks = new Map(
    Array.from(navLinks.querySelectorAll('a[href^="#"]')).map((link) => [link.getAttribute('href').slice(1), link])
  );
  const pageSections = Array.from(sectionLinks.keys()).map((id) => document.getElementById(id)).filter(Boolean);
  if ('IntersectionObserver' in window && pageSections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      sectionLinks.forEach((link, id) => {
        const active = id === visible.target.id;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-25% 0px -58% 0px', threshold: [0, .1, .35] });
    pageSections.forEach((section) => sectionObserver.observe(section));
  }

  // Pointer light and subtle 3D depth for fine-pointer devices.
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (supportsHover && !reduceMotion) {
    let pointerFrame = 0;
    window.addEventListener('pointermove', (event) => {
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--pointer-x', `${event.clientX}px`);
        document.documentElement.style.setProperty('--pointer-y', `${event.clientY}px`);
      });
    }, { passive: true });

    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const strength = Number(card.dataset.tiltStrength || 4);
        card.style.setProperty('--rx', `${(.5 - y) * strength}deg`);
        card.style.setProperty('--ry', `${(x - .5) * strength}deg`);
        card.style.setProperty('--card-x', `${x * 100}%`);
        card.style.setProperty('--card-y', `${y * 100}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--card-x', '50%');
        card.style.setProperty('--card-y', '50%');
      });
    });
  }

  // Reveal-on-scroll
  const revealEls = document.querySelectorAll('.reveal');
  document.querySelectorAll('.about__stats,.skills__grid,.projects__grid,.contact__links').forEach((group) => {
    Array.from(group.children).forEach((item, index) => item.style.setProperty('--reveal-delay', `${Math.min(index * 70, 210)}ms`));
  });
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
    el.textContent = '0';
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

  // Portfolio-only AI assistant
  const aiChat = document.querySelector('[data-ai-chat]');
  if (aiChat) {
    const aiEndpoint = document.querySelector('meta[name="portfolio-ai-endpoint"]')?.content?.trim();
    const aiToggle = document.querySelector('[data-ai-toggle]');
    const aiClose = aiChat.querySelector('[data-ai-close]');
    const aiForm = aiChat.querySelector('[data-ai-form]');
    const aiInput = aiChat.querySelector('[data-ai-input]');
    const aiMessages = aiChat.querySelector('[data-ai-messages]');
    const aiNote = aiChat.querySelector('[data-ai-note]');
    const aiSend = aiForm.querySelector('button[type="submit"]');
    let aiBusy = false;

    const setAssistantOpen = (open) => {
      aiChat.hidden = !open;
      aiToggle.setAttribute('aria-expanded', String(open));
      aiToggle.setAttribute('aria-label', open ? 'Close AI chat' : 'Open AI chat');
      if (open) window.setTimeout(() => aiInput.focus(), 0);
    };

    aiToggle.addEventListener('click', () => setAssistantOpen(aiChat.hidden));
    aiClose.addEventListener('click', () => {
      setAssistantOpen(false);
      aiToggle.focus();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !aiChat.hidden) {
        setAssistantOpen(false);
        aiToggle.focus();
      }
    });

    const appendMessage = (text, role) => {
      const message = document.createElement('div');
      message.className = `assistant-message assistant-message--${role}`;
      message.textContent = text;
      aiMessages.append(message);
      aiMessages.scrollTop = aiMessages.scrollHeight;
      return message;
    };

    const askAssistant = async (question) => {
      const cleaned = question.trim().slice(0, 400);
      if (!cleaned || aiBusy) return;
      appendMessage(cleaned, 'user');
      aiInput.value = '';

      if (!aiEndpoint) {
        appendMessage('My portfolio AI is being connected. Please try again soon or contact me directly.', 'bot');
        return;
      }

      aiBusy = true;
      aiInput.disabled = true;
      aiSend.disabled = true;
      const typing = document.createElement('div');
      typing.className = 'assistant-message assistant-message--bot assistant-message--typing';
      typing.setAttribute('aria-label', 'Assistant is typing');
      typing.innerHTML = '<span></span><span></span><span></span>';
      aiMessages.append(typing);
      aiMessages.scrollTop = aiMessages.scrollHeight;

      try {
        const response = await fetch(aiEndpoint, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({message: cleaned}),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'The assistant is unavailable right now.');
        typing.remove();
        appendMessage(payload.answer || 'I could not answer that from my portfolio.', 'bot');
      } catch (error) {
        typing.remove();
        appendMessage(error.message || 'The assistant is unavailable right now.', 'bot');
      } finally {
        aiBusy = false;
        aiInput.disabled = false;
        aiSend.disabled = false;
        if (!aiChat.hidden) aiInput.focus();
      }
    };

    aiForm.addEventListener('submit', (event) => {
      event.preventDefault();
      askAssistant(aiInput.value);
    });

    document.querySelectorAll('[data-ai-question]').forEach((button) => {
      button.addEventListener('click', () => askAssistant(button.dataset.aiQuestion || ''));
    });

    if (!aiEndpoint) aiNote.textContent = 'The secure AI connection is not published yet.';
  }

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
  if (typed && !reduceMotion) {
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
  if (canvas && !reduceMotion) {
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
