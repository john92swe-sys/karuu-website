/** @param {string} title */
export function formatProductMetadataTitle(title) {
  const unbrandedTitle = title.replace(/(?:\s*\|\s*KARUU)+\s*$/iu, '').trim();
  return `${unbrandedTitle} | KARUU`;
}
