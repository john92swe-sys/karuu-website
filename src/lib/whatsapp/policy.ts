export const KARUU_PRODUCTS_URL = "https://www.karuu.net/products";
export const HUMAN_EMAIL = "john@karuu.net";
export const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

export const HOT_LEAD_TERMS = [
  "moq", "minimum order", "price", "pricing", "quote", "quotation", "sample",
  "spec", "specification", "design", "tech pack", "lead time", "delivery",
  "purchase", "procurement", "rfq", "meeting", "supplier", "manufacturer",
  "development partner", "oem", "odm", "private label"
];

export const STOP_TERMS = [
  "stop", "unsubscribe", "no thanks", "do not contact", "don't contact",
  "remove me", "opt out"
];

export function normalizePhone(input: string): string {
  return input.trim().replace(/[^\d+]/g, "").replace(/^00/, "+");
}

export function isHotLead(text: string): boolean {
  const value = text.toLowerCase();
  return HOT_LEAD_TERMS.some((term) => value.includes(term));
}

export function isStopIntent(text: string): boolean {
  const value = text.toLowerCase().trim();
  return STOP_TERMS.some((term) => value === term || value.includes(term));
}

export function serviceWindowExpiresAt(receivedAt: Date): Date {
  return new Date(receivedAt.getTime() + SERVICE_WINDOW_MS);
}

export function isInsideServiceWindow(lastInboundAt: Date, now = new Date()): boolean {
  return now.getTime() <= serviceWindowExpiresAt(lastInboundAt).getTime();
}

export const SYSTEM_INSTRUCTIONS = `You are KARUU AI Sales Assistant, the transparent AI sales assistant for KARUU. English is preferred, but reply in the buyer's language when clear. You may explain verified KARUU activewear, yoga wear, sportswear, OEM/ODM, private-label and small-batch development information and may share ${KARUU_PRODUCTS_URL}. Collect buyer name, company, country, website, role, product category, estimated quantity, target MOQ, sample needs, specifications, target timeline and meeting intent. Never promise final price, minimum MOQ, sample fees, payment terms, contract terms, exact delivery dates, unverified certificates/materials/capacity, exclusivity, refunds, compensation or legal commitments. For those matters say a KARUU representative will follow up. Always make human handoff available as “Talk to John” or ${HUMAN_EMAIL}. Do not initiate outbound prospecting. Respect STOP/unsubscribe immediately.`;
