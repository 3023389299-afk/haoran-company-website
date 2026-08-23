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
    menuButton.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
    document.body.classList.toggle("mobile-menu-open", open);
  });
  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", "打开导航");
    document.body.classList.remove("mobile-menu-open");
  }));
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !nav?.classList.contains("open")) return;
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", "打开导航");
    document.body.classList.remove("mobile-menu-open");
    menuButton?.focus();
  });

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

  const searchForm = document.querySelector("[data-product-search-form]");
  const searchInput = document.querySelector("[data-product-search-input]");
  const searchClear = document.querySelector("[data-product-search-clear]");
  const searchStatus = document.querySelector("[data-product-search-status]");
  const searchResults = document.querySelector("[data-product-search-results]");
  const searchEmpty = document.querySelector("[data-product-search-empty]");
  const searchCards = Array.from(document.querySelectorAll("[data-product-search-card]"));
  const normalizeSearch = (value) => String(value || "").toUpperCase().replace(/[\s\-_/（）()·.]+/g, "");

  if (searchForm && searchInput && searchStatus) {
    searchCards.forEach((card) => {
      const detailLink = card.querySelector("[data-search-detail]");
      if (detailLink) detailLink.dataset.baseHref = detailLink.getAttribute("href") || "";
    });

    const runProductSearch = (value, moveFocus = false) => {
      const rawQuery = String(value || "").trim();
      const query = normalizeSearch(rawQuery);
      let visibleCount = 0;

      searchCards.forEach((card) => {
        const searchable = normalizeSearch(card.dataset.search);
        const visible = Boolean(query) && searchable.includes(query);
        card.hidden = !visible;
        card.classList.remove("has-model-matches");
        if (!visible) return;

        visibleCount += 1;
        const modelChips = Array.from(card.querySelectorAll("[data-model]"));
        const modelMatches = modelChips.filter((chip) => normalizeSearch(chip.dataset.model).includes(query));
        modelChips.forEach((chip) => chip.classList.toggle("is-match", modelMatches.includes(chip)));
        card.classList.toggle("has-model-matches", modelMatches.length > 0);

        const detailLink = card.querySelector("[data-search-detail]");
        if (detailLink) {
          const baseHref = detailLink.dataset.baseHref || detailLink.getAttribute("href") || "";
          const exactModel = modelMatches.find((chip) => normalizeSearch(chip.dataset.model) === query);
          detailLink.setAttribute("href", exactModel
            ? `${baseHref}?model=${encodeURIComponent(exactModel.dataset.model)}#available-models`
            : baseHref);
        }
      });

      searchClear.hidden = !rawQuery;
      searchEmpty.hidden = !query || visibleCount > 0;
      searchStatus.textContent = !query
        ? "输入型号、系列或产品关键词开始搜索"
        : visibleCount > 0
          ? `找到 ${visibleCount} 个相关产品系列，点击可查看详细资料`
          : "暂未找到匹配产品，可尝试缩短型号或提交选型需求";

      if (moveFocus && visibleCount > 0) {
        searchResults?.querySelector("[data-product-search-card]:not([hidden]) [data-search-detail]")?.focus();
      }
    };

    searchInput.addEventListener("input", () => runProductSearch(searchInput.value));
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      runProductSearch(searchInput.value, true);
    });
    searchClear?.addEventListener("click", () => {
      searchInput.value = "";
      runProductSearch("");
      searchInput.focus();
    });
    document.querySelectorAll("[data-search-term]").forEach((button) => button.addEventListener("click", () => {
      searchInput.value = button.dataset.searchTerm || "";
      runProductSearch(searchInput.value);
      searchInput.focus();
    }));

    const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
    if (initialQuery) {
      searchInput.value = initialQuery;
      runProductSearch(initialQuery);
    }
  }

  const requestedModel = new URLSearchParams(window.location.search).get("model");
  if (requestedModel) {
    const requestedKey = normalizeSearch(requestedModel);
    const modelChip = Array.from(document.querySelectorAll(".model-number-grid [data-model]"))
      .find((chip) => normalizeSearch(chip.dataset.model) === requestedKey);
    const modelNote = document.querySelector("[data-selected-model]");
    if (modelChip) {
      modelChip.classList.add("is-selected");
      if (modelNote) {
        modelNote.textContent = `已从产品搜索定位到型号：${modelChip.dataset.model}。下方参数为所属系列的公开资料，具体电气参数请以对应规格书或工程确认结果为准。`;
        modelNote.hidden = false;
      }
    }
  }

});
