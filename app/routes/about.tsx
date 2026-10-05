import type { Route } from "./+types/about";
import { pageMeta, SITE } from "~/lib/site";

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: "About",
    description:
      "Kevin Martínez is a software architect focused on software quality, testing strategy and responsible AI adoption, and the creator of TWD.",
    path: "/about",
  });

export default function About() {
  return (
    <div className="page about">
      <div className="about-intro">
        <img src="/kevin.jpg" alt="Kevin Martínez working on a laptop" width="640" height="600" />
        <div>
          <h1 className="page-title">About</h1>
          <p className="about-name">{SITE.fullName}</p>
          <p className="about-headline">
            Senior Software Engineer. Engineering quality, testing strategy and AI-assisted
            development. Creator of <a href={SITE.links.twd}>twd.dev</a>.
          </p>
        </div>
      </div>

      <div className="prose">
        <p>
          <strong>I believe AI is changing how we write software, but it shouldn't change how we validate it.</strong>
        </p>
        <p>
          Throughout my career I've focused on one question: how can we help engineers build reliable
          software with confidence?
        </p>
        <p>
          That question has shaped everything I've done, from teaching JavaScript and testing for more
          than six years, to mentoring engineers, leading frontend teams, speaking at internal and
          community events, and creating open-source tools that improve the development experience.
        </p>
        <p>
          Today I'm a Software Architect, where I help engineering teams improve software quality
          through testing strategies, developer experience, and responsible AI adoption. Rather than
          treating tests as something we write after the code, I believe they should become the
          foundation that allows both developers and AI coding assistants to move faster without
          sacrificing quality.
        </p>

        <h2>Why TWD</h2>
        <p>
          This philosophy led me to create <a href={SITE.links.twd}>TWD (Test While Developing)</a>,
          an open-source methodology that brings testing directly into the browser, turning tests
          into executable documentation and enabling rapid feedback during development.
        </p>
        <p>
          Tests run inside the app you already have open, against the real DOM, with a sidebar that
          shows every step. The same tests run headless in CI with <code>twd-cli</code>, and AI agents
          can trigger and read them through <code>twd-relay</code>. This blog is tested with it too.
        </p>

        <h2>Helping engineers grow</h2>
        <p>
          One of the parts of my job I enjoy the most is helping other engineers grow. Whether I'm
          mentoring junior and mid-level developers, interviewing candidates, leading workshops, or
          speaking at meetups and podcasts, I enjoy sharing knowledge and creating environments where
          people can become better engineers.
        </p>
        <p>
          My main interests are software quality, testing, accessibility, developer experience,
          AI-assisted development, and engineering education.
        </p>
      </div>

      <h2 className="about-links-title">Find me elsewhere</h2>
      <ul className="about-links">
        <li><a href={SITE.links.linkedin}>LinkedIn</a><span>Career history and talks</span></li>
        <li><a href={SITE.links.github}>GitHub</a><span>Open-source work</span></li>
        <li><a href={SITE.links.devto}>dev.to</a><span>Where these posts are also published</span></li>
        <li><a href={SITE.links.twd}>twd.dev</a><span>TWD documentation</span></li>
      </ul>
    </div>
  );
}
