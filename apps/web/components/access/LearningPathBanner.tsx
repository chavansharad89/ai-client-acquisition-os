import { GraduationCap } from 'lucide-react';

// Compact banner for the Plus Learning Path catalogue. The right-side
// artwork is a static, pre-made illustration file — not CMS content, not
// generated, not inferred per-path — expected at the path below. See the
// completion report for its current status: if the file has not been
// supplied yet, the <img> below will fail to load (broken image), which is
// intentional — never swapped for a fabricated fallback illustration.
const BANNER_ARTWORK_SRC = '/images/plus-learning-banner.png';

// rounded-b-2xl, not rounded-2xl: the top now sits flush against the
// header (the parent wrapper cancels AppShell's own padding), so only
// the bottom corners stay rounded.
export function LearningPathBanner({ displayName }: { displayName: string }) {
  return (
    <div className="flex flex-col items-center gap-4 overflow-hidden rounded-b-2xl bg-[linear-gradient(135deg,#EEF3FF,#F2EDFF)] px-6 py-5 sm:flex-row sm:gap-6 sm:px-8 md:h-[204px] md:py-0">
      <div className="flex w-full items-center gap-4 sm:w-[60%]">
        <span
          className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-2xl bg-[#DBEAFE]"
          aria-hidden="true"
        >
          <GraduationCap className="h-11 w-11 text-plus" />
        </span>
        <div className="flex flex-col justify-center gap-2">
          <span className="w-fit rounded-full bg-plus px-2.5 py-1 text-xs font-semibold tracking-wide text-plus-foreground!">
            PLUS
          </span>
          {/* "Main banner title": canonical spec 34px/700/41px desktop,
              30px/36px tablet, 26px/31px mobile (same line-height ratio).
              Letter-spacing (~-0.8px) is a prior, still-applicable choice
              not covered by the canonical table, so it's kept as-is. */}
          <h1 className="page-title text-[26px] font-bold leading-[31px] tracking-[-0.8px] text-foreground md:text-[30px] md:leading-[36px] lg:text-[34px] lg:leading-[41px]">
            {displayName}
          </h1>
          {/* "Banner subtitle": canonical spec 16px/400/24px desktop,
              15px/23px tablet, 14px/21px mobile. */}
          <p className="m-0 text-[14px] leading-[21px] text-muted-foreground md:text-[15px] md:leading-[23px] lg:text-[16px] lg:leading-[24px]">
            Explore structured learning paths and build practical AI skills.
          </p>
          {/* CMS-PO-015 security regression tests key off this exact phrase
              to confirm the selection screen (not a roadmap) rendered. */}
          <span className="sr-only">Choose a learning path to get started.</span>
        </div>
      </div>
      <div className="flex w-full items-center justify-center overflow-hidden sm:w-[40%]">
        {/* object-cover + a slight scale-up crops the artwork's own internal
            whitespace margin so the laptop/books/plant read larger; the
            source PNG has no alpha channel (a near-white background baked
            in), so mix-blend-multiply — tested against this exact gradient
            — blends that white away instead of leaving a visible
            rectangle, while leaving the gradient's own colors unaffected
            (multiplying against near-white is visually a no-op). */}
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed decorative artwork, not a CMS/user image; next/image's optimizer is unnecessary here. */}
        <img
          src={BANNER_ARTWORK_SRC}
          alt=""
          className="h-full max-h-[160px] w-full scale-125 object-cover mix-blend-multiply"
        />
      </div>
    </div>
  );
}
