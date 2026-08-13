import crypto from "node:crypto";

export function verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret: string): boolean {
  if (!signatureHeader?.startsWith("sha256=") || !appSecret) return false;
  const supplied = signatureHeader.slice(7);
  const expected = crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  if (supplied.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(supplied, "hex"), Buffer.from(expected, "hex"));
}

export function verifyChallenge(mode: string | null, token: string | null, challenge: string | null, expectedToken: string): string | null {
  if (mode === "subscribe" && token && token === expectedToken && challenge) return challenge;
  return null;
}

export type WhatsAppInbound = {
  eventId: string;
  whatsappUserId: string;
  phone: string;
  displayName?: string;
  text: string;
  receivedAt: Date;
  messageType: string;
};

export function extractInboundMessages(payload: any): WhatsAppInbound[] {
  const out: WhatsAppInbound[] = [];
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value;
      const contact = value?.contacts?.[0];
      for (const message of value?.messages ?? []) {
        const text = message?.text?.body ?? message?.button?.text ?? message?.interactive?.button_reply?.title ?? "";
        out.push({
          eventId: String(message?.id ?? ""),
          whatsappUserId: String(message?.from ?? ""),
          phone: String(message?.from ?? ""),
          displayName: contact?.profile?.name,
          text,
          receivedAt: new Date(Number(message?.timestamp ?? 0) * 1000),
          messageType: String(message?.type ?? "unknown")
        });
      }
    }
  }
  return out.filter((m) => m.eventId && m.whatsappUserId);
}
