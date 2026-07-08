interface SeoOptions {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}

export function getSeoMetadata({ title, description, path = "", noIndex = false }: SeoOptions) {
  const baseUrl = "https://tenet.yashrajn.com"; // Default domain
  const canonicalUrl = `${baseUrl}${path}`;

  const meta = [
    { title },
    { name: "description", content: description },
    // Open Graph / Facebook
    { property: "og:type", content: "website" },
    { property: "og:url", content: canonicalUrl },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: `${baseUrl}/og-image.png` },
    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:url", content: canonicalUrl },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: `${baseUrl}/og-image.png` },
  ];

  if (noIndex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }

  return {
    meta,
    links: [{ rel: "canonical", href: canonicalUrl }],
  };
}
