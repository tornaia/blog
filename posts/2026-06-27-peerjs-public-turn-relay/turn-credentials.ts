import { verifyToken } from '@clerk/backend';

// Vercel serverless function (Node runtime, not Edge — @clerk/backend needs Node).
// Mints a short-lived, dedicated Cloudflare Realtime TURN credential.
//
// The endpoint is public and spends the Cloudflare quota, so it is gated:
//   1) a valid, signed-in Clerk session (else 401), and
//   2) an allowlist claim — `ladder_id` in the session token (else 403).
// Any misconfig / upstream failure returns 5xx, and the client silently falls
// back to peerjs's default config.

interface AllowlistClaims {
  ladder_id?: string;
}

async function handler(req: Request): Promise<Response> {
  // @vercel/node type-checks api/ against the root tsconfig, which has no
  // @types/node, so a bare `process` trips TS2591. Reaching env through
  // globalThis needs only standard-lib types and checks clean.
  const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
  const tokenId  = env.CLOUDFLARE_TURN_TOKEN_ID;
  const apiToken = env.CLOUDFLARE_TURN_API_TOKEN;
  const clerkKey = env.CLERK_SECRET_KEY;
  if (!tokenId || !apiToken || !clerkKey) return new Response(null, { status: 503 });

  const bearer = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!bearer) return new Response(null, { status: 401 });

  let claims: AllowlistClaims;
  try {
    claims = (await verifyToken(bearer, { secretKey: clerkKey })) as unknown as AllowlistClaims;
  } catch {
    return new Response(null, { status: 401 });
  }
  if (!claims.ladder_id) return new Response(null, { status: 403 });

  // 24h TTL: the credential must outlive the longest continuous session — a
  // relayed connection keeps refreshing its TURN allocation with this same
  // credential, so a short TTL would drop relay users mid-game.
  try {
    const r = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${tokenId}/credentials/generate`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl: 86400 }),
      },
    );
    if (!r.ok) return new Response(null, { status: 502 });
    // Cloudflare returns { iceServers: { urls, username, credential } }.
    return new Response(await r.text(), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=3600' },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}

export default { fetch: handler };
