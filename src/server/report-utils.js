export function normalizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

export function cleanExportText(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replaceAll('\u00a0', ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeHeaderKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function sortLocale(values) {
  return [...values].sort((left, right) => left.localeCompare(right, 'pt-BR'));
}

export function fileNameSlug(value) {
  return String(value || 'municipio')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function millions(value) {
  return `R$ ${((Number(value) || 0) / 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} milhões`;
}
