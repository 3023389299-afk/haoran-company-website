document.documentElement.classList.add("static-site");

document.addEventListener("DOMContentLoaded", () => {
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
  });
  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  }));

  const catalogDownload = document.querySelector(".catalog-download");
  catalogDownload?.addEventListener("click", async (event) => {
    event.preventDefault();
    const originalLabel = catalogDownload.innerHTML;
    catalogDownload.setAttribute("aria-busy", "true");
    catalogDownload.innerHTML = "正在准备完整目录… <i>↓</i>";
    try {
      const partUrls = Array.from(
        { length: 9 },
        (_, index) => `/haoran-company-website/downloads/shixin-product-catalog.pdf.part-${String(index).padStart(2, "0")}`,
      );
      const responses = await Promise.all(partUrls.map((url) => fetch(url)));
      if (responses.some((response) => !response.ok)) throw new Error("catalog part unavailable");
      const parts = await Promise.all(responses.map((response) => response.arrayBuffer()));
      const blobUrl = URL.createObjectURL(new Blob(parts, { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "惠州市世鑫科技有限公司产品目录.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
      catalogDownload.innerHTML = originalLabel;
    } catch {
      catalogDownload.innerHTML = "目录下载失败，请联系我们获取 <i>↗</i>";
    } finally {
      catalogDownload.removeAttribute("aria-busy");
    }
  });

});
