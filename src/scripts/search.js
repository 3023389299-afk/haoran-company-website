import { normalizeProductText as normalize, matchesProduct, matchingModel } from "./product-tools.js";
export function initialize(isEnglishPage) {
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
      const visible = matchesProduct(card.dataset.searchKey || "", value);
      card.hidden = !visible;
      if (visible) resultCount += 1;

      let exactModel = "";
      card.querySelectorAll("[data-model]").forEach((model) => {
        const matched = matchesProduct(normalize(model.dataset.model || ""), value);
        model.classList.toggle("is-match", matched);
        if (matchingModel([model.dataset.model || ""], value)) exactModel = model.dataset.model || "";
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
        ? (isEnglishPage ? "Enter a model, series or product keyword to begin" : "输入型号、系列或产品关键词开始搜索")
        : resultCount > 0
          ? (isEnglishPage ? `${resultCount} matching product ${resultCount === 1 ? "family" : "families"}` : `找到 ${resultCount} 个相关产品系列，点击可查看详细资料`)
          : (isEnglishPage ? "No match found. Try a shorter model prefix or submit your requirements." : "暂未找到匹配产品，可尝试缩短型号或提交选型需求");
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


}
