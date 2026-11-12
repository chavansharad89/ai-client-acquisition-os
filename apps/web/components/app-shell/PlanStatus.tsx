import { Badge } from '@/components/ui/Badge';
import type { MaxSubscriptionStatus } from '@/src/server/clientFinderStatus';

export interface PlanStatusProps {
  /** From currentAccess().context.purchased — the existing authoritative
   * entitlement data. Never derived from Max/Client Finder status. */
  plusActive: boolean;
  proActive: boolean;
  /** From getMaxSubscriptionStatus() (subscription_periods), never from
   * `purchased` — see that function's own header for why. */
  maxStatus: MaxSubscriptionStatus;
}

function formatDate(date: Date): string {
  // Explicit locale so server-rendered and client-hydrated output match.
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function PlanRow({ label, badge }: { label: string; badge: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      {/* "Plan names": 14px/500/20px per the canonical typography spec. */}
      <span className="text-[length:var(--acos-type-base)] font-[number:var(--acos-weight-medium)] leading-[20px] text-slate-200">
        {label}
      </span>
      {badge}
    </div>
  );
}

// Subtle, readable badge treatments for this panel's dark-navy surface —
// the shared Badge component's variants (bg-success/bg-muted/bg-warning
// solid fills) are tuned for light surfaces elsewhere in the app, so this
// is a presentation-only className override at each call site below, not
// a change to Badge itself or to this component's structure/data flow.
const ACTIVE = 'border border-emerald-500/25 bg-emerald-500/15 text-emerald-400';
const INACTIVE = 'border border-white/10 bg-white/5 text-slate-400';
const UNAVAILABLE = 'border border-amber-500/25 bg-amber-500/15 text-amber-400';

// Clearly separated "Your Plans" status block — display only, never an
// authorization decision. Never renders a status this task's data
// sources can't actually back: "expired" and "never subscribed" are
// both shown as "Not active" for Max (see clientFinderStatus.ts), and no
// internal id, raw date object, or other sensitive field is exposed —
// only a plain word and, for an active Max subscription, a formatted
// date already safe to show the subscriber themselves.
export function PlanStatus({ plusActive, proActive, maxStatus }: PlanStatusProps) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
      {/* Eyebrow label, same treatment as the Sidebar's section labels:
          12px/600/16px. */}
      <p className="text-[length:var(--acos-type-sm)] font-[number:var(--acos-weight-semibold)] leading-[16px] uppercase tracking-wide text-slate-400">
        Your Plans
      </p>
      <div className="mt-2 flex flex-col gap-1.5 text-sm">
        <PlanRow
          label="Plus"
          badge={<Badge className={plusActive ? ACTIVE : INACTIVE}>{plusActive ? 'Active' : 'Not active'}</Badge>}
        />
        <PlanRow
          label="Pro"
          badge={<Badge className={proActive ? ACTIVE : INACTIVE}>{proActive ? 'Active' : 'Not active'}</Badge>}
        />
        <PlanRow
          label="Max"
          badge={
            maxStatus.state === 'active' ? (
              <Badge className={ACTIVE}>Active</Badge>
            ) : maxStatus.state === 'unavailable' ? (
              <Badge className={UNAVAILABLE}>Unavailable</Badge>
            ) : (
              <Badge className={INACTIVE}>Not active</Badge>
            )
          }
        />
      </div>
      {maxStatus.state === 'active' && (
        <p className="mt-1.5 text-xs text-slate-400">Max active until {formatDate(maxStatus.expiresAt)}</p>
      )}
    </div>
  );
}
