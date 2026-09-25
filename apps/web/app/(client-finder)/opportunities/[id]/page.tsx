import { notFound, redirect } from 'next/navigation';

import { requireUser, UnauthenticatedError } from '@acos/core-identity';
import {
  getFeedback,
  getOpportunity,
  getOpportunityNextAction,
  getOpportunityScore,
  OpportunityNotFoundError,
} from '@acos/core-opportunity';
import { getOpportunityFollowUpPreparation } from '@acos/core-followup-preparation';
import { getOpportunityOutreachPreparation } from '@acos/core-outreach-preparation';
import { getOpportunityPersonalization } from '@acos/core-personalization';
import { getOpportunityQualification } from '@acos/core-qualification';
import { listResearchSignals } from '@acos/core-research';

import { FeedbackForm } from '../../../../src/components/client-finder/FeedbackForm';
import { clientFinderRepositories } from '../../../../src/server/clientFinderRepositories';
import { resolveBusinessIdentity } from '../../../../src/server/clientFinderView';
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

  const [identity, score, signals, qualification, personalization, outreachPrep, followUpPrep, nextAction, feedback] =
    await Promise.all([
      resolveBusinessIdentity(repos, userId, opportunity.prospectId),
      getOpportunityScore(repos, token, opportunity.id),
      listResearchSignals(repos, token, opportunity.prospectId),
      getOpportunityQualification(repos, token, opportunity.id),
      getOpportunityPersonalization(repos, token, opportunity.id),
      getOpportunityOutreachPreparation(repos, token, opportunity.id),
      getOpportunityFollowUpPreparation(repos, token, opportunity.id),
      getOpportunityNextAction(repos, token, opportunity.id),
      getFeedback(repos, token, opportunity.id),
    ]);

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
