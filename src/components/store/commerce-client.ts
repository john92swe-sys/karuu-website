export type CatalogSku = {
  id: string; slug: string; title: string; kind: string; currency: string;
  priceMinor: number | null; normalPriceMinor?: number | null; promotion?: boolean; components: { id: string; title: string; format: string; language: string }[];
  available: boolean; unavailableReason: string | null;
};
export type CommerceStatus = {
  database: boolean; accounts: boolean; payments: boolean; privateMedia: boolean; inquiries: boolean;
  kru: { enabled: boolean; reason: string };
};
export type AccountUser = { id: string; email: string; role: string; brands: string[] };
export type AccountOrder = { id: string; status: string; currency: string; totalMinor: number; createdAt: string; items: { title: string; components: string[] }[] };
export type LibraryItem = { assetId: string; title: string; format: string; language: string; orderId: string; status: 'active' | 'revoked' };

export async function commerceRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', cache: 'no-store', ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : `Request could not be completed (${response.status}).`);
  return data as T;
}
