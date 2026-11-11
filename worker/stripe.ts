// The two things the shop needs from Stripe, written against plain fetch and
// Web Crypto so no SDK is required and the same code runs in tests.

export const STRIPE_API = "https://api.stripe.com/v1";

/**
 * Stripe's API takes form fields, with nesting written as a[b][0][c]=value.
 * { a: { b: [{ c: 1 }] } } -> "a[b][0][c]=1"
 */
export function formEncode(data: Record<string, unknown>): string {
  const pairs: string[] = [];
  const walk = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) value.forEach((v, i) => walk(`${key}[${i}]`, v));
    else if (typeof value === "object") {
      for (const [k, v] of Object.entries(value)) walk(`${key}[${k}]`, v);
    } else pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  };
  for (const [k, v] of Object.entries(data)) walk(k, v);
  return pairs.join("&");
}

export async function stripeRequest(
  secretKey: string,
  method: "GET" | "POST",
  path: string,
  body: Record<string, unknown> | undefined,
  fetchImpl: typeof fetch,
): Promise<{ ok: boolean; status: number; data: any }> {
  const response = await fetchImpl(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: body ? formEncode(body) : undefined,
  });
  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // Leave data null; the caller treats a non-JSON answer as a failure.
  }
  return { ok: response.ok, status: response.status, data };
}

const hex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

/** Compares without stopping at the first difference. */
function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signPayload(secret: string, timestamp: number, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`)));
}

/**
 * True only if the webhook body was signed by Stripe with our secret, and
 * recently. This is the one thing that proves a "payment succeeded" message
 * is real; without it anyone could post a fake one.
 */
export async function verifyWebhook(
  payload: string,
  signatureHeader: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
): Promise<boolean> {
  if (!signatureHeader) return false;
  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of signatureHeader.split(",")) {
    const [k, v] = part.split("=");
    if (k === "t" && v) timestamp = Number(v);
    if (k === "v1" && v) signatures.push(v);
  }
  if (timestamp === null || !Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;
  const expected = await signPayload(secret, timestamp, payload);
  return signatures.some((s) => sameString(s, expected));
}
