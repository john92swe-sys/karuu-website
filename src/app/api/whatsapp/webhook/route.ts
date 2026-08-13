import { NextRequest, NextResponse } from "next/server";
import { extractInboundMessages, verifyChallenge, verifyMetaSignature } from "@/lib/whatsapp/meta";
import { isHotLead, isStopIntent, normalizePhone, serviceWindowExpiresAt } from "@/lib/whatsapp/policy";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const challenge = verifyChallenge(
    url.searchParams.get("hub.mode"),
    url.searchParams.get("hub.verify_token"),
    url.searchParams.get("hub.challenge"),
    process.env.WHATSAPP_VERIFY_TOKEN ?? ""
  );
  return challenge ? new NextResponse(challenge, { status: 200 }) : new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const appSecret = process.env.META_APP_SECRET ?? "";
  if (!verifyMetaSignature(rawBody, signature, appSecret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let payload: unknown;
  try { payload = JSON.parse(rawBody); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const events = extractInboundMessages(payload);
  const accepted = events.map((event) => ({
    provider_event_id: event.eventId,
    whatsapp_user_id: event.whatsappUserId,
    phone_normalized: normalizePhone(event.phone),
    received_at: event.receivedAt.toISOString(),
    service_window_expires_at: serviceWindowExpiresAt(event.receivedAt).toISOString(),
    buying_signal: isHotLead(event.text),
    lead_status: isHotLead(event.text) ? "HOT_LEAD" : "INQUIRY",
    suppressed: isStopIntent(event.text),
    source_channel: "whatsapp",
    message_type: event.messageType
  }));

  // Preview skeleton only: persistence, OpenAI response and Meta send are intentionally disabled
  // until Meta test-number credentials and protected staging secrets are connected.
  return NextResponse.json({ ok: true, accepted_count: accepted.length });
}
