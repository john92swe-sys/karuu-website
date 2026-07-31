import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const fallbackInquiryEmail = 'info@karuu.se';

const fieldLabels: Record<string, string> = {
  productSku: 'Product SKU',
  productName: 'Product Name',
  factoryStyle: 'Factory Style',
  companyName: 'Company Name',
  contactName: 'Contact Name',
  businessEmail: 'Business Email',
  countryRegion: 'Country / Region',
  phone: 'WhatsApp / Phone',
  estimatedQuantity: 'Estimated Quantity',
  selectedColor: 'Selected Color',
  numberOfColors: 'Number of Colors',
  sizeRequirements: 'Size Requirements',
  customLogo: 'Custom Logo',
  customLabel: 'Custom Label',
  customPackaging: 'Custom Packaging',
  preferredTradeTerm: 'Preferred Trade Term',
  requiredDeliveryDate: 'Required Delivery Date',
  message: 'Message',
  privacyConsent: 'Privacy Consent',
};

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim().slice(0, 4000) : '';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const productSku = readField(formData, 'productSku');
  const productName = readField(formData, 'productName');
  const subject = productSku
    ? `KARUU quote request — ${productSku}`
    : 'KARUU business inquiry';

  const lines = Object.entries(fieldLabels)
    .map(([key, label]) => {
      const value = readField(formData, key);
      return value ? `${label}: ${value}` : null;
    })
    .filter((line): line is string => Boolean(line));

  if (!lines.length) {
    return NextResponse.json({ error: 'No inquiry details were provided.' }, { status: 400 });
  }

  const recipient = process.env.KARUU_INQUIRY_EMAIL || fallbackInquiryEmail;
  const body = [
    'Hello KARUU team,',
    '',
    `I would like to request information about ${productName || 'your B2B services'}.`,
    '',
    ...lines,
    '',
    'Please review these requirements and contact me to discuss the next steps.',
  ].join('\n');
  const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const safeMailto = escapeHtml(mailto);

  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Email draft prepared | KARUU</title>
    <style>
      body{margin:0;background:#f5f7fa;color:#1a3a5c;font:16px/1.6 Arial,sans-serif}
      main{max-width:640px;margin:10vh auto;padding:32px;background:#fff;border-radius:18px;box-shadow:0 12px 40px rgba(26,58,92,.12)}
      a{display:inline-block;margin-top:12px;padding:12px 20px;border-radius:8px;background:#1a3a5c;color:#fff;text-decoration:none;font-weight:700}
      p{color:#52616f}
    </style>
  </head>
  <body>
    <main>
      <h1>Your email draft is ready</h1>
      <p>Your email application should open automatically. Review the message and send it to complete your inquiry. KARUU has not received anything until you send the email.</p>
      <a href="${safeMailto}">Open email draft</a>
      <p><a href="/products/${encodeURIComponent(productSku.toLowerCase())}" style="background:transparent;color:#1a3a5c;padding-left:0">Return to product</a></p>
    </main>
    <script>window.location.href=${JSON.stringify(mailto)};</script>
  </body>
</html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",
        'Cache-Control': 'no-store',
      },
    }
  );
}
