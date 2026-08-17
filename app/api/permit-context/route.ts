import { NextResponse } from 'next/server';
import { buildPermitContext } from '@/lib/pipeline';

/**
 * GET /api/permit-context?address=...
 *
 * The single endpoint the client's existing application would call. The shape
 * of the response is the deliverable; the data behind it is mocked.
 */
export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get('address')?.trim() ?? '';

  if (!address) {
    return NextResponse.json(
      { resolved: false, query: '', reason: 'Provide an address in the `address` query parameter.' },
      { status: 400 },
    );
  }

  const result = await buildPermitContext(address);
  return NextResponse.json(result, { status: result.resolved ? 200 : 404 });
}
