import fs from 'node:fs/promises';
import XLSX from 'xlsx';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const STATUS_LABELS = {
  ATENDIDO: 'Atendido',
  EM_ABERTO: 'Em Aberto',
  EM_ESTUDO: 'Em Estudo',
  CONVENIO: 'Convênio',
  LICITACAO: 'Licitação',
  CANCELADO: 'Cancelado'
};

const OPEN_STATUS_SET = new Set(['EM_ABERTO', 'EM_ESTUDO', 'LICITACAO']);
const ATTENDED_STATUS_SET = new Set(['ATENDIDO', 'CONVENIO']);

function getStatusLabel(statusValue) {
  return STATUS_LABELS[String(statusValue || '').toUpperCase()] || 'Em Aberto';
}

const MUNICIPALITY_ALIASES = {
  'dario meira': 'Dário Meira',
  dario: 'Dário',
  ipiau: 'Ipiaú',
  ipiacu: 'Ipiaú',
  piau: 'Ipiaú',
  abaira: 'Abaíra',
  abare: 'Abaré',
  'abaré': 'Abaré',
  aiquara: 'Aiquara',
  anage: 'Anagé',
  'anagé': 'Anagé',
  'barra do rocha': 'Barra do Rocha',
  'sento se': 'Sento Sé',
  'sento sé': 'Sento Sé',
  'vitoria da conquista': 'Vitória da Conquista',
  'vitória da conquista': 'Vitória da Conquista',
  'porto seguro': 'Porto Seguro',
  'sao felipe': 'São Felipe',
  'sao jose': 'São José',
  'sa jose': 'São José',
  cachoeira: 'Cachoeira',
  'varzea da rocha': 'Várzea da Rocha',
  varzea: 'Várzea',
  ibirataia: 'Ibirataia',
  ibira: 'Ibirataia',
  itamari: 'Itamari',
  itagi: 'Itagi',
  itagiba: 'Itagibá',
  jitauna: 'Jitaúna',
  'jitaúna': 'Jitaúna',
  'nova ibia': 'Nova Ibiá',
  ubata: 'Ubatá',
  gongogi: 'Gongogi',
  gongoji: 'Gongogi',
  itapetinga: 'Itapetinga',
  camacari: 'Camaçari',
  'camaçari': 'Camaçari',
  'feira de santana': 'Feira de Santana',
  caetite: 'Caateté',
  'caateté': 'Caateté'
};

const TERRITORY_ALIASES = {
  itaparica: 'Itaparica',
  'sao francisco': 'São Francisco',
  'vale do sao francisco': 'Vale do São Francisco',
  'vale do são francisco': 'Vale do São Francisco',
  'chapada diamantina': 'Chapada Diamantina',
  'medio rio de contas': 'Médio Rio de Contas',
  'medio rio': 'Médio Rio',
  reconcavo: 'Recôncavo',
  'recôncavo': 'Recôncavo',
  'litoral norte': 'Litoral Norte',
  'litoral sul': 'Litoral Sul',
  'sul da bahia': 'Sul da Bahia',
  'extremo sul': 'Extremo Sul',
  'campo alegre de lourdes': 'Campo Alegre de Lourdes'
};

const DEFAULT_FILTERS = {
  municipality: 'ALL',
  territory: 'ALL',
  organ: 'ALL',
  status: 'ALL',
  search: ''
};

function sanitizeExcludedRecordIds(values) {
  if (!Array.isArray(values) || !values.length) return new Set();
  return new Set(
    values
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)
  );
}

function applyExcludedRecords(records, excludedRecordIds) {
  const excluded = sanitizeExcludedRecordIds(excludedRecordIds);
  if (!excluded.size) return records;
  return records.filter((record) => !excluded.has(Number(record.id)));
}

function sanitizeIncludedRecordIds(values) {
  if (!Array.isArray(values) || !values.length) return new Set();
  return new Set(
    values
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)
  );
}

function applyIncludedRecords(records, includedRecordIds) {
  const included = sanitizeIncludedRecordIds(includedRecordIds);
  if (!included.size) return records;
  return records.filter((record) => included.has(Number(record.id)));
}

function normalizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function stripDiacritics(value) {
  return normalizeText(value, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeNameKey(value) {
  return stripDiacritics(normalizeText(value, ''))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalizeDisplayName(value, fallback = '') {
  const raw = normalizeText(value, fallback);
  if (!raw) return fallback;

  return raw
    .replace(/\s+/g, ' ')
    .replace(/[-–—]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (index > 0 && ['da', 'de', 'do', 'dos', 'das', 'e', 'em', 'na', 'no', 'a', 'ao', 'as', 'os'].includes(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function normalizeMunicipioName(value, fallback = 'Não Especificado') {
  const raw = normalizeText(value, fallback);
  if (!raw || raw === fallback) return fallback;
  const key = normalizeNameKey(raw);
  return key ? MUNICIPALITY_ALIASES[key] || canonicalizeDisplayName(raw, fallback) : fallback;
}

function normalizeTerritorioName(value, fallback = 'não consta') {
  const raw = normalizeText(value, fallback);
  if (!raw || raw === fallback) return fallback;
  const key = normalizeNameKey(raw);
  return key ? TERRITORY_ALIASES[key] || canonicalizeDisplayName(raw, fallback) : fallback;
}

function normalizeStatusValue(rawStatus) {
  const cleaned = stripDiacritics(normalizeText(rawStatus, 'EM_ABERTO')).toLowerCase();

  if (cleaned.includes('nao public')) return 'EM_ABERTO';
  if (cleaned.includes('public')) return 'ATENDIDO';
  if (cleaned.includes('conclu') || cleaned.includes('atendid') || cleaned.includes('entreg') || cleaned.includes('finaliz')) return 'ATENDIDO';
  if (cleaned.includes('conven')) return 'CONVENIO';
  if (cleaned.includes('licit')) return 'LICITACAO';
  if (cleaned.includes('estud') || cleaned.includes('analis') || cleaned.includes('avali')) return 'EM_ESTUDO';
  if (cleaned.includes('aberto') || cleaned.includes('pend')) return 'EM_ABERTO';
  if (cleaned.includes('cancel')) return 'CANCELADO';
  return 'EM_ABERTO';
}

function parseNumericValue(value) {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value !== 'string') return 0;

  const cleaned = value
    .replace(/R\$/gi, '')
    .replaceAll('.', '')
    .replaceAll(',', '.')
    .replace(/\s+/g, '')
    .trim();

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isOpenStatus(statusValue) {
  return OPEN_STATUS_SET.has(String(statusValue || '').toUpperCase());
}

function isAttendedStatus(statusValue) {
  return ATTENDED_STATUS_SET.has(String(statusValue || '').toUpperCase());
}

function calculateReportMetrics(records) {
  const safeRecords = Array.isArray(records) ? records : [];

  const attendedRecords = safeRecords.filter((record) =>
    isAttendedStatus(record.statusStd)
  );

  const openRecords = safeRecords.filter((record) =>
    isOpenStatus(record.statusStd)
  );

  const attendedValue = attendedRecords.reduce(
    (total, record) => total + Number(record.val || 0),
    0
  );

  const openValue = openRecords.reduce(
    (total, record) => total + Number(record.val || 0),
    0
  );

  return {
    totalRecords: safeRecords.length,
    attendedRecords,
    openRecords,
    attendedCount: attendedRecords.length,
    openCount: openRecords.length,
    attendedValue,
    openValue
  };
}

function classifyAreaByText(desc) {
  const text = normalizeText(desc, '').toLowerCase();
  if (text.includes('escola') || text.includes('colegio') || text.includes('quadra') || text.includes('ginasio') || text.includes('creche')) return 'Educação e Esporte';
  if (text.includes('agua') || text.includes('esgoto') || text.includes('drenagem') || text.includes('canal') || text.includes('eta')) return 'Saneamento, Drenagem e Água';
  if (text.includes('pista') || text.includes('paviment') || text.includes('estrada') || text.includes('acesso') || text.includes('ponte')) return 'Infraestrutura e Mobilidade';
  if (text.includes('casa') || text.includes('habitac') || text.includes('praca') || text.includes('lagoa')) return 'Habitação e Urbanização';
  if (text.includes('mercado') || text.includes('feira') || text.includes('cacau') || text.includes('rural')) return 'Desenvolvimento Rural e Feiras';
  if (text.includes('hospital') || text.includes('ubs') || text.includes('policia') || text.includes('delegacia')) return 'Saúde e Segurança Pública';
  return 'Infraestrutura e Geral';
}

function computePriority(val, statusStd) {
  const status = String(statusStd || '').toUpperCase();

  if (status === 'CANCELADO') return 'BAIXA';
  if (status === 'ATENDIDO' || status === 'CONVENIO') return val >= 10000000 ? 'MÉDIA' : 'BAIXA';
  if (status === 'LICITACAO') return val >= 5000000 ? 'ALTA' : 'MÉDIA';
  if (status === 'EM_ESTUDO') {
    if (val >= 7000000) return 'ALTA';
    if (val >= 2000000) return 'MÉDIA';
    return 'BAIXA';
  }
  if (isOpenStatus(status)) {
    if (val >= 8000000) return 'ALTA';
    if (val >= 2000000) return 'MÉDIA';
  }
  return 'BAIXA';
}

function stringSimilarity(textA, textB) {
  const normalizedA = String(textA || '').toLowerCase().replace(/[^\w\s]/g, '');
  const normalizedB = String(textB || '').toLowerCase().replace(/[^\w\s]/g, '');
  if (normalizedA === normalizedB) return 1;

  const wordsA = new Set(normalizedA.split(/\s+/).filter(Boolean));
  const wordsB = new Set(normalizedB.split(/\s+/).filter(Boolean));
  const intersection = new Set([...wordsA].filter((word) => wordsB.has(word)));
  const union = new Set([...wordsA, ...wordsB]);

  return union.size ? intersection.size / union.size : 0;
}

function tokenizeForDuplicateCheck(text) {
  const normalized = normalizeNameKey(text);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}

function buildPairKey(leftIndex, rightIndex) {
  return leftIndex < rightIndex ? `${leftIndex}:${rightIndex}` : `${rightIndex}:${leftIndex}`;
}

function setSimilarity(wordsA, wordsB) {
  if (!wordsA.size && !wordsB.size) return 1;
  if (!wordsA.size || !wordsB.size) return 0;

  let intersectionSize = 0;
  const smaller = wordsA.size <= wordsB.size ? wordsA : wordsB;
  const larger = smaller === wordsA ? wordsB : wordsA;

  smaller.forEach((word) => {
    if (larger.has(word)) intersectionSize += 1;
  });

  const unionSize = wordsA.size + wordsB.size - intersectionSize;
  return unionSize ? intersectionSize / unionSize : 0;
}

function hygienizeMunicipioAndTerritorioRows(rows) {
  const seen = new Set();
  const nextRows = [];

  rows.forEach((row) => {
    const plainMuni = normalizeMunicipioName(row.muni || row.municipio || row.MUNICIPIO || row['Município'] || 'Não Especificado');
    const plainTerritorio = normalizeTerritorioName(row.territorio || row.territory || row.TERRITORIO || row['Território'] || row['territorio de identidade'] || 'não consta');

    const cleanedRow = {
      ...row,
      sourceAoaRowIndex: row.sourceAoaRowIndex,
      muni: plainMuni,
      municipio: plainMuni,
      territorio: plainTerritorio,
      territory: plainTerritorio,
      TERRITORIO: plainTerritorio,
      MUNICIPIO: plainMuni
    };

    const rowKey = [
      normalizeNameKey(cleanedRow.muni),
      normalizeNameKey(cleanedRow.territorio || 'não consta'),
      normalizeNameKey(cleanedRow.organ || cleanedRow.orgao || 'Geral'),
      normalizeNameKey(cleanedRow.desc || cleanedRow.descricao || 'Sem Descrição'),
      normalizeNameKey(cleanedRow.status || cleanedRow.statusRaw || 'Em Aberto'),
      normalizeNameKey(cleanedRow.area || 'Infraestrutura e Geral'),
      Number(cleanedRow.val ?? 0)
    ].join('|');

    if (!seen.has(rowKey)) {
      seen.add(rowKey);
      nextRows.push(cleanedRow);
    }
  });

  return nextRows;
}

function auditDataQuality(normalizedRecords) {
  const total = normalizedRecords.length;
  if (!total) {
    return {
      qualityScore: 0,
      fieldStats: {}
    };
  }

  let muniValid = 0;
  let organValid = 0;
  let descValid = 0;
  let valValid = 0;
  let statusValid = 0;

  normalizedRecords.forEach((record) => {
    if (record.muni && record.muni !== 'Não Especificado') muniValid += 1;
    if (record.organ && record.organ !== 'Geral') organValid += 1;
    if (record.desc && record.desc !== 'Sem Descrição') descValid += 1;
    if (typeof record.val === 'number' && !Number.isNaN(record.val) && record.val >= 0) valValid += 1;
    if (record.statusRaw) statusValid += 1;
  });

  const fieldStats = {
    muni: Math.round((muniValid / total) * 100),
    organ: Math.round((organValid / total) * 100),
    desc: Math.round((descValid / total) * 100),
    val: Math.round((valValid / total) * 100),
    status: Math.round((statusValid / total) * 100)
  };

  const qualityScore = Math.round((fieldStats.muni + fieldStats.organ + fieldStats.desc + fieldStats.val + fieldStats.status) / 5);
  return { qualityScore, fieldStats };
}

function detectDuplicates(normalizedRecords) {
  const duplicates = [];
  const groupedRecords = new Map();

  normalizedRecords.forEach((record, index) => {
    const groupKey = `${String(record.muni || '').toLowerCase()}|${String(record.organ || '').toLowerCase()}`;
    if (!groupedRecords.has(groupKey)) groupedRecords.set(groupKey, []);
    groupedRecords.get(groupKey).push({
      index,
      record,
      words: new Set(tokenizeForDuplicateCheck(record.desc))
    });
  });

  groupedRecords.forEach((group) => {
    if (group.length < 2) return;

    const tokenPostings = new Map();
    const seenPairs = new Set();

    for (let currentPosition = 0; currentPosition < group.length; currentPosition += 1) {
      const current = group[currentPosition];
      const candidatePositions = new Set();

      current.words.forEach((word) => {
        const positions = tokenPostings.get(word);
        if (!positions) return;
        positions.forEach((position) => candidatePositions.add(position));
      });

      candidatePositions.forEach((candidatePosition) => {
        const candidate = group[candidatePosition];
        const pairKey = buildPairKey(current.index, candidate.index);
        if (seenPairs.has(pairKey)) return;
        seenPairs.add(pairKey);

        const similarity = setSimilarity(current.words, candidate.words);
        if (similarity >= 0.75) {
          duplicates.push({
            item1: candidate.record,
            item2: current.record,
            similarity: Math.round(similarity * 100)
          });
        }
      });

      current.words.forEach((word) => {
        if (!tokenPostings.has(word)) tokenPostings.set(word, []);
        tokenPostings.get(word).push(currentPosition);
      });
    }
  });

  return duplicates;
}

function matchesStatusFilter(recordStatus, filterValue) {
  if (filterValue === 'ALL') return true;
  const normalized = String(recordStatus || '').toUpperCase();

  switch (filterValue) {
    case 'ATENDIDO':
      return normalized === 'ATENDIDO' || normalized === 'CONVENIO';
    case 'EM_ABERTO':
      return isOpenStatus(normalized);
    case 'CONVENIO':
      return normalized === 'CONVENIO';
    case 'LICITACAO':
      return normalized === 'LICITACAO';
    case 'EM_ESTUDO':
      return normalized === 'EM_ESTUDO';
    case 'CANCELADO':
      return normalized === 'CANCELADO';
    default:
      return normalized === filterValue;
  }
}

function applyFilters(normalizedRecords, rawFilters = DEFAULT_FILTERS) {
  const filters = {
    ...DEFAULT_FILTERS,
    ...rawFilters,
    search: normalizeText(rawFilters.search, '').toLowerCase()
  };

  const filteredRecords = normalizedRecords.filter((record) => {
    const matchMuni = filters.municipality === 'ALL' || record.muni === filters.municipality;
    const matchTerritory = filters.territory === 'ALL' || (record.territorio || 'não consta') === filters.territory;
    const matchOrgan = filters.organ === 'ALL' || record.organ === filters.organ;
    const matchStatus = matchesStatusFilter(record.statusStd, filters.status);
    const matchSearch = !filters.search
      || record.muni.toLowerCase().includes(filters.search)
      || (record.territorio || 'não consta').toLowerCase().includes(filters.search)
      || record.organ.toLowerCase().includes(filters.search)
      || record.desc.toLowerCase().includes(filters.search)
      || String(record.area || '').toLowerCase().includes(filters.search);

    return matchMuni && matchTerritory && matchOrgan && matchStatus && matchSearch;
  });

  return { filters, filteredRecords };
}

function sortLocale(values) {
  return [...values].sort((left, right) => left.localeCompare(right, 'pt-BR'));
}

function buildFilterOptions(normalizedRecords) {
  return {
    municipalities: sortLocale(new Set(normalizedRecords.map((record) => record.muni).filter(Boolean))),
    territories: sortLocale(new Set(normalizedRecords.map((record) => record.territorio || 'não consta').filter(Boolean))),
    organs: sortLocale(new Set(normalizedRecords.map((record) => record.organ).filter(Boolean)))
  };
}

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
}

function formatWhatsAppShortCurrency(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return 'R$ 0,00';

  // Trata valores a partir de 1 Bilhão (ex: R$ 4,08 bi)
  if (amount >= 1000000000) {
    return `R$ ${(amount / 1000000000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} bi`;
  }

  // Trata valores a partir de 1 Milhão (ex: R$ 250,50 mi)
  if (amount >= 1000000) {
    return `R$ ${(amount / 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mi`;
  }

  // Trata valores a partir de 1 Mil (ex: R$ 500,0 mil)
  if (amount >= 1000) {
    return `R$ ${(amount / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`;
  }

  return formatBRL(amount);
}

function shortenWhatsAppDescription(description, maxLength = 240) {
  const text = normalizeText(description, 'Sem Descrição').replace(/\s+/g, ' ').trim();
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3).trim()}...`;
}

function extractWhatsAppLocation(record) {
  const original = record?.original || {};
  const candidates = [
    original.localizacao,
    original.localização,
    original.endereco,
    original.endereço,
    original.comunidade,
    original.local,
    original.bairro,
    original.distrito,
    original.territorio_local,
    original.território_local
  ];

  const found = candidates.find((value) => normalizeText(value, '').trim());
  if (found) return normalizeText(found).trim();

  const desc = normalizeText(record?.desc, '');
  const patterns = [
    /na\s+(Sede[^,.]*)/i,
    /no\s+(Distrito[^,.]*)/i,
    /na\s+(Comunidade[^,.]*)/i,
    /no\s+(Bairro[^,.]*)/i
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(desc);
    if (match?.[1]) return match[1].trim();
  }

  return '';
}

function getWhatsAppAreaTitle(area) {
  const text = normalizeText(area, 'Infraestrutura e Geral').toLowerCase();
  if (text.includes('infraestrutura') || text.includes('mobilidade') || text.includes('rodovia')) return 'INFRAESTRUTURA E RODOVIAS';
  if (text.includes('educação') || text.includes('educacao')) return 'EDUCAÇÃO';
  if (text.includes('saneamento') || text.includes('água') || text.includes('agua') || text.includes('drenagem')) return 'ÁGUA E SANEAMENTO';
  if (text.includes('esporte')) return 'ESPORTE E LAZER';
  if (text.includes('saúde') || text.includes('saude')) return 'SAÚDE';
  if (text.includes('segurança') || text.includes('seguranca')) return 'SEGURANÇA PÚBLICA';
  if (text.includes('rural') || text.includes('desenvolvimento')) return 'DESENVOLVIMENTO RURAL';
  if (text.includes('habitação') || text.includes('habitacao') || text.includes('urbanização') || text.includes('urbanizacao')) return 'HABITAÇÃO E URBANIZAÇÃO';
  return 'OUTRAS ÁREAS';
}

function compareInvestmentRecords(left, right) {
  const leftValue = Number(left?.val || 0);
  const rightValue = Number(right?.val || 0);
  const leftHasValue = leftValue > 0;
  const rightHasValue = rightValue > 0;

  if (leftHasValue && rightHasValue) {
    if (rightValue !== leftValue) return rightValue - leftValue;
  } else if (leftHasValue !== rightHasValue) {
    return leftHasValue ? -1 : 1;
  }

  const leftArea = getWhatsAppAreaTitle(left?.area);
  const rightArea = getWhatsAppAreaTitle(right?.area);
  if (leftArea !== rightArea) return leftArea.localeCompare(rightArea, 'pt-BR');

  const leftOrgan = normalizeText(left?.organ, 'Órgão não informado');
  const rightOrgan = normalizeText(right?.organ, 'Órgão não informado');
  if (leftOrgan !== rightOrgan) return leftOrgan.localeCompare(rightOrgan, 'pt-BR');

  return normalizeText(left?.desc, '').localeCompare(normalizeText(right?.desc, ''), 'pt-BR');
}

function buildAttendedInvestmentHighlights(records, options = {}) {
  const attendedRecords = records.filter((record) => isAttendedStatus(record.statusStd));
  if (!attendedRecords.length) {
    return {
      highlights: [],
      representedOrgans: 0,
      capacity: 0
    };
  }

  const baseCount = Number.isInteger(options.baseCount) ? options.baseCount : 8;
  const extraCount = Number.isInteger(options.extraCount) ? options.extraCount : 6;
  const hardCap = Number.isInteger(options.hardCap) ? options.hardCap : 30;

  const recordsByOrgan = new Map();
  attendedRecords.forEach((record) => {
    const organ = normalizeText(record.organ, 'Órgão não informado');
    if (!recordsByOrgan.has(organ)) recordsByOrgan.set(organ, []);
    recordsByOrgan.get(organ).push(record);
  });

  recordsByOrgan.forEach((items, organ) => {
    recordsByOrgan.set(organ, items.toSorted(compareInvestmentRecords));
  });

  const representatives = [];
  const remaining = [];
  const organEntries = [...recordsByOrgan.entries()].toSorted((left, right) => {
    const leftTop = left[1][0] || {};
    const rightTop = right[1][0] || {};
    return compareInvestmentRecords(leftTop, rightTop);
  });

  organEntries.forEach(([, items]) => {
    if (!items.length) return;
    representatives.push(items[0]);
    if (items.length > 1) remaining.push(...items.slice(1));
  });

  const representedOrgans = representatives.length;
  const minimumTarget = Math.max(baseCount, representedOrgans);
  const maximumTarget = Math.max(representedOrgans, Math.min(hardCap, minimumTarget + extraCount));

  const selected = [...representatives];
  const selectedRecordIds = new Set(selected.map((record) => record.id));

  remaining
    .toSorted(compareInvestmentRecords)
    .forEach((record) => {
      if (selected.length >= maximumTarget) return;
      if (selectedRecordIds.has(record.id)) return;
      selected.push(record);
      selectedRecordIds.add(record.id);
    });

  const highlights = selected.toSorted(compareInvestmentRecords);
  return {
    highlights,
    representedOrgans,
    capacity: maximumTarget
  };
}

function buildWhatsAppExecutiveSummary(records, filters) {
  if (!records.length) {
    return '*RESUMO DE INVESTIMENTOS E AÇÕES*\n\nNenhum registro encontrado para o recorte atual.';
  }

  const municipalities = [...new Set(records.map((record) => record.muni).filter(Boolean))];
  const territories = [...new Set(records.map((record) => record.territorio).filter(Boolean))];
  let municipalityName = 'BAHIA';
  let lines = [];

  const appendLines = (...entries) => {
    lines = lines.concat(entries);
  };

  const appendBlock = (entries) => {
    lines = lines.concat(entries);
  };

  if (filters.municipality !== 'ALL') {
    municipalityName = filters.municipality.toUpperCase();
  } else if (filters.territory !== 'ALL') {
    municipalityName = `TERRITÓRIO ${filters.territory}`.toUpperCase();
  } else if (municipalities.length === 1) {
    municipalityName = municipalities[0].toUpperCase();
  } else if (territories.length === 1) {
    municipalityName = `TERRITÓRIO ${territories[0]}`.toUpperCase();
  }

  const metrics = calculateReportMetrics(records);

  const attendedRecords = metrics.attendedRecords;
  const openRecords = metrics.openRecords;
  const attendedValue = metrics.attendedValue;

  const cancelledRecords = records.filter(
    (record) => String(record.statusStd || '').toUpperCase() === 'CANCELADO'
  );
  lines = [
    `*RESUMO DE INVESTIMENTOS E AÇÕES – ${municipalityName}*`,
    '',
    '*PANORAMA GERAL*',
    '━━━━━━━━━━━━━━━━━━',
    `• Total de pleitos: *${records.length}*`,
    `• Atendidos / Publicados: *${attendedRecords.length}*`,
    `• Em aberto: *${openRecords.length}*`,
    `• Investimentos atendidos/publicados: *${formatBRL(attendedValue)}*`,
  ];

  if (cancelledRecords.length > 0) {
    appendLines(`• Cancelados: *${cancelledRecords.length}*`);
  }

  const groupedOrgans = new Map();

  attendedRecords.forEach((record) => {
    const organ = normalizeText(record.organ, 'Órgão não informado');

    if (!groupedOrgans.has(organ)) {
      groupedOrgans.set(organ, []);
    }

    groupedOrgans.get(organ).push(record);
  });

  const organEntries = [...groupedOrgans.entries()]
    .sort(([organA], [organB]) =>
      organA.localeCompare(organB, 'pt-BR')
    );

  // ==========================================
  // ATENDIDOS / PUBLICADOS AGRUPADOS POR ÓRGÃO
  // ==========================================
  if (attendedRecords.length > 0) {
    appendLines(
      '',
      '━━━━━━━━━━━━━━━━━━',
      '*ATENDIDOS / PUBLICADOS*',
      '━━━━━━━━━━━━━━━━━━'
    );

    organEntries.forEach(([organ, organRecords]) => {
      if (!organRecords.length) return;

      const organTotal = organRecords.reduce(
        (sum, record) => sum + Number(record.val || 0),
        0
      );

      appendLines(
        '',
        `*${organ} — ${organRecords.length} ${organRecords.length === 1 ? 'ITEM' : 'ITENS'}*`,
        '━━━━━━━━━━━━━━━━━━'
      );

      organRecords.forEach((record) => {
        const value = Number(record.val || 0);

        appendLines(
          '',
          `*${value > 0 ? formatWhatsAppShortCurrency(value) : 'VALOR NÃO INFORMADO'}*`,
          `• ${shortenWhatsAppDescription(record.desc)}`
        );

        const location = extractWhatsAppLocation(record);

        if (location) {
          appendLines(`• Local: ${location}`);
        }
      });

      appendLines(
        '',
        `💰 *Total ${organ}: ${formatBRL(organTotal)}*`
      );
    });
  }

  // ==========================================
  // PLEITOS EM ABERTO
  // ==========================================
  if (openRecords.length > 0) {
    const groupedOpenOrgans = {};

    // Agrupa os pleitos em aberto por Secretaria/Órgão
    openRecords.forEach((record) => {
      const organ = normalizeText(record.organ, 'Orgao nao informado');

      groupedOpenOrgans[organ] = groupedOpenOrgans[organ] || [];
      groupedOpenOrgans[organ].push(record);
    });

    // Ordena as secretarias alfabeticamente
    const openOrganEntries = Object.entries(groupedOpenOrgans).sort((left, right) => {
      return left[0].localeCompare(right[0], 'pt-BR');
    });

    appendLines(
      '',
      '━━━━━━━━━━━━━━━━━━',
      '*PLEITOS EM ABERTO*',
      '━━━━━━━━━━━━━━━━━━'
    );

    openOrganEntries.forEach(([organ, items]) => {
      const organTotal = items.reduce(
        (sum, record) => sum + Number(record.val || 0),
        0
      );

      appendLines(
        '',
        `*${organ} — ${items.length} ${items.length === 1 ? 'ITEM' : 'ITENS'}*`,
        '━━━━━━━━━━━━━━━━━━'
      );

      items
        .slice()
        .sort(
          (left, right) =>
            Number(right?.val || 0) - Number(left?.val || 0)
        )
        .forEach((record) => {
          const value = Number(record.val || 0);

          appendLines(
            '',
            value > 0
              ? `*${formatWhatsAppShortCurrency(value)}*`
              : '*Valor nao informado*',
            `• ${shortenWhatsAppDescription(record.desc, 300)}`,
            `• Status: *${getStatusLabel(record.statusStd)}*`
          );
        });

      appendLines(
        '',
        `💰 *Total ${organ}: ${formatBRL(organTotal)}*`
      );
    });
  }

  // ==========================================
  // RESUMO FINAL
  // ==========================================
  appendLines(
    '',
    '━━━━━━━━━━━━━━━━━━',
    '*RESUMO*'
  );

  appendBlock([
    `• *${attendedRecords.length}* pleitos atendidos/publicados`,
    `• *${openRecords.length}* pleitos em aberto`,
    `• *${formatBRL(attendedValue)}* em investimentos atendidos/publicados`
  ]);

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanExportText(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replaceAll('\u00a0', ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeHeaderKey(value) {
  return stripDiacritics(cleanExportText(value)).toLowerCase();
}

function parseDateForExport(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 20000 && value < 80000 && XLSX?.SSF?.parse_date_code) {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) {
        return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0));
      }
    }
    return null;
  }

  const text = cleanExportText(value);
  if (!text) return null;

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/.exec(text);
  if (isoMatch) {
    const date = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const brMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(text);
  if (!brMatch) return null;

  const year = brMatch[3].length === 2 ? Number(`20${brMatch[3]}`) : Number(brMatch[3]);
  const date = new Date(year, Number(brMatch[2]) - 1, Number(brMatch[1]), Number(brMatch[4] || 0), Number(brMatch[5] || 0), Number(brMatch[6] || 0));
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateToExcelSerial(dateValue) {
  const date = dateValue instanceof Date ? dateValue : parseDateForExport(dateValue);
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const utcMillis = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  return (utcMillis - Date.UTC(1899, 11, 30)) / 86400000;
}

function parsePercentForExport(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value > 1 ? value / 100 : value;
  const text = cleanExportText(value).replace('%', '').trim();
  if (!text) return null;
  const parsed = Number(text.replaceAll('.', '').replaceAll(',', '.'));
  if (!Number.isFinite(parsed)) return null;
  return parsed > 1 ? parsed / 100 : parsed;
}

function parseNumericLikeForExport(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = cleanExportText(value);
  if (!text) return null;

  const normalized = text
    .replace(/^R\$\s*/i, '')
    .replaceAll('.', '')
    .replaceAll(',', '.')
    .replace(/\s+/g, '');

  if (!/^[-+]?\d*(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function canonicalizeStatusForExport(value) {
  const normalized = normalizeStatusValue(value);
  return STATUS_LABELS[normalized] || cleanExportText(value);
}

function canonicalizeOrganForExport(value) {
  return cleanExportText(value)
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'ao', 'a', 'as', 'os'].includes(lower)) return lower;
      if (lower === 's/a' || lower === 'sa') return 'S.A.';
      if (index > 0 && /^(sic|cme|dce|sud|sesab|seduc|seinfra|setur|sepromi|seagri|saeb|sae|seds|sedur|serin)$/.test(lower)) {
        return lower.toUpperCase();
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function inferExportColumnProfile(header, samples = []) {
  const headerKey = normalizeHeaderKey(header);
  const sampleValues = samples.filter((value) => value !== null && value !== undefined && value !== '');
  const sampleText = sampleValues.map((value) => cleanExportText(value)).filter(Boolean);

  if (/situa|status|estag|fase|andamento/.test(headerKey)) return 'status';
  if (/percent|porcent|taxa|indice|índice|\bperc\b|%/.test(headerKey) || sampleText.some((text) => text.endsWith('%'))) return 'percent';
  if (/data|dt\b|inicio|início|fim|prazo|emissao|emissão|vencimento|publicacao|publicação|assinatura|atualizacao|atualização/.test(headerKey) || sampleValues.some((value) => parseDateForExport(value))) return 'date';
  if (/valor|invest|orcam|orçam|custo|montante|recurso|despesa|total|r\$/.test(headerKey)) return 'currency';
  if (/quant|qtd|qtde|\bnr\b|numero|número|\bnº\b|\bnum\b|\bid\b/.test(headerKey) && !/process|sei|pleito|protoc|cpf|cnpj|codigo|código/.test(headerKey)) return 'integer';
  if (/process|sei|pleito|protoc|cpf|cnpj|codigo|código|registro|ident|chave|matric|cep|contrat|pedido|id/.test(headerKey)) return 'identifier';
  return 'text';
}

function cleanExportCell(value, profile, header) {
  if (value === null || value === undefined || value === '') return '';
  if (value instanceof Date || profile === 'date') return parseDateForExport(value) || cleanExportText(value);
  if (profile === 'currency') return parseNumericLikeForExport(value) ?? cleanExportText(value);
  if (profile === 'percent') return parsePercentForExport(value) ?? cleanExportText(value);
  if (profile === 'integer') {
    const numeric = parseNumericLikeForExport(value);
    if (numeric === null || !Number.isFinite(numeric)) return cleanExportText(value);
    return Number.isInteger(numeric) ? numeric : Math.trunc(numeric);
  }
  if (profile === 'status') return canonicalizeStatusForExport(value);
  const headerKey = normalizeHeaderKey(header);
  if (/muni|cidade|localidade/.test(headerKey)) return normalizeMunicipioName(value, cleanExportText(value));
  if (/territ/.test(headerKey)) return normalizeTerritorioName(value, cleanExportText(value));
  if (/orgao|órgão|secretar|pasta|autarquia|fundacao|fundação/.test(headerKey)) return canonicalizeOrganForExport(value);
  return cleanExportText(value);
}

function buildExportRangeFromAoa(aoa) {
  const rowCount = Array.isArray(aoa) ? aoa.length : 0;
  const columnCount = rowCount ? Math.max(...aoa.map((row) => Array.isArray(row) ? row.length : 0)) : 0;
  return { rowCount, columnCount };
}

function getExcelColumnName(index) {
  let column = index + 1;
  let name = '';
  while (column > 0) {
    const remainder = (column - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    column = Math.floor((column - 1) / 26);
  }
  return name;
}

function estimateColumnWidth(header, samples, profile) {
  const textLength = Math.max(cleanExportText(header).length, ...samples.map((value) => cleanExportText(value).length));
  const capped = Math.min(60, Math.max(12, textLength + 2));
  if (profile === 'date') return Math.max(12, Math.min(16, capped));
  if (profile === 'currency') return Math.max(14, Math.min(18, capped));
  if (profile === 'percent') return Math.max(10, Math.min(12, capped));
  if (profile === 'integer') return Math.max(10, Math.min(14, capped));
  if (profile === 'status') return Math.max(14, Math.min(20, capped));
  return capped;
}

function createStyledCell(value, profile, isHeader = false, isAlt = false, isStatus = false) {
  const cell = { v: value };

  if (value === null || value === undefined || value === '') {
    cell.t = 's';
    cell.v = '';
  } else if (value instanceof Date) {
    cell.t = 'n';
    cell.v = dateToExcelSerial(value);
    cell.z = 'dd/mm/yyyy';
  } else if (profile === 'currency' || profile === 'percent' || profile === 'integer') {
    cell.t = 'n';
    if (profile === 'currency') cell.z = 'R$ #,##0.00';
    if (profile === 'percent') cell.z = '0.00%';
    if (profile === 'integer') cell.z = '0';
  } else {
    cell.t = 's';
    cell.v = cleanExportText(value);
  }

  cell.s = {
    font: {
      name: 'Calibri',
      sz: isHeader ? 11 : 10,
      bold: isHeader,
      color: { rgb: isHeader ? 'FFFFFF' : '1F2937' }
    },
    fill: isHeader
      ? { patternType: 'solid', fgColor: { rgb: '991B1B' } }
      : isStatus
        ? { patternType: 'solid', fgColor: { rgb: 'FEE2E2' } }
        : isAlt
          ? { patternType: 'solid', fgColor: { rgb: 'F8FAFC' } }
          : { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
    alignment: {
      vertical: 'center',
      horizontal: ['currency', 'percent', 'integer'].includes(profile) ? 'right' : 'left',
      wrapText: ['text', 'status', 'identifier'].includes(profile)
    },
    border: {
      top: { style: 'thin', color: { rgb: 'E5E7EB' } },
      bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
      left: { style: 'thin', color: { rgb: 'E5E7EB' } },
      right: { style: 'thin', color: { rgb: 'E5E7EB' } }
    }
  };

  return cell;
}

function fileNameSlug(value) {
  return String(value || 'municipio')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function getScopeLabel(records, filters) {
  if (filters.municipality && filters.municipality !== 'ALL') return filters.municipality;
  if (filters.territory && filters.territory !== 'ALL') return `Território ${filters.territory}`;

  const municipalities = [...new Set(records.map((record) => record.muni).filter(Boolean))];
  if (municipalities.length === 1) return municipalities[0];
  const territories = [...new Set(records.map((record) => record.territorio).filter(Boolean))];
  if (territories.length === 1) return `Território ${territories[0]}`;
  throw new Error('Selecione um município ou território no filtro antes de gerar o relatório Word.');
}

function millions(value) {
  return `R$ ${((Number(value) || 0) / 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} milhões`;
}

function buildWordTemplateData(records, filters) {
  const metrics = calculateReportMetrics(records);

  const attended = metrics.attendedRecords;
  const open = metrics.openRecords;

  const attendedInvestment = metrics.attendedValue;
  const openInvestment = metrics.openValue;

  const groupedAttended = new Map();
  for (const record of attended.toSorted(compareInvestmentRecords)) {
    const organDisplay = normalizeText(record.organ, 'Órgão não informado');
    const organKey = normalizeNameKey(organDisplay) || 'orgao-nao-informado';

    if (!groupedAttended.has(organKey)) {
      groupedAttended.set(organKey, {
        organ: organDisplay,
        totalValue: 0,
        itens: []
      });
    }

    const group = groupedAttended.get(organKey);
    group.totalValue += Number(record.val || 0);
    group.itens.push({
      valor: Number(record.val || 0) > 0 ? `• ${formatBRL(record.val)}` : '• VALOR NÃO INFORMADO',
      desc: normalizeText(record.desc, 'Sem descrição')
    });
  }

  const highlights = [...groupedAttended.values()].map((group) => ({
    organ: group.organ,
    totalItens: group.itens.length,
    total: formatBRL(group.totalValue),
    itens: group.itens
  }));

  const groupedOpen = new Map();
  for (const record of open.toSorted(compareInvestmentRecords)) {
    const orgaoDisplay = normalizeText(record.organ, 'Órgão não informado');
    const orgaoKey = normalizeNameKey(orgaoDisplay) || 'orgao-nao-informado';

    if (!groupedOpen.has(orgaoKey)) {
      groupedOpen.set(orgaoKey, {
        orgao: orgaoDisplay,
        totalValue: 0,
        itens: []
      });
    }

    const group = groupedOpen.get(orgaoKey);
    group.totalValue += Number(record.val || 0);
    group.itens.push({
      descricao: normalizeText(record.desc, 'Sem descrição'),
      valor: Number(record.val || 0) > 0 ? formatBRL(record.val) : 'VALOR NÃO INFORMADO'
    });
  }

  const abertos = [...groupedOpen.values()].map((group) => ({
    orgao: group.orgao,
    totalItens: group.itens.length,
    total: formatBRL(group.totalValue),
    itens: group.itens
  }));

  return {
    municipio: getScopeLabel(records, filters),
    territorio: filters.territory !== 'ALL' ? filters.territory : ([...new Set(records.map((record) => record.territorio).filter(Boolean))][0] || 'não consta'),
    totalPleitos: String(records.length),
    atendidos: String(attended.length),
    emAberto: String(open.length),
    investimentoMi: millions(attendedInvestment),
    investimentoTotal: formatBRL(attendedInvestment),
    investimentoAberto: formatBRL(openInvestment),
    destaques: highlights,
    abertos
  };
}

function prepareTemplateFormatting(zip) {
  const documentFile = zip.file('word/document.xml');
  if (!documentFile) return;

  let documentXml = documentFile.asText();
  documentXml = documentXml.replace(/🏷️/gu, '•').replace(/➡️/gu, '•');
  documentXml = documentXml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, (paragraph) => {
    const shouldBold = paragraph.includes('organ')
      || paragraph.includes('orgao')
      || paragraph.includes('totalItens')
      || paragraph.includes('{total}');

    if (!shouldBold) return paragraph;

    return paragraph
      .replace(/<w:r>(?!<w:rPr>)/g, '<w:r><w:rPr><w:b/><w:bCs/></w:rPr>')
      .replace(/<w:rPr>[\s\S]*?<\/w:rPr>/g, (runProperties) => runProperties.includes('<w:b') ? runProperties : runProperties.replace('<w:rPr>', '<w:rPr><w:b/><w:bCs/>'));
  });

  zip.file('word/document.xml', documentXml);
}

export function parseWorkbookBuffer(buffer, label = 'planilha') {
  const workbook = XLSX.read(buffer, { type: 'buffer', dense: true });
  const sheetName = workbook.SheetNames[0] || 'Planilha 1';
  const sheet = workbook.Sheets[sheetName];
  const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: '' }).map((row, index) => ({
    ...row,
    __sourceAoaRowIndex: Number.isInteger(row.__rowNum__) ? row.__rowNum__ : index + 1
  }));
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });

  if (!jsonRows.length) {
    const error = new Error(`A planilha ${label} está vazia.`);
    error.statusCode = 400;
    throw error;
  }

  return {
    sheetName,
    jsonRows,
    aoa,
    columns: Object.keys(jsonRows[0] || {})
      .filter((key) => !key.startsWith('__'))
  };
}

export function suggestColumnMappings(jsonRows) {
  const sample = jsonRows[0] || {};
  const keys = Object.keys(sample).filter((key) => !key.startsWith('__'));

  const findBestMatch = (candidates) => keys.find((key) => {
    const cleanKey = key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    return candidates.some((candidate) => cleanKey.includes(candidate));
  }) || '';

  return {
    muni: findBestMatch(['municipio', 'cidade', 'localidade']),
    organ: findBestMatch(['orgao', 'secretaria', 'pasta']),
    desc: findBestMatch(['descricao', 'objeto', 'pleito', 'acao', 'titulo']),
    val: findBestMatch(['valor', 'investimento', 'orcamento']),
    status: findBestMatch(['situacao', 'status', 'estagio', 'fase']),
    territorio: findBestMatch(['territorio', 'territorio de identidade', 'territory'])
  };
}

export function normalizeDatasetFromMapping(dataset, mappings) {
  if (!mappings.muni || !mappings.desc) {
    const error = new Error('Selecione colunas válidas para Município e Descrição.');
    error.statusCode = 400;
    throw error;
  }

  const parsedList = dataset.jsonRows
    .map((row, index) => {
      const rawMuni = normalizeText(row[mappings.muni], 'Não Especificado');
      const rawTerritorio = normalizeText(row[mappings.territorio], 'não consta');
      const rawOrgan = normalizeText(row[mappings.organ], 'Geral');
      const rawDesc = normalizeText(row[mappings.desc], 'Sem Descrição');
      const rawStatus = normalizeText(row[mappings.status], 'Em Aberto');
      const rawValue = parseNumericValue(row[mappings.val] ?? 0);

      if (!rawMuni || !rawDesc) return null;

      return {
        sourceAoaRowIndex: Number.isInteger(row.__sourceAoaRowIndex) ? row.__sourceAoaRowIndex : index + 1,
        sourceJsonIndex: index,
        muni: rawMuni,
        territorio: rawTerritorio,
        organ: rawOrgan,
        desc: rawDesc,
        val: rawValue,
        status: rawStatus,
        area: 'Infraestrutura e Geral'
      };
    })
    .filter(Boolean);

  if (!parsedList.length) {
    const error = new Error('Nenhum registro válido foi encontrado após o mapeamento da planilha.');
    error.statusCode = 400;
    throw error;
  }

  const hygienized = hygienizeMunicipioAndTerritorioRows(parsedList);
  const normalizedRecords = hygienized.map((item, index) => {
    const sourceAoaRowIndex = Number.isInteger(item.sourceAoaRowIndex)
      ? item.sourceAoaRowIndex
      : (Number.isInteger(item.sourceJsonIndex) ? item.sourceJsonIndex + 1 : index + 1);
    const normMuni = normalizeMunicipioName(item.muni || item.municipio || 'Não Especificado');
    const normTerritorio = normalizeTerritorioName(item.territorio || item.territory || item.TERRITORIO || 'não consta');
    const normOrgan = normalizeText(item.organ || item.orgao || 'Geral');
    const normDesc = normalizeText(item.desc || item.descricao || item.pleito || 'Sem Descrição');
    const normVal = parseNumericValue(item.val ?? item.valor ?? item.valorTratado ?? 0);
    const statusRaw = normalizeText(item.status || item.situacao || 'Em Aberto');
    const statusStd = normalizeStatusValue(statusRaw);
    const area = normalizeText(item.area || item.eixo || classifyAreaByText(normDesc));
    const priority = computePriority(normVal, statusStd);

    return {
      id: index + 1,
      sourceJsonIndex: Number.isInteger(item.sourceJsonIndex) ? item.sourceJsonIndex : index,
      sourceAoaRowIndex,
      original: { ...item },
      muni: normMuni,
      territorio: normTerritorio,
      organ: normOrgan,
      desc: normDesc,
      val: normVal,
      statusRaw,
      statusStd,
      area,
      priority
    };
  });

  return {
    normalizedRecords,
    ...auditDataQuality(normalizedRecords),
    detectedDuplicates: detectDuplicates(normalizedRecords)
  };
}

export function buildSnapshot(dataset, options) {
  const { filters, filteredRecords } = applyFilters(dataset.normalizedRecords || [], options.filters || DEFAULT_FILTERS);
  const scopedRecords = applyExcludedRecords(filteredRecords, options.excludedRecordIds || []);
  const filteredQuality = auditDataQuality(scopedRecords);
  const filteredDuplicates = detectDuplicates(scopedRecords);
  const currentPage = Number(options.currentPage || 1);
  const pageSize = Number(options.pageSize || 25);
  const maxPage = Math.max(1, Math.ceil(scopedRecords.length / pageSize) || 1);
  const safePage = Math.min(Math.max(1, currentPage), maxPage);
  const pageStart = (safePage - 1) * pageSize;
  const pageRecords = scopedRecords.slice(pageStart, pageStart + pageSize);

  return {
    datasetId: dataset.id,
    datasetLabel: dataset.datasetLabel,
    importedSheetName: dataset.importedSheetName,
    filters,
    filterOptions: buildFilterOptions(dataset.normalizedRecords || []),
    qualityScore: filteredQuality.qualityScore,
    fieldStats: filteredQuality.fieldStats,
    detectedDuplicates: filteredDuplicates,
    normalizedRecords: dataset.normalizedRecords || [],
    filteredRecords: scopedRecords,
    pageRecords,
    currentPage: safePage,
    pageSize,
    totalFiltered: scopedRecords.length,
    whatsappSummaryText: buildWhatsAppExecutiveSummary(scopedRecords, filters)
  };
}

export function buildWorkbookFromDataset(dataset, filters, excludedRecordIds = []) {
  const { filteredRecords } = applyFilters(dataset.normalizedRecords || [], filters);
  const scopedRecords = applyExcludedRecords(filteredRecords, excludedRecordIds);
  const sourceAoa = Array.isArray(dataset.aoa) ? dataset.aoa : [];

  if (!sourceAoa.length) {
    const error = new Error('Importe uma planilha antes de gerar a planilha tratada.');
    error.statusCode = 400;
    throw error;
  }

  if (!scopedRecords.length) {
    const error = new Error('Não há registros no recorte atual para gerar a planilha tratada.');
    error.statusCode = 400;
    throw error;
  }

  const headerRow = sourceAoa[0] || [];
  const filteredRowIndexes = new Set(scopedRecords.map((record) => Number(record.sourceAoaRowIndex)).filter((index) => Number.isInteger(index) && index > 0));
  const dataRows = sourceAoa
    .slice(1)
    .map((row, index) => ({ row, sourceAoaRowIndex: index + 1 }))
    .filter((entry) => filteredRowIndexes.has(entry.sourceAoaRowIndex))
    .map((entry) => entry.row);

  if (!dataRows.length) {
    const error = new Error('Não há registros no recorte atual para gerar a planilha tratada.');
    error.statusCode = 400;
    throw error;
  }

  const { columnCount } = buildExportRangeFromAoa(sourceAoa);
  if (!columnCount) {
    const error = new Error('A planilha importada não possui colunas válidas para exportação.');
    error.statusCode = 400;
    throw error;
  }

  const workbook = XLSX.utils.book_new();
  const worksheet = {};
  const columnProfiles = headerRow.map((header, columnIndex) => inferExportColumnProfile(header, dataRows.slice(0, 200).map((row) => row?.[columnIndex])));
  const columnWidths = headerRow.map((header, columnIndex) => ({
    wch: estimateColumnWidth(header, dataRows.slice(0, 200).map((row) => cleanExportCell(row?.[columnIndex], columnProfiles[columnIndex], header)), columnProfiles[columnIndex])
  }));

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const address = `${getExcelColumnName(columnIndex)}1`;
    const headerValue = cleanExportText(headerRow[columnIndex] ?? '');
    worksheet[address] = createStyledCell(headerValue, 'text', true, false, false);
  }

  dataRows.forEach((row, rowIndex) => {
    const excelRowIndex = rowIndex + 2;
    const isAltRow = rowIndex % 2 === 1;

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const headerValue = headerRow[columnIndex] ?? '';
      const profile = columnProfiles[columnIndex] || 'text';
      const originalValue = Array.isArray(row) ? row[columnIndex] : '';
      const cleanedValue = cleanExportCell(originalValue, profile, headerValue);
      const address = `${getExcelColumnName(columnIndex)}${excelRowIndex}`;
      const isStatus = /situa|status|estag|fase|andamento/.test(normalizeHeaderKey(headerValue));
      worksheet[address] = createStyledCell(cleanedValue, profile, false, isAltRow, isStatus);
    }
  });

  worksheet['!ref'] = `A1:${getExcelColumnName(columnCount - 1)}${dataRows.length + 1}`;
  worksheet['!cols'] = columnWidths;
  worksheet['!autofilter'] = { ref: worksheet['!ref'] };
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };
  worksheet['!rows'] = [{ hpt: 24 }].concat(dataRows.map((row) => {
    const rowValues = Array.isArray(row) ? row : [];
    const rowText = rowValues.map((cell, columnIndex) => cleanExportCell(cell, columnProfiles[columnIndex], headerRow[columnIndex]));
    const longest = Math.max(...rowText.map((text) => cleanExportText(text).length), 0);
    return { hpt: Math.min(96, Math.max(18, Math.ceil(longest / 35) * 18)) };
  }));
  worksheet['!pageSetup'] = {
    orientation: columnCount > 5 ? 'landscape' : 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0
  };

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Planilha Tratada');
  workbook.Workbook = workbook.Workbook || {};
  workbook.Workbook.Views = [{ RTL: false }];

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', cellStyles: true, bookSST: true });
}

export async function buildWordReport({ dataset, filters, excludedRecordIds = [], includedRecordIds = [], templatePath }) {
  const { filteredRecords } = applyFilters(
    dataset.normalizedRecords || [],
    filters
  );

  const scopedRecords = applyExcludedRecords(
    filteredRecords,
    excludedRecordIds
  );

  if (!scopedRecords.length) {
    const error = new Error('Não há dados filtrados para gerar o relatório.');
    error.statusCode = 400;
    throw error;
  }

  const template = await fs.readFile(templatePath);
  const zip = new PizZip(template);
  prepareTemplateFormatting(zip);

  const document = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true
  });

  const reportData = buildWordTemplateData(scopedRecords, filters);
  console.log(
    '[WORD] destaques:',
    JSON.stringify(reportData.destaques, null, 2)
  );

  console.log(
    '[WORD] abertos:',
    JSON.stringify(reportData.abertos, null, 2)
  );

  console.log(
    '[WORD] primeira destaque:',
    Object.keys(reportData.destaques?.[0] || {})
  );

  console.log(
    '[WORD] primeiro aberto:',
    Object.keys(reportData.abertos?.[0] || {})
  );

  document.render(reportData);

  return {
    fileName: `relatorio-investimentos-${fileNameSlug(reportData.municipio)}.docx`,
    buffer: document.getZip().generate({
      type: 'nodebuffer',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })
  };
}
