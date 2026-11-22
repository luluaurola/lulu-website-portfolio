/* ==========================================================================
   Zoom-Out Detection & Dynamic Adaptation
   Detects browser zoom-out (< 0.95, e.g. 80%, 67%, 50%, 33%).
   Applies 'is-zoomed-out' class to <html> so hero height is capped at 760px.
   At 100% zoom (and large screens at 100%), the class is absent and layout
   remains 100% identical.
   ========================================================================== */
function isBrowserZoomedOut() {
  if (typeof window === 'undefined') return false;

  // Exclude mobile viewports
  const isLandscapeMobile = window.matchMedia && window.matchMedia('(max-width: 932px) and (orientation: landscape)').matches;
  if (window.innerWidth < 768 || isLandscapeMobile) {
    return false;
  }

  // Primary: window.outerWidth / window.innerWidth
  // When zoomed out, innerWidth in CSS pixels expands relative to outerWidth.
  // Ratio drops below 0.95 at 90%, 80%, 75%, 67%, 50%, 33%, etc.
  if (window.outerWidth > 0 && window.innerWidth > 0) {
    const ratio = window.outerWidth / window.innerWidth;
    if (ratio > 0.1 && ratio < 0.95) {
      return true;
    }
  }

  // Backup fallback: devicePixelRatio on standard 1x displays
  if (window.devicePixelRatio && window.devicePixelRatio > 0.1 && window.devicePixelRatio < 0.95) {
    return true;
  }

  return false;
}

function syncZoomState() {
  if (!document.documentElement) return;
  if (isBrowserZoomedOut()) {
    document.documentElement.classList.add('is-zoomed-out');
  } else {
    document.documentElement.classList.remove('is-zoomed-out');
  }
}

// Immediate execution so state is set as early as possible
syncZoomState();
window.addEventListener('resize', syncZoomState, { passive: true });
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', syncZoomState, { passive: true });
}
window.addEventListener('pageshow', syncZoomState, { passive: true });

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const mobileToggleBtn = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  // Asset paths for theme toggle icons
  const iconDark = 'assets/image/logo/dark.png';   // Moon icon for light mode
  const iconLight = 'assets/image/logo/light.png'; // Sun icon for dark mode

  // Helper to reliably detect mobile viewport (including mobile landscape mode)
  function isMobileViewport() {
    const isLandscapeMobile = window.matchMedia('(max-width: 932px) and (orientation: landscape)').matches;
    return window.innerWidth < 768 || isLandscapeMobile;
  }

  /* ==========================================================================
     Theme Management (Dark / Light Mode)
     ========================================================================== */
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeIcon) {
        themeIcon.src = iconLight;
        themeIcon.alt = 'Switch to Light Mode';
      }
      localStorage.setItem('portfolio-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeIcon) {
        themeIcon.src = iconDark;
        themeIcon.alt = 'Switch to Dark Mode';
      }
      localStorage.setItem('portfolio-theme', 'light');
    }
  }

  // Initialize theme from localStorage or system preference
  const savedTheme = localStorage.getItem('portfolio-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    applyTheme('dark');
  } else {
    applyTheme('light');
  }

  // Theme toggle click handler
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      themeToggleBtn.blur();
    });
  }

  /* ==========================================================================
     Mobile Hamburger Navigation Menu
     ========================================================================== */
  if (mobileToggleBtn && navMenu) {
    mobileToggleBtn.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      mobileToggleBtn.classList.toggle('active', isOpen);
      mobileToggleBtn.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (event) => {
      if (!navMenu.contains(event.target) && !mobileToggleBtn.contains(event.target)) {
        navMenu.classList.remove('open');
        mobileToggleBtn.classList.remove('active');
        mobileToggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ==========================================================================
     Navbar Scroll Effect (Sticky / Fixed with Elevation on Scroll)
     ========================================================================== */
  const navbarHeader = document.getElementById('navbar');
  if (navbarHeader) {
    const onScrollHeader = () => {
      if (window.scrollY > 15) {
        navbarHeader.classList.add('scrolled');
      } else {
        navbarHeader.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScrollHeader, { passive: true });
    onScrollHeader();
  }

  /* ==========================================================================
     Active Link & Smooth Navigation
     ========================================================================== */
  function setActiveLink(targetId, updateState = true) {
    if (!targetId) return;
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === `#${targetId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    if (updateState) {
      try {
        sessionStorage.setItem('portfolio_last_section', targetId);
      } catch (e) { }

      if (window.location.hash.replace('#', '') !== targetId) {
        history.replaceState(null, '', `#${targetId}`);
      }
    }
  }

  const brandLogo = document.querySelector('.brand');
  if (brandLogo) {
    brandLogo.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      setActiveLink('home');
      if (navMenu && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        mobileToggleBtn?.classList.remove('active');
        mobileToggleBtn?.setAttribute('aria-expanded', 'false');
      }
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href')?.replace('#', '');
      if (targetId) {
        e.preventDefault();
        if (targetId === 'home') {
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        } else {
          const targetSection = document.getElementById(targetId);
          if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }

        setActiveLink(targetId);

        // Close mobile menu if open
        if (navMenu && navMenu.classList.contains('open')) {
          navMenu.classList.remove('open');
          mobileToggleBtn?.classList.remove('active');
          mobileToggleBtn?.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  // Helper to persist scroll position across reloads
  let scrollSaveTimer = null;
  function persistCurrentScrollY() {
    try {
      const scrollY = Math.round(window.scrollY || window.pageYOffset || 0);
      sessionStorage.setItem('portfolio_last_scroll_y', String(scrollY));
    } catch (e) { }
  }

  window.addEventListener('scroll', () => {
    const dialogEl = document.getElementById('flipbook-dialog');
    if (dialogEl && (dialogEl.open || dialogEl.hasAttribute('open'))) {
      return;
    }
    const scrollY = window.scrollY || window.pageYOffset || 0;
    if (scrollY < 80) {
      setActiveLink('home');
    }
    if (!scrollSaveTimer) {
      scrollSaveTimer = requestAnimationFrame(() => {
        persistCurrentScrollY();
        scrollSaveTimer = null;
      });
    }
  }, { passive: true });

  window.addEventListener('pagehide', persistCurrentScrollY);
  window.addEventListener('beforeunload', persistCurrentScrollY);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      persistCurrentScrollY();
    }
  });

  /* ==========================================================================
     Explore Button Smooth Scroll to About Section
     ========================================================================== */
  const btnExplore = document.querySelector('.btn-explore');
  if (btnExplore) {
    btnExplore.addEventListener('click', (e) => {
      e.preventDefault();
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveLink('about');
      }
    });
  }

  /* ==========================================================================
     ScrollSpy with IntersectionObserver (Updates Active Pill as User Scrolls)
     ========================================================================== */
  if ('IntersectionObserver' in window && sections.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          setActiveLink(id);
        }
      });
    }, observerOptions);

    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ==========================================================================
     Featured Projects Slider Navigation Controller (Direct Carousel)
     ========================================================================== */
  const projectsGrid = document.querySelector('.projects-grid');
  const sliderPrevBtn = document.getElementById('slider-prev');
  const sliderNextBtn = document.getElementById('slider-next');
  const sliderDotsContainer = document.getElementById('slider-dots');

  if (projectsGrid && sliderDotsContainer) {
    function getCards() {
      return Array.from(projectsGrid.querySelectorAll('.project-card'));
    }

    function scrollToCard(index) {
      const cards = getCards();
      if (index < 0 || index >= cards.length) return;
      const card = cards[index];

      const isMobile = isMobileViewport();
      const currentScroll = projectsGrid.scrollLeft;
      const gridRect = projectsGrid.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const offsetFromGridLeft = cardRect.left - gridRect.left;

      let targetScroll;
      if (isMobile) {
        targetScroll = currentScroll + offsetFromGridLeft - ((projectsGrid.clientWidth - card.clientWidth) / 2);
      } else {
        targetScroll = currentScroll + offsetFromGridLeft;
      }

      projectsGrid.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth'
      });
    }

    function getCurrentCardIndex() {
      const cards = getCards();
      if (cards.length === 0) return 0;

      const maxScroll = projectsGrid.scrollWidth - projectsGrid.clientWidth;
      if (maxScroll > 10 && projectsGrid.scrollLeft >= maxScroll - 15) {
        return cards.length - 1;
      }
      if (projectsGrid.scrollLeft <= 15) {
        return 0;
      }

      const isMobile = isMobileViewport();
      const gridRect = projectsGrid.getBoundingClientRect();
      const targetX = isMobile
        ? gridRect.left + gridRect.width / 2
        : gridRect.left + (cards[0].getBoundingClientRect().width / 2);

      let closestIdx = 0;
      let minDistance = Infinity;

      cards.forEach((card, idx) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const dist = Math.abs(targetX - cardCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      });

      return closestIdx;
    }

    function syncActiveDot() {
      const cards = getCards();
      if (cards.length === 0) return;
      const activeIdx = getCurrentCardIndex();

      const dots = sliderDotsContainer.querySelectorAll('.slider-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === activeIdx);
      });
    }

    function refreshDots() {
      const cards = getCards();
      sliderDotsContainer.innerHTML = '';
      cards.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = `slider-dot ${idx === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Lihat project ke-${idx + 1}`);
        dot.addEventListener('click', () => {
          scrollToCard(idx);
        });
        sliderDotsContainer.appendChild(dot);
      });
      syncActiveDot();
    }

    if (sliderPrevBtn) {
      sliderPrevBtn.addEventListener('click', () => {
        const currentIdx = getCurrentCardIndex();
        scrollToCard(Math.max(0, currentIdx - 1));
      });
    }

    if (sliderNextBtn) {
      sliderNextBtn.addEventListener('click', () => {
        const cards = getCards();
        const currentIdx = getCurrentCardIndex();
        scrollToCard(Math.min(cards.length - 1, currentIdx + 1));
      });
    }

    let isScrollingTimer;
    projectsGrid.addEventListener('scroll', () => {
      window.clearTimeout(isScrollingTimer);
      isScrollingTimer = setTimeout(syncActiveDot, 50);
    }, { passive: true });

    refreshDots();
    window.addEventListener('resize', refreshDots, { passive: true });
  }

  /* ==========================================================================
     See More / See Less Projects Toggle (Desktop & Tablet)
     ========================================================================== */
  const seeMoreBtn = document.getElementById('btn-see-more');
  const extraProjects = document.querySelectorAll('.project-card-wrapper.extra-project, .project-card.extra-project');

  if (seeMoreBtn && extraProjects.length > 0) {
    seeMoreBtn.addEventListener('click', () => {
      const isExpanded = extraProjects[0].classList.contains('show');

      if (!isExpanded) {
        extraProjects.forEach((card, index) => {
          card.classList.add('show');
          card.style.animationDelay = `${index * 0.08}s`;
          // Pastikan animasi 3D tilt, hover, dan glare berjalan persis sama tanpa terhalang fill-mode
          card.addEventListener('animationend', () => {
            card.style.animation = 'none';
            card.style.animationDelay = '';
          }, { once: true });
        });
        seeMoreBtn.textContent = 'See Less';
        seeMoreBtn.classList.add('is-expanded');
        seeMoreBtn.blur();
      } else {
        extraProjects.forEach((card) => {
          card.classList.remove('show');
          card.style.animation = '';
          card.style.animationDelay = '';
        });
        seeMoreBtn.textContent = 'See More';
        seeMoreBtn.classList.remove('is-expanded');
        seeMoreBtn.blur();
        const projectHeading = document.querySelector('.project-heading') || document.getElementById('project');
        if (projectHeading) {
          projectHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  }

  /* ==========================================================================
     Hero Avatar Companions (Click / Touch & Keyboard Toggle)
     - Speech bubble stays permanently visible at all times
     - Toggle active state for companions on click / tap or Enter / Space
     ========================================================================== */
  const heroVisual = document.querySelector('.hero-visual');

  if (heroVisual) {
    // Toggle active state for companions on click / tap
    heroVisual.addEventListener('click', () => {
      heroVisual.classList.toggle('active');
    });

    // Keyboard support: Enter or Space toggles active state
    heroVisual.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        heroVisual.classList.toggle('active');
      }
    });
  }

  /* ==========================================================================
     Hero Speech Bubble Auto-Fit (Method A: Single Closed SVG Shape)
     - Computes the exact bounding box and draws one continuous path
     - Merges body and tail seamlessly so no seam / notch can ever occur
     ========================================================================== */
  function syncSpeechBubblePath() {
    const bubble = document.getElementById('hero-speech-bubble');
    const path = document.getElementById('hero-speech-path');
    const svg = document.getElementById('hero-speech-svg');
    if (!bubble || !path || !svg) return;

    const textEl = bubble.querySelector('.hero-speech-text');
    if (!textEl) return;

    const w = Math.round(textEl.offsetWidth);
    const h = Math.round(textEl.offsetHeight);
    if (w <= 0 || h <= 0) return;

    const r = Math.min(14, Math.floor(h / 2));
    const tailH = 10;
    const tailW = 15;
    const isSmall = window.matchMedia('(max-width: 600px)').matches;
    const tailX = isSmall ? 22 : 32;
    const pad = 1;

    const xl = pad;
    const xr = pad + w;
    const yt = pad + tailH;
    const yb = pad + tailH + h;

    const tl = Math.max(xl + r, Math.round(xl + tailX - tailW / 2));
    const tr = Math.min(xr - r, Math.round(xl + tailX + tailW / 2));
    const tp = xl + tailX;

    const d = `M ${xl + r} ${yt} L ${tl} ${yt} L ${tp} ${pad} L ${tr} ${yt} L ${xr - r} ${yt} A ${r} ${r} 0 0 1 ${xr} ${yt + r} L ${xr} ${yb - r} A ${r} ${r} 0 0 1 ${xr - r} ${yb} L ${xl + r} ${yb} A ${r} ${r} 0 0 1 ${xl} ${yb - r} L ${xl} ${yt + r} A ${r} ${r} 0 0 1 ${xl + r} ${yt} Z`;

    svg.setAttribute('viewBox', `0 0 ${xr + pad} ${yb + pad}`);
    path.setAttribute('d', d);
  }

  syncSpeechBubblePath();
  window.addEventListener('resize', syncSpeechBubblePath, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncSpeechBubblePath);
  }





  /* ==========================================================================
     Topic Pills Selection & Custom Topic Input
     ========================================================================== */
  const topicPills = document.querySelectorAll('.topic-pill');
  const hiddenTopicInput = document.getElementById('contact-topic');
  const pillOther = document.getElementById('pill-other');
  const customTopicInput = document.getElementById('custom-topic-input');

  if (topicPills.length > 0 && hiddenTopicInput) {
    topicPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const topic = pill.getAttribute('data-topic');

        if (pill === pillOther) {
          pillOther.style.display = 'none';
          if (customTopicInput) {
            customTopicInput.style.display = 'inline-block';
            customTopicInput.value = '';
            customTopicInput.focus();
          }
          topicPills.forEach((p) => p.classList.remove('active'));
          hiddenTopicInput.value = '';
          const radioOther = document.getElementById('radio-lainnya');
          if (radioOther) radioOther.checked = true;
        } else {
          topicPills.forEach((p) => p.classList.remove('active'));
          pill.classList.add('active');
          hiddenTopicInput.value = topic;

          const radioMatch = document.querySelector(`input[name="topic_radio"][value="${topic}"]`);
          if (radioMatch) radioMatch.checked = true;

          if (pillOther && customTopicInput) {
            customTopicInput.style.display = 'none';
            customTopicInput.value = '';
            pillOther.style.display = 'inline-flex';
            pillOther.classList.remove('active');
          }
        }
      });
    });

    if (customTopicInput) {
      customTopicInput.addEventListener('input', () => {
        hiddenTopicInput.value = customTopicInput.value.trim() || 'Lainnya';
      });
    }
  }

  /* ==========================================================================
     Contact Form Handler (Google Form Integration via Fetch POST no-cors)
     ========================================================================== */
  const contactForm = document.getElementById('f') || document.getElementById('contact-form');
  const contactCard = document.querySelector('.contact-card');
  const errElement = document.getElementById('err');
  const successContainer = document.getElementById('success-msg');
  const btnSendAgain = document.getElementById('btn-send-again');

  const GOOGLE_FORM_ACTION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeyB-IYJ5S344qxjSgDkFVbW9zXuoRRoS7TNYwqDIjb7wJuOg/formResponse';
  const ENTRY_NAMA = 'entry.636835736';
  const ENTRY_EMAIL = 'entry.2097540976';
  const ENTRY_TOPIK = 'entry.2077523094';
  const ENTRY_PESAN = 'entry.131253454';

  function resetFormAndState() {
    if (contactForm) {
      contactForm.reset();
      contactForm.classList.remove('sent');
    }
    if (contactCard) {
      contactCard.classList.remove('sent');
    }
    if (successContainer) {
      successContainer.style.display = 'none';
      successContainer.classList.remove('is-visible');
    }
    if (errElement) {
      errElement.style.display = 'none';
      errElement.textContent = '';
    }

    const submitBtn = contactForm?.querySelector('.btn-submit-message');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Kirim Pesan';
      submitBtn.style.backgroundColor = '';
    }

    // Reset topic pills back to Kolaborasi
    topicPills.forEach((p) => p.classList.remove('active'));
    const defaultPill = document.querySelector('.topic-pill[data-topic="Kolaborasi"]');
    if (defaultPill) defaultPill.classList.add('active');
    if (hiddenTopicInput) hiddenTopicInput.value = 'Kolaborasi';
    const defaultRadio = document.getElementById('radio-kolaborasi');
    if (defaultRadio) defaultRadio.checked = true;

    if (pillOther && customTopicInput) {
      customTopicInput.style.display = 'none';
      customTopicInput.value = '';
      pillOther.style.display = 'inline-flex';
      pillOther.classList.remove('active');
    }
  }

  if (btnSendAgain) {
    btnSendAgain.addEventListener('click', resetFormAndState);
  }

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Native HTML5 validation
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      // 6. Honeypot check as spam trap
      const honeypotVal = document.getElementById('contact-hp')?.value?.trim();
      const submitBtn = contactForm.querySelector('.btn-submit-message');
      const originalBtnText = submitBtn ? submitBtn.textContent : 'Kirim Pesan';

      if (honeypotVal) {
        // Spam detected: silently pretend success without sending
        console.warn('Spam submission detected via honeypot.');
        contactForm.classList.add('sent');
        if (contactCard) contactCard.classList.add('sent');
        if (successContainer) {
          successContainer.style.display = 'flex';
          successContainer.classList.add('is-visible');
        }
        if (submitBtn) {
          submitBtn.textContent = 'Terima kasih, pesanmu sudah masuk';
        }
        return;
      }

      // Reset previous error message
      if (errElement) {
        errElement.style.display = 'none';
        errElement.textContent = '';
      }

      // Offline detection
      if (typeof navigator.onLine === 'boolean' && !navigator.onLine) {
        if (errElement) {
          errElement.textContent = 'Gagal mengirim pesan: Kamu sedang offline. Silakan periksa koneksi internetmu.';
          errElement.style.display = 'block';
        }
        return;
      }

      // Extract field values
      const nameVal = document.getElementById('contact-name')?.value.trim() || '';
      const emailVal = document.getElementById('contact-email')?.value.trim() || '';
      const topicVal = hiddenTopicInput?.value.trim() ||
        document.querySelector('input[name="topic_radio"]:checked')?.value ||
        'Kolaborasi';
      const messageVal = document.getElementById('contact-message')?.value.trim() || '';

      // 3. Button changes to "Mengirim..." and gets disabled
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengirim...';
      }

      // 1. Build FormData with the 4 Google Form entry keys
      const formData = new FormData();
      formData.append(ENTRY_NAMA, nameVal);
      formData.append(ENTRY_EMAIL, emailVal);
      formData.append(ENTRY_TOPIK, topicVal);
      formData.append(ENTRY_PESAN, messageVal);

      // Send to Google Form response endpoint with mode: 'no-cors'
      fetch(GOOGLE_FORM_ACTION_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      })
        .then(() => {
          // 4. On success: show "Terima kasih, pesanmu sudah masuk" using .sent state
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Terima kasih, pesanmu sudah masuk';
          }

          contactForm.classList.add('sent');
          if (contactCard) {
            contactCard.classList.add('sent');
          }
          if (successContainer) {
            successContainer.style.display = 'flex';
            successContainer.classList.add('is-visible');
          }
          if (errElement) {
            errElement.style.display = 'none';
            errElement.textContent = '';
          }
        })
        .catch((error) => {
          console.error('Error submitting form to Google Form:', error);
          // 5. On failure: show error message in #err element
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
          }
          if (errElement) {
            errElement.textContent = 'Gagal mengirim pesan. Silakan periksa koneksi internetmu dan coba lagi.';
            errElement.style.display = 'block';
          }
        });
    });
  }

  /* ==========================================================================
     Contact Social Buttons (Instagram & Email Reveal Popover)
     ========================================================================== */
  const contactEmailBtn = document.getElementById('contact-email-btn');
  const contactEmailContainer = document.getElementById('contact-email-container');
  const emailRevealPopover = document.getElementById('email-reveal-popover');
  const contactEmailLabel = document.getElementById('contact-email-label');
  const btnCloseEmailPopover = document.getElementById('btn-close-email-popover');
  const btnCopyEmail = document.getElementById('btn-copy-email');
  const copyBtnText = document.getElementById('copy-btn-text');
  const targetEmailAddress = 'mvsluluaurola@gmail.com';

  function openEmailPopover() {
    if (!emailRevealPopover || !contactEmailBtn) return;
    emailRevealPopover.classList.add('is-visible');
    contactEmailBtn.classList.add('is-active');
    contactEmailBtn.setAttribute('aria-expanded', 'true');
  }

  function closeEmailPopover() {
    if (!emailRevealPopover || !contactEmailBtn) return;
    emailRevealPopover.classList.remove('is-visible');
    contactEmailBtn.classList.remove('is-active');
    contactEmailBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleEmailPopover() {
    if (emailRevealPopover && emailRevealPopover.classList.contains('is-visible')) {
      closeEmailPopover();
    } else {
      openEmailPopover();
    }
  }

  if (contactEmailBtn) {
    contactEmailBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleEmailPopover();
    });
  }

  if (btnCloseEmailPopover) {
    btnCloseEmailPopover.addEventListener('click', (e) => {
      e.stopPropagation();
      closeEmailPopover();
    });
  }

  function fallbackCopyText(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      if (btnCopyEmail) {
        btnCopyEmail.classList.add('is-copied');
        if (copyBtnText) copyBtnText.textContent = 'Tersalin!';
        setTimeout(() => {
          btnCopyEmail.classList.remove('is-copied');
          if (copyBtnText) copyBtnText.textContent = 'Salin';
        }, 2000);
      }
    } catch (err) {
      console.warn('Copy fallback error:', err);
    }
    document.body.removeChild(tempInput);
  }

  if (btnCopyEmail) {
    btnCopyEmail.addEventListener('click', (e) => {
      e.stopPropagation();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(targetEmailAddress).then(() => {
          btnCopyEmail.classList.add('is-copied');
          if (copyBtnText) copyBtnText.textContent = 'Tersalin!';
          setTimeout(() => {
            btnCopyEmail.classList.remove('is-copied');
            if (copyBtnText) copyBtnText.textContent = 'Salin';
          }, 2000);
        }).catch(() => {
          fallbackCopyText(targetEmailAddress);
        });
      } else {
        fallbackCopyText(targetEmailAddress);
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (contactEmailContainer && !contactEmailContainer.contains(e.target)) {
      closeEmailPopover();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && emailRevealPopover && emailRevealPopover.classList.contains('is-visible')) {
      closeEmailPopover();
    }
  });



  /* ==========================================================================
     Interactive Booster Pack Opening System
     ========================================================================== */
  const packModal = document.getElementById('pack-modal');
  const packModalBackdrop = document.getElementById('pack-modal-backdrop');
  const btnClosePackModal = document.getElementById('btn-close-pack-modal');
  const boosterPack = document.getElementById('booster-pack');
  const packTopStrip = document.getElementById('pack-top-strip');
  const packBodyFoil = document.getElementById('pack-body-foil');
  const packInstruction = document.getElementById('pack-instruction');
  const revealedCardContainer = document.getElementById('revealed-card-container');
  const packActions = document.getElementById('pack-actions');
  const btnPackAgain = document.getElementById('btn-pack-again');
  const btnInspectClose = document.getElementById('btn-inspect-close');
  const cardInspectPill = document.getElementById('card-inspect-pill');
  const packStage = document.getElementById('pack-stage');

  const cardFrontName = document.getElementById('card-front-name');
  const cardFrontHp = document.getElementById('card-front-hp');
  const cardFrontImg = document.getElementById('card-front-img');
  const cardSkillEnergy = document.getElementById('card-skill-energy');
  const cardSkillName = document.getElementById('card-skill-name');
  const cardSkillDmg = document.getElementById('card-skill-dmg');
  const cardFlavorText = document.getElementById('card-flavor-text');
  const cardRarity = document.getElementById('card-rarity');
  const packModalPackName = document.getElementById('pack-modal-pack-name');
  const cardFrontFace = document.getElementById('card-front-face');

  const POKEMON_CARDS = {
    charmander: {
      name: 'Charmender',
      cardNo: 'No.001',
      rarityText: 'Common',
      category: 'pokemon',
      packTitle: 'Charmender Pack',
      rarityTier: 'common',
      rarityLabel: 'Common',
      rarityBadge: 'Common',
      weight: 51,
      hp: 'HP 70 🔥',
      energy: '🔥🔥',
      skill: 'Flame Tail',
      dmg: '50',
      flavor: 'Karakter api imut dengan tatapan pemberani yang digambar oleh Lulu!',
      rarity: 'Common',
      borderColor: '#8fc2fc',
      image: 'assets/image/pokemon/charmender.png'
    },
    piplup: {
      name: 'Piplup',
      cardNo: 'No.002',
      rarityText: 'Common',
      category: 'pokemon',
      packTitle: 'Piplup Pack',
      rarityTier: 'common',
      rarityLabel: 'Common',
      rarityBadge: 'Common',
      weight: 51,
      hp: 'HP 70 💧',
      energy: '💧💧',
      skill: 'Bubble Beam',
      dmg: '45',
      flavor: 'Penguin mungil yang bangga dan sangat menggemaskan!',
      rarity: 'Common',
      borderColor: '#8fc2fc',
      image: 'assets/image/pokemon/piplup.png'
    },
    oshawott: {
      name: 'Oshawott',
      cardNo: 'No.003',
      rarityText: 'Common',
      category: 'pokemon',
      packTitle: 'Oshawott Pack',
      rarityTier: 'common',
      rarityLabel: 'Common',
      rarityBadge: 'Common',
      weight: 51,
      hp: 'HP 80 💧',
      energy: '💧💧',
      skill: 'Water Gun',
      dmg: '40',
      flavor: 'Berang-berang menggemaskan dengan senjata scalchop andalan!',
      rarity: 'Common',
      borderColor: '#8fc2fc',
      image: 'assets/image/pokemon/oshawot.png'
    },
    ditto: {
      name: 'Ditto',
      cardNo: 'No.004',
      rarityText: 'Uncommon',
      category: 'pokemon',
      packTitle: 'Ditto Pack',
      rarityTier: 'uncommon',
      rarityLabel: 'Uncommon',
      rarityBadge: 'Uncommon',
      weight: 51,
      hp: 'HP 70 🟣',
      energy: '⚪⚪',
      skill: 'Transform',
      dmg: '40',
      flavor: 'Pokemon kenyal menggemaskan yang bisa meniru wujud siapa saja!',
      rarity: 'Uncommon',
      borderColor: '#8fc2fc',
      image: 'assets/image/pokemon/ditto.png'
    },
    pikachu: {
      name: 'Pikachu',
      cardNo: 'No.005',
      rarityText: 'Uncommon',
      category: 'pokemon',
      packTitle: 'Pikachu Pack',
      rarityTier: 'uncommon',
      rarityLabel: 'Uncommon',
      rarityBadge: 'Uncommon',
      weight: 58,
      hp: 'HP 70 ⚡',
      energy: '⚡⚡',
      skill: 'Electro Ball',
      dmg: '50',
      flavor: 'Digambar dengan penuh cinta oleh Lulu!',
      rarity: 'Uncommon',
      borderColor: '#8fc2fc',
      image: 'assets/image/pokemon/pikachu.png'
    },
    quaxly: {
      name: 'Quaxly',
      cardNo: 'No.006',
      rarityText: 'Rare',
      category: 'pokemon',
      packTitle: 'Quaxly Pack',
      rarityTier: 'rare',
      rarityLabel: 'Rare',
      rarityBadge: 'Rare',
      weight: 58,
      hp: 'HP 90 💧',
      energy: '💧💧💧',
      skill: 'Aqua Step',
      dmg: '85',
      flavor: 'Bebek modis yang selalu menjaga gaya rambutnya tetap rapi!',
      rarity: 'Rare',
      borderColor: '#8fc2fc',
      image: 'assets/image/pokemon/quaxly.png'
    },
    snorlax: {
      name: 'Snorlax',
      cardNo: 'No.007',
      rarityText: 'Rare',
      category: 'pokemon',
      packTitle: 'Snorlax Pack',
      rarityTier: 'rare',
      rarityLabel: 'Rare',
      rarityBadge: 'Rare',
      weight: 58,
      hp: 'HP 130 💤',
      energy: '⚪⚪⚪',
      skill: 'Heavy Slumber',
      dmg: '90',
      flavor: 'Suka tidur dan bersantai, tapi serangannya sangat kuat!',
      rarity: 'Rare',
      borderColor: '#8fc2fc',
      image: 'assets/image/pokemon/snorlax.png'
    },
    psyduck: {
      name: 'Psyduck',
      cardNo: 'No.008',
      rarityText: 'Epic',
      category: 'pokemon',
      packTitle: 'Psyduck Pack',
      rarityTier: 'epic',
      rarityLabel: 'Epic',
      rarityBadge: 'Epic',
      weight: 78,
      hp: 'HP 120 🌀',
      energy: '💧🧠✨',
      skill: 'Psychic Wave',
      dmg: '150',
      flavor: 'Sering pusing memegang kepala, tapi menyimpan kekuatan misterius dahsyat!',
      rarity: 'Epic',
      borderColor: '#8fc2fc',
      image: 'assets/image/pokemon/psyduck.png'
    },
    minccino: {
      name: 'Minccino',
      cardNo: 'No.009',
      rarityText: 'Epic',
      category: 'pokemon',
      packTitle: 'Minccino Pack',
      rarityTier: 'epic',
      rarityLabel: 'Epic',
      rarityBadge: 'Epic',
      weight: 78,
      hp: 'HP 100 🤍',
      energy: '⚪⚪⚪',
      skill: 'Tail Sweep',
      dmg: '120',
      flavor: 'Chinchilla imut yang sangat suka kebersihan dan menyapu debu!',
      rarity: 'Epic',
      borderColor: '#8fc2fc',
      image: 'assets/image/pokemon/minccino.png'
    },
    ultra: {
      name: 'The Trainer',
      cardNo: 'No.010',
      rarityText: 'Legendary',
      category: 'special',
      packTitle: "Lulu's Studio Pack",
      rarityTier: 'legendary',
      rarityLabel: 'Legendary',
      rarityBadge: 'Legendary',
      weight: 66,
      hp: 'HP 300 🌟',
      energy: '🔥💧⚡✨',
      skill: 'Pokemon Party Spark',
      dmg: '250',
      flavor: 'Kartu legendaris terhebat! Lulu bersama seluruh sahabat Pokemon berkumpul merayakan kebahagiaan!',
      rarity: 'Legendary',
      borderColor: '#8fc2fc',
      image: 'assets/image/pokemon/cardultra.png'
    }
  };

  // 10 Kartu Koleksi Pokemon Lulu (Nomor 1 - 10)
  const ALBUM_CARD_KEYS = [
    'charmander',   // Slot 1: cardcharmender.png
    'piplup',       // Slot 2: cardpiplup.png
    'oshawott',     // Slot 3: cardoshawot.png
    'ditto',        // Slot 4: cardditto.png
    'pikachu',      // Slot 5: cardpikachu.png
    'quaxly',       // Slot 6: cardquaxly.png
    'snorlax',      // Slot 7: cardsnorlax.png
    'psyduck',      // Slot 8: cardpsyduck.png
    'minccino',     // Slot 9: cardminccino.png
    'ultra'         // Slot 10: cardultra.png
  ];

  const packKeys = Object.keys(POKEMON_CARDS);
  let currentPackKey = 'charmander';
  let isTorn = false;
  let isDragging = false;
  let startX = 0;
  let currentDeltaX = 0;
  const TEAR_THRESHOLD = 90;

  let consecutiveDuplicates = 0;

  function getRandomCardKey(avoidKey = null) {
    let candidates = ALBUM_CARD_KEYS;
    if (avoidKey && candidates.length > 1) {
      candidates = candidates.filter(k => k !== avoidKey);
    }

    const totalWeight = candidates.reduce((sum, key) => sum + (POKEMON_CARDS[key]?.weight || 0), 0);
    let rand = Math.random() * totalWeight;

    for (let key of candidates) {
      const w = POKEMON_CARDS[key]?.weight || 0;
      if (rand < w) {
        return key;
      }
      rand -= w;
    }

    return candidates[0];
  }

  /* ==========================================================================
     Pokemon 10-Slot Collection System
     ========================================================================== */
  const COLLECTION_STORAGE_KEY = 'lulu_pokemon_collection_cards';
  let collectedCards = [];

  try {
    const saved = localStorage.getItem(COLLECTION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Hanya simpan kartu yang valid dan hapus duplikat yang sudah tersimpan sebelumnya
        const unique = [];
        const seenKeys = new Set();
        parsed.forEach((key) => {
          let validKey = key;
          // Normalisasi varian key lama jika ada di localStorage pengguna
          if (key === 'xavier') validKey = 'charmander';
          if (key === 'obsidia') validKey = 'ditto';
          if (key === 'aamon') validKey = 'quaxly';
          if (key === 'estes') validKey = 'minccino';
          if (key === 'granger') validKey = 'psyduck';
          if (key === 'lulu_special') validKey = 'psyduck';
          if (key === 'antigravity') validKey = 'ultra';
          if (key === 'snorlax_sleepy' || key === 'snorlax_giga') validKey = 'snorlax';
          if (key === 'pikachu_holo' || key === 'pikachu_volt') validKey = 'pikachu';
          if (key === 'oshawott_razor' || key === 'oshawott_surf') validKey = 'oshawott';

          if (POKEMON_CARDS[validKey] && !seenKeys.has(validKey)) {
            unique.push(validKey);
            seenKeys.add(validKey);
          }
        });
        collectedCards = unique;
        saveCollection();
      }
    }
  } catch (e) {
    collectedCards = [];
  }

  function saveCollection() {
    try {
      localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(collectedCards));
    } catch (e) { }
  }

  /* ==========================================================================
     Memory Game & Collection Tablist State (Persistent)
     ========================================================================== */
  const MEMORY_BEST_SCORE_STORAGE_KEY = 'lulu-memory-best-score';
  const MEMORY_GAME_STATE_STORAGE_KEY = 'lulu-memory-state';
  const CARD_ACTIVE_TAB_STORAGE_KEY = 'lulu-card-active-tab';

  function loadMemoryBestScore() {
    try {
      const raw = localStorage.getItem(MEMORY_BEST_SCORE_STORAGE_KEY);
      if (!raw) return null;
      if (raw.trim().startsWith('{')) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.waktu === 'number' && typeof parsed.langkah === 'number') {
          return parsed;
        }
      } else {
        const parsedInt = parseInt(raw, 10);
        if (!isNaN(parsedInt) && parsedInt > 0) {
          return { waktu: 0, langkah: parsedInt };
        }
      }
    } catch (e) { }
    return null;
  }

  function saveMemoryBestScore(scoreObj) {
    try {
      localStorage.setItem(MEMORY_BEST_SCORE_STORAGE_KEY, JSON.stringify(scoreObj));
    } catch (e) { }
  }

  function formatBestScoreDisplay(scoreObj) {
    if (!scoreObj || typeof scoreObj.waktu !== 'number' || typeof scoreObj.langkah !== 'number') {
      return '--:-- | -- langkah';
    }
    const formattedTime = formatMemoryTime(scoreObj.waktu);
    return `${formattedTime} | ${scoreObj.langkah} langkah`;
  }

  function updateBestScoreDisplay(scoreObj) {
    if (!memoryBestScoreEl) return;
    memoryBestScoreEl.textContent = formatBestScoreDisplay(scoreObj);
  }

  function clearMemoryBestScore() {
    try {
      localStorage.removeItem(MEMORY_BEST_SCORE_STORAGE_KEY);
    } catch (e) { }
    updateBestScoreDisplay(null);
  }

  // Ingat tab terakhir yang aktif selama sesi halaman (sessionStorage)
  let activeCardTab = 'pack';
  try {
    const savedTab = sessionStorage.getItem(CARD_ACTIVE_TAB_STORAGE_KEY);
    if (savedTab === 'memory' || savedTab === 'pack') {
      activeCardTab = savedTab;
    }
  } catch (e) {
    activeCardTab = 'pack';
  }

  function saveActiveCardTab(tabKey) {
    try {
      sessionStorage.setItem(CARD_ACTIVE_TAB_STORAGE_KEY, tabKey);
    } catch (e) { }
  }

  // DOM Elements for Bottom Panel & Memory Game
  const hobbiesBottomPanel = document.getElementById('hobbies-bottom-panel');
  const hobbiesTablist = document.getElementById('hobbies-tablist');
  const tabPack = document.getElementById('tab-pack');
  const tabMemory = document.getElementById('tab-memory');
  const panelPack = document.getElementById('panel-pack');
  const panelMemory = document.getElementById('panel-memory');
  const mysteryCardsDisplay = document.getElementById('mystery-cards-display');
  const collectionCompleteCard = document.getElementById('collection-complete-card');
  const btnGotoMemory = document.getElementById('btn-goto-memory');

  const memoryStepsCountEl = document.getElementById('memory-steps-count');
  const memoryPairsCountEl = document.getElementById('memory-pairs-count');
  const memoryTimerCountEl = document.getElementById('memory-timer-count');
  const memoryBestScoreEl = document.getElementById('memory-best-score');
  const memoryAriaLiveEl = document.getElementById('memory-aria-live');
  const memoryBoardGrid = document.getElementById('memory-board-grid');
  const memorySubtitleEl = document.getElementById('memory-subtitle');
  const memoryActionBar = document.getElementById('memory-action-bar');
  const memoryWinDialog = document.getElementById('memory-win-dialog');
  const memoryWinTitle = document.getElementById('memory-win-title');
  const memoryWinDesc = document.getElementById('memory-win-desc');
  const btnMemoryRestart = document.getElementById('btn-memory-restart');
  const btnMemoryClose = document.getElementById('btn-memory-close');
  const btnMemoryBoardRestart = document.getElementById('btn-memory-board-restart');
  const btnMemoryHeaderRestart = document.getElementById('btn-memory-header-restart');

  const memoryCompletedActions = document.getElementById('memory-completed-actions');
  const btnMemoryBottomRestart = document.getElementById('btn-memory-bottom-restart');
  const btnMemoryBottomResult = document.getElementById('btn-memory-bottom-result');
  const btnMemoryBottomResultText = document.getElementById('btn-memory-bottom-result-text');
  const memoryBottomNote = document.getElementById('memory-bottom-note');

  const leaderboardListBody = document.getElementById('leaderboard-list-body');
  const leaderboardEmpty = document.getElementById('leaderboard-empty');
  const leaderboardEmptyIcon = document.getElementById('leaderboard-empty-icon');
  const leaderboardEmptyText = document.getElementById('leaderboard-empty-text');
  const leaderboardSubmitForm = document.getElementById('leaderboard-submit-form');
  const leaderboardPlayerName = document.getElementById('leaderboard-player-name');
  const btnSubmitScore = document.getElementById('btn-submit-score');
  const leaderboardSubmitMsg = document.getElementById('leaderboard-submit-msg');
  const memoryRegisterDialog = document.getElementById('memory-register-dialog');
  const memoryRegisterForm = document.getElementById('memory-register-form');
  const memoryRegisterInput = document.getElementById('memory-register-input');
  const btnRegisterSubmit = document.getElementById('btn-register-submit');
  const btnRegisterClose = document.getElementById('btn-register-close');
  const memoryRegisterMsg = document.getElementById('memory-register-msg');
  const memoryPlayerBadge = document.getElementById('memory-player-badge');
  const memoryPlayerBadgeName = document.getElementById('memory-player-badge-name');
  const memoryRegisterBadge = document.getElementById('memory-register-badge');
  const memoryRegisterTitle = document.getElementById('memory-register-title');
  const memoryRegisterDesc = document.getElementById('memory-register-desc');

  // URL Google Apps Script Web App Leaderboard
  const LB_URL = 'https://script.google.com/macros/s/AKfycbwMsN4bW3n1t4tLGgsxs5Ib0A-wgdjjzgylR5PeWVWH1Bdr9s96W9cFCxIUONEEBmFwDg/exec';
  const PLAYER_ID_STORAGE_KEY = 'memoryPlayerId';
  const PLAYER_NAME_STORAGE_KEY = 'memoryPlayerName';
  const LEGACY_PLAYER_ID_KEY = 'lulu-memory-player-id';
  const LEGACY_PLAYER_NAME_KEY = 'lulu-memory-player-name';
  const MEMORY_RESET_VERSION_KEY = 'lulu-memory-clean-reset-v5';

  function getStoredPlayerId() {
    try {
      return (localStorage.getItem(PLAYER_ID_STORAGE_KEY) || localStorage.getItem(LEGACY_PLAYER_ID_KEY) || '').trim();
    } catch (e) {
      return '';
    }
  }

  function getStoredPlayerName() {
    try {
      return (localStorage.getItem(PLAYER_NAME_STORAGE_KEY) || localStorage.getItem(LEGACY_PLAYER_NAME_KEY) || '').trim();
    } catch (e) {
      return '';
    }
  }

  function savePlayerIdentity(id, name) {
    try {
      if (id) {
        localStorage.setItem(PLAYER_ID_STORAGE_KEY, id);
        localStorage.setItem(LEGACY_PLAYER_ID_KEY, id);
      }
      if (name) {
        localStorage.setItem(PLAYER_NAME_STORAGE_KEY, name);
        localStorage.setItem(LEGACY_PLAYER_NAME_KEY, name);
      }
    } catch (e) { }
  }

  function clearPlayerIdentity() {
    try {
      localStorage.removeItem(PLAYER_ID_STORAGE_KEY);
      localStorage.removeItem(LEGACY_PLAYER_ID_KEY);
      localStorage.removeItem(PLAYER_NAME_STORAGE_KEY);
      localStorage.removeItem(LEGACY_PLAYER_NAME_KEY);
    } catch (e) { }
  }

  function normalizePlayerName(name) {
    return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function generatePlayerId() {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ts = Date.now().toString(36).toUpperCase();
    return `PID-${ts}-${rand}`;
  }

  function isPlayerNameTaken(nameToCheck, currentId = '', currentName = '') {
    const norm = normalizePlayerName(nameToCheck);
    if (!norm) return false;

    const list = loadLeaderboard();
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const itemWaktu = Number(item.waktu !== undefined ? item.waktu : (item.time !== undefined ? item.time : item.seconds)) || 0;
      // Hanya pemain yang memiliki rekor sah di Leaderboard (waktu > 0) yang dicek duplikat
      // Nama lain selain nama di leaderboard boleh dipakai!
      if (itemWaktu <= 0) continue;

      const itemNameNorm = normalizePlayerName(item.nama !== undefined ? item.nama : item.name);
      const itemId = String(item.playerId || item.id || '').trim();

      // Bandingkan dengan sama persis (===), BUKAN dengan "mengandung" atau "diawali"
      if (itemNameNorm === norm) {
        // Pengecualian: jika baris ini milik Player ID atau nama kita sendiri saat ini, maka bukan duplikat
        if ((currentId && itemId && itemId === currentId) || (currentName && itemNameNorm === normalizePlayerName(currentName))) {
          continue;
        }
        return true;
      }
    }
    return false;
  }

  function showRegisterMsg(text, type = 'error') {
    if (!memoryRegisterMsg) return;
    memoryRegisterMsg.textContent = text;
    memoryRegisterMsg.className = type === 'success' ? 'leaderboard-submit-msg is-success' : 'leaderboard-submit-msg is-error';
  }

  function updatePlayerBadgeDisplay() {
    const playerName = getStoredPlayerName();
    const playerId = getStoredPlayerId();
    if (!memoryPlayerBadge || !memoryPlayerBadgeName) return;

    if (playerName && playerId) {
      // Nama diambil dari data pemain yang tersimpan di browser, diescape via textContent agar aman dari karakter HTML
      memoryPlayerBadgeName.textContent = playerName;
      memoryPlayerBadge.hidden = false;
      memoryPlayerBadge.removeAttribute('hidden');
    } else {
      memoryPlayerBadge.hidden = true;
      memoryPlayerBadge.setAttribute('hidden', '');
    }
  }

  function updatePlayerButton() {
    const playerId = getStoredPlayerId();
    const playerName = getStoredPlayerName();
    const hasPlayer = !!(playerId && playerName);

    if (btnMemoryBottomResultText) {
      btnMemoryBottomResultText.textContent = hasPlayer ? 'Lihat Peringkat Saya' : 'Tulis Nama';
    }
    if (btnMemoryBottomResult) {
      btnMemoryBottomResult.style.display = 'inline-flex';
      btnMemoryBottomResult.setAttribute('aria-label', hasPlayer ? 'Lihat peringkat saya di Leaderboard' : 'Tulis nama untuk Leaderboard');
    }

    updatePlayerBadgeDisplay();
  }

  // Panggil saat script dimuat untuk memastikan label tombol langsung sinkron
  updatePlayerButton();

  function updatePlayerNameInLeaderboard(playerId, newName, oldName = '') {
    if (!newName) return;
    const currentList = loadLeaderboard();
    const oldNorm = normalizePlayerName(oldName);
    let updated = false;

    currentList.forEach(item => {
      const itemId = String(item.playerId || item.id || '').trim();
      const itemNorm = normalizePlayerName(item.nama !== undefined ? item.nama : item.name);
      const isMatch = (playerId && itemId && itemId === playerId) ||
        (oldNorm && itemNorm === oldNorm);

      if (isMatch) {
        item.nama = newName;
        item.name = newName;
        if (playerId) {
          item.playerId = playerId;
        }
        updated = true;
      }
    });

    if (updated) {
      saveLeaderboard(currentList);
      renderLeaderboard(currentList);
    }
  }

  function openPlayerRegisterDialog() {
    if (!memoryRegisterDialog) return;
    document.body.classList.add('memory-dialog-open');
    memoryRegisterDialog.classList.remove('is-closing');
    if (memoryRegisterMsg) {
      memoryRegisterMsg.textContent = '';
      memoryRegisterMsg.className = 'leaderboard-submit-msg';
    }

    if (memoryRegisterBadge) {
      memoryRegisterBadge.textContent = 'Pendaftaran Pemain';
    }
    if (memoryRegisterTitle) {
      memoryRegisterTitle.textContent = 'Siapa Nama Kamu?';
    }
    if (memoryRegisterDesc) {
      memoryRegisterDesc.textContent = 'Catat namamu untuk memulai Memory Game dan mencatat rekor di Leaderboard!';
    }
    if (btnRegisterSubmit) {
      btnRegisterSubmit.textContent = 'Mulai Bermain';
    }

    if (memoryRegisterInput) {
      memoryRegisterInput.value = '';
      if (btnRegisterSubmit) {
        btnRegisterSubmit.disabled = true;
      }
    }
    if (typeof memoryRegisterDialog.showModal === 'function') {
      if (!memoryRegisterDialog.open) {
        memoryRegisterDialog.showModal();
      }
    } else {
      memoryRegisterDialog.setAttribute('open', '');
    }
    setTimeout(() => {
      if (memoryRegisterInput) {
        memoryRegisterInput.focus();
        if (typeof memoryRegisterInput.select === 'function') {
          memoryRegisterInput.select();
        }
      }
    }, 50);
  }

  function closePlayerRegisterDialog() {
    if (!memoryRegisterDialog || !memoryRegisterDialog.open) return;
    document.body.classList.remove('memory-dialog-open');
    memoryRegisterDialog.classList.add('is-closing');
    setTimeout(() => {
      memoryRegisterDialog.classList.remove('is-closing');
      if (typeof memoryRegisterDialog.close === 'function') {
        memoryRegisterDialog.close();
      } else {
        memoryRegisterDialog.removeAttribute('open');
      }
    }, 210);
  }

  if (btnRegisterClose) {
    btnRegisterClose.addEventListener('click', () => {
      closePlayerRegisterDialog();
    });
  }


  if (memoryRegisterDialog) {
    const registerContent = memoryRegisterDialog.querySelector('.memory-dialog-content');
    if (registerContent) {
      registerContent.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      registerContent.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
      registerContent.addEventListener('mouseup', (e) => {
        e.stopPropagation();
      });
    }

    let isRegisterBackdropMousedown = false;

    memoryRegisterDialog.addEventListener('mousedown', (e) => {
      isRegisterBackdropMousedown = (e.target === memoryRegisterDialog);
    });

    memoryRegisterDialog.addEventListener('mouseup', (e) => {
      if (e.target !== memoryRegisterDialog) {
        isRegisterBackdropMousedown = false;
      }
    });

    memoryRegisterDialog.addEventListener('click', (e) => {
      if (isRegisterBackdropMousedown && e.target === memoryRegisterDialog) {
        closePlayerRegisterDialog();
      }
      isRegisterBackdropMousedown = false;
    });

    memoryRegisterDialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      closePlayerRegisterDialog();
    });

    memoryRegisterDialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePlayerRegisterDialog();
      }
    });
  }

  if (memoryRegisterInput) {
    memoryRegisterInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePlayerRegisterDialog();
        return;
      }
      // Mencegah penutupan dialog atau shortcut luar saat mengetik/menghapus di dalam input
      e.stopPropagation();
    });

    memoryRegisterInput.addEventListener('keyup', (e) => {
      e.stopPropagation();
    });

    memoryRegisterInput.addEventListener('input', (e) => {
      e.stopPropagation();
      const val = memoryRegisterInput.value.trim();
      if (memoryRegisterMsg) {
        memoryRegisterMsg.textContent = '';
        memoryRegisterMsg.className = 'leaderboard-submit-msg';
      }
      if (btnRegisterSubmit) {
        btnRegisterSubmit.disabled = (val.length < 2 || val.length > 20);
      }
    });
  }

  if (memoryRegisterForm) {
    memoryRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawName = (memoryRegisterInput ? memoryRegisterInput.value : '').trim();
      if (!rawName) {
        showRegisterMsg('Nama tidak boleh kosong.', 'error');
        return;
      }
      if (rawName.length < 2) {
        showRegisterMsg('Nama minimal 2 karakter.', 'error');
        return;
      }
      if (rawName.length > 20) {
        showRegisterMsg('Nama maksimal 20 karakter.', 'error');
        return;
      }

      // Pengecekan duplikat di sisi browser terlebih dahulu terhadap nama yang ada di Leaderboard
      if (isPlayerNameTaken(rawName)) {
        showRegisterMsg('Nama sudah dipakai, pilih nama lain', 'error');
        return;
      }

      // Tampilkan status loading
      if (btnRegisterSubmit) {
        btnRegisterSubmit.disabled = true;
        btnRegisterSubmit.textContent = 'Mendaftarkan...';
      }

      // PENDAFTARAN PEMAIN BARU
      let registeredPlayerId = null;

      if (LB_URL && typeof fetch === 'function') {
        try {
          const regRes = await fetch(LB_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'register',
              nama: rawName
            })
          });
          const regData = await regRes.json().catch(() => null);

          if (regData) {
            if (Array.isArray(regData)) {
              // Respon berupa array leaderboard (jika server redirect ke doGet)
              const normCheck = normalizePlayerName(rawName);
              const isTaken = regData.some(entry => {
                const entryNorm = normalizePlayerName(entry.nama !== undefined ? entry.nama : entry.name);
                const entryTime = Number(entry.waktu !== undefined ? entry.waktu : (entry.time !== undefined ? entry.time : entry.seconds)) || 0;
                return (entryTime > 0 && entryNorm === normCheck);
              });
              if (isTaken) {
                showRegisterMsg('Nama sudah dipakai, pilih nama lain', 'error');
                if (btnRegisterSubmit) {
                  btnRegisterSubmit.disabled = false;
                  btnRegisterSubmit.textContent = 'Mulai Bermain';
                }
                return;
              }
            } else if (typeof regData === 'object') {
              const isTaken = regData.taken || (regData.error && String(regData.error).toLowerCase().includes('sudah dipakai'));
              if (isTaken) {
                showRegisterMsg('Nama sudah dipakai, pilih nama lain', 'error');
                if (btnRegisterSubmit) {
                  btnRegisterSubmit.disabled = false;
                  btnRegisterSubmit.textContent = 'Mulai Bermain';
                }
                return;
              }
              if (regData.success && regData.playerId) {
                registeredPlayerId = String(regData.playerId).trim();
              }
            }
          }
        } catch (e) {
          console.warn('Gagal koneksi pendaftaran ke server leaderboard (offline fallback):', e);
        }
      }

      const newPlayerId = registeredPlayerId || generatePlayerId();
      savePlayerIdentity(newPlayerId, rawName);

      updatePlayerBadgeDisplay();
      updatePlayerButton();
      fetchLeaderboard(true);
      showRegisterMsg('✓ Berhasil terdaftar! Menyiapkan permainan...', 'success');

      setTimeout(() => {
        if (btnRegisterSubmit) {
          btnRegisterSubmit.disabled = false;
          btnRegisterSubmit.textContent = 'Mulai Bermain';
        }
        closePlayerRegisterDialog();
        startNewMemoryGame();
        announceMemoryLive(`Selamat datang, ${rawName}! Permainan dimulai.`);
      }, 300);
    });
  }

  // 1. Simpan URL di satu konstanta (LB_URL) di main.js supaya mudah diganti
  const MEMORY_LEADERBOARD_STORAGE_KEY = 'lulu-memory-leaderboard';
  let lastLeaderboardFetchTime = 0;
  const LEADERBOARD_FETCH_THROTTLE_MS = 30000; // 30 detik
  let memoryTimerInterval = null;
  let memoryElapsedSeconds = 0;
  let isMemoryTimerRunning = false;
  let hasSubmittedCurrentScore = false;
  let memorySubmitCloseTimeout = null;

  let memoryCards = [];
  let flippedCardIndices = [];
  let memorySteps = 0;
  let matchedPairsCount = 0;
  let isMemoryBoardLocked = false;

  function formatMemoryTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const formattedMins = mins < 10 ? '0' + mins : String(mins);
    const formattedSecs = secs < 10 ? '0' + secs : String(secs);
    return `${formattedMins}:${formattedSecs}`;
  }

  function updateMemoryTimerDisplay() {
    if (memoryTimerCountEl) {
      memoryTimerCountEl.textContent = formatMemoryTime(memoryElapsedSeconds);
    }
  }

  function startMemoryTimer() {
    if (isMemoryTimerRunning) return;
    isMemoryTimerRunning = true;
    stopMemoryTimer();
    isMemoryTimerRunning = true;
    const intervalFn = () => {
      memoryElapsedSeconds++;
      updateMemoryTimerDisplay();
    };
    if (typeof setInterval === 'function') {
      memoryTimerInterval = setInterval(intervalFn, 1000);
    } else if (typeof window !== 'undefined' && typeof window.setInterval === 'function') {
      memoryTimerInterval = window.setInterval(intervalFn, 1000);
    }
  }

  function stopMemoryTimer() {
    isMemoryTimerRunning = false;
    if (memoryTimerInterval !== null) {
      if (typeof clearInterval === 'function') {
        clearInterval(memoryTimerInterval);
      } else if (typeof window !== 'undefined' && typeof window.clearInterval === 'function') {
        window.clearInterval(memoryTimerInterval);
      }
      memoryTimerInterval = null;
    }
  }

  function resetMemoryTimer() {
    stopMemoryTimer();
    memoryElapsedSeconds = 0;
    updateMemoryTimerDisplay();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatScoreTime(val) {
    if (typeof val === 'number' && !isNaN(val)) {
      return formatMemoryTime(val);
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      const mmssMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
      if (mmssMatch) {
        const m = parseInt(mmssMatch[1], 10);
        const s = parseInt(mmssMatch[2], 10);
        return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
      }
      const num = parseInt(trimmed, 10);
      if (!isNaN(num)) {
        return formatMemoryTime(num);
      }
    }
    return '00:00';
  }

  function showLeaderboardStatus(type, message) {
    if (!leaderboardEmpty) return;
    if (leaderboardListBody) leaderboardListBody.innerHTML = '';
    leaderboardEmpty.style.display = 'flex';

    if (leaderboardEmptyIcon) {
      if (type === 'loading') {
        leaderboardEmptyIcon.textContent = '⏳';
      } else if (type === 'error') {
        leaderboardEmptyIcon.textContent = '⚠️';
      } else {
        leaderboardEmptyIcon.textContent = '🏆';
      }
    }

    if (leaderboardEmptyText) {
      leaderboardEmptyText.textContent = message;
    }
  }

  function parseTimeInSeconds(val) {
    if (typeof val === 'number') {
      return isNaN(val) ? 0 : val;
    }
    const str = String(val || '').trim();
    if (!str) return 0;
    if (str.includes(':')) {
      const parts = str.split(':');
      if (parts.length === 2) {
        const m = parseInt(parts[0], 10) || 0;
        const s = parseInt(parts[1], 10) || 0;
        return m * 60 + s;
      }
      if (parts.length === 3) {
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const s = parseInt(parts[2], 10) || 0;
        return h * 3600 + m * 60 + s;
      }
    }
    const num = Number(str);
    return isNaN(num) ? 0 : num;
  }

  function normalizeLeaderboardList(rawList) {
    const listToProcess = Array.isArray(rawList) ? rawList : [];

    const playersMap = {};

    listToProcess.forEach((entry) => {
      if (!entry) return;
      const rawName = String(entry.nama !== undefined ? entry.nama : (entry.name !== undefined ? entry.name : '')).trim();
      if (!rawName) return;

      const playerId = String(entry.playerId || entry.id || '').trim();
      const rawWaktu = parseTimeInSeconds(entry.waktu !== undefined ? entry.waktu : (entry.time !== undefined ? entry.time : entry.seconds));
      const rawLangkah = parseInt(entry.langkah !== undefined ? entry.langkah : (entry.moves !== undefined ? entry.moves : entry.steps), 10) || 0;
      const tanggal = entry.tanggal || entry.date || '';

      // Entri di leaderboard hanya yang sudah memiliki catatan waktu sah (waktu > 0)
      if (rawWaktu <= 0) return;

      // Kunci unik: NAMA DINORMALISASI (Satu nama hanya boleh memiliki satu entri di leaderboard)
      const key = normalizePlayerName(rawName);

      if (!playersMap[key]) {
        playersMap[key] = {
          playerId: playerId,
          nama: rawName,
          name: rawName,
          waktu: rawWaktu,
          seconds: rawWaktu,
          langkah: rawLangkah,
          steps: rawLangkah,
          moves: rawLangkah,
          tanggal: tanggal
        };
      } else {
        const curr = playersMap[key];
        const isBetter = (rawWaktu < curr.waktu) || (rawWaktu === curr.waktu && rawLangkah < curr.langkah);
        if (isBetter) {
          playersMap[key] = {
            playerId: playerId || curr.playerId,
            nama: curr.nama,
            name: curr.nama,
            waktu: rawWaktu,
            seconds: rawWaktu,
            langkah: rawLangkah,
            steps: rawLangkah,
            moves: rawLangkah,
            tanggal: tanggal || curr.tanggal
          };
        }
      }
    });

    const list = Object.values(playersMap);

    list.sort((a, b) => {
      // 1. Waktu tercepat (ascending)
      if (a.waktu !== b.waktu) return a.waktu - b.waktu;
      // 2. Langkah paling sedikit (ascending)
      if (a.langkah !== b.langkah) return a.langkah - b.langkah;

      // 3. Tanggal paling awal (siapa yang mencetak skor lebih dulu / timestamp ascending)
      const timeA = a.tanggal ? new Date(a.tanggal).getTime() : 0;
      const timeB = b.tanggal ? new Date(b.tanggal).getTime() : 0;
      if (timeA && timeB && timeA !== timeB) return timeA - timeB;
      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;

      // 4. Nama A-Z (alfabetis ascending)
      const nameA = String(a.nama || a.name || '').trim().toLowerCase();
      const nameB = String(b.nama || b.name || '').trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return list;
  }

  const DEFAULT_LEADERBOARD_SEED = [
    { nama: 'Lulu', waktu: 43, langkah: 26 },
    { nama: 'ridwan', waktu: 43, langkah: 26 },
    { nama: 'amel', waktu: 43, langkah: 26 },
    { nama: 'amel23', waktu: 43, langkah: 26 },
    { nama: 'zaki', waktu: 43, langkah: 26 },
    { nama: 'tomas', waktu: 43, langkah: 26 },
    { nama: 'thomas', waktu: 43, langkah: 26 },
    { nama: 'thomas14', waktu: 43, langkah: 26 },
    { nama: 'ulul23', waktu: 43, langkah: 26 },
    { nama: 'Dimas', waktu: 45, langkah: 27 },
    { nama: 'Sarah', waktu: 46, langkah: 28 },
    { nama: 'Fajar', waktu: 47, langkah: 28 },
    { nama: 'Nabila', waktu: 49, langkah: 29 },
    { nama: 'Kevin', waktu: 50, langkah: 30 },
    { nama: 'Jessica', waktu: 52, langkah: 31 },
    { nama: 'Budi', waktu: 53, langkah: 31 },
    { nama: 'Anita', waktu: 55, langkah: 32 },
    { nama: 'Rizky', waktu: 56, langkah: 33 },
    { nama: 'Putri', waktu: 58, langkah: 34 },
    { nama: 'Daniel', waktu: 59, langkah: 34 },
    { nama: 'Maya', waktu: 61, langkah: 35 },
    { nama: 'Andre', waktu: 63, langkah: 36 },
    { nama: 'Cindy', waktu: 65, langkah: 36 },
    { nama: 'Hendra', waktu: 66, langkah: 37 },
    { nama: 'Tiara', waktu: 68, langkah: 38 },
    { nama: 'Rian', waktu: 70, langkah: 39 },
    { nama: 'Bella', waktu: 72, langkah: 40 },
    { nama: 'Agung', waktu: 74, langkah: 40 },
    { nama: 'Dinda', waktu: 76, langkah: 41 },
    { nama: 'Eko', waktu: 78, langkah: 42 },
    { nama: 'Nadia', waktu: 80, langkah: 43 },
    { nama: 'Gilang', waktu: 82, langkah: 44 },
    { nama: 'Fitri', waktu: 85, langkah: 45 },
    { nama: 'Arif', waktu: 87, langkah: 46 },
    { nama: 'Vina', waktu: 90, langkah: 47 },
    { nama: 'Surya', waktu: 92, langkah: 48 },
    { nama: 'Intan', waktu: 95, langkah: 49 },
    { nama: 'Bayu', waktu: 98, langkah: 50 },
    { nama: 'Clarissa', waktu: 100, langkah: 51 },
    { nama: 'Rendy', waktu: 103, langkah: 52 },
    { nama: 'Ratna', waktu: 106, langkah: 53 },
    { nama: 'Ilham', waktu: 109, langkah: 54 },
    { nama: 'Tari', waktu: 112, langkah: 55 },
    { nama: 'Bagas', waktu: 115, langkah: 56 },
    { nama: 'Wulan', waktu: 118, langkah: 57 },
    { nama: 'Doni', waktu: 122, langkah: 59 },
    { nama: 'Siska', waktu: 126, langkah: 60 },
    { nama: 'Wahyu', waktu: 130, langkah: 62 },
    { nama: 'Tania', waktu: 135, langkah: 64 },
    { nama: 'Yudi', waktu: 140, langkah: 66 }
  ];

  function loadLeaderboard() {
    try {
      const raw = localStorage.getItem(MEMORY_LEADERBOARD_STORAGE_KEY);
      if (!raw) {
        const seedList = normalizeLeaderboardList(DEFAULT_LEADERBOARD_SEED);
        saveLeaderboard(seedList);
        return seedList;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeLeaderboardList(parsed);
      }
      const seedList = normalizeLeaderboardList(DEFAULT_LEADERBOARD_SEED);
      saveLeaderboard(seedList);
      return seedList;
    } catch (e) {
      return normalizeLeaderboardList(DEFAULT_LEADERBOARD_SEED);
    }
  }

  function saveLeaderboard(list) {
    try {
      if (Array.isArray(list)) {
        localStorage.setItem(MEMORY_LEADERBOARD_STORAGE_KEY, JSON.stringify(list.slice(0, 500)));
      }
    } catch (e) { }
  }

  function syncCurrentPlayerBestScoreFromLeaderboard(list) {
    const curId = getStoredPlayerId();
    const curName = getStoredPlayerName();
    const curNameNorm = normalizePlayerName(curName);
    if (!curId && !curNameNorm) return;

    const myEntry = (list || []).find(item => {
      const itemId = String(item.playerId || item.id || '').trim();
      const itemNameNorm = normalizePlayerName(item.nama !== undefined ? item.nama : item.name);
      return Boolean((curNameNorm && itemNameNorm && itemNameNorm === curNameNorm) || (curId && itemId === curId));
    });

    if (myEntry) {
      const remoteWaktu = Number(myEntry.waktu !== undefined ? myEntry.waktu : myEntry.seconds) || 0;
      const remoteLangkah = Number(myEntry.langkah !== undefined ? myEntry.langkah : (myEntry.steps || myEntry.moves)) || 0;
      if (remoteWaktu > 0) {
        const syncedBest = { waktu: remoteWaktu, langkah: remoteLangkah };
        saveMemoryBestScore(syncedBest);
        updateBestScoreDisplay(syncedBest);
      }
    }
  }

  let isUserInteractingWithLeaderboard = false;
  let userScrollTimeout = null;

  function markUserInteracting() {
    isUserInteractingWithLeaderboard = true;
    if (userScrollTimeout) clearTimeout(userScrollTimeout);
    userScrollTimeout = setTimeout(() => {
      isUserInteractingWithLeaderboard = false;
    }, 2500);
  }

  function scrollToCurrentPlayer(force = false) {
    if (!force && isUserInteractingWithLeaderboard) return;

    const tableWrap = document.querySelector('.leaderboard-table-wrap');
    if (!tableWrap) return;

    const currentRow = tableWrap.querySelector('.leaderboard-row.is-current-player');
    if (!currentRow) return;

    const wrapRect = tableWrap.getBoundingClientRect();
    const rowRect = currentRow.getBoundingClientRect();

    const tableHeader = tableWrap.querySelector('.leaderboard-table thead');
    const headerHeight = tableHeader ? tableHeader.offsetHeight : 38;

    // Cek apakah baris "Kamu" berada di luar area yang terlihat
    const isAboveView = (rowRect.top < wrapRect.top + headerHeight);
    const isBelowView = (rowRect.bottom > wrapRect.bottom);

    if (isAboveView || isBelowView) {
      const rowOffsetTop = currentRow.offsetTop;
      const targetScrollTop = Math.max(
        0,
        rowOffsetTop - headerHeight - (tableWrap.clientHeight - headerHeight - currentRow.offsetHeight) / 2
      );

      tableWrap.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }

  function initLeaderboardScrollListeners() {
    const tableWrap = document.querySelector('.leaderboard-table-wrap');
    if (!tableWrap || tableWrap.dataset.scrollListenersAttached) return;

    tableWrap.addEventListener('wheel', markUserInteracting, { passive: true });
    tableWrap.addEventListener('touchstart', markUserInteracting, { passive: true });
    tableWrap.addEventListener('touchmove', markUserInteracting, { passive: true });
    tableWrap.addEventListener('pointerdown', markUserInteracting, { passive: true });
    tableWrap.dataset.scrollListenersAttached = 'true';
  }

  // 4. Tabel Leaderboard (Rank, Nama, Waktu, Langkah) diisi dari fetch GET ke LB_URL
  // 5. Tampilkan status: "Memuat leaderboard...", "Belum ada skor. Jadilah yang pertama!", atau "Leaderboard tidak bisa dimuat sekarang."
  // 6. Tampilkan nama dengan textContent (bukan innerHTML) supaya aman.
  function renderLeaderboard(dataList) {
    if (!leaderboardListBody) return;

    initLeaderboardScrollListeners();

    const list = Array.isArray(dataList) ? dataList : loadLeaderboard();
    syncCurrentPlayerBestScoreFromLeaderboard(list);
    leaderboardListBody.innerHTML = '';

    console.log(`[Leaderboard] Merender leaderboard: ${list.length} pemain ke tabel.`);

    const leaderboardTotalCount = document.getElementById('leaderboard-total-count');

    if (!list || list.length === 0) {
      showLeaderboardStatus('empty', 'Belum ada skor. Jadilah yang pertama!');
      if (leaderboardTotalCount) {
        leaderboardTotalCount.textContent = 'Total 0 pemain';
      }
      syncLeaderboardHeight();
      return;
    }

    if (leaderboardEmpty) leaderboardEmpty.style.display = 'none';

    const curPlayerId = getStoredPlayerId();
    const curPlayerName = getStoredPlayerName();
    const curNameNorm = normalizePlayerName(curPlayerName);

    const fragment = document.createDocumentFragment();

    list.forEach((entry, idx) => {
      const entryId = String(entry.playerId || entry.id || '').trim();
      const entryNameNorm = normalizePlayerName(entry.nama !== undefined ? entry.nama : entry.name);

      // Baris pemain saat ini: cocokkan berdasarkan Player ID ATAU nama pemain aktif
      const isCurrentPlayer = Boolean(
        (curPlayerId && entryId && entryId === curPlayerId) ||
        (curNameNorm && entryNameNorm && entryNameNorm === curNameNorm)
      );

      const tr = document.createElement('tr');
      tr.className = `leaderboard-row rank-${idx + 1}` + (isCurrentPlayer ? ' is-current-player' : '');

      const tdRank = document.createElement('td');
      tdRank.className = 'td-rank';
      if (idx === 0) {
        tdRank.innerHTML = '<span class="rank-badge-circle rank-gold" aria-label="Juara 1">1</span>';
      } else if (idx === 1) {
        tdRank.innerHTML = '<span class="rank-badge-circle rank-silver" aria-label="Juara 2">2</span>';
      } else if (idx === 2) {
        tdRank.innerHTML = '<span class="rank-badge-circle rank-bronze" aria-label="Juara 3">3</span>';
      } else {
        const rankSpan = document.createElement('span');
        rankSpan.className = 'rank-num';
        rankSpan.textContent = String(idx + 1);
        tdRank.appendChild(rankSpan);
      }

      // 6. Tampilkan nama dengan textContent (bukan innerHTML) supaya aman
      const tdName = document.createElement('td');
      tdName.className = 'td-name';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'player-name';
      nameSpan.textContent = String(entry.nama !== undefined ? entry.nama : (entry.name !== undefined ? entry.name : 'Anonim'));
      tdName.appendChild(nameSpan);

      if (isCurrentPlayer) {
        const youBadge = document.createElement('span');
        youBadge.className = 'leaderboard-you-badge';
        youBadge.textContent = 'Kamu';
        tdName.appendChild(youBadge);
      }

      // Waktu dalam format mm:ss
      const tdTime = document.createElement('td');
      tdTime.className = 'td-time';
      const timeSpan = document.createElement('span');
      timeSpan.className = 'score-time';
      const rawWaktu = entry.waktu !== undefined ? entry.waktu : (entry.time !== undefined ? entry.time : entry.seconds);
      timeSpan.textContent = formatScoreTime(rawWaktu);
      tdTime.appendChild(timeSpan);

      // Langkah (moves) sebagai angka
      const tdMoves = document.createElement('td');
      tdMoves.className = 'td-moves';
      const movesSpan = document.createElement('span');
      movesSpan.className = 'score-moves';
      const rawLangkah = entry.langkah !== undefined ? entry.langkah : (entry.moves !== undefined ? entry.moves : entry.steps || 0);
      movesSpan.textContent = String(parseInt(rawLangkah, 10) || 0);
      tdMoves.appendChild(movesSpan);

      tr.appendChild(tdRank);
      tr.appendChild(tdName);
      tr.appendChild(tdTime);
      tr.appendChild(tdMoves);

      fragment.appendChild(tr);
    });

    leaderboardListBody.appendChild(fragment);

    if (leaderboardTotalCount) {
      leaderboardTotalCount.textContent = `Total ${list.length} pemain`;
    }
    syncLeaderboardHeight();

    // Scroll otomatis (halus) ke baris "Kamu" jika berada di luar area yang terlihat
    setTimeout(() => {
      scrollToCurrentPlayer(false);
    }, 200);
  }

  function syncLeaderboardHeight() {
    const lbCardBox = document.querySelector('.leaderboard-card-box');
    const gamePane = document.getElementById('memory-pane-game');
    const lbHeader = document.querySelector('.leaderboard-header');
    if (!lbCardBox) return;

    if (window.innerWidth > 900 && gamePane) {
      const headerHeight = lbHeader ? lbHeader.offsetHeight + 12 : 54;
      const targetHeight = Math.max(340, gamePane.offsetHeight - headerHeight);
      lbCardBox.style.height = `${targetHeight}px`;
    } else {
      lbCardBox.style.height = 'auto';
    }
  }

  window.addEventListener('resize', syncLeaderboardHeight, { passive: true });

  if (typeof ResizeObserver !== 'undefined') {
    const gamePaneEl = document.getElementById('memory-pane-game');
    if (gamePaneEl) {
      const ro = new ResizeObserver(() => {
        syncLeaderboardHeight();
      });
      ro.observe(gamePaneEl);
    }
  }

  // 7. Ambil leaderboard saat halaman dibuka, dan jangan mengambil lebih sering dari sekali per 30 detik
  async function fetchLeaderboard(force = false) {
    if (!LB_URL || typeof fetch !== 'function') return;

    const now = Date.now();
    if (!force && (now - lastLeaderboardFetchTime < LEADERBOARD_FETCH_THROTTLE_MS)) {
      return;
    }
    lastLeaderboardFetchTime = now;

    // Saat menunggu data, tampilkan teks "Memuat leaderboard..." jika belum ada baris skor
    if (!leaderboardListBody || leaderboardListBody.children.length === 0) {
      showLeaderboardStatus('loading', 'Memuat leaderboard...');
    }

    try {
      const res = await fetch(LB_URL, {
        method: 'GET',
        cache: 'no-cache'
      });

      if (!res.ok) {
        const fallbackList = loadLeaderboard();
        if (fallbackList && fallbackList.length > 0) {
          renderLeaderboard(fallbackList);
        } else if (!leaderboardListBody || leaderboardListBody.children.length === 0) {
          showLeaderboardStatus('error', 'Leaderboard tidak bisa dimuat sekarang.');
        }
        return;
      }

      const data = await res.json();
      const rawList = Array.isArray(data) ? data : (data && Array.isArray(data.leaderboard) ? data.leaderboard : null);

      console.log(`[Leaderboard] Diterima dari server Google Sheets (${LB_URL}):`, rawList ? rawList.length : 0, 'pemain.');

      const currentLocal = loadLeaderboard();
      const remoteList = (rawList && rawList.length > 0) ? normalizeLeaderboardList(rawList) : [];
      // Gabungkan data server dengan cache lokal pemain agar tidak hilang tertimpa
      const combined = normalizeLeaderboardList([...remoteList, ...currentLocal]);

      saveLeaderboard(combined);
      renderLeaderboard(combined);
      syncCurrentPlayerBestScoreFromLeaderboard(combined);
      updatePlayerButton();
    } catch (err) {
      console.warn('Gagal memuat leaderboard:', err);
      // Kalau gagal (misal offline/sandbox), tetap tampilkan cache leaderboard lokal dengan mulus
      const fallbackList = loadLeaderboard();
      if (fallbackList && fallbackList.length > 0) {
        renderLeaderboard(fallbackList);
      } else if (!leaderboardListBody || leaderboardListBody.children.length === 0) {
        showLeaderboardStatus('error', 'Leaderboard tidak bisa dimuat sekarang.');
      }
    }
  }

  // 1. Setelah pemain menyelesaikan permainan, sistem mengecek apakah nama pemain sudah terdaftar di Google Sheets.
  // 2. Jika nama belum terdaftar, tambahkan sebagai pemain baru.
  // 3. Jika nama sudah terdaftar, bandingkan hasil permainan terbaru dengan skor terbaik sebelumnya.
  // 4. Jika hasil terbaru lebih baik, perbarui data pada baris pemain yang sama.
  // 5. Jika hasil terbaru lebih buruk, pertahankan skor sebelumnya tanpa membuat perubahan.
  // 6. Setelah proses selesai, ambil ulang data leaderboard terbaru dari Google Sheets.
  async function submitScoreToLeaderboard(playerName, customWaktu, customLangkah) {
    if (hasSubmittedCurrentScore) return;
    if (matchedPairsCount < 10) return;

    // Kirim hanya sekali per permainan
    hasSubmittedCurrentScore = true;

    const playerId = getStoredPlayerId() || generatePlayerId();
    const nama = (playerName || getStoredPlayerName() || 'Anonim').trim().substring(0, 20) || 'Anonim';
    const waktu = Number(customWaktu !== undefined ? customWaktu : memoryElapsedSeconds);
    const langkah = Number(customLangkah !== undefined ? customLangkah : memorySteps);
    const tanggal = new Date().toISOString();

    savePlayerIdentity(playerId, nama);

    // Langsung simpan dan render skor pemain secara instan ke Leaderboard lokal
    const localEntry = {
      playerId: playerId,
      nama: nama,
      name: nama,
      waktu: waktu,
      seconds: waktu,
      langkah: langkah,
      steps: langkah,
      moves: langkah,
      tanggal: tanggal
    };
    const currentListBefore = loadLeaderboard();
    const mergedList = normalizeLeaderboardList([...currentListBefore, localEntry]);
    saveLeaderboard(mergedList);
    renderLeaderboard(mergedList);

    // UI feedback status pada form modal (jika ada)
    if (leaderboardPlayerName) leaderboardPlayerName.disabled = true;
    if (btnSubmitScore) {
      btnSubmitScore.disabled = true;
      btnSubmitScore.textContent = 'Menyimpan...';
    }
    if (leaderboardSubmitMsg) {
      leaderboardSubmitMsg.textContent = 'Menyimpan skor ke Google Sheets...';
    }

    const payload = {
      action: 'submit_score',
      playerId: playerId,
      nama: nama,
      waktu: waktu,
      langkah: langkah,
      tanggal: tanggal
    };

    // Kirim skor ke server Google Sheets via fetch POST mode no-cors
    if (typeof fetch === 'function' && LB_URL) {
      try {
        await fetch(LB_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Gagal mengirim skor ke leaderboard:', err);
      }
    }

    // Beri jeda 1 detik agar Google Apps Script sempat menyimpan row sebelum GET dijalankan
    setTimeout(async () => {
      try {
        await fetchLeaderboard(true);
      } catch (e) { }
    }, 1200);

    if (btnSubmitScore) {
      btnSubmitScore.textContent = 'Tersimpan ✓';
    }
    if (leaderboardSubmitMsg) {
      leaderboardSubmitMsg.textContent = '✓ Skor berhasil disimpan ke Leaderboard!';
    }
    updatePlayerButton();
    announceMemoryLive(`Skor ${nama} berhasil disimpan ke Leaderboard.`);

    // Perbarui peringkat pemain di modal kemenangan
    const currentList = loadLeaderboard();
    const curNorm = normalizePlayerName(nama);
    const playerIdx = currentList.findIndex(item => {
      const itemId = String(item.playerId || item.id || '').trim();
      const itemName = normalizePlayerName(item.nama !== undefined ? item.nama : item.name);
      return Boolean((playerId && itemId === playerId) || (curNorm && itemName === curNorm));
    });

    const rankResult = document.getElementById('memory-rank-result');
    const rankBadge = document.getElementById('memory-rank-badge');
    const rankTotal = document.getElementById('memory-rank-total');

    if (rankResult) rankResult.hidden = false;
    if (rankBadge) {
      rankBadge.textContent = playerIdx !== -1 ? `Kamu berhasil mendapatkan peringkat #${playerIdx + 1}!` : 'Skor berhasil disimpan ke Leaderboard!';
    }
    if (rankTotal) {
      rankTotal.textContent = `Dari ${Math.max(currentList.length, 1)} pemain di Leaderboard.`;
    }
  }

  if (leaderboardSubmitForm) {
    leaderboardSubmitForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (leaderboardPlayerName) {
        submitScoreToLeaderboard(leaderboardPlayerName.value);
      }
    });
  }

  function announceMemoryLive(message) {
    if (!memoryAriaLiveEl) return;
    memoryAriaLiveEl.textContent = '';
    setTimeout(() => {
      if (memoryAriaLiveEl) {
        memoryAriaLiveEl.textContent = message;
      }
    }, 40);
  }

  function openMemoryWinDialog() {
    if (!memoryWinDialog) return;

    document.body.classList.add('memory-dialog-open');

    if (typeof memoryWinDialog.showModal === 'function') {
      if (!memoryWinDialog.open) {
        memoryWinDialog.showModal();
      }
    } else {
      memoryWinDialog.setAttribute('open', '');
    }

    setTimeout(() => {
      if (leaderboardPlayerName && !leaderboardPlayerName.disabled) {
        leaderboardPlayerName.focus();
      } else if (btnMemoryClose) {
        btnMemoryClose.focus();
      }
    }, 40);
  }

  function closeMemoryWinDialog(returnFocusToBoard = true) {
    if (memorySubmitCloseTimeout) {
      clearTimeout(memorySubmitCloseTimeout);
      memorySubmitCloseTimeout = null;
    }
    if (!memoryWinDialog || !memoryWinDialog.open) return;

    document.body.classList.remove('memory-dialog-open');
    memoryWinDialog.classList.add('is-closing');

    setTimeout(() => {
      memoryWinDialog.classList.remove('is-closing');
      if (typeof memoryWinDialog.close === 'function') {
        memoryWinDialog.close();
      } else {
        memoryWinDialog.removeAttribute('open');
      }

      if (returnFocusToBoard) {
        if (btnMemoryBoardRestart && memoryActionBar && memoryActionBar.classList.contains('is-completed')) {
          btnMemoryBoardRestart.focus();
        } else if (memoryBoardGrid) {
          memoryBoardGrid.focus();
        }
      }
    }, 210);
  }

  function updateBottomPanelState() {
    const isCollectionFull = collectedCards.length >= 10;

    // Bar tab SELALU terlihat di atas panel untuk semua pengunjung sejak awal
    if (hobbiesTablist) {
      hobbiesTablist.classList.add('is-visible');
    }

    // Tab "Buka Pack" isinya mengikuti keadaan koleksi:
    if (isCollectionFull) {
      // Koleksi lengkap 10/10: tampilkan layar "Koleksi Lengkap!"
      if (mysteryCardsDisplay) mysteryCardsDisplay.style.display = 'none';
      if (collectionCompleteCard) collectionCompleteCard.classList.add('is-visible');
    } else {
      // Koleksi belum lengkap (atau setelah restart): tampilkan 3 pack
      if (mysteryCardsDisplay) mysteryCardsDisplay.style.display = '';
      if (collectionCompleteCard) collectionCompleteCard.classList.remove('is-visible');
    }

    // Tab yang sedang aktif tidak berubah paksa
    setActiveTab(activeCardTab, false);

    // Perbarui tampilan timer, skor terbaik, pasangan, dan leaderboard
    updateMemoryTimerDisplay();
    renderLeaderboard();
    updateBestScoreDisplay(loadMemoryBestScore());
    if (memoryPairsCountEl) {
      memoryPairsCountEl.textContent = `${matchedPairsCount} / 10`;
    }
  }

  function setActiveTab(tabKey, persist = true) {
    if (tabKey !== 'pack' && tabKey !== 'memory') {
      tabKey = 'pack';
    }
    activeCardTab = tabKey;
    if (persist) {
      saveActiveCardTab(activeCardTab);
      announceMemoryLive('Tab aktif: ' + (activeCardTab === 'memory' ? 'Memory Game' : 'Buka Pack'));
    }

    if (tabPack && tabMemory && panelPack && panelMemory) {
      if (activeCardTab === 'pack') {
        tabPack.classList.add('is-active');
        tabPack.setAttribute('aria-selected', 'true');
        tabPack.setAttribute('tabindex', '0');

        tabMemory.classList.remove('is-active');
        tabMemory.setAttribute('aria-selected', 'false');
        tabMemory.setAttribute('tabindex', '-1');

        panelPack.classList.add('is-active');
        panelPack.removeAttribute('hidden');

        panelMemory.classList.remove('is-active');
        panelMemory.setAttribute('hidden', 'true');
      } else {
        tabMemory.classList.add('is-active');
        tabMemory.setAttribute('aria-selected', 'true');
        tabMemory.setAttribute('tabindex', '0');

        tabPack.classList.remove('is-active');
        tabPack.setAttribute('aria-selected', 'false');
        tabPack.setAttribute('tabindex', '-1');

        panelMemory.classList.add('is-active');
        panelMemory.removeAttribute('hidden');

        panelPack.classList.remove('is-active');
        panelPack.setAttribute('hidden', 'true');

        // Inisialisasi memory game jika belum ada kartu
        if (!memoryCards || memoryCards.length === 0) {
          initMemoryGame();
        }
        fetchLeaderboard(false);
        setTimeout(syncLeaderboardHeight, 60);
      }
    }
  }

  // W3C ARIA Accessible Tabs Navigation (Arrow keys, Home, End, Enter, Space, Click)
  const hobbyTabs = [tabPack, tabMemory].filter(Boolean);
  hobbyTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      const targetKey = tab.id === 'tab-memory' ? 'memory' : 'pack';
      setActiveTab(targetKey, true);
    });

    tab.addEventListener('keydown', (e) => {
      let targetIndex = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        targetIndex = (index + 1) % hobbyTabs.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        targetIndex = (index - 1 + hobbyTabs.length) % hobbyTabs.length;
      } else if (e.key === 'Home') {
        targetIndex = 0;
      } else if (e.key === 'End') {
        targetIndex = hobbyTabs.length - 1;
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const targetKey = tab.id === 'tab-memory' ? 'memory' : 'pack';
        setActiveTab(targetKey, true);
        return;
      }

      if (targetIndex !== null) {
        e.preventDefault();
        const targetTab = hobbyTabs[targetIndex];
        targetTab.focus();
        const targetKey = targetTab.id === 'tab-memory' ? 'memory' : 'pack';
        setActiveTab(targetKey, true);
      }
    });
  });

  // ==========================================================================
  // Memory Game Persistent State (localStorage: lulu-memory-state)
  // ==========================================================================
  function clearMemoryGameState() {
    try {
      localStorage.removeItem(MEMORY_GAME_STATE_STORAGE_KEY);
    } catch (e) { }
  }

  function loadMemoryGameState() {
    try {
      const raw = localStorage.getItem(MEMORY_GAME_STATE_STORAGE_KEY);
      if (!raw) return null;

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        clearMemoryGameState();
        return null;
      }

      if (!parsed || typeof parsed !== 'object') {
        clearMemoryGameState();
        return null;
      }

      // 1. Nomor versi data (version: 1)
      if (parsed.version !== 1) {
        clearMemoryGameState();
        return null;
      }

      // 2. Status permainan: 'playing' atau 'completed'
      if (parsed.status !== 'playing' && parsed.status !== 'completed') {
        clearMemoryGameState();
        return null;
      }

      // 3. Jumlah langkah non-negatif
      if (typeof parsed.steps !== 'number' || !Number.isInteger(parsed.steps) || parsed.steps < 0) {
        clearMemoryGameState();
        return null;
      }

      // 4. Urutan 20 kartu: harus array tepat 20 kartu
      if (!Array.isArray(parsed.cards) || parsed.cards.length !== 20) {
        clearMemoryGameState();
        return null;
      }

      // 5. Semua 10 ID gambar koleksi harus dikenal dan masing-masing tepat 2 kartu
      const keyCounts = {};
      for (let i = 0; i < parsed.cards.length; i++) {
        const k = parsed.cards[i];
        if (!ALBUM_CARD_KEYS.includes(k)) {
          clearMemoryGameState();
          return null;
        }
        keyCounts[k] = (keyCounts[k] || 0) + 1;
      }
      for (let i = 0; i < ALBUM_CARD_KEYS.length; i++) {
        const k = ALBUM_CARD_KEYS[i];
        if (keyCounts[k] !== 2) {
          clearMemoryGameState();
          return null;
        }
      }

      // 6. Kartu yang sudah cocok (matchedIndices)
      if (!Array.isArray(parsed.matchedIndices)) {
        clearMemoryGameState();
        return null;
      }

      const seenIndices = new Set();
      for (let i = 0; i < parsed.matchedIndices.length; i++) {
        const idx = parsed.matchedIndices[i];
        if (typeof idx !== 'number' || !Number.isInteger(idx) || idx < 0 || idx >= 20 || seenIndices.has(idx)) {
          clearMemoryGameState();
          return null;
        }
        seenIndices.add(idx);
      }

      // Jumlah kartu yang cocok harus kelipatan 2 (berpasangan)
      if (parsed.matchedIndices.length % 2 !== 0) {
        clearMemoryGameState();
        return null;
      }

      // Setiap pasangan yang cocok: pasangannya juga harus ada di matchedIndices
      for (let i = 0; i < parsed.matchedIndices.length; i++) {
        const idx = parsed.matchedIndices[i];
        const cardKey = parsed.cards[idx];
        const partnerIdx = parsed.cards.findIndex((k, pIdx) => k === cardKey && pIdx !== idx);
        if (partnerIdx === -1 || !seenIndices.has(partnerIdx)) {
          clearMemoryGameState();
          return null;
        }
      }

      // 7. Konsistensi status: jika status completed, harus 20 kartu cocok
      if (parsed.status === 'completed' && parsed.matchedIndices.length !== 20) {
        clearMemoryGameState();
        return null;
      }

      if (parsed.status === 'playing' && parsed.matchedIndices.length === 20) {
        parsed.status = 'completed';
      }

      return parsed;
    } catch (e) {
      clearMemoryGameState();
      return null;
    }
  }

  function saveMemoryGameState() {
    try {
      if (!memoryCards || memoryCards.length !== 20) return;

      const matchedIndices = [];
      const cardKeys = [];

      for (let i = 0; i < memoryCards.length; i++) {
        const card = memoryCards[i];
        cardKeys.push(card.key);
        if (card.isMatched) {
          matchedIndices.push(i);
        }
      }

      const isCompleted = (matchedIndices.length === 20);

      const state = {
        version: 1,
        status: isCompleted ? 'completed' : 'playing',
        steps: memorySteps,
        elapsedSeconds: memoryElapsedSeconds,
        cards: cardKeys,
        matchedIndices: matchedIndices
      };

      localStorage.setItem(MEMORY_GAME_STATE_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Abaikan jika localStorage tidak tersedia atau penuh (private mode)
    }
  }

  function restoreMemoryGame(savedState) {
    if (!memoryBoardGrid) return;

    // Pastikan modal hasil tertutup (tidak ada popup saat memulihkan halaman)
    closeMemoryWinDialog(false);

    memorySteps = savedState.steps;
    matchedPairsCount = savedState.matchedIndices.length / 2;
    flippedCardIndices = [];
    isMemoryBoardLocked = (savedState.status === 'completed');
    memoryElapsedSeconds = (typeof savedState.elapsedSeconds === 'number' && savedState.elapsedSeconds >= 0)
      ? savedState.elapsedSeconds
      : 0;
    updateMemoryTimerDisplay();

    if (memoryStepsCountEl) {
      memoryStepsCountEl.textContent = String(memorySteps);
    }
    if (memoryPairsCountEl) {
      memoryPairsCountEl.textContent = `${matchedPairsCount} / 10`;
    }
    updateBestScoreDisplay(loadMemoryBestScore());

    if (memoryCompletedActions) {
      memoryCompletedActions.hidden = false;
      memoryCompletedActions.style.display = 'flex';
    }
    updatePlayerButton();
    if (memoryBottomNote) {
      memoryBottomNote.hidden = false;
      memoryBottomNote.style.display = 'block';
    }

    if (savedState.status === 'completed') {
      if (memoryActionBar) {
        memoryActionBar.classList.add('is-completed');
      }
      if (memorySubtitleEl) {
        memorySubtitleEl.textContent = `Selesai dalam ${formatMemoryTime(memoryElapsedSeconds)} (${memorySteps} langkah)!`;
      }
      memoryBoardGrid.classList.add('is-locked');
    } else {
      if (memoryActionBar) {
        memoryActionBar.classList.remove('is-completed');
      }
      if (memorySubtitleEl) {
        memorySubtitleEl.textContent = 'Cocokkan 10 pasang kartu!';
      }
      memoryBoardGrid.classList.remove('is-locked');
    }

    const matchedSet = new Set(savedState.matchedIndices);

    memoryCards = savedState.cards.map((key, idx) => {
      const isMatched = matchedSet.has(idx);
      return {
        index: idx,
        key: key,
        isFlipped: isMatched,
        isMatched: isMatched
      };
    });

    // Render 20 kartu langsung ke papan tanpa animasi balik (is-restored)
    memoryBoardGrid.innerHTML = '';
    memoryCards.forEach((card, idx) => {
      const cardData = POKEMON_CARDS[card.key] || { name: 'Pokemon', image: '' };
      const cardBtn = document.createElement('button');
      cardBtn.type = 'button';
      cardBtn.className = card.isMatched
        ? 'memory-card is-flipped is-matched is-restored'
        : 'memory-card is-restored';
      cardBtn.setAttribute('data-index', String(idx));
      cardBtn.setAttribute(
        'aria-label',
        card.isMatched
          ? `Kartu ${cardData.name} (cocok)`
          : `Kartu tertutup nomor ${idx + 1}`
      );

      cardBtn.innerHTML = `
        <span class="memory-card-q">?</span>
        <span class="memory-card-front">
          <img src="${cardData.image}" alt="${cardData.name}" class="memory-card-img${card.key === 'ultra' ? ' is-ultra' : ''}" draggable="false" />
        </span>
      `;

      cardBtn.addEventListener('click', () => handleMemoryCardClick(idx));
      memoryBoardGrid.appendChild(cardBtn);
    });

    if (savedState.status === 'completed') {
      announceMemoryLive(`Papan Memory Game selesai dipulihkan. Selesai dalam ${memorySteps} langkah.`);
    } else if (matchedPairsCount > 0) {
      announceMemoryLive(`Papan Memory Game dipulihkan. ${matchedPairsCount} pasang cocok, ${memorySteps} langkah.`);
    }
  }

  function initMemoryGame() {
    if (!memoryBoardGrid) return;
    updatePlayerBadgeDisplay();
    syncCurrentPlayerBestScoreFromLeaderboard(loadLeaderboard());
    const savedState = loadMemoryGameState();
    if (savedState) {
      restoreMemoryGame(savedState);
    } else {
      startNewMemoryGame();
    }
    setTimeout(syncLeaderboardHeight, 60);
  }

  // Memory Game Logic: 10 pasang (20 kartu) dari semua kartu koleksi
  function startNewMemoryGame() {
    if (!memoryBoardGrid) return;
    updatePlayerBadgeDisplay();

    // Tutup popup jika masih terbuka dan sembunyikan tombol restart di papan
    closeMemoryWinDialog(false);
    resetMemoryTimer();
    hasSubmittedCurrentScore = false;
    if (memoryActionBar) {
      memoryActionBar.classList.remove('is-completed');
    }
    if (memorySubtitleEl) {
      memorySubtitleEl.textContent = 'Cocokkan 10 pasang kartu!';
    }

    // Reset memory state
    memorySteps = 0;
    matchedPairsCount = 0;
    flippedCardIndices = [];
    isMemoryBoardLocked = false;

    if (memoryStepsCountEl) memoryStepsCountEl.textContent = '0';
    if (memoryPairsCountEl) memoryPairsCountEl.textContent = '0 / 10';
    updateBestScoreDisplay(loadMemoryBestScore());
    if (memoryCompletedActions) {
      memoryCompletedActions.hidden = false;
      memoryCompletedActions.style.display = 'flex';
    }
    updatePlayerButton();
    const btnRestartText = document.getElementById('btn-memory-bottom-restart-text');
    if (btnRestartText) {
      btnRestartText.textContent = 'Ayo Mulai!';
    }
    if (memoryBottomNote) {
      memoryBottomNote.hidden = false;
      memoryBottomNote.style.display = 'block';
    }
    memoryBoardGrid.classList.remove('is-locked');

    // 20 kartu = 10 pasang (semua 10 gambar koleksi digunakan, masing-masing 2 kali)
    const deck = [];
    ALBUM_CARD_KEYS.forEach((key, pairIdx) => {
      deck.push({ key, pairIdx, cardId: pairIdx * 2 });
      deck.push({ key, pairIdx, cardId: pairIdx * 2 + 1 });
    });

    // Acak posisi 20 kartu dengan algoritma Fisher-Yates
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = deck[i];
      deck[i] = deck[j];
      deck[j] = temp;
    }

    memoryCards = deck.map((item, idx) => ({
      index: idx,
      key: item.key,
      isFlipped: false,
      isMatched: false
    }));

    // Render 20 kartu ke papan permainan
    memoryBoardGrid.innerHTML = '';
    memoryCards.forEach((card, idx) => {
      const cardData = POKEMON_CARDS[card.key] || { name: 'Pokemon', image: '' };
      const cardBtn = document.createElement('button');
      cardBtn.type = 'button';
      cardBtn.className = 'memory-card';
      cardBtn.setAttribute('data-index', String(idx));
      cardBtn.setAttribute('aria-label', `Kartu tertutup nomor ${idx + 1}`);

      cardBtn.innerHTML = `
        <span class="memory-card-q">?</span>
        <span class="memory-card-front">
          <img src="${cardData.image}" alt="${cardData.name}" class="memory-card-img${card.key === 'ultra' ? ' is-ultra' : ''}" draggable="false" />
        </span>
      `;

      cardBtn.addEventListener('click', () => handleMemoryCardClick(idx));
      memoryBoardGrid.appendChild(cardBtn);
    });

    // Simpan susunan baru ke localStorage
    saveMemoryGameState();

    announceMemoryLive('Permainan Memory Game dimulai. 20 kartu tertutup di papan.');
  }

  function handleMemoryCardClick(idx) {
    if (isMemoryBoardLocked) return;

    // Pemain wajib memasukkan nama sebelum bisa memulai permainan
    if (!getStoredPlayerId()) {
      openPlayerRegisterDialog();
      return;
    }

    const card = memoryCards[idx];
    if (!card || card.isMatched || card.isFlipped) return;

    // Mulai timer otomatis pada klik kartu pertama jika belum berjalan
    if (!isMemoryTimerRunning && matchedPairsCount < 10) {
      startMemoryTimer();
    }

    const cardBtn = memoryBoardGrid.children[idx];
    if (!cardBtn) return;
    const cardData = POKEMON_CARDS[card.key] || { name: 'Pokemon' };

    // Buka kartu yang diklik
    card.isFlipped = true;
    cardBtn.classList.remove('is-restored');
    cardBtn.classList.add('is-flipped', 'is-animating');
    setTimeout(() => cardBtn.classList.remove('is-animating'), 300);
    cardBtn.setAttribute('aria-label', `Kartu ${cardData.name} (terbuka)`);

    flippedCardIndices.push(idx);

    if (flippedCardIndices.length === 1) {
      // Kartu pertama dibuka pada giliran ini: jangan simpan (tunggu pasangannya)
      announceMemoryLive(`Kartu ${cardData.name} terbuka.`);
      return;
    }

    if (flippedCardIndices.length === 2) {
      // Kartu kedua dibuka: dihitung 1 langkah (1 giliran = 2 kartu)
      memorySteps++;
      if (memoryStepsCountEl) {
        memoryStepsCountEl.textContent = String(memorySteps);
      }

      const firstIdx = flippedCardIndices[0];
      const secondIdx = flippedCardIndices[1];
      const firstCard = memoryCards[firstIdx];
      const secondCard = memoryCards[secondIdx];
      const firstBtn = memoryBoardGrid.children[firstIdx];
      const secondBtn = memoryBoardGrid.children[secondIdx];

      if (firstCard.key === secondCard.key) {
        // PASANGAN COCOK: keduanya tetap terbuka selamanya dan diberi bingkai biru yang lebih tegas
        firstCard.isMatched = true;
        secondCard.isMatched = true;
        matchedPairsCount++;
        if (memoryPairsCountEl) {
          memoryPairsCountEl.textContent = `${matchedPairsCount} / 10`;
        }

        firstBtn.classList.add('is-matched');
        secondBtn.classList.add('is-matched');
        firstBtn.setAttribute('aria-label', `Kartu ${cardData.name} (cocok)`);
        secondBtn.setAttribute('aria-label', `Kartu ${cardData.name} (cocok)`);
        flippedCardIndices = [];

        // Simpan giliran yang cocok ke localStorage
        saveMemoryGameState();

        if (matchedPairsCount === 10) {
          isMemoryBoardLocked = true;
          if (memoryBoardGrid) memoryBoardGrid.classList.add('is-locked');

          // Tunggu sekitar 600 ms (supaya pengunjung sempat melihat kartu terakhir terbuka)
          setTimeout(() => {
            handleMemoryWin();
          }, 600);
        } else {
          announceMemoryLive(`Cocok! Pasangan ${cardData.name} ditemukan.`);
        }
      } else {
        // TIDAK COCOK: Kunci papan selama jeda 800 ms agar kartu lain tidak bisa diklik
        isMemoryBoardLocked = true;
        if (memoryBoardGrid) memoryBoardGrid.classList.add('is-locked');
        announceMemoryLive('Tidak cocok. Kartu akan tertutup kembali.');

        setTimeout(() => {
          firstCard.isFlipped = false;
          secondCard.isFlipped = false;

          if (firstBtn) {
            firstBtn.classList.remove('is-flipped');
            firstBtn.classList.add('is-animating');
            setTimeout(() => firstBtn.classList.remove('is-animating'), 300);
            firstBtn.setAttribute('aria-label', `Kartu tertutup nomor ${firstIdx + 1}`);
          }
          if (secondBtn) {
            secondBtn.classList.remove('is-flipped');
            secondBtn.classList.add('is-animating');
            setTimeout(() => secondBtn.classList.remove('is-animating'), 300);
            secondBtn.setAttribute('aria-label', `Kartu tertutup nomor ${secondIdx + 1}`);
          }

          flippedCardIndices = [];
          isMemoryBoardLocked = false;
          if (memoryBoardGrid) memoryBoardGrid.classList.remove('is-locked');

          // Simpan setelah kartu tidak cocok tertutup kembali (langkah terhitung)
          saveMemoryGameState();
        }, 800);
      }
    }
  }

  function handleMemoryWin() {
    stopMemoryTimer();
    hasSubmittedCurrentScore = false;
    const timeFormatted = formatMemoryTime(memoryElapsedSeconds);
    const steps = memorySteps;
    const waktu = memoryElapsedSeconds;

    const currentBest = loadMemoryBestScore();
    let isNewBest = false;
    if (!currentBest) {
      isNewBest = true;
    } else if (waktu < currentBest.waktu) {
      isNewBest = true;
    } else if (waktu === currentBest.waktu && steps < currentBest.langkah) {
      isNewBest = true;
    }

    if (isNewBest) {
      const newBest = { waktu: waktu, langkah: steps };
      saveMemoryBestScore(newBest);
      updateBestScoreDisplay(newBest);
    } else {
      updateBestScoreDisplay(currentBest);
    }

    // Ambil identitas pemain yang sudah terdaftar
    let playerId = getStoredPlayerId();
    let playerName = getStoredPlayerName();
    if (!playerId) {
      playerId = generatePlayerId();
      playerName = playerName || 'Pemain';
      savePlayerIdentity(playerId, playerName);
    }

    // Otomatis kirim hasil permainan ke Google Sheets
    submitScoreToLeaderboard(playerName, waktu, steps);

    if (memoryWinTitle) {
      memoryWinTitle.textContent = isNewBest ? 'Selamat! Rekor Baru!' : 'Selamat!';
    }

    if (memoryWinDesc) {
      memoryWinDesc.textContent = `Waktu: ${timeFormatted} • Langkah: ${steps}`;
    }

    // Sembunyikan form input manual jika pemain sudah terdaftar
    if (leaderboardSubmitForm) {
      leaderboardSubmitForm.style.display = 'none';
    }

    // Tampilkan hasil peringkat pemain
    const rankResult = document.getElementById('memory-rank-result');
    const rankBadge = document.getElementById('memory-rank-badge');
    const rankTotal = document.getElementById('memory-rank-total');

    const currentList = loadLeaderboard();
    const curNorm = normalizePlayerName(playerName);
    const playerIdx = currentList.findIndex(item => {
      const itemId = String(item.playerId || item.id || '').trim();
      const itemName = normalizePlayerName(item.nama !== undefined ? item.nama : item.name);
      return Boolean((playerId && itemId === playerId) || (curNorm && itemName === curNorm));
    });

    if (rankResult) rankResult.hidden = false;
    if (rankBadge) {
      rankBadge.textContent = playerIdx !== -1 ? `Peringkat kamu saat ini: #${playerIdx + 1}` : 'Menyimpan skor ke Leaderboard...';
    }
    if (rankTotal) {
      rankTotal.textContent = `Dari ${Math.max(currentList.length, 1)} pemain di Leaderboard.`;
    }

    if (memorySubtitleEl) {
      memorySubtitleEl.textContent = `Selesai dalam ${timeFormatted} (${steps} langkah)!`;
    }

    if (memoryCompletedActions) {
      memoryCompletedActions.hidden = false;
      memoryCompletedActions.style.display = 'flex';
    }
    updatePlayerButton();
    const btnRestartText = document.getElementById('btn-memory-bottom-restart-text');
    if (btnRestartText) {
      btnRestartText.textContent = 'Main Lagi';
    }

    if (memoryActionBar) {
      memoryActionBar.classList.add('is-completed');
    }

    saveMemoryGameState();
    openMemoryWinDialog();

    const liveMsg = `Selamat! Kasus terpecahkan dalam waktu ${timeFormatted} dan ${steps} langkah.`;
    announceMemoryLive(liveMsg);
  }

  // Hook tombol "Main Memory Game" di kartu Koleksi Lengkap
  if (btnGotoMemory) {
    btnGotoMemory.addEventListener('click', () => {
      setActiveTab('memory', true);
      if (tabMemory) {
        tabMemory.focus();
      }
      const memoryCard = document.getElementById('memory-game-card');
      if (memoryCard) {
        memoryCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      announceMemoryLive('Berpindah ke tab Memory Game. Permainan siap dimainkan.');
    });
  }

  // Hook tombol "Main Lagi" di popup
  if (btnMemoryRestart) {
    btnMemoryRestart.addEventListener('click', () => {
      closeMemoryWinDialog(false);
      startNewMemoryGame();
    });
  }

  // Hook tombol "Tutup" di popup (hanya menutup popup agar pengunjung bisa melihat papan yang selesai)
  if (btnMemoryClose) {
    btnMemoryClose.addEventListener('click', () => {
      closeMemoryWinDialog(true);
    });
  }

  // Hook tombol "Main Lagi" di papan permainan
  if (btnMemoryBoardRestart) {
    btnMemoryBoardRestart.addEventListener('click', () => {
      startNewMemoryGame();
    });
  }

  // Hook tombol "Restart Game" di area informasi permainan
  if (btnMemoryHeaderRestart) {
    btnMemoryHeaderRestart.addEventListener('click', () => {
      btnMemoryHeaderRestart.classList.add('is-spinning');
      setTimeout(() => {
        btnMemoryHeaderRestart.classList.remove('is-spinning');
      }, 650);
      startNewMemoryGame();
    });
  }

  // Hook tombol aksi di bawah grid Memory Game ("Ayo Main!" / "Main Lagi")
  if (btnMemoryBottomRestart) {
    btnMemoryBottomRestart.addEventListener('click', () => {
      if (!getStoredPlayerId()) {
        // Pemain belum punya Player ID/nama tersimpan: tampilkan popup
        openPlayerRegisterDialog();
      } else {
        // Returning player: langsung mulai game tanpa popup
        closeMemoryWinDialog(false);
        startNewMemoryGame();
      }
    });
  }

  function displayMyRank() {
    const playerId = getStoredPlayerId();
    const playerName = getStoredPlayerName();
    if (!playerId) return;

    const list = loadLeaderboard();
    const playerIdx = list.findIndex(item => {
      const itemId = String(item.playerId || item.id || '').trim();
      return Boolean(playerId && itemId === playerId);
    });

    if (memoryWinTitle) memoryWinTitle.textContent = 'Peringkat Saya';
    if (leaderboardSubmitForm) leaderboardSubmitForm.style.display = 'none';

    const rankResult = document.getElementById('memory-rank-result');
    const rankBadge = document.getElementById('memory-rank-badge');
    const rankTotal = document.getElementById('memory-rank-total');

    if (playerIdx !== -1) {
      const entry = list[playerIdx];
      const bestTime = formatScoreTime(entry.waktu);
      const bestSteps = entry.langkah !== undefined ? entry.langkah : (entry.steps || entry.moves || 0);

      if (memoryWinDesc) {
        memoryWinDesc.textContent = `Pemain: ${entry.nama || playerName} • Rekor: ${bestTime} (${bestSteps} langkah)`;
      }
      if (rankResult) rankResult.hidden = false;
      if (rankBadge) {
        rankBadge.textContent = `Kamu berada di peringkat #${playerIdx + 1}!`;
      }
      if (rankTotal) {
        rankTotal.textContent = `Dari ${list.length} pemain di Leaderboard.`;
      }
    } else {
      if (memoryWinDesc) {
        memoryWinDesc.textContent = `Pemain: ${playerName}`;
      }
      if (rankResult) rankResult.hidden = false;
      if (rankBadge) {
        rankBadge.textContent = 'Kamu belum punya skor. Ayo main dulu!';
      }
      if (rankTotal) {
        rankTotal.textContent = 'Selesaikan 10 pasangan kartu untuk mencatat rekor di Leaderboard!';
      }
    }

    openMemoryWinDialog();
  }

  if (btnMemoryBottomResult) {
    btnMemoryBottomResult.addEventListener('click', () => {
      const playerId = getStoredPlayerId();
      if (!playerId) {
        openPlayerRegisterDialog();
        return;
      }

      displayMyRank();
      setTimeout(() => scrollToCurrentPlayer(true), 150);

      // Ambil peringkat terbaru dari Google Sheets jika tersedia dan perbarui tampilan
      if (LB_URL && typeof fetch === 'function') {
        fetchLeaderboard(true).then(() => {
          if (memoryWinDialog && memoryWinDialog.open && memoryWinTitle && memoryWinTitle.textContent === 'Peringkat Saya') {
            displayMyRank();
          }
          setTimeout(() => scrollToCurrentPlayer(true), 250);
        }).catch(() => { });
      }
    });
  }

  // Hook dialog: Escape key, klik di backdrop gelap luar kotak, dan focus trap
  if (memoryWinDialog) {
    const winContent = memoryWinDialog.querySelector('.memory-dialog-content');
    if (winContent) {
      winContent.addEventListener('click', (e) => e.stopPropagation());
      winContent.addEventListener('mousedown', (e) => e.stopPropagation());
      winContent.addEventListener('mouseup', (e) => e.stopPropagation());
    }

    let isWinBackdropMousedown = false;

    memoryWinDialog.addEventListener('mousedown', (e) => {
      isWinBackdropMousedown = (e.target === memoryWinDialog);
    });

    memoryWinDialog.addEventListener('mouseup', (e) => {
      if (e.target !== memoryWinDialog) {
        isWinBackdropMousedown = false;
      }
    });

    memoryWinDialog.addEventListener('click', (e) => {
      if (isWinBackdropMousedown && e.target === memoryWinDialog) {
        closeMemoryWinDialog(true);
      }
      isWinBackdropMousedown = false;
    });

    memoryWinDialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeMemoryWinDialog(true);
    });

    memoryWinDialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMemoryWinDialog(true);
        return;
      }
      if (e.key === 'Tab') {
        const focusableEls = memoryWinDialog.querySelectorAll('button:not([disabled])');
        if (focusableEls.length === 0) return;
        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    });
  }

  if (leaderboardPlayerName) {
    leaderboardPlayerName.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMemoryWinDialog(true);
        return;
      }
      e.stopPropagation();
    });
    leaderboardPlayerName.addEventListener('keyup', (e) => e.stopPropagation());
  }

  function buildCardFaceHtml(data, isLocked = false) {
    const lockedClass = isLocked ? " is-locked" : "";
    return `<div class="pack-card-inner${lockedClass}"><div class="pack-card-header"><div class="pack-card-name" title="${data.name}">${data.name}</div><div class="pack-card-badge">${data.rarityText}</div></div><div class="pack-card-art"><img src="${data.image}" alt="${data.name}" class="pack-card-img" draggable="false" /></div><div class="pack-card-footer"><div class="pack-card-no">${data.cardNo}</div><div class="pack-card-brand">Lulu's Studio</div></div></div>`;
  }

  function renderCollectionGrid() {
    // 1. Render Game Grid (10 slots di #card-game-grid)
    const gameSlots = document.querySelectorAll("#card-game-grid .pack-card");
    gameSlots.forEach((slot, idx) => {
      const cardKey = ALBUM_CARD_KEYS[idx];
      const data = POKEMON_CARDS[cardKey];
      if (!data) return;

      const isCollected = collectedCards.includes(cardKey);
      slot.setAttribute("data-card", cardKey);

      if (isCollected) {
        slot.setAttribute("data-locked", "false");
        slot.setAttribute("aria-disabled", "false");
        slot.setAttribute("tabindex", "0");
        slot.className = `pack-card revealed card-slot-${idx + 1} tier-${data.rarityTier}`;
        slot.setAttribute("title", `${data.name} [${data.rarityText}] (Terkumpul! Klik untuk melihat)`);
        slot.setAttribute("aria-label", `Kartu ${data.name} - ${data.rarityText}`);
        slot.innerHTML = buildCardFaceHtml(data, false);
      } else {
        slot.removeAttribute("data-locked");
        slot.removeAttribute("aria-disabled");
        slot.removeAttribute("tabindex");
        slot.removeAttribute("title");
        slot.className = "pack-card";
        slot.setAttribute("aria-label", "Slot kartu misteri belum terbuka");
        slot.innerHTML = `<span class="card-slot-q">?</span>`;
      }
    });

    // 2. Render Desktop Preview Overlay Grid (10 slots di #preview-overlay-grid)
    const previewSlots = document.querySelectorAll("#preview-overlay-grid .pack-card");
    previewSlots.forEach((slot, idx) => {
      const cardKey = ALBUM_CARD_KEYS[idx];
      const data = POKEMON_CARDS[cardKey];
      if (!data) return;

      const isCollected = collectedCards.includes(cardKey);
      slot.setAttribute("data-card", cardKey);
      const statusClass = isCollected ? "is-collected" : "is-unowned";
      slot.className = `pack-card is-preview ${statusClass} card-slot-${idx + 1} tier-${data.rarityTier}`;
      slot.removeAttribute("tabindex");
      slot.removeAttribute("title");

      slot.setAttribute("data-locked", "false");
      slot.setAttribute("aria-disabled", "false");
      slot.setAttribute("aria-label", `Preview Kartu ${data.name} - ${data.rarityText}`);
      slot.innerHTML = buildCardFaceHtml(data, false);
    });

    // 3. Render Mobile Preview Strip (10 mini cards di #mobile-preview-strip)
    const mobileMiniSlots = document.querySelectorAll("#mobile-preview-strip .preview-mini-card");
    mobileMiniSlots.forEach((slot, idx) => {
      const cardKey = ALBUM_CARD_KEYS[idx];
      const data = POKEMON_CARDS[cardKey];
      if (!data) return;

      const isCollected = collectedCards.includes(cardKey);
      slot.setAttribute("data-card", cardKey);
      const statusClass = isCollected ? "is-collected" : "is-unowned";
      slot.className = `preview-mini-card ${statusClass} card-slot-${idx + 1} tier-${data.rarityTier}`;
      slot.removeAttribute("tabindex");
      slot.removeAttribute("title");

      slot.setAttribute("aria-label", `Preview Kartu ${data.name} - ${data.rarityText}`);
      slot.innerHTML = buildCardFaceHtml(data, false);
    });
  }

  function addCardToCollection(cardKey) {
    if (!POKEMON_CARDS[cardKey]) return;

    // Catat streak duplikat untuk pity system jika kartu sudah pernah didapatkan
    if (collectedCards.includes(cardKey)) {
      consecutiveDuplicates++;
      return;
    }

    // Kartu baru berhasil didapatkan: reset streak duplikat
    consecutiveDuplicates = 0;

    if (collectedCards.length < 10) {
      collectedCards.push(cardKey);
    }
    saveCollection();
    renderCollectionGrid();
    updateBottomPanelState();
  }

  function populateCard(packKey) {
    const data = POKEMON_CARDS[packKey] || POKEMON_CARDS.pikachu;
    currentPackKey = packKey;
    if (packModalPackName) packModalPackName.textContent = data.packTitle;
    if (cardFrontName) cardFrontName.textContent = data.name;
    const cardFrontBadge = document.getElementById("card-front-badge");
    if (cardFrontBadge) cardFrontBadge.textContent = data.rarityText;
    const cardFrontNo = document.getElementById("card-front-no");
    if (cardFrontNo) cardFrontNo.textContent = data.cardNo;
    if (cardFrontHp) cardFrontHp.textContent = data.hp;
    if (cardFrontImg) {
      cardFrontImg.src = data.image;
      cardFrontImg.alt = data.name;
    }
    if (cardSkillEnergy) cardSkillEnergy.textContent = data.energy;
    if (cardSkillName) cardSkillName.textContent = data.skill;
    if (cardSkillDmg) cardSkillDmg.textContent = data.dmg;
    if (cardFlavorText) cardFlavorText.textContent = data.flavor;
    if (cardRarity) cardRarity.textContent = data.rarity;
    if (cardFrontFace) {
      cardFrontFace.classList.remove("has-animated-gradient");
    }
  }

  function resetPackState() {
    isTorn = false;
    isDragging = false;
    currentDeltaX = 0;

    if (boosterPack) boosterPack.classList.remove('is-torn');
    if (packTopStrip) {
      packTopStrip.classList.remove('is-dragging');
      packTopStrip.style.transform = '';
      packTopStrip.style.opacity = '';
    }
    if (packBodyFoil) {
      packBodyFoil.style.transform = '';
      packBodyFoil.style.opacity = '';
    }
    if (revealedCardContainer) {
      revealedCardContainer.classList.remove('is-emerging', 'is-flipped');
    }
    if (packInstruction) packInstruction.classList.remove('hidden');
    if (packActions) packActions.classList.remove('is-visible');

    document.querySelectorAll('.pack-confetti-particle').forEach(el => el.remove());
  }

  function openPackModal(packKey = null) {
    if (packModal) {
      packModal.classList.remove('is-inspect-mode');
    }
    const chosenKey = packKey && POKEMON_CARDS[packKey] ? packKey : getRandomCardKey();
    populateCard(chosenKey);
    resetPackState();
    if (packModal) {
      packModal.classList.add('active');
      packModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function inspectCardInModal(cardKey) {
    if (!POKEMON_CARDS[cardKey]) return;
    populateCard(cardKey);
    resetPackState();
    if (packModal) {
      packModal.classList.add('is-inspect-mode');
      packModal.classList.add('active');
      packModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    if (revealedCardContainer) {
      revealedCardContainer.classList.add('is-emerging', 'is-flipped');
    }
    if (packActions) {
      packActions.classList.add('is-visible');
    }
  }

  function closePackModal() {
    if (packModal) {
      packModal.classList.remove('active');
      packModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      setTimeout(() => {
        packModal.classList.remove('is-inspect-mode');
        resetPackState();
      }, 400);
    }
  }

  // Hook 3 big mystery cards to open the pack modal
  const mysteryPacks = document.querySelectorAll('.big-mystery-card');
  const mysteryCardLastPicks = ['charmander', 'pikachu', 'quaxly'];
  const mysteryCardDrawnCount = [0, 0, 0];

  mysteryPacks.forEach((packEl, packIdx) => {
    const handleOpen = (e) => {
      e.stopPropagation();
      packEl.classList.add('card-bounce');
      setTimeout(() => packEl.classList.remove('card-bounce'), 600);

      let chosenKey;
      if (mysteryCardDrawnCount[packIdx] === 0) {
        // Tarikan pertama pada tombol ini memakai seed awal yang sudah tersebar
        chosenKey = mysteryCardLastPicks[packIdx];
      } else {
        chosenKey = getRandomCardKey();
      }

      mysteryCardLastPicks[packIdx] = chosenKey;
      mysteryCardDrawnCount[packIdx]++;
      openPackModal(chosenKey);
    };
    packEl.addEventListener('click', handleOpen);
    packEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen(e);
      }
    });
  });

  // "Ayo Buka Pack!" button scrolls smoothly down to the active bottom panel / 3 mystery cards
  const playCardsBtn = document.getElementById('btn-play-cards');
  if (playCardsBtn) {
    playCardsBtn.addEventListener('click', () => {
      const bottomPanel = document.getElementById('hobbies-bottom-panel') || document.getElementById('mystery-cards-display');
      if (bottomPanel) {
        bottomPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Wave bounce animation on the 3 mystery cards if visible
        const mysteryDisplay = document.getElementById('mystery-cards-display');
        if (mysteryDisplay && mysteryDisplay.style.display !== 'none') {
          const mysteryCards = mysteryDisplay.querySelectorAll('.big-mystery-card');
          mysteryCards.forEach((card, idx) => {
            setTimeout(() => {
              card.classList.add('card-bounce');
              setTimeout(() => card.classList.remove('card-bounce'), 650);
            }, 320 + idx * 100);
          });
        }
      }
    });
  }

  // "Restart" button resets the collection grid and localStorage (memory game unlock & best score persist)
  const restartCardsBtn = document.getElementById('btn-restart-cards');
  if (restartCardsBtn) {
    restartCardsBtn.addEventListener('click', () => {
      // Visual feedback: ultra-smooth icon spin without glitch or snap
      const icon = restartCardsBtn.querySelector('.restart-icon');
      restartCardsBtn.classList.add('is-spinning');
      if (icon) {
        const isHovered = restartCardsBtn.matches(':hover');
        const startDeg = isHovered ? -60 : 0;
        if (typeof icon.animate === 'function') {
          icon.animate([
            { transform: `rotate(${startDeg}deg)` },
            { transform: `rotate(${startDeg - 360}deg)` }
          ], {
            duration: 650,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
          });
        }
      }
      restartCardsBtn.classList.add('card-bounce');
      setTimeout(() => {
        restartCardsBtn.classList.remove('is-spinning');
        restartCardsBtn.classList.remove('card-bounce');
      }, 650);

      // Reset collected cards and persist (Status terbuka & skor terbaik memory game tetap aman)
      collectedCards = [];
      consecutiveDuplicates = 0;
      saveCollection();

      // Animate slots returning to ?
      const slots = document.querySelectorAll('#card-game-grid .pack-card');
      slots.forEach((slot, i) => {
        setTimeout(() => {
          slot.classList.add('card-bounce');
          setTimeout(() => slot.classList.remove('card-bounce'), 350);
        }, i * 25);
      });

      renderCollectionGrid();
      updateBottomPanelState();
    });
  }

  // Hook 10 collection slots in Pokemon hobby card game grid
  const collectionSlots = document.querySelectorAll('#card-game-grid .pack-card');
  collectionSlots.forEach((slot) => {
    const handleSlotClick = () => {
      const cardKey = slot.getAttribute('data-card');
      if (cardKey && collectedCards.includes(cardKey) && POKEMON_CARDS[cardKey]) {
        // Jika sudah dapat kartu: perlihatkan detail kartu
        slot.classList.add('card-press');
        setTimeout(() => slot.classList.remove('card-press'), 300);
        inspectCardInModal(cardKey);
      } else {
        // Kartu belum dibuka di grid biasa: efek tekan ringan (umpan balik), tidak ada gaya tersangkut
        slot.classList.add('card-press');
        setTimeout(() => {
          slot.classList.remove('card-press');
          if (document.activeElement === slot) {
            slot.blur();
          }
        }, 250);
      }
    };

    slot.addEventListener('click', handleSlotClick);
    slot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSlotClick();
      }
    });
  });

  // Card Preview Bar: Hover over bar to preview (desktop), Tab focus to preview (keyboard), click does nothing
  const previewBar = document.getElementById('preview-cards-bar');
  const collectionGridContainer = document.getElementById('collection-grid-container');

  if (previewBar && collectionGridContainer) {
    // 1. Mouse hover: tampilan 10 kartu hanya muncul selama kursor berada di atas bar
    previewBar.addEventListener('mouseenter', () => {
      collectionGridContainer.classList.add('is-preview-active');
    });

    previewBar.addEventListener('mouseleave', () => {
      collectionGridContainer.classList.remove('is-preview-active');
    });

    // 2. Keyboard Tab navigation: fokus menampilkan 10 kartu, blur menyembunyikan
    previewBar.addEventListener('focus', () => {
      collectionGridContainer.classList.add('is-preview-active');
    });

    previewBar.addEventListener('blur', () => {
      collectionGridContainer.classList.remove('is-preview-active');
    });

    // Enter atau Spasi toggle preview
    previewBar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        collectionGridContainer.classList.toggle('is-preview-active');
      }
    });

    // 3. Bar bisa diklik atau ditap untuk toggle preview (membantu di mobile & layar sentuh)
    previewBar.addEventListener('click', (e) => {
      e.preventDefault();
      collectionGridContainer.classList.toggle('is-preview-active');
    });
  }

  if (btnClosePackModal) btnClosePackModal.addEventListener('click', closePackModal);
  if (btnInspectClose) btnInspectClose.addEventListener('click', closePackModal);
  if (packModalBackdrop) packModalBackdrop.addEventListener('click', closePackModal);

  // Close modal when clicking or tapping outside the card/buttons (including left and right sides on mobile)
  if (packModal) {
    packModal.addEventListener('click', (e) => {
      if (isDragging) return;
      const isCardOrInteractive = e.target.closest(
        '.booster-pack, .revealed-card-container, .pack-instruction-pill, .card-inspect-pill, .pack-actions, .pack-modal-close'
      );
      if (!isCardOrInteractive) {
        closePackModal();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && packModal && packModal.classList.contains('active')) {
      closePackModal();
    }
  });

  // Drag or Tap interaction for tearing the foil pack (mouse & touch)
  let hasDraggedPack = false;
  if (packTopStrip) {
    packTopStrip.addEventListener('pointerdown', (e) => {
      if (isTorn) return;
      isDragging = true;
      hasDraggedPack = false;
      startX = e.clientX;
      currentDeltaX = 0;
      packTopStrip.classList.add('is-dragging');
      packTopStrip.setPointerCapture(e.pointerId);
    });

    packTopStrip.addEventListener('pointermove', (e) => {
      if (!isDragging || isTorn) return;
      const deltaX = Math.max(0, e.clientX - startX);
      if (deltaX > 6) hasDraggedPack = true;
      currentDeltaX = deltaX;
      const rotation = Math.min(deltaX * 0.08, 16);
      packTopStrip.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
    });

    const handlePointerEnd = (e) => {
      if (!isDragging || isTorn) return;
      isDragging = false;
      packTopStrip.classList.remove('is-dragging');

      const isLandscape = window.matchMedia('(max-width: 932px) and (orientation: landscape)').matches;
      const threshold = isLandscape ? 60 : TEAR_THRESHOLD;

      if (currentDeltaX >= threshold || !hasDraggedPack) {
        completePackTear();
      } else {
        packTopStrip.style.transform = 'translateX(0) rotate(0deg)';
      }
    };

    packTopStrip.addEventListener('pointerup', handlePointerEnd);
    packTopStrip.addEventListener('pointercancel', handlePointerEnd);
  }

  if (boosterPack) {
    boosterPack.addEventListener('click', (e) => {
      if (isTorn || isDragging) return;
      completePackTear();
    });
  }

  function spawnConfetti(container, customCount = 24) {
    if (!container) return;
    const colors = ['#facc15', '#60a5fa', '#38bdf8', '#f43f5e', '#a855f7', '#ffffff'];
    const count = customCount;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'pack-confetti-particle';
      const angle = (Math.PI * 2 * i) / count;
      const distance = 90 + Math.random() * 110;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance - 20;
      const rot = Math.random() * 720 - 360;
      const color = colors[Math.floor(Math.random() * colors.length)];

      particle.style.backgroundColor = color;
      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);
      particle.style.setProperty('--rot', `${rot}deg`);
      particle.style.left = '50%';
      particle.style.top = '45%';
      container.appendChild(particle);

      setTimeout(() => particle.remove(), 1300);
    }
  }

  function completePackTear() {
    isTorn = true;

    // 1. Hide drag instruction
    if (packInstruction) packInstruction.classList.add('hidden');

    // 2. Tear pack open
    if (boosterPack) boosterPack.classList.add('is-torn');

    // 3. Card slides up from pack (back-facing)
    setTimeout(() => {
      if (revealedCardContainer) {
        revealedCardContainer.classList.add('is-emerging');
      }
    }, 280);

    // 4. Smooth 3D Flip to reveal front card with extra confetti for rare pulls!
    setTimeout(() => {
      if (revealedCardContainer) {
        revealedCardContainer.classList.add('is-flipped');
        const cardData = POKEMON_CARDS[currentPackKey];
        let confettiCount = 20;
        if (cardData) {
          if (cardData.rarityTier === 'legendary' || cardData.rarityTier === 'secret-rare') confettiCount = 60;
          else if (cardData.rarityTier === 'rainbow-rare') confettiCount = 50;
          else if (cardData.rarityTier === 'ultra-rare') confettiCount = 38;
          else if (cardData.rarityTier === 'super-rare') confettiCount = 28;
        }
        spawnConfetti(packStage, confettiCount);
      }
      // Add card to 10-slot collection!
      addCardToCollection(currentPackKey);
    }, 780);

    // 5. Show "Buka pack lagi" action button
    setTimeout(() => {
      if (packActions) {
        packActions.classList.add('is-visible');
      }
    }, 1500);
  }

  // "Buka pack lagi" resets state and selects a random new card based on configured pull rates
  if (btnPackAgain) {
    btnPackAgain.addEventListener('click', () => {
      const nextKey = getRandomCardKey();

      if (revealedCardContainer) {
        revealedCardContainer.classList.remove('is-emerging');
      }
      if (packActions) {
        packActions.classList.remove('is-visible');
      }

      setTimeout(() => {
        populateCard(nextKey);
        resetPackState();
      }, 350);
    });
  }

  /* ==========================================================================
     Project Artwork Showcase Modal System (Unified Card-Style Modal & Multi-Slide)
     ========================================================================== */
  const PROJECTS_DATA = [
    {
      title: 'Lato & Aleo',
      type: 'Tipografi',
      no: 'No.001',
      keywords: 'Typography, Typeface, Lato, Aleo, Book, Sans Serif, Serif',
      desc: 'Membuat tipografi pengenalan dua typeface, yaitu Lato dan Aleo, yang memiliki karakteristik berbeda melalui gaya sans serif dan serif. Perancangan ini berfokus pada eksplorasi bentuk huruf, ukuran teks, serta pengaturan komposisi dan tata letak untuk menampilkan keunikan masing-masing typeface dalam satu kesatuan visual yang menarik dan harmonis.',
      slides: [
        {
          type: 'image',
          src: 'assets/image/project/tipografi.jpg',
          alt: 'Tipografi Lato & Aleo Poster',
          subtitle: 'Perkenalan Tipografi Lato & Aleo'
        },
        {
          type: 'flipbook',
          fbId: 'pRE6emkitMz4N1uuScm2',
          subtitle: 'Interactive Book Flipbook Lato & Aleo',
          desc: 'Buku disajikan dalam format flipbook digital interaktif yang memungkinkan setiap halaman dibuka dan dibalik secara virtual. Format ini memberikan gambaran keseluruhan isi buku sekaligus menampilkan detail desain dalam pengalaman membaca yang lebih dinamis.',
          fallbackUrl: 'https://flipbook.so/flip/pRE6emkitMz4N1uuScm2',
          fallbackText: 'Tidak muncul? Buka flipbook di tab baru'
        }
      ]
    },
    {
      title: 'The Science of Spice',
      type: 'Buku',
      no: 'No.002',
      keywords: 'Typography, Typeface, Layout, Book, Redesign, Editorial',
      desc: 'Membuat perancangan ulang desain buku The Science of Spice dalam 10 halaman dengan memperhatikan penyusunan tata letak, hierarki informasi, tipografi, pemilihan warna, serta penggunaan elemen visual. Perancangan ini bertujuan untuk menghadirkan tampilan buku yang lebih menarik, terstruktur, dan memudahkan pembaca dalam memahami informasi yang disajikan.',
      slides: [
        {
          type: 'image',
          src: 'assets/image/project/spice.jpg',
          alt: 'The Science of Spice Cover',
          subtitle: 'Redesain Buku The Science of Spice'
        },
        {
          type: 'video',
          src: 'assets/image/spice/spice.mov',
          subtitle: 'Video Preview The Science of Spice',
          desc: 'Menampilkan hasil akhir perancangan ulang buku The Science of Spice melalui video yang memperlihatkan keseluruhan tampilan buku, mulai dari sampul hingga isi halaman. Video ini memberikan gambaran mengenai penerapan tata letak, tipografi, warna, dan elemen visual dalam desain buku.'
        },
        {
          type: 'flipbook',
          fbId: '0BjYukqT3kjujXekYRbs',
          subtitle: 'Interactive Book The Science of Spice',
          desc: 'Buku disajikan dalam format flipbook digital interaktif yang memungkinkan setiap halaman dibuka dan dibalik secara virtual. Format ini memberikan gambaran keseluruhan isi buku sekaligus menampilkan detail desain dalam pengalaman membaca yang lebih dinamis.',
          fallbackUrl: 'https://flipbook.so/flip/0BjYukqT3kjujXekYRbs',
          fallbackText: 'Tidak muncul? Buka flipbook di tab baru'
        }
      ]
    },
    {
      title: 'Hotel Borobudur',
      type: 'Logo',
      no: 'No.003',
      keywords: 'Logo, Rebranding, Identity, Hotel Borobudur, Corporate',
      desc: 'Membuat perancangan ulang logo Hotel Borobudur dengan tetap mempertahankan identitas dan karakter khas hotel melalui pengembangan bentuk, pemilihan tipografi, serta penyusunan elemen visual. Perancangan ini bertujuan untuk menghadirkan tampilan logo yang lebih modern dan elegan tanpa menghilangkan nilai historis serta kesan ikonik yang dimiliki hotel.',
      slides: [
        {
          type: 'image',
          src: 'assets/image/project/borobudur.png',
          alt: 'Logo Hotel Borobudur',
          subtitle: 'Rebranding Logo Hotel Borobudur'
        },
        {
          type: 'image',
          src: 'assets/image/borobudur/borobudur1.jpeg',
          alt: 'Display Hotel Borobudur Halaman 1',
          subtitle: 'Display (Halaman 1)',
          desc: 'Menampilkan hasil perancangan ulang logo Hotel Borobudur melalui visualisasi pada berbagai media display untuk memperlihatkan penerapan identitas visual serta kesesuaiannya dengan karakter dan citra hotel.'
        },
        {
          type: 'image',
          src: 'assets/image/borobudur/borobudur2.jpeg',
          alt: 'Display Hotel Borobudur Halaman 2',
          subtitle: 'Display (Halaman 2)',
          desc: 'Menampilkan hasil perancangan ulang logo Hotel Borobudur melalui visualisasi pada berbagai media display untuk memperlihatkan penerapan identitas visual serta kesesuaiannya dengan karakter dan citra hotel.'
        },
        {
          type: 'image',
          src: 'assets/image/borobudur/borobudur3.jpeg',
          alt: 'Display Hotel Borobudur Halaman 3',
          subtitle: 'Display (Halaman 3)',
          desc: 'Menampilkan hasil perancangan ulang logo Hotel Borobudur melalui visualisasi pada berbagai media display untuk memperlihatkan penerapan identitas visual serta kesesuaiannya dengan karakter dan citra hotel.'
        },
        {
          type: 'image',
          src: 'assets/image/borobudur/borobudur4.jpeg',
          alt: 'Display Hotel Borobudur Halaman 4',
          subtitle: 'Display (Halaman 4)',
          desc: 'Menampilkan hasil perancangan ulang logo Hotel Borobudur melalui visualisasi pada berbagai media display untuk memperlihatkan penerapan identitas visual serta kesesuaiannya dengan karakter dan citra hotel.'
        },
        {
          type: 'image',
          src: 'assets/image/borobudur/borobudur5.jpeg',
          alt: 'Display Hotel Borobudur Halaman 5',
          subtitle: 'Display (Halaman 5)',
          desc: 'Menampilkan hasil perancangan ulang logo Hotel Borobudur melalui visualisasi pada berbagai media display untuk memperlihatkan penerapan identitas visual serta kesesuaiannya dengan karakter dan citra hotel.'
        },
        {
          type: 'flipbook',
          fbId: 'jk7uwvPEQuUPaZAzCb7Q',
          subtitle: 'Interactive Book Brand Guidelines Hotel Borobudur',
          desc: 'GSM disajikan dalam format flipbook digital interaktif yang memungkinkan setiap halaman dibuka dan dibalik secara virtual. Format ini memberikan gambaran keseluruhan isi buku sekaligus menampilkan detail desain dalam pengalaman membaca yang lebih dinamis.',
          fallbackUrl: 'https://flipbook.so/flip/jk7uwvPEQuUPaZAzCb7Q',
          fallbackText: 'Tidak muncul? Buka flipbook di tab baru'
        }
      ]
    },
    {
      title: 'Grenzy',
      type: 'Packaging',
      no: 'No.004',
      keywords: 'Typography, Typeface, Lato, Aleo, Book, Sans Serif, Serif',
      desc: 'Perancangan kemasan produk vegetable leather sebagai bagian dari proyek kolaborasi bersama mahasiswa Teknologi Pangan. Perancangan ini mencakup pengembangan konsep visual, pemilihan warna, tipografi, serta elemen grafis yang disesuaikan dengan karakteristik produk agar kemasan terlihat menarik sekaligus mampu menyampaikan informasi produk dengan jelas.',
      slides: [
        {
          type: 'image',
          src: 'assets/image/project/grenzy.png',
          alt: 'Grenzy Vegetable Leather Packaging',
          subtitle: 'Pembuatan Packaging Vegetable Leather'
        },
        {
          type: 'image',
          src: 'assets/image/grenzy/grenzy1.jpeg',
          alt: 'Display Grenzy Halaman 1',
          subtitle: 'Display (Halaman 1)',
          desc: 'Menampilkan visualisasi produk Grenzy melalui media display yang dirancang untuk memperkenalkan produk sekaligus memperkuat identitas visualnya. Penataan kemasan, elemen grafis, dan karakter produk disusun secara harmonis untuk menciptakan tampilan yang menarik serta mencerminkan konsep vegetable leather.'
        },
        {
          type: 'image',
          src: 'assets/image/grenzy/grenzy2.jpeg',
          alt: 'Display Grenzy Halaman 2',
          subtitle: 'Display (Halaman 2)',
          desc: 'Menampilkan visualisasi produk Grenzy melalui media display yang dirancang untuk memperkenalkan produk sekaligus memperkuat identitas visualnya. Penataan kemasan, elemen grafis, dan karakter produk disusun secara harmonis untuk menciptakan tampilan yang menarik serta mencerminkan konsep vegetable leather.'
        },
        {
          type: 'image',
          src: 'assets/image/grenzy/grenzy3.jpeg',
          alt: 'Display Grenzy Halaman 3',
          subtitle: 'Display (Halaman 3)',
          desc: 'Menampilkan visualisasi produk Grenzy melalui media display yang dirancang untuk memperkenalkan produk sekaligus memperkuat identitas visualnya. Penataan kemasan, elemen grafis, dan karakter produk disusun secara harmonis untuk menciptakan tampilan yang menarik serta mencerminkan konsep vegetable leather.'
        },
        {
          type: 'image',
          src: 'assets/image/grenzy/grenzy4.jpeg',
          alt: 'Display Grenzy Halaman 4',
          subtitle: 'Display (Halaman 4)',
          desc: 'Menampilkan visualisasi produk Grenzy melalui media display yang dirancang untuk memperkenalkan produk sekaligus memperkuat identitas visualnya. Penataan kemasan, elemen grafis, dan karakter produk disusun secara harmonis untuk menciptakan tampilan yang menarik serta mencerminkan konsep vegetable leather.'
        },
        {
          type: 'image',
          src: 'assets/image/grenzy/grenzy5.jpeg',
          alt: 'Display Grenzy Halaman 5',
          subtitle: 'Display (Halaman 5)',
          desc: 'Menampilkan visualisasi produk Grenzy melalui media display yang dirancang untuk memperkenalkan produk sekaligus memperkuat identitas visualnya. Penataan kemasan, elemen grafis, dan karakter produk disusun secara harmonis untuk menciptakan tampilan yang menarik serta mencerminkan konsep vegetable leather.'
        },
        {
          type: 'image',
          src: 'assets/image/grenzy/grenzy6.jpeg',
          alt: 'Display Grenzy Halaman 6',
          subtitle: 'Display (Halaman 6)',
          desc: 'Menampilkan visualisasi produk Grenzy melalui media display yang dirancang untuk memperkenalkan produk sekaligus memperkuat identitas visualnya. Penataan kemasan, elemen grafis, dan karakter produk disusun secara harmonis untuk menciptakan tampilan yang menarik serta mencerminkan konsep vegetable leather.'
        },
        {
          type: 'image',
          src: 'assets/image/grenzy/grenzy7.jpeg',
          alt: 'Display Grenzy Halaman 7',
          subtitle: 'Display (Halaman 7)',
          desc: 'Menampilkan visualisasi produk Grenzy melalui media display yang dirancang untuk memperkenalkan produk sekaligus memperkuat identitas visualnya. Penataan kemasan, elemen grafis, dan karakter produk disusun secara harmonis untuk menciptakan tampilan yang menarik serta mencerminkan konsep vegetable leather.'
        },
        {
          type: 'image',
          src: 'assets/image/grenzy/grenzy8.jpeg',
          alt: 'Display Grenzy Halaman 8',
          subtitle: 'Display (Halaman 8)',
          desc: 'Menampilkan visualisasi produk Grenzy melalui media display yang dirancang untuk memperkenalkan produk sekaligus memperkuat identitas visualnya. Penataan kemasan, elemen grafis, dan karakter produk disusun secara harmonis untuk menciptakan tampilan yang menarik serta mencerminkan konsep vegetable leather.'
        },
        {
          type: 'image',
          src: 'assets/image/grenzy/grenzy9.jpeg',
          alt: 'Display Grenzy Halaman 9',
          subtitle: 'Display (Halaman 9)',
          desc: 'Menampilkan visualisasi produk Grenzy melalui media display yang dirancang untuk memperkenalkan produk sekaligus memperkuat identitas visualnya. Penataan kemasan, elemen grafis, dan karakter produk disusun secara harmonis untuk menciptakan tampilan yang menarik serta mencerminkan konsep vegetable leather.'
        },
        {
          type: 'image',
          src: 'assets/image/grenzy/grenzy10.jpeg',
          alt: 'Display Grenzy Halaman 10',
          subtitle: 'Display (Halaman 10)',
          desc: 'Menampilkan visualisasi produk Grenzy melalui media display yang dirancang untuk memperkenalkan produk sekaligus memperkuat identitas visualnya. Penataan kemasan, elemen grafis, dan karakter produk disusun secara harmonis untuk menciptakan tampilan yang menarik serta mencerminkan konsep vegetable leather.'
        },
        {
          type: 'image',
          src: 'assets/image/grenzy/grenzy11.jpeg',
          alt: 'Display Grenzy Halaman 11',
          subtitle: 'Display (Halaman 11)',
          desc: 'Menampilkan visualisasi produk Grenzy melalui media display yang dirancang untuk memperkenalkan produk sekaligus memperkuat identitas visualnya. Penataan kemasan, elemen grafis, dan karakter produk disusun secara harmonis untuk menciptakan tampilan yang menarik serta mencerminkan konsep vegetable leather.'
        },
        {
          type: 'image',
          src: 'assets/image/grenzy/grenzy12.jpeg',
          alt: 'Display Grenzy Halaman 12',
          subtitle: 'Display (Halaman 12)',
          desc: 'Menampilkan visualisasi produk Grenzy melalui media display yang dirancang untuk memperkenalkan produk sekaligus memperkuat identitas visualnya. Penataan kemasan, elemen grafis, dan karakter produk disusun secara harmonis untuk menciptakan tampilan yang menarik serta mencerminkan konsep vegetable leather.'
        },
        {
          type: 'video',
          src: 'assets/image/grenzy/grenzy.MOV',
          subtitle: 'Video Preview Packaging Grenzy'
        },
        {
          type: 'flipbook',
          fbId: 'KKIsuzl3C3PH5wYrf88g',
          subtitle: 'Interactive Book Packaging Grenzy',
          desc: 'Progress Book disajikan dalam format flipbook digital interaktif yang memungkinkan setiap halaman dibuka dan dibalik secara virtual. Format ini memberikan gambaran keseluruhan isi buku sekaligus menampilkan detail desain dalam pengalaman membaca yang lebih dinamis.',
          fallbackUrl: 'https://flipbook.so/flip/KKIsuzl3C3PH5wYrf88g',
          fallbackText: 'Tidak muncul? Buka flipbook di tab baru'
        }
      ]
    },
    {
      title: 'Trifold',
      type: 'Brosur',
      no: 'No.005',
      keywords: 'Brochure, Trifold, Print Design, Layout, Graphic Design',
      desc: 'Membuat desain brosur trifold sebagai media penyampaian informasi dengan menyusun konten, mengatur tata letak, memilih tipografi, serta memadukan elemen visual agar informasi tersampaikan dengan jelas dan menarik.',
      slides: [
        {
          type: 'image',
          src: 'assets/image/project/brosurdepan.jpg',
          alt: 'Brosur Trifold Bagian Depan',
          subtitle: 'Pembuatan Brosur Trifold (Tampak Depan)'
        },
        {
          type: 'image',
          src: 'assets/image/project/brosurbelakang.jpg',
          alt: 'Brosur Trifold Bagian Belakang',
          subtitle: 'Pembuatan Brosur Trifold (Tampak Belakang)'
        }
      ]
    },
    {
      title: 'Perspektif 1 Titik',
      type: 'Perspektif',
      no: 'No.006',
      keywords: 'Perspective Drawing, 1 Point Perspective, Interior, Library, Hand Drawing',
      desc: 'Tugas Ujian Praktik SMA (UPRAK) berupa menggambar perspektif satu titik hilang dengan objek interior perpustakaan. Dalam pengerjaannya, memperhatikan bentuk, proporsi, komposisi, serta kedalaman ruang untuk menciptakan kesan ruang yang realistis.',
      image: 'assets/image/project/perspektifsatutitik.jpg',
      tools: ['Manual Drawing', 'Pensil'],
      slides: [
        {
          type: 'image',
          src: 'assets/image/project/perspektifsatutitik.jpg',
          alt: 'Perspektif 1 Titik',
          subtitle: 'Menggambar Perspektif Satu Titik Hilang'
        }
      ]
    }
  ];

  const projectModal = document.getElementById('project-card-modal');
  const projectModalBackdrop = document.getElementById('project-modal-backdrop');
  const btnCloseProjectModal = document.getElementById('btn-close-project-modal');

  /* ==========================================================================
     Reusable Flipbook Modal Dialog System (<dialog>) with Multi-Slide 1-2
     ========================================================================== */
  const flipbookDialog = document.getElementById('flipbook-dialog');
  const btnCloseFlipbook = document.getElementById('flipbook-close-btn');
  const btnPrevSlide = document.getElementById('flipbook-prev-btn');
  const btnNextSlide = document.getElementById('flipbook-next-btn');
  const flipbookSlideIndicator = document.getElementById('flipbook-slide-indicator');
  const flipbookSlideCounter = document.getElementById('flipbook-slide-counter');
  const flipbookIframeContainer = document.getElementById('flipbook-iframe-container');
  const flipbookTitle = document.getElementById('flipbook-dialog-title');
  const flipbookBadge = document.getElementById('flipbook-dialog-badge');
  const flipbookSubtitle = document.getElementById('flipbook-dialog-subtitle');
  const flipbookDesc = document.getElementById('flipbook-dialog-desc');
  const flipbookNo = document.getElementById('flipbook-dialog-no');
  const flipbookKeywordText = document.getElementById('project-dialog-keyword-text');
  const flipbookFallbackLink = document.getElementById('flipbook-fallback-link');

  let currentProjectIndex = 0;
  let currentSlideIndex = 0;

  function renderSlide(projectIdx, slideIdx) {
    const project = PROJECTS_DATA[projectIdx];
    if (!project || !project.slides || project.slides.length === 0) return;

    const totalSlides = project.slides.length;
    slideIdx = (slideIdx + totalSlides) % totalSlides;
    currentSlideIndex = slideIdx;

    const slide = project.slides[slideIdx];

    if (flipbookTitle) {
      flipbookTitle.textContent = project.title || '';
    }
    if (flipbookBadge) {
      flipbookBadge.textContent = project.type || '';
    }
    if (flipbookKeywordText) {
      flipbookKeywordText.textContent = project.keywords || 'Typography, Typeface, Lato, Aleo, Book, Sans Serif, Serif';
    }
    if (flipbookSubtitle) {
      if (slide && slide.subtitle) {
        flipbookSubtitle.style.visibility = 'visible';
        flipbookSubtitle.textContent = slide.subtitle;
      } else {
        flipbookSubtitle.style.visibility = 'hidden';
        flipbookSubtitle.textContent = '';
      }
    }
    if (flipbookDesc) {
      const activeDesc = (slide && slide.desc) ? slide.desc : (project.desc || '');
      flipbookDesc.textContent = activeDesc;
      flipbookDesc.scrollTop = 0;
      flipbookDesc.style.visibility = activeDesc ? 'visible' : 'hidden';
    }
    if (flipbookDialog) {
      const dialogContent = flipbookDialog.querySelector('.flipbook-dialog-content');
      if (dialogContent) {
        dialogContent.scrollTop = 0;
      }
    }
    if (flipbookNo) {
      flipbookNo.textContent = project.no || `No.00${projectIdx + 1}`;
    }

    if (flipbookSlideCounter) {
      flipbookSlideCounter.textContent = `${slideIdx + 1} / ${totalSlides}`;
    }

    if (flipbookDialog) {
      if (totalSlides > 1) {
        flipbookDialog.classList.add('has-multiple-slides');
      } else {
        flipbookDialog.classList.remove('has-multiple-slides');
      }

      if (slide.type === 'flipbook') {
        flipbookDialog.classList.add('is-flipbook-slide');
        flipbookDialog.classList.remove('is-image-slide');
        flipbookDialog.classList.remove('is-video-slide');
      } else if (slide.type === 'video') {
        flipbookDialog.classList.remove('is-flipbook-slide');
        flipbookDialog.classList.remove('is-image-slide');
        flipbookDialog.classList.add('is-video-slide');
      } else {
        flipbookDialog.classList.remove('is-flipbook-slide');
        flipbookDialog.classList.remove('is-video-slide');
        flipbookDialog.classList.add('is-image-slide');
      }
    }

    const fallbackWrapper = flipbookDialog ? flipbookDialog.querySelector('.flipbook-fallback-wrapper') : null;
    if (fallbackWrapper && flipbookFallbackLink) {
      const projectHasFlipbook = Array.isArray(project.slides) && project.slides.some(s => s.type === 'flipbook');
      if (projectHasFlipbook && slide && slide.type === 'flipbook') {
        fallbackWrapper.classList.remove('is-hidden');
        fallbackWrapper.classList.remove('is-removed');
        flipbookFallbackLink.removeAttribute('tabindex');
        flipbookFallbackLink.href = slide.fallbackUrl || (slide.fbId ? `https://flipbook.so/flip/${slide.fbId}` : '#');
        const linkSpan = flipbookFallbackLink.querySelector('span');
        if (linkSpan) {
          linkSpan.textContent = 'Tidak muncul? Buka flipbook di tab baru';
        }
      } else {
        fallbackWrapper.classList.add('is-hidden');
        fallbackWrapper.classList.remove('is-removed');
        flipbookFallbackLink.setAttribute('tabindex', '-1');
      }
    }

    if (flipbookIframeContainer) {
      const existingVideo = flipbookIframeContainer.querySelector('video');
      if (existingVideo && typeof existingVideo.pause === 'function') {
        try {
          existingVideo.pause();
        } catch (e) { }
      }

      if (slide.type === 'flipbook') {
        const embedUrl = `https://flipbook.so/embed/${encodeURIComponent(slide.fbId)}`;
        const safeTitle = (project.title || 'Flipbook').replace(/"/g, '&quot;');
        flipbookIframeContainer.innerHTML = `
          <iframe
            src="${embedUrl}"
            class="flipbook-iframe"
            width="100%"
            height="100%"
            frameborder="0"
            allow="fullscreen; web-share; clipboard-write"
            allowfullscreen
            title="${safeTitle}">
          </iframe>
        `;
      } else if (slide.type === 'video' && slide.src) {
        flipbookIframeContainer.innerHTML = `
          <video
            src="${slide.src}"
            class="flipbook-slide-video"
            controls
            playsinline
            preload="metadata"
            controlslist="nodownload"
            disablepictureinpicture>
            <source src="${slide.src}" type="video/quicktime">
            <source src="${slide.src}" type="video/mp4; codecs=hevc">
            Browser Anda tidak mendukung pemutaran video ini.
          </video>
        `;
      } else if (slide.type === 'image' && slide.src) {
        flipbookIframeContainer.innerHTML = `
          <img
            src="${slide.src}"
            alt="${slide.alt ? slide.alt.replace(/"/g, '&quot;') : (project.title || 'Project Artwork')}"
            class="flipbook-slide-img"
            loading="eager"
            decoding="async"
            draggable="false">
        `;
      } else {
        flipbookIframeContainer.innerHTML = `
          <div class="flipbook-placeholder-inner"></div>
        `;
      }
    }
  }

  let savedPageScrollY = 0;

  function openProjectModalByIndex(projectIdx, startSlideIdx = 0) {
    if (projectIdx < 0 || projectIdx >= PROJECTS_DATA.length) {
      projectIdx = 0;
    }
    const project = PROJECTS_DATA[projectIdx];
    if (!project) return;
    currentProjectIndex = projectIdx;
    currentSlideIndex = startSlideIdx;

    // Save exact scroll position before opening dialog (or calculate from project section)
    const currentY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    if (currentY > 0) {
      savedPageScrollY = currentY;
    } else {
      const projectSec = document.getElementById('project');
      if (projectSec) {
        savedPageScrollY = projectSec.offsetTop - 70;
      }
    }

    renderSlide(currentProjectIndex, currentSlideIndex);

    if (flipbookDialog) {
      try {
        if (!flipbookDialog.open) {
          if (typeof flipbookDialog.showModal === 'function') {
            flipbookDialog.showModal();
          } else {
            flipbookDialog.setAttribute('open', '');
          }
        }
      } catch (err) {
        try {
          flipbookDialog.setAttribute('open', '');
        } catch (e) { }
      }
      document.body.classList.add('flipbook-open');

      // Preserve scroll position so it stays at the projects section
      if (savedPageScrollY > 0) {
        window.scrollTo({ top: savedPageScrollY, left: 0, behavior: 'instant' });
      }

      try {
        sessionStorage.setItem('portfolio_last_section', 'project');
        sessionStorage.setItem('portfolio_last_scroll_y', String(Math.round(savedPageScrollY)));
      } catch (e) { }
      setActiveLink('project', false);
    }
  }

  function closeFlipbookDialog() {
    if (!flipbookDialog) return;

    if (flipbookIframeContainer) {
      const existingVideo = flipbookIframeContainer.querySelector('video');
      if (existingVideo && typeof existingVideo.pause === 'function') {
        try {
          existingVideo.pause();
        } catch (e) { }
      }
      flipbookIframeContainer.innerHTML = '';
    }

    if (typeof flipbookDialog.close === 'function') {
      try {
        flipbookDialog.close();
      } catch (err) {
        flipbookDialog.removeAttribute('open');
      }
    } else {
      flipbookDialog.removeAttribute('open');
    }
    document.body.classList.remove('flipbook-open');

    // Restore exact scroll position to stay at the projects section
    if (savedPageScrollY > 0) {
      window.scrollTo({ top: savedPageScrollY, left: 0, behavior: 'instant' });
    }
    setActiveLink('project', false);
  }

  function openFlipbookFromElement(el) {
    if (!el) return;
    const card = el.closest('.project-card');
    let projectIdx = 0;
    if (card && card.hasAttribute('data-project-index')) {
      projectIdx = parseInt(card.getAttribute('data-project-index'), 10) || 0;
    } else {
      const fbBtn = el.hasAttribute('data-fb') ? el : el.closest('[data-fb]') || el.querySelector('[data-fb]');
      if (fbBtn) {
        const fbId = fbBtn.getAttribute('data-fb');
        const foundIdx = PROJECTS_DATA.findIndex(p => p.slides && p.slides.some(s => s.fbId === fbId));
        if (foundIdx !== -1) projectIdx = foundIdx;
      }
    }
    openProjectModalByIndex(projectIdx, 0);
  }

  if (btnPrevSlide) {
    btnPrevSlide.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      renderSlide(currentProjectIndex, currentSlideIndex - 1);
    });
  }

  if (btnNextSlide) {
    btnNextSlide.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      renderSlide(currentProjectIndex, currentSlideIndex + 1);
    });
  }

  window.addEventListener('keydown', (e) => {
    if (!flipbookDialog || (!flipbookDialog.open && !flipbookDialog.hasAttribute('open'))) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      renderSlide(currentProjectIndex, currentSlideIndex + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      renderSlide(currentProjectIndex, currentSlideIndex - 1);
    }
  });

  if (btnCloseFlipbook) {
    btnCloseFlipbook.addEventListener('click', (e) => {
      e.preventDefault();
      closeFlipbookDialog();
    });
  }

  if (flipbookDialog) {
    // Click outside popup to close (clicking backdrop / outside content box)
    flipbookDialog.addEventListener('click', (e) => {
      if (e.target.closest('#flipbook-prev-btn, #flipbook-next-btn, .flipbook-nav-btn')) {
        return;
      }
      const content = flipbookDialog.querySelector('.flipbook-dialog-content');
      if (content && !content.contains(e.target)) {
        closeFlipbookDialog();
      }
    });

    // Native cancel event when Escape key is pressed
    flipbookDialog.addEventListener('cancel', () => {
      closeFlipbookDialog();
    });

    // Prevent background scrolling when mouse wheel or touch moves on dialog or backdrop
    flipbookDialog.addEventListener('wheel', (e) => {
      const content = flipbookDialog.querySelector('.flipbook-dialog-content');
      if (content && content.contains(e.target)) {
        const isScrollable = content.scrollHeight > content.clientHeight;
        if (!isScrollable) {
          e.preventDefault();
        }
      } else {
        e.preventDefault();
      }
    }, { passive: false });

    flipbookDialog.addEventListener('touchmove', (e) => {
      const content = flipbookDialog.querySelector('.flipbook-dialog-content');
      if (content && content.contains(e.target)) {
        const isScrollable = content.scrollHeight > content.clientHeight;
        if (!isScrollable) {
          e.preventDefault();
        }
      } else {
        e.preventDefault();
      }
    }, { passive: false });
  }

  window.addEventListener('wheel', (e) => {
    if (flipbookDialog && (flipbookDialog.open || flipbookDialog.hasAttribute('open'))) {
      const content = flipbookDialog.querySelector('.flipbook-dialog-content');
      if (!content || !content.contains(e.target) || content.scrollHeight <= content.clientHeight) {
        e.preventDefault();
      }
    }
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (flipbookDialog && (flipbookDialog.open || flipbookDialog.hasAttribute('open'))) {
      const content = flipbookDialog.querySelector('.flipbook-dialog-content');
      if (!content || !content.contains(e.target) || content.scrollHeight <= content.clientHeight) {
        e.preventDefault();
      }
    }
  }, { passive: false });

  function populateProjectModal(projectIdx) {
    const data = PROJECTS_DATA[projectIdx] || PROJECTS_DATA[0];
    const showcaseImg = document.getElementById('showcase-img');
    const showcaseTitle = document.getElementById('showcase-title');
    const showcaseBadge = document.getElementById('showcase-badge');
    const showcaseDesc = document.getElementById('showcase-desc');
    const showcaseTools = document.getElementById('showcase-tools');

    if (showcaseImg) {
      showcaseImg.src = data.image;
      showcaseImg.alt = data.title;
    }
    if (showcaseTitle) showcaseTitle.textContent = data.title;
    if (showcaseBadge) showcaseBadge.textContent = data.type;
    if (showcaseDesc) showcaseDesc.textContent = data.desc;
    if (showcaseTools && Array.isArray(data.tools)) {
      showcaseTools.innerHTML = data.tools
        .map(tool => `<span class="showcase-tool-tag">${tool}</span>`)
        .join('');
    }
  }

  function openProjectModal(index) {
    openProjectModalByIndex(index, 0);
  }

  function closeProjectModal() {
    if (projectModal) {
      projectModal.classList.remove('active');
      projectModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  // Hook all project cards in the grid with interactive 3D tilt, slide/drag, and shiny glare ("mengkilap") animation
  const projectCards = document.querySelectorAll('.project-card');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  projectCards.forEach((card, idx) => {
    const projectIdx = card.getAttribute('data-project-index') !== null && !isNaN(parseInt(card.getAttribute('data-project-index'), 10))
      ? parseInt(card.getAttribute('data-project-index'), 10)
      : idx;
    card.setAttribute('data-project-index', projectIdx);

    let isPointerDown = false;
    let startX = 0;
    let startY = 0;
    let isTouchDrag = false;
    let rafId = null;

    const resetCard = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      card.style.transition = 'transform 0.55s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.55s ease';
      card.style.transform = 'perspective(1800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      card.style.boxShadow = '';
      card.style.setProperty('--glare-opacity', '0');
      card.style.setProperty('--glare-x', '0px');
      card.style.setProperty('--glare-y', '0px');
    };

    const updateTilt = (clientX, clientY, activeDragging = false) => {
      if (prefersReducedMotion.matches) return;
      const rect = card.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

      const xRatio = x / rect.width;
      const yRatio = y / rect.height;

      const offsetX = (xRatio - 0.5) * 2; // -1 (left) to 1 (right)
      const offsetY = (yRatio - 0.5) * 2; // -1 (top) to 1 (bottom)

      // Gentle, subtle tilt angle (tidak terlalu dalam / refined 3D depth)
      const maxTilt = activeDragging ? 8.5 : 6;
      const rotX = -offsetY * maxTilt;
      const rotY = offsetX * maxTilt;
      const scale = activeDragging ? 1.025 : 1.018;

      const shadowX = -offsetX * 14;
      const shadowY = -offsetY * 14 + 10;
      const shadowBlur = 20 + Math.abs(offsetX + offsetY) * 4;

      // Hardware-accelerated glare position that physically tracks the cursor
      const glareX = (offsetX * (rect.width * 0.45)).toFixed(1);
      const glareY = (offsetY * (rect.height * 0.45)).toFixed(1);

      // Subtle dynamic angle tilt following motion (118deg to 126deg)
      const beamAngle = (122 + offsetX * 4).toFixed(1);

      const isMobileNoShadow = window.matchMedia('(max-width: 767px), ((max-width: 932px) and (orientation: landscape))').matches;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        card.style.transition = 'transform 0.08s ease-out, box-shadow 0.08s ease-out';
        card.style.transform = `perspective(1800px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`;
        card.style.boxShadow = isMobileNoShadow ? 'none' : `${shadowX.toFixed(1)}px ${shadowY.toFixed(1)}px ${shadowBlur.toFixed(1)}px rgba(100, 160, 245, 0.32), 0 8px 20px rgba(15, 41, 74, 0.1)`;
        card.style.setProperty('--glare-x', `${glareX}px`);
        card.style.setProperty('--glare-y', `${glareY}px`);
        card.style.setProperty('--beam-angle', `${beamAngle}deg`);
        card.style.setProperty('--glare-opacity', activeDragging ? '0.94' : '0.88');
      });
    };

    // Pointer events (handles mouse hover & click tilt smoothly)
    card.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') {
        updateTilt(e.clientX, e.clientY, false);
      }
    });

    card.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse') {
        updateTilt(e.clientX, e.clientY, isPointerDown);
      }
    });

    card.addEventListener('pointerdown', (e) => {
      isPointerDown = true;
      startX = e.clientX;
      startY = e.clientY;
      isTouchDrag = false;
      if (e.pointerType === 'mouse') {
        updateTilt(e.clientX, e.clientY, true);
      }
    });

    card.addEventListener('pointerup', () => {
      isPointerDown = false;
      resetCard();
    });

    card.addEventListener('pointercancel', () => {
      isPointerDown = false;
      isTouchDrag = false;
      resetCard();
    });

    card.addEventListener('pointerleave', () => {
      isPointerDown = false;
      isTouchDrag = false;
      resetCard();
    });

    // Touch support for mobile swipe gesture detection in slider
    card.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isTouchDrag = false;
      }
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - startX;
        if (Math.abs(dx) > 30) {
          isTouchDrag = true;
        }
      }
    }, { passive: true });

    card.addEventListener('touchend', () => {
      setTimeout(() => {
        isTouchDrag = false;
      }, 80);
    });

    card.addEventListener('click', (e) => {
      if (isTouchDrag) {
        isTouchDrag = false;
        return;
      }
      if (window.matchMedia && window.matchMedia('(hover: none)').matches) {
        const isThumb = e.target.closest('.card-thumb, .card-thumb-btn, [data-fb]');
        if (!isThumb) {
          const wrapper = card.closest('.project-card-wrapper');
          if (wrapper) {
            wrapper.classList.toggle('peek-full');
          }
          return;
        }
      }
      e.preventDefault();
      resetCard();
      openProjectModalByIndex(projectIdx, 0);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        resetCard();
        openProjectModalByIndex(projectIdx, 0);
      }
    });
  });

  // Global delegated click handler for any standalone [data-fb] buttons outside cards
  document.addEventListener('click', (e) => {
    const fbBtn = e.target.closest('[data-fb]');
    if (fbBtn && !fbBtn.closest('.project-card')) {
      e.preventDefault();
      openFlipbookFromElement(fbBtn);
    }
  });

  if (btnCloseProjectModal) btnCloseProjectModal.addEventListener('click', closeProjectModal);
  if (projectModalBackdrop) projectModalBackdrop.addEventListener('click', closeProjectModal);

  if (projectModal) {
    projectModal.addEventListener('click', (e) => {
      const isCardOrInteractive = e.target.closest('.project-showcase-panel, .project-modal-close');
      if (!isCardOrInteractive) {
        closeProjectModal();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && projectModal && projectModal.classList.contains('active')) {
      closeProjectModal();
    }
    if (e.key === 'Escape' && flipbookDialog && (flipbookDialog.open || flipbookDialog.hasAttribute('open'))) {
      closeFlipbookDialog();
    }
  });

  /* ==========================================================================
     Project Images Protection (Exclusively for Project Section & Modals)
     - Prevents context menu (Save image as..., Copy image)
     - Prevents drag-and-drop saving of photos
     - Exclusively scoped to #project and project modal dialogs (#flipbook-dialog, #project-card-modal)
     ========================================================================== */
  const projectSecEl = document.getElementById('project');
  if (projectSecEl) {
    projectSecEl.addEventListener('contextmenu', (e) => {
      if (e.target.tagName === 'IMG' || e.target.closest('.card-thumb, .project-card, .project-pokemon')) {
        e.preventDefault();
        return false;
      }
    });

    projectSecEl.addEventListener('dragstart', (e) => {
      if (e.target.tagName === 'IMG' || e.target.closest('.card-thumb, .project-card, .project-pokemon')) {
        e.preventDefault();
        return false;
      }
    });
  }

  if (flipbookDialog) {
    flipbookDialog.addEventListener('contextmenu', (e) => {
      if (e.target.tagName === 'IMG' || e.target.closest('.flipbook-thumb-frame, .flipbook-iframe-container')) {
        e.preventDefault();
        return false;
      }
    });

    flipbookDialog.addEventListener('dragstart', (e) => {
      if (e.target.tagName === 'IMG' || e.target.closest('.flipbook-thumb-frame, .flipbook-iframe-container')) {
        e.preventDefault();
        return false;
      }
    });
  }

  if (projectModal) {
    projectModal.addEventListener('contextmenu', (e) => {
      if (e.target.tagName === 'IMG' || e.target.closest('.project-showcase-panel, .showcase-img')) {
        e.preventDefault();
        return false;
      }
    });

    projectModal.addEventListener('dragstart', (e) => {
      if (e.target.tagName === 'IMG' || e.target.closest('.project-showcase-panel, .showcase-img')) {
        e.preventDefault();
        return false;
      }
    });
  }



  /* ==========================================================================
     Page Navigation Restoration & Initial Entry Manager
     - On Refresh (Reload) Mobile & Desktop: Returns directly to the last visited place/section
     - On First Mobile Entry: Lands cleanly on Home (#home)
     ========================================================================== */
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  function isPageReload() {
    try {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length > 0) {
        return navEntries[0].type === 'reload';
      }
      if (window.performance && window.performance.navigation) {
        return window.performance.navigation.type === 1; // TYPE_RELOAD
      }
    } catch (e) { }
    try {
      return sessionStorage.getItem('portfolio_session_initialized') === 'true';
    } catch (e) { }
    return false;
  }

  function getTargetSectionId() {
    const currentHash = window.location.hash ? window.location.hash.replace('#', '') : '';
    if (currentHash && document.getElementById(currentHash)) {
      return currentHash;
    }
    try {
      const saved = sessionStorage.getItem('portfolio_last_section');
      if (saved && document.getElementById(saved)) {
        return saved;
      }
    } catch (e) { }
    return null;
  }

  function restoreOrInitializePage() {
    const isMobile = isMobileViewport();
    const isReload = isPageReload();
    const targetId = getTargetSectionId();

    let savedScrollY = null;
    try {
      const rawScrollY = sessionStorage.getItem('portfolio_last_scroll_y');
      if (rawScrollY !== null && !isNaN(Number(rawScrollY))) {
        savedScrollY = parseFloat(rawScrollY);
      }
    } catch (e) { }

    // Mark current session as active
    try {
      sessionStorage.setItem('portfolio_session_initialized', 'true');
    } catch (e) { }

    // Mobile viewport behavior:
    if (isMobile) {
      if (isReload) {
        // Refresh on mobile: Return to the last visited place!
        if (savedScrollY !== null && savedScrollY > 10) {
          window.scrollTo({ top: savedScrollY, left: 0, behavior: 'instant' });
          if (targetId) {
            setActiveLink(targetId, false);
          }
          requestAnimationFrame(() => {
            window.scrollTo({ top: savedScrollY, left: 0, behavior: 'instant' });
          });
          setTimeout(() => {
            window.scrollTo({ top: savedScrollY, left: 0, behavior: 'instant' });
          }, 80);
          return;
        }

        if (targetId && targetId !== 'home') {
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'instant', block: 'start' });
            setActiveLink(targetId, true);
            return;
          }
        }

        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        setActiveLink('home', true);
        return;
      }

      // First initial visit on mobile: strictly land at Home (0, 0)
      window.scrollTo(0, 0);
      setActiveLink('home', true);
      try {
        sessionStorage.setItem('portfolio_last_section', 'home');
        sessionStorage.setItem('portfolio_last_scroll_y', '0');
      } catch (e) { }
      if (window.location.hash && window.location.hash !== '#home') {
        history.replaceState(null, document.title, window.location.pathname + window.location.search);
      }
      return;
    }

    // Desktop view:
    if (isReload && targetId && targetId !== 'home') {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'auto', block: 'start' });
        setActiveLink(targetId, true);
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setActiveLink('home', true);
  }

  // Run restoration immediately
  restoreOrInitializePage();

  // Re-verify after resources load and on pageshow
  window.addEventListener('load', () => {
    const isMobile = isMobileViewport();
    const isReload = isPageReload();

    if (isMobile) {
      if (isReload) {
        let savedScrollY = null;
        try {
          const rawScrollY = sessionStorage.getItem('portfolio_last_scroll_y');
          if (rawScrollY !== null && !isNaN(Number(rawScrollY))) {
            savedScrollY = parseFloat(rawScrollY);
          }
        } catch (e) { }

        if (savedScrollY !== null && savedScrollY > 10) {
          window.scrollTo({ top: savedScrollY, left: 0, behavior: 'instant' });
          return;
        }

        const targetId = getTargetSectionId();
        if (targetId && targetId !== 'home') {
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'instant', block: 'start' });
            setActiveLink(targetId, false);
          }
          return;
        }
      } else {
        window.scrollTo(0, 0);
        setActiveLink('home', true);
      }
      return;
    }

    if (isReload) {
      const targetId = getTargetSectionId();
      if (targetId && targetId !== 'home') {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'auto', block: 'start' });
          setActiveLink(targetId, false);
        }
      }
    }
  });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      restoreOrInitializePage();
    }
  });

  // Handle switching / resizing between desktop and mobile ("pada saat jadi mobile")
  let wasDesktop = !isMobileViewport();
  window.addEventListener('resize', () => {
    const isNowMobile = isMobileViewport();
    if (wasDesktop && isNowMobile) {
      const targetId = getTargetSectionId();
      if (!targetId || targetId === 'about' || targetId === 'home') {
        window.scrollTo(0, 0);
        setActiveLink('home', true);
        try {
          sessionStorage.setItem('portfolio_last_section', 'home');
          sessionStorage.setItem('portfolio_last_scroll_y', '0');
        } catch (e) { }
        if (window.location.hash === '#about') {
          history.replaceState(null, document.title, window.location.pathname + window.location.search);
        }
      }
    }
    wasDesktop = !isNowMobile;
  }, { passive: true });

  // About Section - Pikachu Peek on Touch Devices
  const aboutCardWrapper = document.getElementById('about-card-wrapper');
  if (aboutCardWrapper) {
    aboutCardWrapper.addEventListener('click', (e) => {
      if (window.matchMedia && window.matchMedia('(hover: none)').matches) {
        if (e.target.closest('a, button, input, textarea, select')) {
          return;
        }
        aboutCardWrapper.classList.toggle('peek-full');
      }
    });

    document.addEventListener('click', (e) => {
      if (window.matchMedia && window.matchMedia('(hover: none)').matches) {
        if (!aboutCardWrapper.contains(e.target)) {
          aboutCardWrapper.classList.remove('peek-full');
          aboutCardWrapper.classList.remove('peek');
        }
      }
    });
  }

  // Featured Projects Section - Pokemon Peek on Touch Devices
  const projectCardWrappers = document.querySelectorAll('.project-card-wrapper');
  if (projectCardWrappers.length > 0) {
    document.addEventListener('click', (e) => {
      if (window.matchMedia && window.matchMedia('(hover: none)').matches) {
        projectCardWrappers.forEach((wrapper) => {
          if (!wrapper.contains(e.target)) {
            wrapper.classList.remove('peek-full');
            wrapper.classList.remove('peek');
          }
        });
      }
    });
  }

  // Contact Section - Snorlax Peek on Touch Devices
  const contactCardWrapper = document.getElementById('contact-card-wrapper');
  if (contactCardWrapper) {
    contactCardWrapper.addEventListener('click', (e) => {
      if (window.matchMedia && window.matchMedia('(hover: none)').matches) {
        if (e.target.closest('a, button, input, textarea, select, label')) {
          return;
        }
        contactCardWrapper.classList.toggle('peek-full');
      }
    });

    document.addEventListener('click', (e) => {
      if (window.matchMedia && window.matchMedia('(hover: none)').matches) {
        if (!contactCardWrapper.contains(e.target)) {
          contactCardWrapper.classList.remove('peek-full');
          contactCardWrapper.classList.remove('peek');
        }
      }
    });
  }

  /* ==========================================================================
     Hobbies Section - "Susun & Rakit" Jigsaw Puzzle Game Engine
     ========================================================================== */
  function initJigsawPuzzle() {
    const puzzleArea = document.getElementById('puzzle-game-area');
    if (!puzzleArea) return;

    const boardEl = document.getElementById('puzzle-board');
    const slotsContainer = document.getElementById('puzzle-grid-slots');
    const peekOverlay = document.getElementById('puzzle-peek-overlay');
    const winOverlay = document.getElementById('puzzle-win-overlay');
    const winSummary = document.getElementById('puzzle-win-summary');
    const btnAgain = document.getElementById('btn-puzzle-again');
    const btnReset = document.getElementById('btn-puzzle-reset');
    const btnPeek = document.getElementById('btn-puzzle-peek');
    const timerEl = document.getElementById('puzzle-timer');
    const movesEl = document.getElementById('puzzle-moves');
    const progressEl = document.getElementById('puzzle-progress');
    const bestEl = document.getElementById('puzzle-best');
    const levelBtns = puzzleArea.querySelectorAll('.puzzle-level-btn');

    if (!boardEl || !slotsContainer) return;

    const PUZZLE_LEVELS = {
      easy: { cols: 3, rows: 4, label: 'Easy (4×3)' },
      medium: { cols: 4, rows: 6, label: 'Medium (6×4)' },
      hard: { cols: 6, rows: 8, label: 'Hard (8×6)' }
    };

    const BEST_SCORE_KEYS = {
      easy: 'puzzle_scramble_best_easy',
      medium: 'puzzle_scramble_best_medium',
      hard: 'puzzle_scramble_best_hard'
    };

    let currentLevelKey = 'easy';
    let currentConfig = PUZZLE_LEVELS[currentLevelKey];
    let totalPieces = currentConfig.cols * currentConfig.rows;
    let boardState = []; // boardState[slotIndex] = pieceIndex
    let pieceEdges = []; // pieceEdges[pieceIndex] = { top, right, bottom, left }
    let selectedSlot = null;
    let moves = 0;
    let timerSeconds = 0;
    let timerInterval = null;
    let timerStarted = false;
    let isSolved = false;
    let isPeeking = false;

    // Pointer Drag Tracking
    let activeDragSlot = null;
    let activeDragPiece = null;
    let activePointerId = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let isDragging = false;

    function formatTime(totalSec) {
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }

    function getBestScore(levelKey) {
      try {
        const raw = localStorage.getItem(BEST_SCORE_KEYS[levelKey]);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }

    function saveBestScore(levelKey, time, movesCount) {
      try {
        localStorage.setItem(BEST_SCORE_KEYS[levelKey], JSON.stringify({ time: time, moves: movesCount }));
      } catch (e) {
        // Fallback silently if localStorage is restricted
      }
    }

    function isBetterScore(newTime, newMoves, record) {
      if (!record || typeof record.time !== 'number') return true;
      if (newTime < record.time) return true;
      if (newTime === record.time && newMoves < record.moves) return true;
      return false;
    }

    function updateBestScoreDisplay() {
      if (!bestEl) return;
      const record = getBestScore(currentLevelKey);
      const parent = bestEl.closest('.puzzle-stat-item');
      if (record && typeof record.time === 'number') {
        bestEl.textContent = formatTime(record.time);
        const detail = 'Terbaik: ' + formatTime(record.time) + ' · ' + record.moves + ' langkah';
        bestEl.title = detail;
        if (parent) parent.title = detail;
      } else {
        bestEl.textContent = '-';
        bestEl.title = 'Belum ada rekor';
        if (parent) parent.title = 'Belum ada rekor';
      }
    }

    function startTimer() {
      if (timerStarted) return;
      timerStarted = true;
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        timerSeconds++;
        if (timerEl) {
          timerEl.textContent = formatTime(timerSeconds);
        }
      }, 1000);
    }

    function stopTimer() {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    function resetTimer() {
      stopTimer();
      timerStarted = false;
      timerSeconds = 0;
      if (timerEl) {
        timerEl.textContent = '00:00';
      }
    }

    function getCorrectCount() {
      let count = 0;
      for (let i = 0; i < totalPieces; i++) {
        if (boardState[i] === i) {
          count++;
        }
      }
      return count;
    }

    function updateStats() {
      if (movesEl) {
        movesEl.textContent = String(moves);
      }
      if (progressEl) {
        progressEl.textContent = getCorrectCount() + ' / ' + totalPieces;
      }
      updateBestScoreDisplay();
    }

    function getBoardDimensions() {
      const rect = boardEl.getBoundingClientRect();
      const boardW = rect.width || boardEl.clientWidth || Math.round(300 * (744 / 1039));
      const boardH = rect.height || boardEl.clientHeight || Math.round(boardW * (1039 / 744));
      return { boardW, boardH };
    }

    function getSlotCoords(slotIdx, cellW, cellH, tabSize) {
      const cols = currentConfig.cols;
      const sc = slotIdx % cols;
      const sr = Math.floor(slotIdx / cols);
      return {
        left: sc * cellW - tabSize,
        top: sr * cellH - tabSize
      };
    }

    function buildJigsawPath(w, h, topE, rightE, botE, leftE, tab) {
      const m = tab;
      function edge(x0, y0, x1, y1, dir) {
        if (dir === 0) {
          return 'L ' + x1.toFixed(2) + ' ' + y1.toFixed(2);
        }
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.hypot(dx, dy);
        const nx = -(dy / len) * dir;
        const ny = (dx / len) * dir;

        function pos(u, v) {
          const px = x0 + u * dx + v * tab * nx;
          const py = y0 + u * dy + v * tab * ny;
          return px.toFixed(2) + ' ' + py.toFixed(2);
        }

        return (
          'L ' + pos(0.36, 0.0) + ' ' +
          'C ' + pos(0.38, 0.05) + ', ' + pos(0.33, 0.45) + ', ' + pos(0.38, 0.70) + ' ' +
          'C ' + pos(0.42, 1.05) + ', ' + pos(0.58, 1.05) + ', ' + pos(0.62, 0.70) + ' ' +
          'C ' + pos(0.67, 0.45) + ', ' + pos(0.62, 0.05) + ', ' + pos(0.64, 0.0) + ' ' +
          'L ' + x1.toFixed(2) + ' ' + y1.toFixed(2)
        );
      }

      return [
        'M ' + m.toFixed(2) + ' ' + m.toFixed(2),
        edge(m, m, m + w, m, topE),
        edge(m + w, m, m + w, m + h, rightE),
        edge(m + w, m + h, m, m + h, botE),
        edge(m, m + h, m, m, leftE),
        'Z'
      ].join(' ');
    }

    function generateRandomEdges() {
      const cols = currentConfig.cols;
      const rows = currentConfig.rows;

      const vEdges = [];
      for (let r = 0; r < rows; r++) {
        vEdges[r] = [];
        for (let c = 0; c < cols - 1; c++) {
          vEdges[r][c] = Math.random() < 0.5 ? 1 : -1;
        }
      }

      const hEdges = [];
      for (let r = 0; r < rows - 1; r++) {
        hEdges[r] = [];
        for (let c = 0; c < cols; c++) {
          hEdges[r][c] = Math.random() < 0.5 ? 1 : -1;
        }
      }

      pieceEdges = [];
      for (let p = 0; p < totalPieces; p++) {
        const pr = Math.floor(p / cols);
        const pc = p % cols;
        pieceEdges[p] = {
          top: pr === 0 ? 0 : -hEdges[pr - 1][pc],
          right: pc === cols - 1 ? 0 : vEdges[pr][pc],
          bottom: pr === rows - 1 ? 0 : hEdges[pr][pc],
          left: pc === 0 ? 0 : -vEdges[pr][pc - 1]
        };
      }
    }

    function renderBoard() {
      slotsContainer.innerHTML = '';

      const { boardW, boardH } = getBoardDimensions();
      const cols = currentConfig.cols;
      const rows = currentConfig.rows;
      const cellW = boardW / cols;
      const cellH = boardH / rows;
      const tabSize = Math.round(0.22 * Math.min(cellW, cellH));
      const pieceW = cellW + 2 * tabSize;
      const pieceH = cellH + 2 * tabSize;

      for (let slotIdx = 0; slotIdx < totalPieces; slotIdx++) {
        const pieceIdx = boardState[slotIdx];
        const pc = pieceIdx % cols;
        const pr = Math.floor(pieceIdx / cols);
        const edges = pieceEdges[pieceIdx];
        const pathD = buildJigsawPath(cellW, cellH, edges.top, edges.right, edges.bottom, edges.left, tabSize);
        const coords = getSlotCoords(slotIdx, cellW, cellH, tabSize);

        const imgX = tabSize - pc * cellW;
        const imgY = tabSize - pr * cellH;

        const pieceEl = document.createElement('div');
        pieceEl.className = 'puzzle-piece';
        pieceEl.setAttribute('data-slot', String(slotIdx));
        pieceEl.setAttribute('data-piece', String(pieceIdx));
        pieceEl.setAttribute('role', 'button');
        pieceEl.setAttribute('tabindex', '0');
        pieceEl.setAttribute('aria-label', 'Potongan di kotak ' + (slotIdx + 1) + (pieceIdx === slotIdx ? ' (posisi benar)' : ''));
        pieceEl.style.left = coords.left.toFixed(2) + 'px';
        pieceEl.style.top = coords.top.toFixed(2) + 'px';
        pieceEl.style.width = pieceW.toFixed(2) + 'px';
        pieceEl.style.height = pieceH.toFixed(2) + 'px';

        if (pieceIdx === slotIdx) {
          pieceEl.classList.add('is-correct-slot');
        }

        if (selectedSlot === slotIdx) {
          pieceEl.classList.add('is-selected');
        }

        pieceEl.innerHTML =
          '<svg viewBox="0 0 ' + pieceW.toFixed(2) + ' ' + pieceH.toFixed(2) + '" class="jigsaw-piece-svg" aria-hidden="true">' +
          '<defs>' +
          '<clipPath id="jigsaw-clip-' + pieceIdx + '">' +
          '<path d="' + pathD + '"></path>' +
          '</clipPath>' +
          '</defs>' +
          '<path d="' + pathD + '" class="jigsaw-piece-bg"></path>' +
          '<image href="assets/image/pokemon/cardultra.png" ' +
          'x="' + imgX.toFixed(2) + '" y="' + imgY.toFixed(2) + '" ' +
          'width="' + boardW.toFixed(2) + '" height="' + boardH.toFixed(2) + '" ' +
          'clip-path="url(#jigsaw-clip-' + pieceIdx + ')" ' +
          'preserveAspectRatio="xMidYMid meet"></image>' +
          '<path d="' + pathD + '" class="jigsaw-piece-tint"></path>' +
          '<path d="' + pathD + '" fill="none" class="jigsaw-piece-stroke"></path>' +
          '</svg>';

        pieceEl.addEventListener('pointerdown', handlePointerDown);

        pieceEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const currSlot = parseInt(pieceEl.getAttribute('data-slot'), 10);
            handleSlotTap(currSlot);
          }
        });

        slotsContainer.appendChild(pieceEl);
      }

      updateStats();
    }

    function updatePieceSizing() {
      if (!slotsContainer) return;
      const { boardW, boardH } = getBoardDimensions();
      const cols = currentConfig.cols;
      const rows = currentConfig.rows;
      const cellW = boardW / cols;
      const cellH = boardH / rows;
      const tabSize = Math.round(0.22 * Math.min(cellW, cellH));
      const pieceW = cellW + 2 * tabSize;
      const pieceH = cellH + 2 * tabSize;

      const pieceEls = slotsContainer.querySelectorAll('.puzzle-piece');
      pieceEls.forEach((pieceEl) => {
        const slotIdx = parseInt(pieceEl.getAttribute('data-slot'), 10);
        const pieceIdx = parseInt(pieceEl.getAttribute('data-piece'), 10);
        if (isNaN(slotIdx) || isNaN(pieceIdx)) return;

        const coords = getSlotCoords(slotIdx, cellW, cellH, tabSize);
        pieceEl.style.left = coords.left.toFixed(2) + 'px';
        pieceEl.style.top = coords.top.toFixed(2) + 'px';
        pieceEl.style.width = pieceW.toFixed(2) + 'px';
        pieceEl.style.height = pieceH.toFixed(2) + 'px';

        const pc = pieceIdx % cols;
        const pr = Math.floor(pieceIdx / cols);
        const edges = pieceEdges[pieceIdx];
        if (!edges) return;
        const pathD = buildJigsawPath(cellW, cellH, edges.top, edges.right, edges.bottom, edges.left, tabSize);
        const imgX = tabSize - pc * cellW;
        const imgY = tabSize - pr * cellH;

        const svgEl = pieceEl.querySelector('svg');
        if (svgEl) {
          svgEl.setAttribute('viewBox', '0 0 ' + pieceW.toFixed(2) + ' ' + pieceH.toFixed(2));
          const clipPathD = svgEl.querySelector('clipPath path');
          if (clipPathD) clipPathD.setAttribute('d', pathD);
          const bgPath = svgEl.querySelector('.jigsaw-piece-bg');
          if (bgPath) bgPath.setAttribute('d', pathD);
          const tintPath = svgEl.querySelector('.jigsaw-piece-tint');
          if (tintPath) tintPath.setAttribute('d', pathD);
          const strokePath = svgEl.querySelector('.jigsaw-piece-stroke');
          if (strokePath) strokePath.setAttribute('d', pathD);
          const imgEl = svgEl.querySelector('image');
          if (imgEl) {
            imgEl.setAttribute('x', imgX.toFixed(2));
            imgEl.setAttribute('y', imgY.toFixed(2));
            imgEl.setAttribute('width', boardW.toFixed(2));
            imgEl.setAttribute('height', boardH.toFixed(2));
            imgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          }
        }
      });
    }

    function shuffleState() {
      boardState = [];
      for (let i = 0; i < totalPieces; i++) {
        boardState.push(i);
      }

      let attempts = 0;
      do {
        for (let i = totalPieces - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = boardState[i];
          boardState[i] = boardState[j];
          boardState[j] = temp;
        }
        attempts++;
      } while (getCorrectCount() >= Math.ceil(totalPieces / 2) && attempts < 100);
    }

    function buildBoard(levelKey) {
      currentLevelKey = levelKey || 'easy';
      currentConfig = PUZZLE_LEVELS[currentLevelKey];
      totalPieces = currentConfig.cols * currentConfig.rows;
      selectedSlot = null;
      moves = 0;
      isSolved = false;
      isPeeking = false;
      activeDragSlot = null;
      activeDragPiece = null;
      activePointerId = null;
      isDragging = false;

      resetTimer();

      if (boardEl) {
        boardEl.classList.remove('is-solved');
      }
      if (winOverlay) {
        winOverlay.classList.remove('is-active');
      }
      if (peekOverlay) {
        peekOverlay.classList.remove('is-active');
      }

      levelBtns.forEach((btn) => {
        const isActive = btn.getAttribute('data-level') === currentLevelKey;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      generateRandomEdges();
      shuffleState();
      renderBoard();
      updateBestScoreDisplay();
    }

    function swapSlots(slotA, slotB) {
      if (slotA === slotB || isSolved) return;

      startTimer();
      moves++;

      const pieceA = boardState[slotA];
      const pieceB = boardState[slotB];
      boardState[slotA] = pieceB;
      boardState[slotB] = pieceA;

      selectedSlot = null;

      const { boardW, boardH } = getBoardDimensions();
      const cellW = boardW / currentConfig.cols;
      const cellH = boardH / currentConfig.rows;
      const tabSize = Math.round(0.22 * Math.min(cellW, cellH));

      const coordsA = getSlotCoords(slotA, cellW, cellH, tabSize);
      const coordsB = getSlotCoords(slotB, cellW, cellH, tabSize);

      const elA = slotsContainer.querySelector('.puzzle-piece[data-slot="' + slotA + '"]');
      const elB = slotsContainer.querySelector('.puzzle-piece[data-slot="' + slotB + '"]');

      if (elA && elB) {
        elA.style.left = coordsB.left.toFixed(2) + 'px';
        elA.style.top = coordsB.top.toFixed(2) + 'px';
        elA.setAttribute('data-slot', String(slotB));
        elA.classList.toggle('is-correct-slot', pieceA === slotB);
        elA.classList.remove('is-selected');

        elB.style.left = coordsA.left.toFixed(2) + 'px';
        elB.style.top = coordsA.top.toFixed(2) + 'px';
        elB.setAttribute('data-slot', String(slotA));
        elB.classList.toggle('is-correct-slot', pieceB === slotA);
        elB.classList.remove('is-selected');
      }

      updateStats();
      checkWin();
    }

    function handleSlotTap(slotIdx) {
      if (isSolved) return;

      if (selectedSlot === null) {
        selectedSlot = slotIdx;
        highlightSelected();
      } else if (selectedSlot === slotIdx) {
        selectedSlot = null;
        highlightSelected();
      } else {
        const prevSlot = selectedSlot;
        selectedSlot = null;
        swapSlots(prevSlot, slotIdx);
      }
    }

    function highlightSelected() {
      const pieceEls = slotsContainer.querySelectorAll('.puzzle-piece');
      pieceEls.forEach((el) => {
        const slot = parseInt(el.getAttribute('data-slot'), 10);
        el.classList.toggle('is-selected', slot === selectedSlot);
      });
    }

    // Pointer Events: Seamless Drag & Tap-to-Swap
    function handlePointerDown(e) {
      if (isSolved || isPeeking || (e.button !== undefined && e.button !== 0)) return;

      const pieceEl = e.currentTarget;
      const slotIdx = parseInt(pieceEl.getAttribute('data-slot'), 10);
      if (isNaN(slotIdx)) return;

      activeDragSlot = slotIdx;
      activeDragPiece = pieceEl;
      activePointerId = e.pointerId;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      isDragging = false;

      try {
        pieceEl.setPointerCapture(e.pointerId);
      } catch (err) { }

      window.addEventListener('pointermove', handlePointerMove, { passive: false });
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    }

    function handlePointerMove(e) {
      if (!activeDragPiece || (activePointerId !== null && e.pointerId !== activePointerId)) return;

      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;

      if (!isDragging && Math.hypot(dx, dy) >= 6) {
        isDragging = true;
        if (selectedSlot !== null) {
          selectedSlot = null;
          highlightSelected();
        }
        activeDragPiece.classList.add('is-dragging');
      }

      if (isDragging) {
        e.preventDefault();
        activeDragPiece.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(1.05)';

        // Find target piece under pointer
        const hits = document.elementsFromPoint ? document.elementsFromPoint(e.clientX, e.clientY) : [document.elementFromPoint(e.clientX, e.clientY)];
        let targetPiece = null;
        for (let i = 0; i < hits.length; i++) {
          const p = hits[i] ? hits[i].closest('.puzzle-piece') : null;
          if (p && p !== activeDragPiece && slotsContainer.contains(p)) {
            targetPiece = p;
            break;
          }
        }

        const allPieces = slotsContainer.querySelectorAll('.puzzle-piece');
        allPieces.forEach((p) => {
          if (p !== activeDragPiece) {
            p.classList.toggle('is-drop-target', p === targetPiece);
          }
        });
      }
    }

    function handlePointerUp(e) {
      if (!activeDragPiece || (activePointerId !== null && e.pointerId !== activePointerId)) return;

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      const allPieces = slotsContainer.querySelectorAll('.puzzle-piece');
      allPieces.forEach((p) => p.classList.remove('is-drop-target'));

      try {
        if (activeDragPiece.hasPointerCapture(e.pointerId)) {
          activeDragPiece.releasePointerCapture(e.pointerId);
        }
      } catch (err) { }

      const draggedEl = activeDragPiece;
      const fromSlot = activeDragSlot;

      if (isDragging) {
        isDragging = false;
        draggedEl.classList.remove('is-dragging');

        // Identify target piece dropped onto
        const hits = document.elementsFromPoint ? document.elementsFromPoint(e.clientX, e.clientY) : [document.elementFromPoint(e.clientX, e.clientY)];
        let targetPiece = null;
        for (let i = 0; i < hits.length; i++) {
          const p = hits[i] ? hits[i].closest('.puzzle-piece') : null;
          if (p && p !== draggedEl && slotsContainer.contains(p)) {
            targetPiece = p;
            break;
          }
        }

        activeDragPiece = null;
        activeDragSlot = null;
        activePointerId = null;

        if (targetPiece) {
          const targetSlot = parseInt(targetPiece.getAttribute('data-slot'), 10);
          draggedEl.style.transform = '';
          if (!isNaN(targetSlot) && targetSlot !== fromSlot) {
            swapSlots(fromSlot, targetSlot);
          }
        } else {
          // Snap back smoothly to original slot
          draggedEl.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.4, 1)';
          draggedEl.style.transform = 'translate(0px, 0px)';
          setTimeout(() => {
            draggedEl.style.transition = '';
            draggedEl.style.transform = '';
          }, 200);
        }
      } else {
        // Was a tap/click
        activeDragPiece = null;
        activeDragSlot = null;
        activePointerId = null;
        handleSlotTap(fromSlot);
      }
    }

    function checkWin() {
      if (getCorrectCount() === totalPieces) {
        isSolved = true;
        stopTimer();

        if (boardEl) {
          boardEl.classList.add('is-solved');
        }

        const oldBest = getBestScore(currentLevelKey);
        const isNewRecord = isBetterScore(timerSeconds, moves, oldBest);

        if (isNewRecord) {
          saveBestScore(currentLevelKey, timerSeconds, moves);
          updateBestScoreDisplay();
        }

        setTimeout(() => {
          const badgeEl = winOverlay ? winOverlay.querySelector('.puzzle-win-badge') : null;
          if (badgeEl) {
            badgeEl.textContent = isNewRecord ? 'Rekor Baru!' : 'Puzzle Selesai!';
          }
          if (winSummary) {
            let summaryMsg = 'Waktu: ' + formatTime(timerSeconds) + ' • Langkah: ' + moves;
            if (isNewRecord) {
              summaryMsg += '\nRekor baru! ' + formatTime(timerSeconds) + ' · ' + moves + ' langkah';
            } else if (oldBest) {
              summaryMsg += '\nTerbaik: ' + formatTime(oldBest.time) + ' · ' + oldBest.moves + ' langkah';
            }
            winSummary.textContent = summaryMsg;
          }
          if (winOverlay) {
            winOverlay.classList.add('is-active');
          }
        }, 350);
      }
    }

    // Level buttons listener
    levelBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const levelKey = btn.getAttribute('data-level');
        if (levelKey && PUZZLE_LEVELS[levelKey]) {
          buildBoard(levelKey);
        }
      });
    });

    // Reset button (Acak Ulang)
    if (btnReset) {
      btnReset.addEventListener('click', (e) => {
        e.preventDefault();
        buildBoard(currentLevelKey);
      });
    }

    // Peek button (Lihat Petunjuk - Hover / Touch Hold)
    function showPeek() {
      if (isSolved) return;
      isPeeking = true;
      if (peekOverlay) {
        peekOverlay.classList.add('is-active');
      }
    }

    function hidePeek() {
      isPeeking = false;
      if (peekOverlay) {
        peekOverlay.classList.remove('is-active');
      }
    }

    if (btnPeek) {
      btnPeek.addEventListener('contextmenu', (e) => e.preventDefault());

      // Hover on desktop
      btnPeek.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'mouse') {
          showPeek();
        }
      });
      btnPeek.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'mouse') {
          hidePeek();
        }
      });

      // Press and hold on touch devices
      btnPeek.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse') {
          e.preventDefault();
          showPeek();
        }
      });
      btnPeek.addEventListener('pointerup', (e) => {
        if (e.pointerType !== 'mouse') {
          hidePeek();
        }
      });
      btnPeek.addEventListener('pointercancel', (e) => {
        if (e.pointerType !== 'mouse') {
          hidePeek();
        }
      });

      // Prevent default click
      btnPeek.addEventListener('click', (e) => {
        e.preventDefault();
      });
    }

    // Main Lagi button
    if (btnAgain) {
      btnAgain.addEventListener('click', (e) => {
        e.preventDefault();
        buildBoard(currentLevelKey);
      });
    }

    // Responsive resize listener
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updatePieceSizing();
      }, 100);
    });

    // Initial build
    buildBoard('easy');
  }


  initJigsawPuzzle();

  // Initial render of memory game, leaderboard, collection grid, and bottom panel state
  initMemoryGame();
  renderLeaderboard();
  fetchLeaderboard(true);
  updatePlayerButton();
  renderCollectionGrid();
  updateBottomPanelState();
});
