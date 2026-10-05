import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation } from "react-router";
import type { Route } from "./+types/root";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "icon", href: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "alternate", type: "application/rss+xml", title: "Kevin Martínez", href: "/rss.xml" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=JetBrains+Mono:wght@400;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400&display=swap",
  },
];

// Runs before paint so the saved theme never flashes.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;

export function Layout({ children }: { children: React.ReactNode }) {
  // The TWD mount page renders bare so tests only see the component under test.
  const bare = useLocation().pathname === "/testing";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Meta />
        <Links />
      </head>
      <body>
        {bare ? (
          children
        ) : (
          <>
            <a href="#main" className="skip-link">Skip to content</a>
            <SiteHeader />
            <main id="main">{children}</main>
            <SiteFooter />
          </>
        )}
        <ScrollRestoration />
        <Scripts />
        {/* After <Scripts /> so React Router's HMR preamble exists before test files load. */}
        {import.meta.env.DEV && (
          <>
            <script type="module" src="/@id/virtual:twd/init" />
            <script type="module" src="/@id/virtual:twd-relay/connect" />
          </>
        )}
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <div className="page">
      <h1 className="page-title">{notFound ? "Page not found" : "Something broke"}</h1>
      <p className="lede">
        {notFound
          ? "That address doesn't match any page. The post may have moved when the blog was rebuilt."
          : "This page failed to load. Reload to try again."}
      </p>
      <p><a href="/posts">Browse all posts</a></p>
      {import.meta.env.DEV && error instanceof Error && <pre>{error.stack}</pre>}
    </div>
  );
}
