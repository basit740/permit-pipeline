'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import PipelineRail from './PipelineRail';
import CoveragePanel from './CoveragePanel';
import RulesPanel from './RulesPanel';
import ApiPanel from './ApiPanel';
import type { PipelineResult, ResolvedPipelineResult, UnresolvedAddress } from '@/lib/types';

interface DemoMunicipality {
  slug: string;
  label: string;
  address: string;
  characteristic: string;
}

const STAGE_COUNT = 5;
const STAGE_MS = 190;

export default function PipelineExplorer({ examples }: { examples: DemoMunicipality[] }) {
  const [query, setQuery] = useState('');
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(-1);
  const [result, setResult] = useState<ResolvedPipelineResult | null>(null);
  const [unresolved, setUnresolved] = useState<UnresolvedAddress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const run = useCallback(async (address: string) => {
    const trimmed = address.trim();
    if (!trimmed || typeof window === 'undefined') return;

    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRunning(true);
    setError(null);
    setUnresolved(null);
    setResult(null);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setStage(STAGE_COUNT);
    } else {
      setStage(0);
      for (let i = 1; i <= STAGE_COUNT; i += 1) {
        timers.current.push(setTimeout(() => setStage(i), i * STAGE_MS));
      }
    }

    const started = Date.now();

    try {
      const response = await fetch(`/api/permit-context?address=${encodeURIComponent(trimmed)}`);
      const data: PipelineResult = await response.json();

      const elapsed = Date.now() - started;
      const settle = reduceMotion ? 0 : Math.max(0, STAGE_COUNT * STAGE_MS - elapsed);

      timers.current.push(
        setTimeout(() => {
          if (data.resolved) {
            setResult(data);
          } else {
            setUnresolved(data);
            setStage(0);
          }
          setRunning(false);
        }, settle),
      );
    } catch {
      setError('The pipeline endpoint did not respond. Check that the dev server is running.');
      setStage(-1);
      setRunning(false);
    }
  }, []);

  function handleExample(example: DemoMunicipality) {
    setQuery(example.address);
    void run(example.address);
  }

  const activeExample = examples.find(
    (e) => result && e.address === result.resolution.formatted,
  );

  return (
    <>
      <section className="hero shell">
        <p className="eyebrow">Milestone 1 · Visual proof</p>
        <h1>One address in. Clean, traceable rules out.</h1>
        <p className="lede">
          This pipeline sits between the existing address flow and the AI analysis engine. It
          discovers which sources apply to a location, normalizes them into one predictable
          structure, keeps provenance on every rule, and exposes gaps instead of guessing.
        </p>

        <div className="runner">
          <div className="runner-row">
            <label htmlFor="address" style={{ position: 'absolute', left: -9999 }}>
              Dutch address
            </label>
            <input
              id="address"
              value={query}
              placeholder="Dorpsstraat 12, 6021 CE Budel"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void run(query);
              }}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="run-btn"
              disabled={running || !query.trim()}
              onClick={() => void run(query)}
            >
              {running ? 'Running…' : 'Run pipeline →'}
            </button>
          </div>

          <div className="examples">
            <span className="examples-label">Try</span>
            {examples.map((example) => (
              <button
                key={example.slug}
                type="button"
                className="chip"
                aria-pressed={activeExample?.slug === example.slug}
                onClick={() => handleExample(example)}
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section shell">
        <div className="section-head">
          <p className="eyebrow">Stages</p>
        </div>
        <PipelineRail activeIndex={stage} />

        {error ? (
          <div className="notice" style={{ marginTop: 24 }}>
            {error}
          </div>
        ) : null}

        {unresolved ? (
          <div className="notice" style={{ marginTop: 24 }}>
            <strong>Address not resolved.</strong> {unresolved.reason}
          </div>
        ) : null}

        {result ? (
          <div className="resolution" style={{ marginTop: 32 }}>
            <div className="section-head">
              <p className="eyebrow">Address resolution</p>
              <p>{activeExample?.characteristic}</p>
            </div>
            <dl className="resolution-grid">
              <div className="field">
                <dt>Resolved address</dt>
                <dd>{result.resolution.formatted}</dd>
              </div>
              <div className="field">
                <dt>Municipality</dt>
                <dd>{result.resolution.municipality.name}</dd>
              </div>
              <div className="field">
                <dt>Municipality code</dt>
                <dd className="mono">{result.resolution.municipality.code}</dd>
              </div>
              <div className="field">
                <dt>Parcel / building</dt>
                <dd className="mono">
                  {result.resolution.parcel.cadastralReference} · BAG{' '}
                  {result.resolution.parcel.bagBuildingId}
                </dd>
              </div>
              <div className="field">
                <dt>Building year</dt>
                <dd className="mono">{result.resolution.parcel.buildingYear}</dd>
              </div>
              <div className="field">
                <dt>Footprint</dt>
                <dd className="mono">{result.resolution.parcel.footprintM2} m²</dd>
              </div>
              <div className="field">
                <dt>Geometry</dt>
                <dd className="mono">
                  {result.resolution.geometry.crs} · {result.resolution.geometry.centroid.join(', ')}
                </dd>
              </div>
              <div className="field">
                <dt>Source coverage</dt>
                <dd className="mono">
                  {result.context.coverage.verified}/{result.context.sources.length} verified ·{' '}
                  {result.context.coverage.status.replace('_', ' ')}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </section>

      {result ? (
        <>
          <section className="section shell">
            <div className="section-head">
              <p className="eyebrow">04 · Coverage</p>
              <h2>Source coverage</h2>
              <p>
                What was found for {result.resolution.municipality.name}, and what a human still
                has to resolve before this address can be trusted end to end.
              </p>
            </div>
            <CoveragePanel sources={result.context.sources} coverage={result.context.coverage} />
          </section>

          <section className="section shell">
            <div className="section-head">
              <p className="eyebrow">03 · Normalize</p>
              <h2>Normalized rules</h2>
              <p>
                Unrelated document formats reduced to one internal shape. Hard numbers are marked
                for deterministic evaluation; free text is marked as context for Claude.
              </p>
            </div>
            <RulesPanel rules={result.context.rules} />
          </section>

          <section className="section shell">
            <div className="section-head">
              <p className="eyebrow">05 · Serve</p>
              <h2>Backend contract</h2>
              <p>
                One endpoint the existing application consumes. Trimmed here for reading; the
                endpoint returns the full source and rule objects.
              </p>
            </div>
            <ApiPanel
              context={result.context}
              endpoint={`/api/permit-context?address=${encodeURIComponent(
                result.resolution.formatted,
              )}`}
            />
          </section>
        </>
      ) : null}
    </>
  );
}
