// WHEN SHOULD I FOLLOW UP — cadence.
// -----------------------------------------------------------------------
// Spacing widens with each touch: someone who has ignored three emails is
// not persuaded by a fourth arriving sooner. The sequence stops at a fixed
// count, because the difference between persistence and harassment is
// whether it ends.
//
// Every computation is pure and takes `now`, so a test can assert an exact
// date instead of sleeping.
// -----------------------------------------------------------------------

/** Business days after the previous touch, by attempt number (1-based). */
export const FOLLOW_UP_SPACING_DAYS: readonly number[] = [3, 5, 8, 13];

export const MAX_FOLLOW_UPS = FOLLOW_UP_SPACING_DAYS.length;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Saturday/Sunday pushed to Monday. Outreach on a weekend is wasted. */
export function nextBusinessDay(date: Date): Date {
  const result = new Date(date);
  const day = result.getUTCDay();
  if (day === 6) result.setUTCDate(result.getUTCDate() + 2);
  else if (day === 0) result.setUTCDate(result.getUTCDate() + 1);
  return result;
}

export function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from);
  let remaining = days;
  while (remaining > 0) {
    result.setTime(result.getTime() + DAY_MS);
    const day = result.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return result;
}

export interface FollowUpPlan {
  attempt: number;
  dueAt: Date;
  /** False once the sequence is exhausted. */
  shouldSend: boolean;
  reason: string;
}

/**
 * When the next touch is due.
 *
 * `attempt` is the follow-up number about to be scheduled: 1 is the first
 * chase after the opening message.
 */
export function planFollowUp(lastTouchAt: Date, attempt: number): FollowUpPlan {
  if (attempt < 1) {
    throw new RangeError(`follow-up attempt must be 1 or greater, received ${attempt}`);
  }
  if (attempt > MAX_FOLLOW_UPS) {
    return {
      attempt,
      dueAt: lastTouchAt,
      shouldSend: false,
      reason: `Sequence complete after ${MAX_FOLLOW_UPS} follow-ups — move on or re-approach later.`,
    };
  }
  const spacing = FOLLOW_UP_SPACING_DAYS[attempt - 1]!;
  return {
    attempt,
    dueAt: nextBusinessDay(addBusinessDays(lastTouchAt, spacing)),
    shouldSend: true,
    reason: `Follow-up ${attempt} of ${MAX_FOLLOW_UPS}, ${spacing} business days after the last touch.`,
  };
}

/** The whole sequence from an opening message, for previewing a cadence. */
export function fullSequence(firstTouchAt: Date): readonly FollowUpPlan[] {
  const plans: FollowUpPlan[] = [];
  let cursor = firstTouchAt;
  for (let attempt = 1; attempt <= MAX_FOLLOW_UPS; attempt += 1) {
    const plan = planFollowUp(cursor, attempt);
    plans.push(plan);
    cursor = plan.dueAt;
  }
  return plans;
}

/**
 * A reply cancels every scheduled touch.
 *
 * This is the single most important rule in the module: continuing to
 * send a sequence after someone has replied is the behaviour that gets a
 * sending domain blocked and makes a freelancer look automated.
 */
export function shouldCancelOnReply(
  status: 'SCHEDULED' | 'SENT' | 'CANCELLED' | 'SUPERSEDED',
): boolean {
  return status === 'SCHEDULED';
}
