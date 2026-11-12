import { GitBranch } from 'lucide-react';

// Compact banner for the Pro repository catalogue — same layout/typography
// as LearningPathBanner (Plus), swapped to Pro's copy and to the --primary
// accent that Pro/Max already share per the ACOS palette decision (Pro
// never got its own dedicated token the way Plus did). The right-side
// artwork is a small code-drawn SVG motif (branch/commit nodes), not a
// photo asset — consistent with how LearningPathCover's path covers are
// code-defined rather than stock images, and avoids depending on an
// illustration file that doesn't exist yet.
export function RepositoryBanner({ displayName }: { displayName: string }) {
  return (
    <div className="flex flex-col items-center gap-4 overflow-hidden rounded-b-2xl bg-[linear-gradient(135deg,#F3EEFE,#EFF3FF)] px-6 py-5 sm:flex-row sm:gap-6 sm:px-8 md:h-[204px] md:py-0">
      <div className="flex w-full items-center gap-4 sm:w-[60%]">
        <span
          className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-2xl bg-[#E7E0FC]"
          aria-hidden="true"
        >
          <GitBranch className="h-11 w-11 text-primary" />
        </span>
        <div className="flex flex-col justify-center gap-2">
          <span className="w-fit rounded-full bg-primary px-2.5 py-1 text-xs font-semibold tracking-wide text-primary-foreground!">
            PRO
          </span>
          {/* Same canonical banner-title/subtitle scale as LearningPathBanner. */}
          <h1 className="page-title text-[26px] font-bold leading-[31px] tracking-[-0.8px] text-foreground md:text-[30px] md:leading-[36px] lg:text-[34px] lg:leading-[41px]">
            {displayName}
          </h1>
          <p className="m-0 text-[14px] leading-[21px] text-muted-foreground md:text-[15px] md:leading-[23px] lg:text-[16px] lg:leading-[24px]">
            Explore git repositories and learn how to build them step by step.
          </p>
          <span className="sr-only">Choose a repository to get started.</span>
        </div>
      </div>
      <div className="flex w-full items-center justify-center overflow-hidden sm:w-[40%]">
        <RepositoryBannerArt />
      </div>
    </div>
  );
}

function RepositoryBannerArt() {
  return (
    <svg viewBox="0 0 320 180" className="h-full max-h-[160px] w-full" aria-hidden="true" focusable="false">
      <path d="M70 40 V140" stroke="var(--primary)" strokeOpacity="0.5" strokeWidth="2.5" />
      <path d="M70 90 H160" stroke="var(--primary)" strokeOpacity="0.5" strokeWidth="2.5" />
      <path d="M160 90 V40" stroke="var(--primary)" strokeOpacity="0.5" strokeWidth="2.5" />
      <path d="M70 90 H160 V140" stroke="var(--secondary)" strokeOpacity="0.45" strokeWidth="2.5" />
      {[
        [70, 40],
        [70, 90],
        [70, 140],
        [160, 40],
        [160, 90],
        [160, 140],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="7" fill="var(--card)" stroke="var(--primary)" strokeWidth="2.5" />
      ))}
      <circle cx="240" cy="65" r="34" fill="var(--primary)" fillOpacity="0.12" />
      <circle cx="252" cy="130" r="22" fill="var(--secondary)" fillOpacity="0.14" />
    </svg>
  );
}
