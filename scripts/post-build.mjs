// Netlify serves /404.html for unknown paths; React Router prerenders it at /404/.
import fs from "node:fs/promises";

await fs.copyFile("build/client/404/index.html", "build/client/404.html");
await fs.rm("build/client/404", { recursive: true });
console.log("post-build: wrote build/client/404.html");
