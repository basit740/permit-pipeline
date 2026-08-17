/**
 * Provider boundary.
 *
 * Everything above this file is production logic. Everything the mocks return
 * here is illustrative. Milestone 1 replaces the implementations, not the
 * interfaces:
 *
 *   MockPdokAddressProvider              -> PDOK Locatieserver + BAG
 *   MockNationalRulesProvider            -> versioned Bbl ruleset
 *   MockDsoOmgevingsdocumentProvider     -> DSO/Ozon omgevingsdocumenten API
 *   MockTransitionPlanProvider           -> legacy IMRO plan service
 *   MockMunicipalPolicyProvider          -> per-municipality policy strategies
 */

import type { DiscoveredSource, NormalizedRule, ResolvedAddress } from '../types';
import { FIXTURES, type MunicipalityFixture } from './fixtures';

/** Resolves a free-text address to a municipality, parcel and geometry. */
export interface AddressProvider {
  readonly id: string;
  resolve(query: string): Promise<ResolvedAddress | null>;
}

/**
 * Returns the sources one layer knows about for a resolved location.
 * A real adapter is responsible for reporting `missing` honestly.
 */
export interface SourceAdapter {
  readonly id: string;
  discover(address: ResolvedAddress): Promise<DiscoveredSource[]>;
}

function findFixture(query: string): MunicipalityFixture | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return (
    FIXTURES.find((f) => f.matchTerms.some((term) => q.includes(term))) ?? null
  );
}

export function fixtureForMunicipalityCode(code: string): MunicipalityFixture | null {
  return FIXTURES.find((f) => f.address.municipality.code === code) ?? null;
}

export const MockPdokAddressProvider: AddressProvider = {
  id: 'MockPdokAddressProvider',
  async resolve(query) {
    const fixture = findFixture(query);
    if (!fixture) return null;
    return { ...fixture.address, query };
  },
};

/**
 * One mock adapter stands in for all five real adapters. It reads the sources
 * a municipality fixture declares and returns only those belonging to its layer,
 * which is exactly the call pattern the real adapters will follow.
 */
function mockAdapter(id: string, layers: string[]): SourceAdapter {
  return {
    id,
    async discover(address) {
      const fixture = fixtureForMunicipalityCode(address.municipality.code);
      if (!fixture) return [];
      return fixture.rawSources.filter((s) => layers.includes(s.layer) && s.provider === id);
    },
  };
}

export const SOURCE_ADAPTERS: SourceAdapter[] = [
  mockAdapter('MockPdokAddressProvider', ['national']),
  mockAdapter('MockNationalRulesProvider', ['national']),
  mockAdapter('MockDsoOmgevingsdocumentProvider', ['omgevingsplan']),
  mockAdapter('MockTransitionPlanProvider', ['transition']),
  mockAdapter('MockMunicipalPolicyProvider', ['local_policy', 'welstand']),
];

/**
 * Stand-in for the normalizer's per-source parsing work. In production each
 * adapter contributes rule objects; here the fixture supplies the already
 * normalized shape so the UI can show what "normalized" means.
 */
export function mockNormalizedRules(address: ResolvedAddress): NormalizedRule[] {
  return fixtureForMunicipalityCode(address.municipality.code)?.rules ?? [];
}

export const DEMO_MUNICIPALITIES = FIXTURES.map((f) => ({
  slug: f.slug,
  label: f.chipLabel,
  address: f.address.formatted,
  characteristic: f.characteristic,
}));
