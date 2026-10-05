import { Link } from "react-router";

export const meta = () => [{ title: "Page not found | Kevin Martínez" }, { name: "robots", content: "noindex" }];

export default function NotFound() {
  return (
    <div className="page">
      <h1 className="page-title">Page not found</h1>
      <p className="lede">
        That address doesn't match any page. The post may have moved when the blog was rebuilt.
      </p>
      <p><Link to="/posts">Browse all posts</Link></p>
    </div>
  );
}
