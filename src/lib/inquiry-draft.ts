export const inquiryFieldLabels: Record<string, string> = {
  productSku: 'Product SKU', productName: 'Product Name', inquiryType: 'Inquiry Type',
  companyName: 'Company Name', contactName: 'Contact Name', businessEmail: 'Business Email',
  countryRegion: 'Country / Region', businessType: 'Business Type', intendedUse: 'Intended Use',
  instructorStaffWear: 'Instructor or Staff Wear', memberRetail: 'Member Retail', teacherTraining: 'Teacher Training',
  privateLabel: 'Private Label', phone: 'WhatsApp / Phone', estimatedQuantity: 'Estimated Total Quantity',
  preferredProductCategories: 'Preferred Product Categories', representativeStyles: 'Selected Representative Styles',
  selectedColor: 'Selected Color', numberOfColors: 'Number of Colors', sizeRequirements: 'Size Requirements',
  customLogo: 'Custom Logo', customLabel: 'Custom Label', customPackaging: 'Custom Packaging',
  brandingRequirement: 'Branding Requirement', preferredTradeTerm: 'Preferred Trade Term',
  requiredDeliveryDate: 'Required Delivery Date', targetLaunchDate: 'Target Launch Date', message: 'Message',
};
export function karuuInquiryDraft(form: FormData) {
  if (form.get('brand') === 'jkj-plus') return null;
  const read = (key: string) => { const value = form.get(key); return typeof value === 'string' ? value.trim().slice(0, key === 'message' ? 4000 : 500) : ''; };
  const subject = ['KARUU inquiry', read('inquiryType'), read('productSku')].filter(Boolean).join(' — ');
  const details = Object.entries(inquiryFieldLabels).map(([key, label]) => read(key) ? `${label}: ${read(key)}` : '').filter(Boolean);
  const slug = read('productSlug');
  const source = slug && /^[a-z0-9-]+$/.test(slug) ? `https://www.karuu.net/products/${slug}` : 'https://www.karuu.net/contact';
  return `mailto:john@karuu.net?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(['Hello KARUU team,', '', ...details, '', `Website: ${source}`, 'Please contact me to discuss the next steps.'].join('\n'))}`;
}
