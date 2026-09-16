import type { SectionSummary } from '@acos/core-acquisition';

/**
 * Sections with something waiting on the operator.
 *
 * Hidden entirely when nothing needs attention. A permanently-present
 * strip showing zeroes trains people to ignore it, which defeats the
 * purpose of having it at all.
 */
export function AttentionStrip({ sections }: { sections: readonly SectionSummary[] }) {
  if (sections.length === 0) return null;

  return (
    <section className="attention" aria-label="Needs your attention">
      {sections.map((section) => (
        <a key={section.section} className="attention-card" href={`#${section.section}`}>
          <span className="attention-count">{section.needsAttention}</span>
          <span className="attention-label">{section.label}</span>
          <span className="attention-note">{section.note}</span>
        </a>
      ))}
    </section>
  );
}
