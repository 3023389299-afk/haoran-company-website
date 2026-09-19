import { normalizeProductText as normalize, matchesProduct, matchingModel } from "./product-tools.js";
export function initialize(isEnglishPage) {
  const requestedModel = new URLSearchParams(location.search).get("model");
  if (requestedModel) {
    const model = [...document.querySelectorAll(".model-number-grid [data-model]")]
      .find((item) => matchingModel([item.dataset.model || ""], requestedModel));
    if (model) {
      model.classList.add("is-selected");
      const note = document.querySelector("[data-selected-model]");
      if (note) {
        note.hidden = false;
        note.textContent = isEnglishPage
          ? `Selected from product search: ${model.dataset.model}. The information below describes the product family; final electrical data must be confirmed against the applicable specification.`
          : `已从产品搜索定位到型号：${model.dataset.model}。下方参数为所属系列的公开资料，具体电气参数请以对应规格书或工程确认结果为准。`;
      }
      model.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }
}
