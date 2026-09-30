(() => {
  "use strict";

  const header = document.getElementById("siteHeader");
  const navToggle = document.getElementById("navToggle");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header scroll state ---------- */
  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile nav toggle ---------- */
  navToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
  document.querySelectorAll(".main-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      header.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- GSAP animations ---------- */
  if (window.gsap) {
    gsap.registerPlugin(ScrollTrigger);
    document.body.classList.add("js-ready");

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      /* Hero entrance */
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl
        .from("#heroLogo", { opacity: 0, y: 24, scale: 0.96, duration: 0.9 })
        .from("#heroTitle", { opacity: 0, y: 24, duration: 0.8 }, "-=0.55")
        .from("#heroSub", { opacity: 0, y: 20, duration: 0.7 }, "-=0.5")
        .from("#heroActions", { opacity: 0, y: 16, duration: 0.6 }, "-=0.45");

      /* Category headers */
      gsap.utils.toArray(".category-head").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 32,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
        });
      });

      /* Product cards stagger */
      gsap.utils.toArray(".product-grid").forEach((grid) => {
        const cards = grid.querySelectorAll(".product-card");
        gsap.from(cards, {
          opacity: 0,
          y: 36,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: grid, start: "top 85%", once: true },
        });
      });

      /* Intro strip numbers */
      gsap.from(".intro-item", {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: ".intro-strip", start: "top 90%", once: true },
      });

      /* CTA band */
      gsap.from(".cta-inner > *", {
        opacity: 0,
        y: 24,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: ".cta-band", start: "top 80%", once: true },
      });

      /* Footer disclaimer */
      gsap.from(".disclaimer", {
        opacity: 0,
        y: 16,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: { trigger: ".disclaimer", start: "top 92%", once: true },
      });
    });
  }
})();
