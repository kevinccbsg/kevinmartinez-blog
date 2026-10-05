import { Marked, type Token, type Tokens } from "marked";
import { createHighlighter, type Highlighter } from "shiki";

const LANGS = [
  "ts", "tsx", "js", "jsx", "json", "bash", "shell", "html", "css", "vue",
  "yaml", "diff", "md", "sql", "graphql", "toml", "xml", "dockerfile", "python",
] as const;

const ALIASES: Record<string, string> = {
  typescript: "ts", javascript: "js", sh: "bash", zsh: "bash", console: "bash",
  yml: "yaml", markdown: "md", shellscript: "bash",
};

let highlighter: Promise<Highlighter> | undefined;

function getHighlighter() {
  highlighter ??= createHighlighter({ themes: ["github-light", "github-dark"], langs: [...LANGS] });
  return highlighter;
}

function resolveLang(lang: string | undefined): string {
  const name = (lang ?? "").trim().split(/\s+/)[0].toLowerCase();
  const resolved = ALIASES[name] ?? name;
  return (LANGS as readonly string[]).includes(resolved) ? resolved : "text";
}

const marked = new Marked({ gfm: true });

export async function renderMarkdown(source: string): Promise<string> {
  const shiki = await getHighlighter();
  const tokens = marked.lexer(source);

  marked.walkTokens(tokens, (token: Token) => {
    if (token.type !== "code") return;
    const code = token as Tokens.Code;
    const html = shiki.codeToHtml(code.text, {
      lang: resolveLang(code.lang),
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    });
    // Swap the code token for pre-rendered HTML.
    Object.assign(token, { type: "html", block: true, pre: false, raw: code.raw, text: html });
  });

  return marked.parser(tokens);
}
