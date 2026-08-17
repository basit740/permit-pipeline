import type { EvaluationMode, NormalizedRule } from '@/lib/types';
import { StatusPill } from './CoveragePanel';

const EVAL_LABEL: Record<EvaluationMode, string> = {
  deterministic: 'Deterministic code',
  llm_interpretation: 'Claude interpretation',
  retained_for_review: 'Held for review',
};

export default function RulesPanel({ rules }: { rules: NormalizedRule[] }) {
  return (
    <div className="rules">
      {rules.map((rule) => (
        <article key={rule.id} className="rule">
          <div className="rule-head">
            <h3>{rule.category}</h3>
            <StatusPill status={rule.status} />
          </div>

          <dl className="rule-fields">
            <div className="rule-field">
              <dt>Source</dt>
              <dd>{rule.sources.length ? rule.sources.join(' + ') : 'None found'}</dd>
            </div>
            <div className="rule-field">
              <dt>Applies to</dt>
              <dd>{rule.appliesTo}</dd>
            </div>
            <div className="rule-field">
              <dt>Condition</dt>
              <dd>{rule.condition}</dd>
            </div>
          </dl>

          <div className="rule-foot">
            <span className="eval-tag">{EVAL_LABEL[rule.evaluation]}</span>
            <span>provenance: {rule.provenance}</span>
            {rule.effectiveDate ? <span>effective: {rule.effectiveDate}</span> : null}
          </div>
        </article>
      ))}
    </div>
  );
}
