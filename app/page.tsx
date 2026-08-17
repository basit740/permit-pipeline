import PipelineExplorer from '@/components/PipelineExplorer';
import { DEMO_MUNICIPALITIES } from '@/lib/providers';

const PROOFS = [
  'One reusable ingestion architecture, not per-municipality curation.',
  'Real address → municipality → source discovery.',
  'A common normalized rule schema with provenance on every rule.',
  'Coverage and exception detection instead of silent gaps.',
  'Tested against deliberately different municipalities.',
  'A clean backend contract ready for the existing Claude flow.',
];

export default function Home() {
  return (
    <>
      <header className="masthead">
        <div className="shell masthead-inner">
          <div className="wordmark">
            <strong>Permit Pipeline</strong>
            <span>Milestone 1 · Visual Proof</span>
          </div>
          <div className="proto-note">
            Visual engineering prototype · sample data is illustrative
          </div>
        </div>
      </header>

      <main>
        <PipelineExplorer examples={DEMO_MUNICIPALITIES} />

        <section className="section shell">
          <div className="milestone">
            <p className="eyebrow">Milestone 1</p>
            <h2>What the first $1,500 proves</h2>

            <div className="milestone-grid">
              {PROOFS.map((proof, i) => (
                <div className="proof" key={proof}>
                  <div className="proof-no">{String(i + 1).padStart(2, '0')}</div>
                  <p>{proof}</p>
                </div>
              ))}
            </div>

            <div className="scope-note">
              <h3>Nationwide rollout remains the target.</h3>
              <div>
                <p>
                  The three municipalities above are not the geographic scope. They are test cases,
                  chosen because they break in different ways: one is well covered with a genuine
                  transition-law overlap, one publishes policy across several partially overlapping
                  documents, one has no machine-readable welstand source at all.
                </p>
                <p>
                  If the ingestion architecture survives those three, the remaining municipalities
                  are a data problem rather than an architecture problem. Finding that out in
                  testing costs a milestone. Finding it out after a national launch costs a rebuild.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="shell site-foot">
        <span>Permit Pipeline · Milestone 1 visual proof</span>
        <span>
          Architecture visualization only. Sample data is illustrative and was not retrieved from
          live government services.
        </span>
      </footer>
    </>
  );
}
