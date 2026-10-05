import { createRoot } from "react-dom/client";
import { createRoutesStub, useLoaderData, useMatches, useParams } from "react-router";
import { twd, screenDomGlobal } from "twd-js";
import type { PostMeta } from "~/lib/posts.server";

let root: ReturnType<typeof createRoot> | undefined;

// Mounts a fresh React root inside the blank /testing page.
export async function setupReactRoot() {
  root?.unmount();
  root = undefined;
  await twd.visit("/testing");
  const container = await screenDomGlobal.findByTestId("testing-page");
  root = createRoot(container);
  return root;
}

type RouteComponent = React.ComponentType<any>;

// Renders a route component the way React Router would, with a stubbed loader.
export function renderRoute(
  Component: RouteComponent,
  { path, url = path, loaderData }: { path: string; url?: string; loaderData?: unknown },
) {
  const Stub = createRoutesStub([
    {
      path,
      Component: () => (
        <Component loaderData={useLoaderData()} params={useParams()} matches={useMatches()} />
      ),
      loader: () => loaderData ?? null,
    },
    { path: "*", Component: () => <p>navigated away</p> },
  ]);
  root!.render(<Stub initialEntries={[url]} />);
}

export const posts: PostMeta[] = [
  {
    slug: "when-your-mocks-lie",
    title: "When Your Mocks Lie: Contract Testing with TWD",
    description: "How TWD validates every mock response against your OpenAPI spec.",
    date: "2026-04-19",
    tags: ["testing", "twd", "contracts"],
    lang: "en",
    devtoUrl: "https://dev.to/kevinccbsg/when-your-mocks-lie-contract-testing-with-twd-2e58",
  },
  {
    slug: "react-router-data-mode-parte-3",
    title: "React Router Data Mode: Parte 3 - Loaders y carga de datos",
    description: "Vamos con la tercera parte de esta serie de tutoriales.",
    date: "2025-06-02",
    tags: ["react", "reactrouter"],
    lang: "es",
  },
  {
    slug: "easy-docs-nodejs-api",
    title: "How to create easy Docs in a Node.js REST API",
    description: "Document your Node.js REST API with express-jsdoc-swagger.",
    date: "2021-12-14",
    tags: ["nodejs", "api"],
    lang: "en",
  },
];
