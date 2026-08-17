/**
 * The pipeline itself. Five stages, one contract out.
 *
 *   AddressResolver -> SourceDiscovery -> RuleNormalizer -> CoverageAnalyzer -> PermitContext
 *
 * Nothing here knows whether a provider is mocked or real.
 */

import {
  MockPdokAddressProvider,
  SOURCE_ADAPTERS,
  mockNormalizedRules,
} from '../providers';
import type {
  Coverage,
  DiscoveredSource,
  NormalizedRule,
  PermitContext,
  PipelineResult,
  ResolvedAddress,
  RuleLayer,
} from '../types';

export const DISCLAIMER =
  'Indication only. The municipality remains the final authority on any permit decision.';

/** 01 — Resolve. */
export async function resolveAddress(query: string): Promise<ResolvedAddress | null> {
  return MockPdokAddressProvider.resolve(query);
}

/** 02 — Discover. Every adapter is asked; silence from one is recorded, not ignored. */
export async function discoverSources(address: ResolvedAddress): Promise<DiscoveredSource[]> {
  const results = await Promise.all(SOURCE_ADAPTERS.map((a) => a.discover(address)));
  return results.flat();
}

/** 03 — Normalize. Different document formats become one rule shape. */
export function normalizeRules(address: ResolvedAddress): NormalizedRule[] {
  return mockNormalizedRules(address);
}

/** 04 — Coverage. Counts, and says what a human has to do next. */
export function analyzeCoverage(sources: DiscoveredSource[]): Coverage {
  const verified = sources.filter((s) => s.status === 'verified').length;
  const review = sources.filter((s) => s.status === 'review').length;
  const missing = sources.filter((s) => s.status === 'missing').length;

  const notes = sources
    .filter((s) => s.status !== 'verified')
    .map((s) => `${s.label}: ${s.statusNote}`);

  const status: Coverage['status'] =
    missing > 0 ? 'incomplete' : review > 0 ? 'review_required' : 'complete';

  return { status, verified, review, missing, notes };
}

const LAYER_ORDER: RuleLayer[] = [
  'national',
  'omgevingsplan',
  'transition',
  'local_policy',
  'welstand',
];

function ruleGroups(sources: DiscoveredSource[]): RuleLayer[] {
  const present = new Set(sources.filter((s) => s.status !== 'missing').map((s) => s.layer));
  return LAYER_ORDER.filter((l) => present.has(l));
}

/**
 * In-memory cache stand-in for RuleRepository. In production this is a table
 * keyed by municipality code and document version, refreshed on a schedule.
 */
const repository = new Map<string, PermitContext>();

/** 05 — Serve. */
export async function buildPermitContext(query: string): Promise<PipelineResult> {
  const address = await resolveAddress(query);

  if (!address) {
    return {
      resolved: false,
      query,
      reason:
        'No fixture matches this address. This prototype ships sample data for three municipalities; a production AddressResolver would call the PDOK Locatieserver instead.',
    };
  }

  const cacheKey = `${address.municipality.code}:${address.parcel.bagBuildingId}`;
  const cached = repository.get(cacheKey);
  if (cached) return { resolved: true, resolution: address, context: cached };

  const sources = await discoverSources(address);
  const rules = normalizeRules(address);
  const coverage = analyzeCoverage(sources);

  const context: PermitContext = {
    address: address.formatted,
    municipality: address.municipality,
    coverage,
    ruleGroups: ruleGroups(sources),
    provenance: 'retained_per_rule',
    // A missing expected source means the model would have to speculate.
    safeForAI: coverage.missing === 0,
    sources,
    rules,
    generatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
  };

  repository.set(cacheKey, context);
  return { resolved: true, resolution: address, context };
}
