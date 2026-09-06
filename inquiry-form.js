// Shared by the hydrated site and the GitHub Pages export.
// Browser checks supplement FormSubmit's CAPTCHA; they are not server rate limits.
const COOLDOWN_MS = 30000;
const STORAGE_KEY = "haoran-inquiry-last-attempt";

/** @param {HTMLFormElement} form */
export function initializeInquiryForm(form) {
  const win = form.ownerDocument.defaultView;
  if (!win) return () => {};
  const isEnglish = form.dataset.inquiryLanguage === "en";
  const status = form.querySelector("[data-form-status]");
  const button = form.querySelector('button[type="submit"]');
  const next = form.querySelector('input[name="_next"]');
  const defaultStatus = status?.innerHTML || "";
  const defaultButton = button?.innerHTML || "";
  let pending = false;
  let resetTimer;
  let lastAttempt = 0;

  if (next) {
    const base = win.location.pathname.startsWith("/haoran-company-website/") ? "/haoran-company-website" : "";
    next.value = `${win.location.origin}${base}${isEnglish ? "/en/contact/" : "/contact/"}?submitted=1`;
  }

  const showStatus = (message, error = false) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", error);
  };

  const reset = () => {
    pending = false;
    win.clearTimeout(resetTimer);
    if (button) {
      button.disabled = false;
      button.innerHTML = defaultButton;
    }
    if (new URLSearchParams(win.location.search).get("submitted") === "1") {
      showStatus(isEnglish
        ? "You have returned from the submission service. This page cannot confirm email delivery. Please email us if you need to follow up."
        : "您已返回联系页面。本页面无法确认邮件是否送达；如需跟进，请直接邮件联系我们。");
    } else {
      if (status) {
        status.innerHTML = defaultStatus;
        status.classList.toggle("is-error", false);
      }
    }
  };

  const submit = (event) => {
    // Recheck whitespace-only values before passing anything to the service.
    for (const field of form.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]), textarea')) {
      field.value = field.value.trim();
    }
    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }
    if (form.querySelector('[name="_honey"]')?.value) {
      event.preventDefault();
      showStatus(isEnglish ? "This submission could not be accepted. Please contact us by email." : "本次提交未被接受，请通过邮箱联系我们。", true);
      return;
    }
    try { lastAttempt = Number(win.sessionStorage.getItem(STORAGE_KEY)) || lastAttempt; } catch { /* Storage may be unavailable in private browsing. */ }
    const elapsed = Date.now() - lastAttempt;
    if (pending || (elapsed >= 0 && elapsed < COOLDOWN_MS)) {
      event.preventDefault();
      showStatus(isEnglish ? "Please wait 30 seconds before trying again, or contact us by email." : "请间隔30秒后再提交，或直接邮件联系我们。", true);
      return;
    }
    lastAttempt = Date.now();
    try { win.sessionStorage.setItem(STORAGE_KEY, String(lastAttempt)); } catch { /* In-memory checks still prevent repeated clicks. */ }
    pending = true;
    if (button) {
      button.disabled = true;
      button.textContent = isEnglish ? "Opening verification…" : "正在前往安全验证…";
    }
    showStatus(isEnglish ? "Complete the verification on the next page. If it cannot load, please email us directly." : "请在下一页完成安全验证。如果验证页面无法加载，请直接发送邮件。");
    // Recover if navigation fails, and when returning through the browser back button.
    resetTimer = win.setTimeout(reset, COOLDOWN_MS);
  };

  reset();
  form.addEventListener("submit", submit);
  win.addEventListener("pageshow", reset);
  return () => {
    form.removeEventListener("submit", submit);
    win.removeEventListener("pageshow", reset);
    win.clearTimeout(resetTimer);
  };
}
