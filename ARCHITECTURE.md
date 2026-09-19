# Website architecture and performance notes

## Architecture

The source is organized as a static-site build so every existing URL remains a plain HTML route.

- The existing Chinese and English HTML files remain the authoritative page content at their current paths, so every published URL stays unchanged.
- `src/components/` contains the two shared language headers and footers. The build restores each page's active navigation state.
- `src/styles/` keeps the original cascade order while separating base, page, product, responsive, inquiry, news, readability, and datasheet styles.
- `src/scripts/` separates site shell, home banner, product search, model selection, inquiry form, product helpers, and deployment configuration. Page-only modules load only when matching markup exists.
- `scripts/build.mjs` reads those pages, replaces repeated shells with the shared components, compiles `dist/`, fingerprints/minifies CSS and JavaScript, generates responsive WebP images, and enriches HTML without changing its text, metadata, links, forms, or heading structure.
- `scripts/verify.mjs` compares all generated routes with the existing site and fails on changes to content, metadata, navigation, forms, headings, or contact links.

## Key implementation details

Images keep their original URL as a compressed fallback for social previews, downloads, and old links. HTML uses generated WebP variants through `srcset` and `sizes`. Every image receives its intrinsic `width` and `height`; above-the-fold and LCP candidates load eagerly, while remaining images use native lazy loading. The home banner updates `src`, `srcset`, dimensions, and alt text together when slides change.

CSS is concatenated in its established cascade order and minified without reordering selectors or merging rules that could alter the visual result. JavaScript is bundled as ES modules, minified, split into shared chunks, and loaded with `type="module"`, which is deferred by default. Contact-form validation is a dedicated entry and loads immediately on contact pages.

## Deployment

The GitHub Actions workflow runs unit tests, builds all routes, performs the preservation audit, uploads only `dist/`, and deploys it to GitHub Pages. GitHub Pages must use **GitHub Actions** as its build source. Keep the repository base path `/haoran-company-website` unless the site moves to a custom domain; if it moves, update `src/scripts/site-config.js`, canonical metadata, sitemap, and the build `base` constant together.

The build requires Node.js 20 and uses locked dependency versions through `npm ci`. Do not publish `src/` as the web root. A failed preservation audit should block deployment because it indicates that business content, SEO data, navigation, or form behavior changed.

## Expected PageSpeed improvements

The build reduces full-width WebP image payloads from about 7.4 MB to about 1.4 MB before browser selection of smaller responsive variants. CSS is reduced from about 160 KB to 141 KB, and the initial shared JavaScript entry is about 2 KB, with page functions loaded on demand.

These changes should improve LCP through smaller responsive images and high-priority loading for the home hero; improve CLS through intrinsic image dimensions; reduce total transfer and main-thread work through lazy loading, minification, and page-specific JavaScript; and improve repeat visits through fingerprinted immutable assets. Final PageSpeed scores depend on GitHub Pages latency, third-party form navigation, test location, device profile, and current field data, so scores must be measured again after production deployment rather than presented as guaranteed values.
