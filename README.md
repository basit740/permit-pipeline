# Permit Pipeline — Milestone 1 visual proof

A deployable, interactive prototype of the regulation ingestion pipeline that sits between an
address lookup and an AI analysis engine for Dutch construction permit checks.

**This is an architecture visualization, not a working ingestion system.** No government service is
called. All sample data is illustrative and hand-written to model the shape of real responses,
including the gaps.

---

## What the demo represents

One address goes in. What comes out is a normalized, traceable set of rules with an explicit
statement of what could not be found.

Five stages:

| Stage | Name | What it does |
| --- | --- | --- |
| 01 | Resolve | Address → municipality, parcel, building, geometry |
| 02 | Discover | Ask every source layer what applies to that location |
| 03 | Normalize | Different document formats → one internal rule shape |
| 04 | Coverage | Count verified / review / missing, and say what a human must resolve |
| 05 | Serve | Emit one clean contract for the existing application |

Three municipalities are included because they fail differently:

- **Cranendonck** — well covered, with one genuine transition-law overlap (a pre-2024 plan still
  applying alongside the omgevingsplan). Both sources are retained; neither is silently discarded.
- **Rotterdam** — core sources clean, but local policy is split across partially overlapping
  documents and the welstand area typology is not yet mapped to parcel geometry.
- **Groningen** — no machine-readable welstand source. Reported as a gap rather than substituted.

The design principle the prototype is built to demonstrate: **do not silently guess when
information is missing or ambiguous.**

## Design decisions worth noting

- **Deterministic vs. interpreted is a field on the rule, not a convention.** Every normalized rule
  carries an `evaluation` value: `deterministic` (hard numeric thresholds, evaluated in code),
  `llm_interpretation` (free text handed to Claude as structured context), or
  `retained_for_review` (ambiguous or overlapping, held for a human). This is what makes the
  eventual output defensible.
- **`safeForAI` is computed, not asserted.** It is false whenever an expected source is missing,
  because that is the case where the model would otherwise speculate.
- **Provenance is per rule**, not per response, so any single statement in the final report can be
  traced back to a document reference and an effective date.
- **No permit verdicts anywhere.** The prototype deliberately shows no likelihood scores or
  approval percentages. It demonstrates the data pipeline, not the recommendation engine.

## Running locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run typecheck  # tsc --noEmit
npm run build      # production build
npm start          # serve the production build
```

Requires Node 18.18+. No environment variables, no database, no API keys.

## Deploying to Vercel

Either:

1. Push the repository to GitHub, then **New Project** in Vercel and import it. The framework is
   detected automatically; no build settings or environment variables need changing.

Or:

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

The Hobby tier is sufficient for this prototype — nothing here runs long. The production system is
a different matter: real ingestion and analysis will need Vercel Pro's longer function limits.

## Mocked vs. production

| Piece | In this prototype | In Milestone 1 |
| --- | --- | --- |
| Address resolution | `MockPdokAddressProvider`, three fixtures | PDOK Locatieserver + BAG |
| National rules | Static ruleset with parsed thresholds | Versioned Bbl ruleset with change tracking |
| Omgevingsplan | `MockDsoOmgevingsdocumentProvider` | DSO/Ozon omgevingsdocumenten API (some endpoints need a key) |
| Legacy plans | `MockTransitionPlanProvider` | IMRO-era plan service for transition-law overlaps |
| Local policy / welstand | `MockMunicipalPolicyProvider` | Per-municipality strategies with explicit exception handling |
| Rule storage | In-memory `Map` | Postgres, keyed by municipality code and document version |
| Normalization | Fixture data already in final shape | Real parsers per source type |
| Coverage analysis | **Real logic** | Unchanged |
| API contract | **Real** | Unchanged |

The last two rows are the point. The coverage analyzer and the response contract are production
logic already; Milestone 1 replaces what feeds them.

## Structure

```
app/
  layout.tsx                    root layout
  page.tsx                      masthead, milestone section, footer
  globals.css                   design tokens and all styles
  api/permit-context/route.ts   GET /api/permit-context?address=...
components/
  PipelineExplorer.tsx          run state, address resolution summary
  PipelineRail.tsx              the five stages
  CoveragePanel.tsx             source ledger + status pills
  RulesPanel.tsx                normalized rules
  ApiPanel.tsx                  dark JSON contract panel
lib/
  types.ts                      the shared contract
  pipeline/index.ts             resolve → discover → normalize → coverage → serve
  providers/index.ts            AddressProvider / SourceAdapter interfaces + mocks
  providers/fixtures.ts         illustrative sample data (the only fabricated content)
```

Every mocked implementation sits behind an interface in `lib/providers/`. Nothing above that
boundary knows whether a provider is real.

## API

```
GET /api/permit-context?address=Dorpsstraat%2012,%206021%20CE%20Budel
```

Returns `{ resolved: true, resolution, context }`, or `404` with a reason when the address does not
match a fixture. The `context` object is the contract the existing application would consume.

## Note on official sources

Endpoints were deliberately not hardcoded here. PDOK, DSO/Ozon and the Presenteren API evolve, some
require keys, and municipal policy coverage varies by municipality. Current official documentation
should be checked at implementation time rather than assumed. That uncertainty is exactly why the
pipeline reports coverage gaps as first-class output.

---

Indication only. The municipality remains the final authority on any permit decision.
