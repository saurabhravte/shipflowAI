import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db, subscription } from "@shipflow/db";

/**
 * Razorpay signs over the RAW webhook body — re-parsing to JSON and
 * re-stringifying before verifying produces a different byte sequence and
 * fails verification (same lesson as the GitHub webhook in Pass 3).
 * `req.text()` is read once and passed as-is into the HMAC computation.
 *
 * Implemented as manual HMAC-SHA256 (rather than importing a helper from
 * the `razorpay` package's internal `dist/utils` path, whose public-export
 * stability across versions isn't something I could verify from here) —
 * this is the same algorithm Razorpay's own docs describe and show as a
 * direct code sample, so it has no dependency on the SDK's internal file
 * layout. If you prefer the SDK helper, check your installed version's
 * actual exports first: `require('razorpay/dist/utils/razorpay-utils')`.
 */
function verifyRazorpaySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  // Constant-time comparison — avoids leaking timing information about how
  // many leading bytes matched, which a naive `===` would not protect against.
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}

export async function POST(req: Request) {
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
  }

  const rawBody = await req.text();

  let isValid: boolean;
  try {
    isValid = verifyRazorpaySignature(rawBody, signature, process.env.RAZORPAY_WEBHOOK_SECRET as string);
  } catch (err) {
    console.error("[razorpay webhook] signature validation threw:", err);
    return NextResponse.json({ error: "Signature validation failed" }, { status: 400 });
  }

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody);
  const event = payload.event as string;

  try {
    switch (event) {
      case "subscription.activated":
      case "subscription.charged": {
        const rpSubscriptionId = payload.payload.subscription.entity.id as string;
        const currentEnd = payload.payload.subscription.entity.current_end as number | null;
        await db
          .update(subscription)
          .set({
            status: "active",
            currentPeriodEnd: currentEnd ? new Date(currentEnd * 1000) : null,
          })
          .where(eq(subscription.razorpaySubscriptionId, rpSubscriptionId));
        break;
      }
      case "subscription.pending":
      case "subscription.halted": {
        const rpSubscriptionId = payload.payload.subscription.entity.id as string;
        await db
          .update(subscription)
          .set({ status: "past_due" })
          .where(eq(subscription.razorpaySubscriptionId, rpSubscriptionId));
        break;
      }
      case "subscription.cancelled": {
        const rpSubscriptionId = payload.payload.subscription.entity.id as string;
        await db
          .update(subscription)
          .set({ status: "canceled", plan: "free" })
          .where(eq(subscription.razorpaySubscriptionId, rpSubscriptionId));
        break;
      }
      default:
        // Unhandled event types are expected (Razorpay sends many event
        // types we don't subscribe to in the dashboard config) — no-op,
        // not an error.
        break;
    }
  } catch (err) {
    console.error(`[razorpay webhook] handler error for event "${event}":`, err);
    // Still return 200 here would suppress Razorpay's retry — but since the
    // signature was valid and the failure is on our side (DB write failed),
    // returning 500 lets Razorpay's retry schedule give us another chance
    // once the underlying issue (e.g. a transient DB blip) clears.
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
