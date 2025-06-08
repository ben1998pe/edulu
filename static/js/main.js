document.addEventListener('DOMContentLoaded', () => {
  // Animaciones fade-in
  gsap.utils.toArray('.fade-in').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });
  });

  // Partículas.js
  particlesJS("particles-js", {
    particles: {
      number: { value: 80 },
      size: { value: 3 },
      color: { value: "#6366f1" },
      line_linked: { enable: true, color: "#6366f1" },
      move: { enable: true, speed: 1 }
    },
    interactivity: {
      events: {
        onhover: { enable: true, mode: "repulse" }
      }
    }
  });
});
