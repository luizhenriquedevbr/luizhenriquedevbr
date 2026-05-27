const navbar = document.getElementById("navbar");

if (navbar) {
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  });
}

const supportsMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (supportsMotion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 },
  );

  document.querySelectorAll(".solution-card").forEach((element, index) => {
    element.style.transitionDelay = `${index * 0.06}s`;
    element.classList.add("fade-in");
    observer.observe(element);
  });
}
