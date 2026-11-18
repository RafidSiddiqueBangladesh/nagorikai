import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

export function ensureGsapRegistered() {
  if (typeof window !== 'undefined' && !registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
}

export function isMotionReduced(userReducedMotion = false): boolean {
  if (userReducedMotion) return true;
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function runHeroAndSectionAnimations(
  root: HTMLElement | null,
  reducedMotion = false,
): () => void {
  if (!root) return () => {};
  ensureGsapRegistered();

  if (isMotionReduced(reducedMotion)) {
    return () => {};
  }

  const ctx = gsap.context(() => {
    // 1. Hero entrance choreography
    const heroItems = root.querySelectorAll('.gsap-hero-item');
    if (heroItems.length > 0) {
      gsap.fromTo(
        heroItems,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        },
      );
    }

    const heroVisual = root.querySelectorAll('.gsap-hero-visual');
    if (heroVisual.length > 0) {
      gsap.fromTo(
        heroVisual,
        { y: 22, scale: 0.97, opacity: 0 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 0.85,
          delay: 0.15,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        },
      );
    }

    // 2. Subtle ambient floating elements
    root.querySelectorAll('.gsap-float-slow').forEach((el, idx) => {
      gsap.to(el, {
        y: idx % 2 === 0 ? -10 : 10,
        x: idx % 2 === 0 ? 6 : -6,
        duration: 4.5 + idx * 0.7,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });

    // 3. Animated numeric counters
    root.querySelectorAll<HTMLElement>('[data-gsap-count]').forEach((el) => {
      const target = Number(el.dataset.gsapCount || '0');
      const suffix = el.dataset.gsapSuffix || '';
      const prefix = el.dataset.gsapPrefix || '';
      if (!Number.isFinite(target) || target <= 0) return;

      const tracker = { value: 0 };
      gsap.to(tracker, {
        value: target,
        duration: 1.3,
        delay: 0.2,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = `${prefix}${Math.round(tracker.value).toLocaleString()}${suffix}`;
        },
      });
    });

    // 4. Scroll-triggered section reveals
    root.querySelectorAll<HTMLElement>('.gsap-reveal').forEach((section) => {
      gsap.fromTo(
        section,
        { y: 26, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: section,
            start: 'top 88%',
            once: true,
          },
        },
      );
    });

    // 5. Scroll-triggered staggered grids
    root.querySelectorAll<HTMLElement>('.gsap-stagger-grid').forEach((grid) => {
      const children = Array.from(grid.children);
      if (children.length === 0) return;
      gsap.fromTo(
        children,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.06,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: grid,
            start: 'top 88%',
            once: true,
          },
        },
      );
    });

    // 6. Scroll-triggered horizontal progress sweeps
    root.querySelectorAll<HTMLElement>('.gsap-bar-fill').forEach((bar) => {
      gsap.fromTo(
        bar,
        { scaleX: 0, transformOrigin: 'left center' },
        {
          scaleX: 1,
          duration: 0.9,
          ease: 'power3.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: bar,
            start: 'top 92%',
            once: true,
          },
        },
      );
    });
  }, root);

  return () => ctx.revert();
}

export function runViewTransition(
  el: HTMLElement | null,
  reducedMotion = false,
): () => void {
  if (!el || isMotionReduced(reducedMotion)) return () => {};
  ensureGsapRegistered();

  const ctx = gsap.context(() => {
    gsap.fromTo(
      el,
      { y: 14, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.36,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      },
    );
  }, el);

  return () => ctx.revert();
}
