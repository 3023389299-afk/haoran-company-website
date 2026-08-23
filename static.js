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

  document.querySelectorAll('a[href$="/downloads/shixin-product-catalog.pdf"]').forEach((catalogLink) => {
    catalogLink.addEventListener("click", async (event) => {
      event.preventDefault();
      const originalLabel = catalogLink.innerHTML;
      catalogLink.setAttribute("aria-busy", "true");
      catalogLink.innerHTML = "正在准备完整目录… <i>↓</i>";
      try {
        const partUrls = Array.from(
          { length: 9 },
          (_, index) => `/haoran-company-website/downloads/shixin-product-catalog.pdf.part-${String(index).padStart(2, "0")}`,
        );
        const responses = await Promise.all(partUrls.map((url) => fetch(url)));
        if (responses.some((response) => !response.ok)) throw new Error("catalog part unavailable");
        const parts = await Promise.all(responses.map((response) => response.arrayBuffer()));
        const blobUrl = URL.createObjectURL(new Blob(parts, { type: "application/pdf" }));
        const downloadLink = document.createElement("a");
        downloadLink.href = blobUrl;
        downloadLink.download = "惠州市世鑫科技有限公司产品目录.pdf";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
        catalogLink.innerHTML = originalLabel;
      } catch {
        catalogLink.innerHTML = "目录下载失败，请联系我们获取 <i>↗</i>";
      } finally {
        catalogLink.removeAttribute("aria-busy");
      }
    });
  });

  const normalize = (value) => value.toUpperCase().replace(/[\s\-_/（）()·.]+/g, "");
  const searchInput = document.querySelector("[data-product-search-input]");
  const searchForm = document.querySelector("[data-product-search-form]");
  const clearButton = document.querySelector("[data-product-search-clear]");
  const searchStatus = document.querySelector("[data-product-search-status]");
  const emptyState = document.querySelector("[data-product-search-empty]");
  const searchCards = [...document.querySelectorAll("[data-product-search-card]")];

  const updateSearch = (value) => {
    const query = normalize(value.trim());
    let resultCount = 0;
    searchCards.forEach((card) => {
      const visible = Boolean(query) && normalize(card.dataset.search || "").includes(query);
      card.hidden = !visible;
      if (visible) resultCount += 1;

      let exactModel = "";
      card.querySelectorAll("[data-model]").forEach((model) => {
        const matched = Boolean(query) && normalize(model.dataset.model || "").includes(query);
        model.classList.toggle("is-match", matched);
        if (normalize(model.dataset.model || "") === query) exactModel = model.dataset.model || "";
      });
      const detail = card.querySelector("[data-search-detail]");
      if (detail) {
        const cleanHref = detail.href.split("?")[0].split("#")[0];
        detail.href = exactModel
          ? `${cleanHref}?model=${encodeURIComponent(exactModel)}#available-models`
          : cleanHref;
      }
    });

    if (clearButton) clearButton.hidden = !value.trim();
    if (emptyState) emptyState.hidden = !query || resultCount > 0;
    if (searchStatus) {
      searchStatus.textContent = !query
        ? "输入型号、系列或产品关键词开始搜索"
        : resultCount > 0
          ? `找到 ${resultCount} 个相关产品系列，点击可查看详细资料`
          : "暂未找到匹配产品，可尝试缩短型号或提交选型需求";
    }
  };

  if (searchInput) {
    const initialQuery = new URLSearchParams(location.search).get("q") || "";
    searchInput.value = initialQuery;
    updateSearch(initialQuery);
    searchInput.addEventListener("input", () => updateSearch(searchInput.value));
    clearButton?.addEventListener("click", () => {
      searchInput.value = "";
      updateSearch("");
      searchInput.focus();
    });
    document.querySelectorAll("[data-search-term]").forEach((button) => {
      button.addEventListener("click", () => {
        searchInput.value = button.dataset.searchTerm || "";
        updateSearch(searchInput.value);
        searchInput.focus();
      });
    });
    searchForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      document.querySelector("[data-product-search-card]:not([hidden]) [data-search-detail]")?.focus();
    });
  }

  const requestedModel = new URLSearchParams(location.search).get("model");
  if (requestedModel) {
    const model = [...document.querySelectorAll(".model-number-grid [data-model]")]
      .find((item) => normalize(item.dataset.model || "") === normalize(requestedModel));
    if (model) {
      model.classList.add("is-selected");
      const note = document.querySelector("[data-selected-model]");
      if (note) {
        note.hidden = false;
        note.textContent = `已从产品搜索定位到型号：${model.dataset.model}。下方参数为所属系列的公开资料，具体电气参数请以对应规格书或工程确认结果为准。`;
      }
      model.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }
});
