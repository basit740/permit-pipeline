'use client';

import { useState } from 'react';
import type { PermitContext } from '@/lib/types';

/**
 * The panel shows a trimmed view of the contract so it stays readable on one
 * screen. The full objects come back from the endpoint itself.
 */
function displayShape(context: PermitContext) {
  return {
    address: context.address,
    municipality: context.municipality,
    coverage: {
      status: context.coverage.status,
      verified: context.coverage.verified,
      review: context.coverage.review,
      missing: context.coverage.missing,
    },
    ruleGroups: context.ruleGroups,
    provenance: context.provenance,
    safeForAI: context.safeForAI,
    rules: context.rules.map((r) => ({
      category: r.category,
      evaluation: r.evaluation,
      status: r.status,
      sources: r.sources,
    })),
    disclaimer: context.disclaimer,
  };
}

function highlight(json: string) {
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped.replace(
    /("(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      if (match.startsWith('"')) {
        return match.trimEnd().endsWith(':')
          ? `<span class="k">${match}</span>`
          : `<span class="s">${match}</span>`;
      }
      if (/^(true|false|null)$/.test(match)) return `<span class="b">${match}</span>`;
      return `<span class="n">${match}</span>`;
    },
  );
}

export default function ApiPanel({
  context,
  endpoint,
}: {
  context: PermitContext;
  endpoint: string;
}) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(displayShape(context), null, 2);

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="code-panel">
      <div className="code-head">
        <span className="endpoint">GET {endpoint}</span>
        <button type="button" className="copy-btn" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="code-body">
        <code dangerouslySetInnerHTML={{ __html: highlight(json) }} />
      </pre>
    </div>
  );
}
