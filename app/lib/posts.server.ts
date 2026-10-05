import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export const ARTICLES_DIR = path.resolve(process.cwd(), "articles");

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  coverImage?: string;
  lang: "en" | "es";
  canonicalUrl?: string;
  series?: string;
  devtoUrl?: string;
};

export type Post = PostMeta & { body: string };

function toDateString(value: unknown, file: string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  throw new Error(`${file}: "date" must be YYYY-MM-DD, got ${JSON.stringify(value)}`);
}

function toTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((t) => t.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

function requireString(data: Record<string, unknown>, key: string, file: string): string {
  const value = data[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${file}: missing required frontmatter field "${key}"`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function readPost(file: string): Promise<(Post & { draft: boolean })> {
  const raw = await fs.readFile(path.join(ARTICLES_DIR, file), "utf8");
  const { data, content } = matter(raw);
  return {
    slug: file.replace(/\.md$/, ""),
    title: requireString(data, "title", file),
    description: requireString(data, "description", file),
    date: toDateString(data.date, file),
    tags: toTags(data.tags),
    coverImage: optionalString(data.cover_image),
    lang: data.lang === "es" ? "es" : "en",
    canonicalUrl: optionalString(data.canonical_url),
    series: optionalString(data.series),
    devtoUrl: optionalString(data.devto_url),
    draft: data.draft === true,
    body: content,
  };
}

let cache: Promise<Post[]> | undefined;

async function loadAll(): Promise<Post[]> {
  const files = (await fs.readdir(ARTICLES_DIR)).filter((f) => f.endsWith(".md"));
  const posts = await Promise.all(files.map(readPost));
  return posts
    .filter((p) => !p.draft)
    .map(({ draft: _draft, ...post }) => post)
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

function all(): Promise<Post[]> {
  // Re-read on every call in dev so new/edited articles show up without a restart.
  if (process.env.NODE_ENV !== "production") return loadAll();
  cache ??= loadAll();
  return cache;
}

export async function getAllPosts(): Promise<PostMeta[]> {
  return (await all()).map(({ body: _body, ...meta }) => meta);
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return (await all()).find((p) => p.slug === slug);
}
