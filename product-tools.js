import { siteConfig } from "./site-config.js?v=20260906-review-followup";
// Small, framework-independent helpers shared by React and the static export.
export const normalizeProductText = (value) => String(value).toUpperCase().replace(/[\s\-_/（）()·.]+/g, "");
export const productSearchKey = (value) => String(value).split(/\s+/).map(normalizeProductText).join(" ");

export function matchesProduct(searchKey, query) {
  const terms = String(query).trim().split(/\s+/).map(normalizeProductText).filter(Boolean);
  return terms.length > 0 && terms.every((term) => {
    // Structure terms must not match their opposites (UNSHIELDED / 非屏蔽).
    if (["SHIELDED", "UNSHIELDED"].includes(term)) return new RegExp(`(?:^|[^A-Z])${term}(?:$|[^A-Z])`).test(searchKey);
    if (["屏蔽", "屏蔽电感", "屏蔽功率电感"].includes(term)) return /(?<!非)屏蔽/.test(searchKey);
    if (term === "非屏蔽电感") return searchKey.includes("非屏蔽");
    return searchKey.includes(term);
  });
}

export function matchingModel(models, query) {
  const key = normalizeProductText(query);
  if (!key) return "";
  return models.find((model) => normalizeProductText(model) === key || model.split(/\s*\/\s*/).some((alias) => normalizeProductText(alias) === key)) || "";
}

export function inquiryHref({ lang = "zh", family = "", model = "", request = "selection" } = {}) {
  const params = new URLSearchParams();
  if (family) params.set("family", family);
  if (model) params.set("model", model);
  if (["selection", "sample", "specification"].includes(request)) params.set("request", request);
  return `${lang === "en" ? "/en" : ""}/contact?${params}#inquiry`;
}

export function initializeProductInquiryLinks(root = document) {
  const requested = new URLSearchParams(root.location?.search || "").get("model") || "";
  const models = Array.from(root.querySelectorAll(".model-number-grid [data-model]"), (el) => el.dataset.model);
  const selected = matchingModel(models, requested);
  root.querySelectorAll("[data-product-inquiry]").forEach((link) => {
    const href = inquiryHref({lang: link.dataset.lang, family: link.dataset.family, model: selected, request: link.dataset.request});
    const base = link.pathname.startsWith(`${siteConfig.githubBasePath}/`) ? siteConfig.githubBasePath : "";
    link.href = `${base}${href}`;
  });
}
