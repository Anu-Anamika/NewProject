// SleepCare AI — Home page interactions
// Scroll-triggered animations with IntersectionObserver.
// No external dependencies required.

(function () {
  'use strict';

  // -----------------------------------------------------------------------
  // Scroll-reveal animations using IntersectionObserver
  // -----------------------------------------------------------------------
  function initScrollAnimations() {
    var elements = document.querySelectorAll('.sca-animate');
    if (!elements.length) return;

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(function (el) {
        el.classList.add('sca-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('sca-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // -----------------------------------------------------------------------
  // Smooth navbar background transition on scroll
  // -----------------------------------------------------------------------
  function initNavbarScroll() {
    var navbar = document.querySelector('.sca-navbar');
    if (!navbar) return;

    function updateNavbar() {
      if (window.scrollY > 20) {
        navbar.classList.add('sca-navbar-scrolled');
      } else {
        navbar.classList.remove('sca-navbar-scrolled');
      }
    }

    window.addEventListener('scroll', updateNavbar, { passive: true });
    updateNavbar();
  }

  // -----------------------------------------------------------------------
  // Circular progress indicator for glassmorphism card
  // -----------------------------------------------------------------------
  function initCircleProgress() {
    var circle = document.querySelector('.sca-circle-progress');
    if (!circle) return;

    var radius = 19;
    var circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = circumference;
    // 8/10 = 80%
    circle.style.strokeDashoffset = circumference - (0.8 * circumference);
  }

  // -----------------------------------------------------------------------
  // Initialize everything
  // -----------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    initScrollAnimations();
    initNavbarScroll();
    initCircleProgress();
  });
})();
