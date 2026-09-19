export function initialize(isEnglishPage) {
  const revealItems = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.1 },
    );
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".global-nav");
  menuButton?.addEventListener("click", () => {
    const open = nav?.classList.toggle("open") ?? false;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? (isEnglishPage ? "Close navigation" : "关闭导航") : (isEnglishPage ? "Open navigation" : "打开导航"));
    document.body.classList.toggle("mobile-menu-open", open);
  });
  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", isEnglishPage ? "Open navigation" : "打开导航");
    document.body.classList.remove("mobile-menu-open");
  }));
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !nav?.classList.contains("open")) return;
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", isEnglishPage ? "Open navigation" : "打开导航");
    document.body.classList.remove("mobile-menu-open");
    menuButton?.focus();
  });


}
