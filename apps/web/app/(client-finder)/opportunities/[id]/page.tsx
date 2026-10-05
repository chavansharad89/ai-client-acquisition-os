
import { listAiUsageEvents } from '@acos/core-ai-usage';
import { getOpportunityFollowUpPreparation } from '@acos/core-followup-preparation';
import { recordFunnelEvent } from '@acos/core-funnel-events';
import { requireUser, UnauthenticatedError } from '@acos/core-identity';
import {
  getFeedback,
  getOpportunity,
  getOpportunityNextAction,
  getOpportunityScore,
  OpportunityNotFoundError,
} from '@acos/core-opportunity';
import { getOpportunityOutreachPreparation } from '@acos/core-outreach-preparation';
import { getOpportunityPersonalization } from '@acos/core-personalization';
import { getOpportunityQualification } from '@acos/core-qualification';
import { getCategoryPlausibilityDetermination, listResearchSignals } from '@acos/core-research';
import { notFound, redirect } from 'next/navigation';

import { FeedbackForm } from '../../../../src/components/client-finder/FeedbackForm';
import { clientFinderRepositories } from '../../../../src/server/clientFinderRepositories';
import { resolveBusinessIdentity } from '../../../../src/server/clientFinderView';
import { getPool } from '../../../../src/server/db';
import { readSessionTokenFromServerComponent } from '../../../../src/server/session';

export const metadata = { title: 'Prospect detail — Client Finder' };
export const dynamic = 'force-dynamic';

// Prospect/Opportunity detail page (§10 "Prospect detail works").
// -----------------------------------------------------------------------
// Every section below reads an existing, already-persisted record
// through its own already-tested package — nothing here re-derives
// evidence, re-scores, or re-classifies anything. Qualification,
// Personalization, Outreach Preparation and Follow-Up Preparation each
// render only IF a record already exists (getX returns null before that
// stage has run) — this page never triggers generation itself.
// -----------------------------------------------------------------------

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const token = readSessionTokenFromServerComponent();
  if (!token) redirect('/login');

  const repos = clientFinderRepositories();

  let userId: string;
  try {
    userId = await requireUser(repos.identity, token);
  } catch (err) {
    if (err instanceof UnauthenticatedError) redirect('/login');
    throw err;
  }

  let opportunity;
  try {
    opportunity = await getOpportunity(repos, token, params.id);
  } catch (err) {
    if (err instanceof OpportunityNotFoundError) notFound();
    if (err instanceof UnauthenticatedError) redirect('/login');
    throw err;
  }

  // PCG-6/B-1's "opportunity reviewed" event (ED-9): deliberately NOT
  // derived from feedback submission (FeedbackForm below posts
  // separately, to a different endpoint, on the user's own schedule).
  // First-view-only/deduplicated via migration 0031's partial unique
  // index — every later view of this page by this user is a no-op.
  await recordFunnelEvent(getPool(), {
    eventName: 'opportunity_reviewed',
    visitorId: null,
    userId,
    subjectType: 'opportunity',
    subjectId: opportunity.id,
    payload: {},
    occurredAt: new Date(),
  });

  const [
    identity,
    score,
    signals,
    categoryPlausibility,
    qualification,
    personalization,
    outreachPrep,
    followUpPrep,
    nextAction,
    feedback,
    usageEvents,
  ] = await Promise.all([
    resolveBusinessIdentity(repos, userId, opportunity.prospectId),
    getOpportunityScore(repos, token, opportunity.id),
    listResearchSignals(repos, token, opportunity.prospectId),
    getCategoryPlausibilityDetermination(repos, token, opportunity.prospectId),
    getOpportunityQualification(repos, token, opportunity.id),
    getOpportunityPersonalization(repos, token, opportunity.id),
    getOpportunityOutreachPreparation(repos, token, opportunity.id),
    getOpportunityFollowUpPreparation(repos, token, opportunity.id),
    getOpportunityNextAction(repos, token, opportunity.id),
    getFeedback(repos, token, opportunity.id),
    listAiUsageEvents(repos, token, opportunity.prospectId),
  ]);

  // Fallback observability (D9 §9 / D11-H §14) is read from the persisted
  // request_kind only — a 'fallback' event means a non-primary provider
  // was invoked. The configured primary provider is not persisted, so it
  // is not shown here.
  const fallbackEvents = usageEvents.filter((event) => event.requestKind === 'fallback');
  const providersRecorded = [
    ...new Set((fallbackEvents.length > 0 ? fallbackEvents : usageEvents).map((event) => event.provider)),
  ];

  return (
    <main id="main" className="shell">
      <header>
        <p className="eyebrow">Client Finder</p>
        <h1 className="page-title">{identity.companyName ?? `Prospect ${opportunity.prospectId}`}</h1>
        <p className="lede">Next action: {nextAction.label}</p>
      </header>

      <section className="card">
        <h2>Opportunity</h2>
        <dl className="summary">
          <div className="row">
            <dt>State</dt>
            <dd>{opportunity.state}</dd>
          </div>
          <div className="row">
            <dt>Need detected</dt>
            <dd>{opportunity.needDetected ? 'Yes' : 'No'}</dd>
          </div>
          <div className="row">
            <dt>Staleness</dt>
            <dd>{opportunity.staleness}</dd>
          </div>
        </dl>
        {opportunity.offer ? (
          <div className="card">
            <h3>Recommended offer: {opportunity.offer.service}</h3>
            <p>{opportunity.offer.rationale}</p>
            <p>Fit: {opportunity.offer.fit}/100</p>
            <p>Estimated value: ₹{(opportunity.offer.estimatedValuePaise / 100).toLocaleString('en-IN')}</p>
          </div>
        ) : (
          <p>No suitable offer — evidence was insufficient to recommend one (AC-14).</p>
        )}
      </section>

      {score ? (
        <section className="card">
          <h2>Score: {score.total} ({score.band})</h2>
          <ul>
            {score.factors.map((factor) => (
              <li key={factor.factor}>
                {factor.factor}: +{factor.points} ({factor.basis}) — {factor.reason}
              </li>
            ))}
          </ul>
          <p>Observed share: {Math.round(score.observedShare * 100)}%</p>
        </section>
      ) : null}

      <section className="card">
        <h2>Evidence</h2>
        {signals.length === 0 ? (
          <p>No research signals recorded.</p>
        ) : (
          <ul className="evidence-list">
            {signals.map((signal) => (
              <li key={signal.id} className="evidence-item">
                <p>
                  <strong>{signal.field}</strong> — {signal.classification}
                  {signal.classification !== 'UNKNOWN' ? ` (confidence ${signal.confidence})` : ''}
                </p>
                {signal.signal ? <p>{signal.signal}</p> : null}
                {signal.basis ? <p className="hint">Basis: {signal.basis}</p> : null}
                {signal.sources.map((source) => (
                  <p key={source.id} className="hint">
                    <a href={source.sourceUrl} target="_blank" rel="noreferrer">
                      {source.sourceLabel}
                    </a>
                    : "{source.sourceQuote}"
                  </p>
                ))}
              </li>
            ))}
          </ul>
        )}
      </section>

      {categoryPlausibility ? (
        <section className="card">
          <h2>Category plausibility: {categoryPlausibility.aggregateResult}</h2>
          <p className="hint">
            Target customer (as of this Search): {categoryPlausibility.targetCustomer}
          </p>
          <p className="hint">Determined {categoryPlausibility.observedAt.toISOString()}</p>
          <dl className="summary">
            <div className="row">
              <dt>Determination ID</dt>
              <dd>{categoryPlausibility.id}</dd>
            </div>
            <div className="row">
              <dt>Search ID</dt>
              <dd>{categoryPlausibility.searchId}</dd>
            </div>
            <div className="row">
              <dt>Prospect ID</dt>
              <dd>{categoryPlausibility.prospectId}</dd>
            </div>
          </dl>
          <p className="hint">Target segments ({categoryPlausibility.targetSegments.length}):</p>
          <ol>
            {categoryPlausibility.targetSegments.map((targetSegment, index) => (
              <li key={`${index}-${targetSegment}`}>{targetSegment}</li>
            ))}
          </ol>
          <ul className="evidence-list">
            {categoryPlausibility.segmentResults.map((segment) => (
              <li key={segment.segment} className="evidence-item">
                <p>
                  <strong>{segment.segment}</strong> — {segment.fit}
                </p>
                {/* Stored values exactly as persisted; ABSENT where a pre-F-1 row lacks the field (Companion §0 rule 2). */}
                <p className="hint">
                  Classification: {segment.classification ?? 'ABSENT'} · Confidence:{' '}
                  {segment.confidence ?? 'ABSENT'} · Basis: {segment.basis ?? 'ABSENT'}
                </p>
                {segment.rationale ? <p>{segment.rationale}</p> : null}
                {segment.evidence.map((source, index) => (
                  <p key={`${segment.segment}-${index}`} className="hint">
                    <a href={source.sourceUrl} target="_blank" rel="noreferrer">
                      {source.sourceLabel}
                    </a>
                    : "{source.quote}"
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card">
        <h2>AI usage (this Prospect)</h2>
        {usageEvents.length === 0 ? (
          <p>No AI usage events recorded.</p>
        ) : (
          <>
            <p className="hint">
              Fallback invoked: {fallbackEvents.length > 0 ? 'YES' : 'NO'} · Provider recorded
              {fallbackEvents.length > 0 ? ' on fallback events' : ''}: {providersRecorded.join(', ')}
            </p>
            <ul>
              {usageEvents.map((event) => (
                <li key={event.id}>
                  {event.createdAt.toISOString()} — provider {event.provider}, model {event.model}, request_kind{' '}
                  {event.requestKind}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {qualification ? (
        <section className="card">
          <h2>Qualification: {qualification.state}</h2>
          <ul>
            {qualification.criteria.map((criterion) => (
              <li key={criterion.criterion}>
                {criterion.criterion}: {criterion.satisfied ? 'satisfied' : 'not satisfied'} — {criterion.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {personalization ? (
        <section className="card">
          <h2>Personalization</h2>
          <p>{personalization.openingContext}</p>
          <p>{personalization.valueProposition}</p>
        </section>
      ) : null}

      {outreachPrep ? (
        <section className="card">
          <h2>Prepared outreach draft ({outreachPrep.state})</h2>
          <p>
            <strong>{outreachPrep.subjectLine}</strong>
          </p>
          <p>{outreachPrep.messageBody}</p>
          <p className="hint">{outreachPrep.callToAction}</p>
          <p className="hint">Draft only — this system does not send messages.</p>
        </section>
      ) : null}

      {followUpPrep ? (
        <section className="card">
          <h2>Prepared follow-up draft ({followUpPrep.state})</h2>
          <p>{followUpPrep.followUpContent}</p>
          <p className="hint">{followUpPrep.rationale}</p>
          <p className="hint">Draft only — this system does not send or schedule anything.</p>
        </section>
      ) : null}

      <FeedbackForm opportunityId={opportunity.id} existing={feedback ? { useful: feedback.useful, reason: feedback.reason } : null} />
    </main>
  );
}
