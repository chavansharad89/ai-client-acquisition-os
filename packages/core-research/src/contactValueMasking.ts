import { detectContactIdentifiers } from './contactIdentifiers';
import { candidateSubstrings } from './contactValueExtraction';

// ₹1,499 Client Finder subscription — evidence-rendering contact mask.
// -----------------------------------------------------------------------
// Additive, read-time, rendering-only. Never touches persistence, never
// changes what Path B (contactValueExtraction.ts) itself extracts for an
// unlock, and never modifies K1's detector (contactIdentifiers.ts). It
// reuses exactly the same candidate-substring rules Path B uses
// (`candidateSubstrings`) and the same unmodified `detectContactIdentifiers`
// re-classification, so a value masked here is always a value Path B/K1
// would also recognize as a qualifying or fragment contact identifier --
// no new detection rule is introduced.
//
// Longest-candidate-first replacement: an email candidate's local part can
// itself contain a digit run that also satisfies the phone-candidate
// regex (e.g. "9876543210@example.com"). Masking the longer candidate
// first removes that digit run from `result`, so the shorter, now-absent
// candidate is simply a no-op rather than leaving a stray "@example.com".
// -----------------------------------------------------------------------

const CONTACT_MASK = '[contact hidden — unlock to view]';

/**
 * Returns `text` with every K1-confirmed contact identifier (business
 * email, personal email, uncertain email, phone -- FRAGMENT is left
 * alone, same convention K1/Path B already use) replaced by a fixed
 * placeholder. Used only to decide what is rendered to a viewer who has
 * not unlocked this Opportunity's contact -- the stored signal/source
 * text itself is never touched.
 */
export function maskContactIdentifiersInText(text: string, website: string | null): string {
  if (!text) return text;

  const candidates = [...candidateSubstrings(text)].sort((a, b) => b.length - a.length);
  let result = text;
  for (const candidate of candidates) {
    if (!result.includes(candidate)) continue; // already consumed by a longer, overlapping candidate
    const kinds = detectContactIdentifiers(candidate, website);
    const qualifies = kinds.some((kind) => kind !== 'FRAGMENT');
    if (!qualifies) continue;
    result = result.split(candidate).join(CONTACT_MASK);
  }
  return result;
}
