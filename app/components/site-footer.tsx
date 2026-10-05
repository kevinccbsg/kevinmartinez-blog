import { SITE } from "~/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p>
          Written by Kevin Martínez. Tested with <a href={SITE.links.twd}>TWD</a>.
        </p>
        <ul aria-label="Elsewhere">
          <li><a href={SITE.links.github}>GitHub</a></li>
          <li><a href={SITE.links.linkedin}>LinkedIn</a></li>
          <li><a href={SITE.links.devto}>dev.to</a></li>
          <li><a href="/rss.xml">RSS</a></li>
        </ul>
      </div>
    </footer>
  );
}
