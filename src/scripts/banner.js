export function initialize(isEnglishPage) {
  const banner = document.querySelector(".home-banner");
  if (banner) {
    const heroImage = banner.querySelector(".home-banner-media img");
    const controls = [...banner.querySelectorAll(".home-banner-controls button")];
    const caption = banner.querySelector(".home-banner-caption");
    let currentSlide = Math.max(0, controls.findIndex((button) => button.classList.contains("is-active")));
    let bannerTimer;

    const showSlide = (nextSlide) => {
      currentSlide = (nextSlide + controls.length) % controls.length;
      controls.forEach((button, index) => {
        const active = index === currentSlide;
        button.classList.toggle("is-active", active);
        if (active) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
      });
      const selected = controls[currentSlide];
      if (heroImage && selected) {
        const nextImage = selected.dataset.slideImage || "";
        if (nextImage && heroImage.getAttribute("src") !== nextImage) heroImage.setAttribute("src", nextImage);
        // Update responsive candidates with each slide; a stale srcset overrides src.
        if (selected.dataset.slideSrcset) {
          heroImage.setAttribute("srcset", selected.dataset.slideSrcset);
          heroImage.setAttribute("sizes", "100vw");
        } else heroImage.removeAttribute("srcset");
        if (selected.dataset.slideWidth) heroImage.width = Number(selected.dataset.slideWidth);
        if (selected.dataset.slideHeight) heroImage.height = Number(selected.dataset.slideHeight);
        heroImage.alt = selected.dataset.slideAlt || "";
        heroImage.className = `is-active ${selected.dataset.slideClass || ""}`;
        heroImage.setAttribute("aria-hidden", "false");
      }
      if (caption && selected) {
        caption.querySelector("span").textContent = selected.dataset.slideLabel || "";
        caption.querySelector("strong").textContent = selected.dataset.slideTitle || "";
        caption.querySelector("p").textContent = selected.dataset.slideDetail || "";
        caption.style.animation = "none";
        void caption.offsetHeight;
        caption.style.animation = "";
      }
    };

    const stopRotation = () => window.clearInterval(bannerTimer);
    const startRotation = () => {
      stopRotation();
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        bannerTimer = window.setInterval(() => showSlide(currentSlide + 1), 6200);
      }
    };

    controls.forEach((button, index) => button.addEventListener("click", () => {
      showSlide(index);
      startRotation();
    }));
    window.setTimeout(() => {
      const next = controls[(currentSlide + 1) % controls.length]?.dataset.slideImage;
      if (next) {
        const preloader = new Image();
        preloader.src = next;
      }
    }, 1800);
    banner.addEventListener("mouseenter", stopRotation);
    banner.addEventListener("mouseleave", startRotation);
    banner.addEventListener("focusin", stopRotation);
    banner.addEventListener("focusout", startRotation);
    startRotation();
  }


}
