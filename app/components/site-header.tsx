import { NavLink, Link } from "react-router";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="wordmark">
          <img src="/twd-logo.png" alt="" width="28" height="29" />
          Kevin Martínez
        </Link>
        <nav aria-label="Main">
          <NavLink to="/posts">Posts</NavLink>
          <NavLink to="/about">About</NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
