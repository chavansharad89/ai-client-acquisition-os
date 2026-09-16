import type { SectionSummary } from '@acos/core-acquisition';

/** The ten sections, as navigation with live counts. */
export function SectionList({ sections }: { sections: readonly SectionSummary[] }) {
  return (
    <section className="sections" aria-label="Sections">
      {sections.map((section) => (
        <article className="section-card" id={section.section} key={section.section}>
          <header>
            <h3>{section.label}</h3>
            <span className="section-count">{section.count}</span>
          </header>
          <p>{section.note}</p>
          {section.needsAttention > 0 ? (
            <p className="section-waiting">
              <strong>{section.needsAttention}</strong> waiting on you
            </p>
          ) : null}
        </article>
      ))}
    </section>
  );
}
