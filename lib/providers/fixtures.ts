/**
 * ILLUSTRATIVE SAMPLE DATA.
 *
 * None of this was retrieved from a live government service. It is hand-written
 * to model the *shape* of what the real adapters would return, including the
 * gaps. Three municipalities were chosen because they fail differently:
 *
 *   Cranendonck — curated today, one genuine transition-law overlap
 *   Rotterdam   — large, well-published, but policy split across documents
 *   Groningen   — welstand policy not machine-readable in the register
 *
 * The point of the prototype is that the pipeline reports those differences
 * instead of flattening them.
 */

import type { DiscoveredSource, NormalizedRule, ResolvedAddress } from '../types';

export interface MunicipalityFixture {
  slug: string;
  chipLabel: string;
  address: ResolvedAddress;
  /** Matched against lowercased user input. */
  matchTerms: string[];
  rawSources: DiscoveredSource[];
  rules: NormalizedRule[];
  characteristic: string;
}

export const FIXTURES: MunicipalityFixture[] = [
  {
    slug: 'cranendonck',
    chipLabel: 'Cranendonck',
    characteristic: 'Well-covered municipality with one real transition-law edge case.',
    matchTerms: ['cranendonck', 'budel', 'maarheeze', '6021', 'dorpsstraat'],
    address: {
      query: '',
      formatted: 'Dorpsstraat 12, 6021 CE Budel',
      street: 'Dorpsstraat',
      houseNumber: '12',
      postcode: '6021 CE',
      city: 'Budel',
      municipality: { name: 'Cranendonck', code: 'GM1706' },
      parcel: {
        cadastralReference: 'BDL00-C-4182',
        bagBuildingId: '1706100000012345',
        buildingYear: 1974,
        footprintM2: 118,
      },
      geometry: { crs: 'EPSG:28992', centroid: [166420, 361180] },
      resolvedBy: 'MockPdokAddressProvider',
    },
    rawSources: [
      {
        id: 'cra-bag',
        label: 'BAG / PDOK address and building',
        layer: 'national',
        provider: 'MockPdokAddressProvider',
        status: 'verified',
        statusNote: 'Address matched to a single BAG building with parcel geometry.',
        reference: 'BAG pand 1706100000012345',
        effectiveDate: null,
        appliesTo: 'This parcel',
      },
      {
        id: 'cra-bbl',
        label: 'National rules — Bbl vergunningvrij bouwen',
        layer: 'national',
        provider: 'MockNationalRulesProvider',
        status: 'verified',
        statusNote: 'Versioned national ruleset loaded; thresholds parsed as numbers.',
        reference: 'Bbl hoofdstuk 2, bijlage II-equivalent',
        effectiveDate: '2024-01-01',
        appliesTo: 'All addresses nationally',
      },
      {
        id: 'cra-dso',
        label: 'DSO omgevingsplan — Cranendonck',
        layer: 'omgevingsplan',
        provider: 'MockDsoOmgevingsdocumentProvider',
        status: 'verified',
        statusNote: 'Single active omgevingsplan document covering this location.',
        reference: '/akn/nl/act/gm1706/2024/omgevingsplan',
        effectiveDate: '2024-01-01',
        appliesTo: 'Werkingsgebied covering this parcel',
      },
      {
        id: 'cra-welstand',
        label: 'Welstandsnota Cranendonck',
        layer: 'welstand',
        provider: 'MockMunicipalPolicyProvider',
        status: 'verified',
        statusNote: 'Policy text extracted and attached to the "dorpslint" area.',
        reference: 'Welstandsnota 2019, gebied 4 — dorpslinten',
        effectiveDate: '2019-06-01',
        appliesTo: 'Dorpslint area — includes this parcel',
      },
      {
        id: 'cra-transition',
        label: 'Legacy bestemmingsplan (transition law)',
        layer: 'transition',
        provider: 'MockTransitionPlanProvider',
        status: 'review',
        statusNote:
          'A pre-2024 plan still applies to this parcel alongside the omgevingsplan. Both are retained; neither is silently discarded.',
        reference: 'NL.IMRO.1706.BPBudelKom-VA01',
        effectiveDate: '2013-09-12',
        appliesTo: 'Overlapping werkingsgebied',
      },
    ],
    rules: [
      {
        id: 'cra-r1',
        category: 'Dormer',
        sources: ['National Bbl'],
        appliesTo: 'Rear roof plane',
        condition:
          'Height, setback from eaves and ridge, and width relative to the roof plane. Hard dimensional thresholds evaluated deterministically, not by the model.',
        evaluation: 'deterministic',
        effectiveDate: '2024-01-01',
        provenance: 'Bbl hoofdstuk 2 · parsed numeric thresholds',
        status: 'verified',
      },
      {
        id: 'cra-r2',
        category: 'Rear extension',
        sources: ['National Bbl', 'DSO omgevingsplan Cranendonck'],
        appliesTo: 'Achtererfgebied of this parcel',
        condition:
          'Buildable depth and area derived from parcel geometry. National allowance and the local plan both constrain it; the stricter value governs and both are recorded.',
        evaluation: 'deterministic',
        effectiveDate: '2024-01-01',
        provenance: 'Bbl + /akn/nl/act/gm1706/2024/omgevingsplan',
        status: 'verified',
      },
      {
        id: 'cra-r3',
        category: 'Appearance',
        sources: ['Welstandsnota Cranendonck'],
        appliesTo: 'Visible roof additions in the dorpslint area',
        condition:
          'Local aesthetic criteria supplied as structured context for interpretation. Not reduced to a number, and not treated as a pass/fail gate.',
        evaluation: 'llm_interpretation',
        effectiveDate: '2019-06-01',
        provenance: 'Welstandsnota 2019, gebied 4 · §3.2',
        status: 'verified',
      },
      {
        id: 'cra-r4',
        category: 'Plan overlap',
        sources: ['DSO omgevingsplan Cranendonck', 'NL.IMRO.1706.BPBudelKom-VA01'],
        appliesTo: 'This parcel',
        condition:
          'Two potentially applicable sources detected. Both are retained rather than silently choosing one. Flagged for human resolution before the answer is trusted.',
        evaluation: 'retained_for_review',
        effectiveDate: null,
        provenance: 'Conflict detected by CoverageAnalyzer · both document IDs kept',
        status: 'review',
      },
    ],
  },
  {
    slug: 'rotterdam',
    chipLabel: 'Rotterdam',
    characteristic: 'Core sources clean, local policy split across several documents.',
    matchTerms: ['rotterdam', '3011', 'coolsingel', '3012', '3061'],
    address: {
      query: '',
      formatted: 'Coolsingel 40, 3011 AD Rotterdam',
      street: 'Coolsingel',
      houseNumber: '40',
      postcode: '3011 AD',
      city: 'Rotterdam',
      municipality: { name: 'Rotterdam', code: 'GM0599' },
      parcel: {
        cadastralReference: 'RTD02-F-9911',
        bagBuildingId: '0599100000098221',
        buildingYear: 1953,
        footprintM2: 342,
      },
      geometry: { crs: 'EPSG:28992', centroid: [92450, 437620] },
      resolvedBy: 'MockPdokAddressProvider',
    },
    rawSources: [
      {
        id: 'rot-bag',
        label: 'BAG / PDOK address and building',
        layer: 'national',
        provider: 'MockPdokAddressProvider',
        status: 'verified',
        statusNote: 'Address matched to a single BAG building with parcel geometry.',
        reference: 'BAG pand 0599100000098221',
        effectiveDate: null,
        appliesTo: 'This parcel',
      },
      {
        id: 'rot-bbl',
        label: 'National rules — Bbl vergunningvrij bouwen',
        layer: 'national',
        provider: 'MockNationalRulesProvider',
        status: 'verified',
        statusNote: 'Versioned national ruleset loaded; thresholds parsed as numbers.',
        reference: 'Bbl hoofdstuk 2, bijlage II-equivalent',
        effectiveDate: '2024-01-01',
        appliesTo: 'All addresses nationally',
      },
      {
        id: 'rot-dso',
        label: 'DSO omgevingsplan — Rotterdam',
        layer: 'omgevingsplan',
        provider: 'MockDsoOmgevingsdocumentProvider',
        status: 'verified',
        statusNote: 'Active omgevingsplan document resolved for this werkingsgebied.',
        reference: '/akn/nl/act/gm0599/2024/omgevingsplan',
        effectiveDate: '2024-01-01',
        appliesTo: 'Werkingsgebied covering this parcel',
      },
      {
        id: 'rot-welstand',
        label: 'Welstandsbeleid Rotterdam',
        layer: 'welstand',
        provider: 'MockMunicipalPolicyProvider',
        status: 'review',
        statusNote:
          'Policy found, but the area classification uses a local geographic scheme that is not yet mapped to parcel geometry. A human confirms which area applies.',
        reference: 'Welstandsnota — gebiedstypologie, area lookup unmapped',
        effectiveDate: '2022-03-01',
        appliesTo: 'Area classification pending mapping',
      },
      {
        id: 'rot-beleid',
        label: 'Local beleidsregel — rooftop additions',
        layer: 'local_policy',
        provider: 'MockMunicipalPolicyProvider',
        status: 'review',
        statusNote:
          'Two policy documents cover roof additions and their scopes partially overlap. Both retained pending reconciliation.',
        reference: 'Beleidsregel dakopbouwen + gebiedsgerichte uitwerking',
        effectiveDate: '2023-11-01',
        appliesTo: 'Roof additions, scope overlap unresolved',
      },
    ],
    rules: [
      {
        id: 'rot-r1',
        category: 'Dormer',
        sources: ['National Bbl'],
        appliesTo: 'Rear roof plane',
        condition:
          'Hard dimensional thresholds evaluated deterministically. Identical national ruleset as every other municipality — this is the part that never varies.',
        evaluation: 'deterministic',
        effectiveDate: '2024-01-01',
        provenance: 'Bbl hoofdstuk 2 · parsed numeric thresholds',
        status: 'verified',
      },
      {
        id: 'rot-r2',
        category: 'Building height',
        sources: ['DSO omgevingsplan Rotterdam'],
        appliesTo: 'Werkingsgebied covering this parcel',
        condition:
          'Maximum building height and permitted footprint read from the plan and stored as numbers with the werkingsgebied they came from.',
        evaluation: 'deterministic',
        effectiveDate: '2024-01-01',
        provenance: '/akn/nl/act/gm0599/2024/omgevingsplan · art. 4.2',
        status: 'verified',
      },
      {
        id: 'rot-r3',
        category: 'Appearance',
        sources: ['Welstandsbeleid Rotterdam'],
        appliesTo: 'Area classification not yet resolved for this parcel',
        condition:
          'Policy text is available, but the criteria differ per area type and the area lookup is unmapped. The text is not attached to this address until the mapping is confirmed.',
        evaluation: 'retained_for_review',
        effectiveDate: '2022-03-01',
        provenance: 'Welstandsnota · area typology, no geometry link',
        status: 'review',
      },
      {
        id: 'rot-r4',
        category: 'Roof additions',
        sources: ['Beleidsregel dakopbouwen', 'Gebiedsgerichte uitwerking'],
        appliesTo: 'Roof additions on this parcel',
        condition:
          'Two policy documents with partially overlapping scope. Both retained rather than silently choosing one.',
        evaluation: 'retained_for_review',
        effectiveDate: '2023-11-01',
        provenance: 'Overlap detected by CoverageAnalyzer · both documents kept',
        status: 'review',
      },
    ],
  },
  {
    slug: 'groningen',
    chipLabel: 'Groningen',
    characteristic: 'National and plan data present, local welstand source not machine-readable.',
    matchTerms: ['groningen', '9712', 'grote markt', '9711', '9713'],
    address: {
      query: '',
      formatted: 'Grote Markt 1, 9712 HN Groningen',
      street: 'Grote Markt',
      houseNumber: '1',
      postcode: '9712 HN',
      city: 'Groningen',
      municipality: { name: 'Groningen', code: 'GM0014' },
      parcel: {
        cadastralReference: 'GRN01-A-2207',
        bagBuildingId: '0014100000031877',
        buildingYear: 1962,
        footprintM2: 205,
      },
      geometry: { crs: 'EPSG:28992', centroid: [233620, 582410] },
      resolvedBy: 'MockPdokAddressProvider',
    },
    rawSources: [
      {
        id: 'gro-bag',
        label: 'BAG / PDOK address and building',
        layer: 'national',
        provider: 'MockPdokAddressProvider',
        status: 'verified',
        statusNote: 'Address matched to a single BAG building with parcel geometry.',
        reference: 'BAG pand 0014100000031877',
        effectiveDate: null,
        appliesTo: 'This parcel',
      },
      {
        id: 'gro-bbl',
        label: 'National rules — Bbl vergunningvrij bouwen',
        layer: 'national',
        provider: 'MockNationalRulesProvider',
        status: 'verified',
        statusNote: 'Versioned national ruleset loaded; thresholds parsed as numbers.',
        reference: 'Bbl hoofdstuk 2, bijlage II-equivalent',
        effectiveDate: '2024-01-01',
        appliesTo: 'All addresses nationally',
      },
      {
        id: 'gro-dso',
        label: 'DSO omgevingsplan — Groningen',
        layer: 'omgevingsplan',
        provider: 'MockDsoOmgevingsdocumentProvider',
        status: 'verified',
        statusNote: 'Active omgevingsplan document resolved for this werkingsgebied.',
        reference: '/akn/nl/act/gm0014/2024/omgevingsplan',
        effectiveDate: '2024-01-01',
        appliesTo: 'Werkingsgebied covering this parcel',
      },
      {
        id: 'gro-welstand',
        label: 'Welstand / aesthetics policy',
        layer: 'welstand',
        provider: 'MockMunicipalPolicyProvider',
        status: 'missing',
        statusNote:
          'No machine-readable welstand source found for this municipality in the register. Reported as a gap. The pipeline does not fall back to another municipality\u2019s criteria and does not invent one.',
        reference: null,
        effectiveDate: null,
        appliesTo: null,
      },
      {
        id: 'gro-beleid',
        label: 'Local beleidsregels — supplementary',
        layer: 'local_policy',
        provider: 'MockMunicipalPolicyProvider',
        status: 'review',
        statusNote:
          'Published as a PDF without structured articles. Text extracted but not yet normalized into rule objects.',
        reference: 'Beleidsregels bouwen — PDF, unstructured',
        effectiveDate: '2021-05-01',
        appliesTo: 'Municipality-wide, scope not parsed',
      },
    ],
    rules: [
      {
        id: 'gro-r1',
        category: 'Dormer',
        sources: ['National Bbl'],
        appliesTo: 'Rear roof plane',
        condition:
          'Hard dimensional thresholds evaluated deterministically. Available regardless of local coverage.',
        evaluation: 'deterministic',
        effectiveDate: '2024-01-01',
        provenance: 'Bbl hoofdstuk 2 · parsed numeric thresholds',
        status: 'verified',
      },
      {
        id: 'gro-r2',
        category: 'Rear extension',
        sources: ['National Bbl', 'DSO omgevingsplan Groningen'],
        appliesTo: 'Achtererfgebied of this parcel',
        condition:
          'Buildable area computed from parcel geometry against national allowance and the plan limit.',
        evaluation: 'deterministic',
        effectiveDate: '2024-01-01',
        provenance: 'Bbl + /akn/nl/act/gm0014/2024/omgevingsplan',
        status: 'verified',
      },
      {
        id: 'gro-r3',
        category: 'Appearance',
        sources: [],
        appliesTo: 'Unknown for this parcel',
        condition:
          'No welstand criteria available. Downstream analysis must state that appearance was not assessed rather than assume it is unconstrained.',
        evaluation: 'retained_for_review',
        effectiveDate: null,
        provenance: 'No source. Gap recorded by CoverageAnalyzer.',
        status: 'missing',
      },
    ],
  },
];
