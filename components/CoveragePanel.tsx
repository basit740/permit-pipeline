import type { Coverage, DiscoveredSource, SourceStatus } from '@/lib/types';

const STATUS_LABEL: Record<SourceStatus, string> = {
  verified: 'Verified',
  review: 'Review',
  missing: 'Missing',
};

export function StatusPill({ status }: { status: SourceStatus }) {
  return <span className={`pill ${status}`}>{STATUS_LABEL[status]}</span>;
}

export default function CoveragePanel({
  sources,
  coverage,
}: {
  sources: DiscoveredSource[];
  coverage: Coverage;
}) {
  return (
    <>
      <div className="tally" style={{ marginBottom: 18 }}>
        <span className="pill verified">{coverage.verified} verified</span>
        <span className="pill review">{coverage.review} review</span>
        <span className="pill missing">{coverage.missing} missing</span>
      </div>

      <div className="ledger">
        {sources.map((source) => (
          <div
            key={source.id}
            className={`source-row${source.status === 'missing' ? ' is-missing' : ''}`}
          >
            <h3 className="source-title">{source.label}</h3>
            <StatusPill status={source.status} />
            <p className="source-note">{source.statusNote}</p>
            <div className="source-meta">
              <span>
                provider <b>{source.provider}</b>
              </span>
              <span>
                reference <b>{source.reference ?? '—'}</b>
              </span>
              <span>
                effective <b>{source.effectiveDate ?? '—'}</b>
              </span>
              <span>
                applies to <b>{source.appliesTo ?? '—'}</b>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="philosophy">
        <b>Missing data is surfaced, not hidden.</b>
        <span>
          A source the pipeline could not find is reported as a gap, never replaced with a
          plausible substitute.
        </span>
      </div>
    </>
  );
}
