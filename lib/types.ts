/**
 * Shared contract for the regulation ingestion pipeline.
 *
 * Every stage in the pipeline speaks these types. Swapping a mocked provider
 * for a real one (PDOK, DSO/Ozon, a municipal policy scraper) must not change
 * anything below this line.
 */

/** Where a piece of information sits in the Dutch regulatory stack. */
export type RuleLayer =
  | 'national'
  | 'omgevingsplan'
  | 'transition'
  | 'local_policy'
  | 'welstand';

/**
 * Coverage status is deliberately three-valued.
 *
 * `missing` is a first-class outcome, not an error. The pipeline is required to
 * report what it could not find rather than degrade to a confident guess.
 */
export type SourceStatus = 'verified' | 'review' | 'missing';

/** How a rule is intended to be evaluated downstream. */
export type EvaluationMode =
  /** Hard numeric threshold. Belongs in deterministic code, not in the model. */
  | 'deterministic'
  /** Unstructured text. Handed to Claude as structured context for interpretation. */
  | 'llm_interpretation'
  /** Ambiguous or overlapping. Retained as-is and flagged for a human. */
  | 'retained_for_review';

export interface Municipality {
  name: string;
  /** CBS gemeentecode, e.g. GM1706. */
  code: string;
}

export interface ResolvedAddress {
  query: string;
  formatted: string;
  street: string;
  houseNumber: string;
  postcode: string;
  city: string;
  municipality: Municipality;
  parcel: {
    cadastralReference: string;
    bagBuildingId: string;
    buildingYear: number;
    footprintM2: number;
  };
  geometry: {
    crs: 'EPSG:28992';
    centroid: [number, number];
  };
  /** Which provider produced this resolution. */
  resolvedBy: string;
}

export interface DiscoveredSource {
  id: string;
  label: string;
  layer: RuleLayer;
  /** Adapter that claimed responsibility for this source. */
  provider: string;
  status: SourceStatus;
  /** Plain-language reason the status is what it is. Always populated. */
  statusNote: string;
  /** Human-checkable reference: document identifier, register ID, URL path. */
  reference: string | null;
  effectiveDate: string | null;
  /** Applicability scope where the source declares one. */
  appliesTo: string | null;
}

export interface NormalizedRule {
  id: string;
  category: string;
  /** One or more source labels. Overlaps keep every contributing source. */
  sources: string[];
  appliesTo: string;
  condition: string;
  evaluation: EvaluationMode;
  effectiveDate: string | null;
  provenance: string;
  status: SourceStatus;
}

export interface Coverage {
  status: 'complete' | 'review_required' | 'incomplete';
  verified: number;
  review: number;
  missing: number;
  /** What a human should do about the non-verified items. */
  notes: string[];
}

/** The object the client's existing Claude analysis engine consumes. */
export interface PermitContext {
  address: string;
  municipality: Municipality;
  coverage: Coverage;
  ruleGroups: RuleLayer[];
  provenance: 'retained_per_rule';
  /**
   * False when a gap would force the model to speculate about a rule that
   * should have been supplied. The consuming app decides what to do about it.
   */
  safeForAI: boolean;
  sources: DiscoveredSource[];
  rules: NormalizedRule[];
  generatedAt: string;
  disclaimer: string;
}

/** Returned when the address cannot be resolved to a known municipality. */
export interface UnresolvedAddress {
  resolved: false;
  query: string;
  reason: string;
}

export interface ResolvedPipelineResult {
  resolved: true;
  /** Stage 01 output, shown in the UI. Not part of the downstream contract. */
  resolution: ResolvedAddress;
  /** The contract handed to the client's existing Claude analysis engine. */
  context: PermitContext;
}

export type PipelineResult = ResolvedPipelineResult | UnresolvedAddress;
