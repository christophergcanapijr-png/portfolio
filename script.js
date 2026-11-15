(() => {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileViewport = window.matchMedia('(max-width: 720px)').matches;

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
    const aiToggles = document.querySelectorAll('[data-ai-toggle]');
    const aiClose = aiChat.querySelector('[data-ai-close]');
    const aiForm = aiChat.querySelector('[data-ai-form]');
    const aiInput = aiChat.querySelector('[data-ai-input]');
    const aiMessages = aiChat.querySelector('[data-ai-messages]');
    const aiNote = aiChat.querySelector('[data-ai-note]');
    const aiSend = aiForm.querySelector('button[type="submit"]');
    let aiBusy = false;
    const fallbackIntro = 'The live AI service is offline, so I’m answering from the approved portfolio facts on this page.';

    const hasAny = (text, terms) => terms.some(term => text.includes(term));

    const getFallbackAnswer = (question) => {
      const text = question.toLowerCase().trim();

      // Greetings
      if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|yo)\b/i.test(text)) {
        return "Hello! I'm Christopher's AI Copilot. How can I assist you today? You can ask me to tell you about Christopher, his GoHighLevel builds, his autonomous AI video pipeline, his work automation tools, or how to get in touch with him!";
      }

      // Tell me about yourself / Bio / Who are you
      if (hasAny(text, ['yourself', 'about you', 'who are you', 'who is', 'introduce', 'bio', 'summary', 'background', 'profile'])) {
        return "I'm Christopher G. Canapi Jr., a Full-Stack Developer, GoHighLevel (GHL) Systems Architect, and Automation Specialist based in Tuguegarao City, Philippines.\n\nKey highlights:\n• Graduated in 2026 with a BS in Information Technology from the University of Cagayan Valley, serving as Lead Programmer for the CIT voting system capstone.\n• Completed a 486-hour government web developer internship with the Cagayan Museum.\n• Built an autonomous Faceless AI Video Generation Pipeline that renders 1080p videos with neural TTS at $0 API cost.\n• Built production e-commerce listing tools actively used by a Vinted.fr seller.\n• Deployed enterprise GoHighLevel systems with Conversation AI appointment setters and review gates.\n\nHe is available immediately for full-time remote roles or contract projects!";
      }

      // What do you do / What can you build / Services
      if (hasAny(text, ['what do you do', 'what can you do', 'services', 'what can you build', 'what do you build', 'what are your skills'])) {
        return "Christopher specializes in 3 core engineering domains:\n1. GoHighLevel (GHL) Systems: Custom funnels, Conversation AI appointment concierges, multi-stage sales pipelines, and smart 1–5★ review gates.\n2. Intelligent Automation: Headless browser scrapers (Playwright/Selenium), automated data extraction, and AI-driven workflows.\n3. Full-Stack Web Development: High-performance async APIs with Python (FastAPI), robust databases (PostgreSQL/SQLAlchemy), and modern interfaces with React & TypeScript.";
      }

      // Resume / CV
      if (hasAny(text, ['resume', 'cv', 'curriculum vitae'])) {
        return "You can request Christopher's official 1-page US-format resume directly via email at christophergcanapijr@gmail.com with the subject 'Resume Request', or reach out on LinkedIn (linkedin.com/in/christopher-canapi-jr-bb31ab415/).";
      }

      // Contact & Hire
      if (hasAny(text, ['contact', 'email', 'github', 'linkedin', 'reach', 'message', 'phone', 'call', 'talk'])) {
        return "You can reach Christopher directly at:\n• Email: christophergcanapijr@gmail.com\n• LinkedIn: linkedin.com/in/christopher-canapi-jr-bb31ab415/\n• GitHub: github.com/christophergcanapijr-png\n\nHe is based in the Philippines (GMT+8) with full flexibility to overlap with US, Australian, and European working hours.";
      }

      // Availability / Hiring / Rate / Salary
      if (hasAny(text, ['hire', 'available', 'availability', 'remote', 'relocate', 'freelance', 'full-time', 'rate', 'pricing', 'salary', 'cost'])) {
        return "Christopher is available immediately for full-time remote software engineering positions, contract roles, or freelance GoHighLevel and automation projects. He prefers remote work and is also open to relocation. Email him at christophergcanapijr@gmail.com to discuss requirements.";
      }

      // GoHighLevel (GHL)
      if (hasAny(text, ['ghl', 'gohighlevel', 'highlevel', 'prime realty', 'auraglow', 'medspa', 'real estate', 'funnel', 'crm', 'appointment', 'review gate', 'dbr'])) {
        return "Christopher has built two enterprise-grade GoHighLevel (GHL) systems:\n1. AuraGlow MedSpa: Custom 2-page dark/gold funnel, Live Chat Conversation AI concierge (Chloe) that qualifies leads and books appointments onto Google Calendar, missed-call text-back, database reactivation (DBR), and a 1–5 star review gate protecting Google Review reputation across 6 workflows.\n2. Prime Realty: Real estate brokerage platform with dynamic inquiry and viewing booking widgets, automated branded confirmation emails, a 5-stage sales pipeline, and 7+ workflows.";
      }

      // Faceless AI Video Pipeline / Media
      if (hasAny(text, ['video', 'faceless', 'youtube', 'ffmpeg', 'tts', 'caption', 'speech', 'reels', 'shorts', 'media', 'alcatraz', 'pyramids', 'pompeii', 'titanic'])) {
        return "Christopher engineered an autonomous Faceless AI Video Generation Pipeline using Python, FastAPI, Edge-TTS, and FFmpeg.\n\nIt takes any topic or custom script, generates neural voiceovers with word-level synced captions, retrieves matching archival photography via Wikimedia Commons and Openverse APIs, applies documentary color grading or cartoon cel-shading with OpenCV, and renders upload-ready 1080p MP4 videos with Ken Burns camera motion at $0 API cost.";
      }

      // Work Automation (SHEIN / Temu / Vinted)
      if (hasAny(text, ['automation', 'shein', 'temu', 'vinted', 'product listing', 'playwright', 'selenium', 'scraping', 'scraper'])) {
        return "His flagship production automation is a SHEIN and Temu product-listing platform built with Python, FastAPI, Playwright, Gemini API, and SQLite. Actively used by an e-commerce seller on Vinted.fr and Christopher, it extracts garment measurements, applies platform pricing rules, and generates bilingual English/French descriptions, reducing listing time from 3 minutes per item down to 15 seconds.";
      }

      // Full-Stack & Projects List
      if (hasAny(text, ['full-stack', 'full stack', 'projects', 'built', 'portfolio', 'applications', 'apps'])) {
        return "Christopher has 8 substantial production and client builds:\n1. AuraGlow MedSpa (GHL AI & Review Gate)\n2. Prime Realty (GHL Real Estate Funnel & CRM)\n3. Faceless AI Video Generation Pipeline (Python & FFmpeg)\n4. SHEIN & Temu Listing Automation (Vinted.fr)\n5. AI Job Aggregator (FastAPI, Selenium & React/TS)\n6. CIT Online Voting System (Lead Programmer Capstone)\n7. Cagayan Museum Official Website (486-hour Internship)\n8. Sales & Inventory Tracker (Used by 2 client businesses)";
      }

      // Education & University
      if (hasAny(text, ['education', 'college', 'degree', 'university', 'school', 'graduate', 'ucv'])) {
        return "Christopher graduated in 2026 with a Bachelor of Science in Information Technology (BSIT) from the University of Cagayan Valley, where he served as Lead Programmer on the college's capstone voting system.";
      }

      // Internship & Museum
      if (hasAny(text, ['intern', 'internship', 'museum', 'cagayan', 'government', 'wordpress'])) {
        return "From February 2026 to May 2026, Christopher completed a 486-hour Web Developer Internship with the Cagayan Museum, a provincial cultural institution. He built the museum's official WordPress digital portal with custom exhibition galleries and visitor schedules, and received official government certification upon deployment.";
      }

      // Tech Stack & Skills
      if (hasAny(text, ['skill', 'stack', 'technology', 'technologies', 'backend', 'frontend', 'api', 'database', 'python', 'fastapi', 'react', 'typescript'])) {
        return "Christopher's core tech stack includes:\n• CRM & Growth: GoHighLevel (GHL), Conversation AI, Review Gates, Workflow Automation\n• Backend & Automation: Python, FastAPI, Playwright, Selenium, Node.js, PHP\n• Databases: PostgreSQL, SQLite, MySQL, SQLAlchemy\n• Frontend: React, TypeScript, JavaScript (ES6+), HTML5/CSS3, Tailwind CSS\n• AI & Media: Gemini API, Edge-TTS, FFmpeg, OpenCV, Pillow";
      }

      // Why Hire Me
      if (hasAny(text, ['why hire', 'why should', 'why you', 'strength', 'candidate'])) {
        return "Why hire Christopher:\n1. Practical Problem Solver: He builds systems that eliminate actual business friction (like saving an e-commerce seller 10+ hours a week).\n2. Dual Skillset: Strong in both deep technical engineering (Python, Playwright, APIs) and revenue-driving marketing tech (GoHighLevel, AI booking bots).\n3. Proven Delivery: 6+ production builds, 486-hour government web dev internship, Lead Programmer graduate.\n4. Available immediately for full-time or contract roles!";
      }

      return "I can answer questions about Christopher's work, including:\n• His GoHighLevel builds (AuraGlow MedSpa, Prime Realty)\n• The autonomous Faceless AI Video Pipeline\n• His production e-commerce automation for Vinted.fr\n• Full-stack applications (AI Job Aggregator, CIT Voting System)\n• His 486-hour government internship or education\n• His availability and contact info\n\nWhat would you like to know?";
    };

    const setAssistantOpen = (open) => {
      aiChat.hidden = !open;
      aiChat.style.display = open ? 'flex' : 'none';
      aiToggles.forEach(toggle => {
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close AI chat' : 'Open AI chat');
      });
      if (open) window.setTimeout(() => aiInput.focus(), 0);
    };

    aiToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const isHidden = aiChat.hidden || aiChat.style.display === 'none';
        setAssistantOpen(isHidden);
      });
    });
    aiClose.addEventListener('click', (e) => {
      e.stopPropagation();
      setAssistantOpen(false);
      aiToggles[0]?.focus();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && (!aiChat.hidden && aiChat.style.display !== 'none')) {
        setAssistantOpen(false);
        aiToggles[0]?.focus();
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
        appendMessage(getFallbackAnswer(cleaned), 'bot');
        if (aiNote) aiNote.textContent = 'Live AI is not configured, so answers use approved portfolio facts from this page.';
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
        console.warn('Portfolio AI endpoint failed; using local fallback.', error);
        typing.remove();
        appendMessage(getFallbackAnswer(cleaned), 'bot');
        if (aiNote) aiNote.textContent = 'Live AI is temporarily offline, so answers use approved portfolio facts from this page.';
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

  // Category filter buttons on projects.html
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('[data-category]');
  if (filterBtns.length && projectCards.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-filter');
        filterBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
        projectCards.forEach((card) => {
          const cardCat = card.getAttribute('data-category');
          const show = cat === 'all' || cardCat.includes(cat);
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  // Quick inquiry mailto form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName')?.value || '';
      const email = document.getElementById('contactEmail')?.value || '';
      const subject = document.getElementById('contactSubject')?.value || 'Engineering & Automation Inquiry';
      const msg = document.getElementById('contactMessage')?.value || '';
      const body = encodeURIComponent(`Hi Christopher,\n\nName: ${name}\nEmail: ${email}\n\nProject Scope:\n${msg}`);
      window.location.href = `mailto:christophergcanapijr@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
    });
  }

  // Numbered project tab switcher
  document.querySelectorAll('[data-project-tabs]').forEach((wrap) => {
    const tabs = wrap.querySelectorAll('.project-tab');
    const panels = wrap.querySelectorAll('.project-panel');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-target');
        tabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', String(active));
        });
        panels.forEach((p) => {
          const match = p.getAttribute('data-panel') === target;
          p.classList.toggle('is-active', match);
          if (match) p.classList.add('is-visible');
        });
      });
    });
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
  if (typed && !reduceMotion && !mobileViewport) {
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
  if (canvas && !reduceMotion && !mobileViewport) {
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
        hue: Math.random() < 0.6 ? '56,189,248' : (Math.random() < 0.5 ? '99,102,241' : '168,85,247'),
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
            ctx.strokeStyle = `rgba(56,189,248,${0.09 * (1 - d / 120)})`;
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
