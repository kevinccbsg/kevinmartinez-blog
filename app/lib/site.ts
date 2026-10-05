export const SITE = {
  url: "https://www.kevinmartinez.dev",
  name: "Kevin Martínez",
  fullName: "Kevin Julián Martínez Escobar",
  headline:
    "Senior Software Engineer focused on engineering quality, testing strategy and AI-assisted development. Creator of TWD.",
  ogImage: "/twd-og.png",
  links: {
    twd: "https://twd.dev",
    twdGithub: "https://github.com/BRIKEV/twd",
    twdNpm: "https://www.npmjs.com/package/twd-js",
    github: "https://github.com/kevinccbsg",
    linkedin: "https://www.linkedin.com/in/kevinjmartinez/",
    devto: "https://dev.to/kevinccbsg",
  },
} as const;

type MetaInput = {
  title?: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  canonical?: string;
  publishedTime?: string;
};

export function pageMeta({ title, description, path, image, type = "website", canonical, publishedTime }: MetaInput) {
  const fullTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} | Engineering quality, testing and TWD`;
  const url = `${SITE.url}${path}`;
  const imageUrl = image ? (image.startsWith("http") ? image : `${SITE.url}${image}`) : `${SITE.url}${SITE.ogImage}`;
  return [
    { title: fullTitle },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: canonical ?? url },
    { property: "og:type", content: type },
    { property: "og:site_name", content: SITE.name },
    { property: "og:title", content: title ?? SITE.name },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: imageUrl },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title ?? SITE.name },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
    ...(publishedTime ? [{ property: "article:published_time", content: publishedTime }] : []),
  ];
}

export function formatDate(date: string, lang: "en" | "es" = "en") {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(lang === "es" ? "es-ES" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
