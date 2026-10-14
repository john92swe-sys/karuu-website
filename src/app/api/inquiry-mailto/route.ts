import { NextResponse } from 'next/server';
import { karuuInquiryDraft } from '@/lib/inquiry-draft';
export const runtime = 'nodejs';
const escapeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 20000) return NextResponse.json({ error: 'The inquiry is too large.' }, { status: 413 });
  const form = await request.formData();
  if (form.get('website')) return NextResponse.json({ error: 'Invalid submission.' }, { status: 400 });
  const draft = karuuInquiryDraft(form);
  if (!draft) return NextResponse.json({ error: 'Please contact JKJ-Plus through its own website.' }, { status: 400 });
  return new NextResponse(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your email draft | KARUU</title><style>body{margin:0;background:#f2f8fc;color:#12364d;font:16px/1.6 Arial,sans-serif}main{max-width:640px;margin:8vh auto;padding:32px;background:white;border-radius:18px}a{color:#0878cc}a.button{display:inline-block;padding:12px 20px;background:#0878cc;color:white;border-radius:8px;text-decoration:none}</style></head><body><main><h1>Your email draft is ready</h1><p>Your details are included in a draft addressed to john@karuu.net. Review and send it in your email app to complete your inquiry. This page has not sent or saved your request.</p><a class="button" href="${escapeHtml(draft)}">Open email draft</a><p><a href="/contact">Return to KARUU contact</a></p></main></body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'" } });
}
