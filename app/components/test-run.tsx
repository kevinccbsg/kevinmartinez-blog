// The home hero: a TWD-sidebar-style run where each line ticks to green.
const CASES = [
  "teaches JavaScript and testing (6+ years)",
  "mentors engineers and leads frontend teams",
  "treats tests as the foundation, not the afterthought",
  "built TWD to test in the browser you develop in",
  "keeps AI fast without lowering the bar",
];

export function TestRun() {
  return (
    <figure className="test-run" aria-label={`Test run: Kevin Martínez, ${CASES.length} passing`}>
      <div className="test-run-bar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="test-run-body">
        <p className="test-run-describe">
          describe(<span className="str">"Kevin Martínez"</span>)
        </p>
        <ul>
          {CASES.map((name, i) => (
            <li key={name} style={{ "--i": i } as React.CSSProperties}>
              <span className="check" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="14" height="14">
                  <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>it(<span className="str">"{name}"</span>)</span>
            </li>
          ))}
        </ul>
        <p className="test-run-summary">
          <span className="pass">{CASES.length} passing</span>
        </p>
      </div>
    </figure>
  );
}
