// Public, non-secret deployment settings. Change canonicalBase only after
// the official domain is registered and serving the site.
export const siteConfig = Object.freeze({
  canonicalBase: "https://3023389299-afk.github.io/haoran-company-website",
  githubBasePath: "/haoran-company-website",
  inquiryEmail: "sz-haoran@126.com",
  inquiryEndpoint: "https://formsubmit.co/sz-haoran@126.com",
});

export function canonicalUrl(path = "/") {
  return `${siteConfig.canonicalBase}${path.startsWith("/") ? path : `/${path}`}`;
}
