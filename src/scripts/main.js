import { initialize as initializeShell } from './shell.js';
document.documentElement.classList.add('static-site');
const english = /(?:^|\/)en(?:\/|$)/.test(location.pathname);
if (english) document.documentElement.lang = 'en';
function start() {
  initializeShell(english);
  if (document.querySelector('.home-banner')) import('./banner.js').then(m => m.initialize(english));
  if (document.querySelector('[data-product-search-input]')) import('./search.js').then(m => m.initialize(english));
  if (document.querySelector('.model-number-grid')) import('./model.js').then(m => m.initialize(english));
  if (document.querySelector('[data-product-inquiry]')) import('./product-tools.js').then(m => m.initializeProductInquiryLinks());
}
// Inquiry validation is loaded eagerly on contact pages by a dedicated entry;
// it must be ready before interaction, rather than deferred until idle.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
