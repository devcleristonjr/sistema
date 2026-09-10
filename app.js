// GLOBAL APPLICATION STATE
const AppState = {
    viewMode: 'executive', // 'executive' | 'analyst'
    datasetLabel: "Nenhuma planilha carregada",
    rawRecords: [],
    normalizedRecords: [],
    filteredRecords: [],
    pendingUploadedAoa: [],
    importedSheetName: '',
    showGeneralExecutiveTable: true,
    qualityScore: 100,
    fieldStats: {},
    detectedDuplicates: [],
    datasetAnalysisTimer: null,
    currentPage: 1,
    pageSize: 25,
    pendingUploadedJson: null,
    columnMappings: {},
    filters: {
        municipality: 'ALL',
        territory: 'ALL',
        organ: 'ALL',
        status: 'ALL',
        search: ''
    }
};

const DASHBOARD_STORAGE_KEY = 'mrc-dashboard-state-v1';
const DASHBOARD_DATASET_KEY = 'mrc-dashboard-dataset-v1';

function saveDashboardDataset() {
    try {
        const payload = {
            datasetLabel: AppState.datasetLabel,
            rawRecords: AppState.rawRecords
        };
        localStorage.setItem(DASHBOARD_DATASET_KEY, JSON.stringify(payload));
    } catch (error) {
        console.warn('Não foi possível persistir a planilha do dashboard.', error);
    }
}

function saveDashboardState() {
    try {
        const payload = {
            filters: AppState.filters,
            viewMode: AppState.viewMode
        };
        localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
        console.warn('Não foi possível persistir o estado do dashboard.', error);
    }
}

function restoreDashboardState() {
    try {
        const saved = JSON.parse(localStorage.getItem(DASHBOARD_STORAGE_KEY) || 'null');
        AppState.viewMode = saved?.viewMode === 'analyst' ? 'analyst' : 'executive';
    } catch (error) {
        console.warn('Não foi possível restaurar o estado salvo do dashboard.', error);
    }
}

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

const PRIORITY_LABELS = {
    ALTA: 'Alta',
    MÉDIA: 'Média',
    BAIXA: 'Baixa'
};

const MUNICIPALITY_ALIASES = {
    'dario meira': 'Dário Meira',
    'dario': 'Dário',
    'ipiau': 'Ipiaú',
    'ipiacu': 'Ipiaú',
    'piau': 'Ipiaú',
    'abaira': 'Abaíra',
    'abare': 'Abaré',
    'abaré': 'Abaré',
    'aiquara': 'Aiquara',
    'anage': 'Anagé',
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
    'cachoeira': 'Cachoeira',
    'varzea da rocha': 'Várzea da Rocha',
    'varzea': 'Várzea',
    'ibirataia': 'Ibirataia',
    'ibira': 'Ibirataia',
    'itamari': 'Itamari',
    'itagi': 'Itagi',
    'itagiba': 'Itagibá',
    'jitauna': 'Jitaúna',
    'jitaúna': 'Jitaúna',
    'nova ibia': 'Nova Ibiá',
    'ubata': 'Ubatá',
    'gongogi': 'Gongogi',
    'gongoji': 'Gongogi',
    'itapetinga': 'Itapetinga',
    'camacari': 'Camaçari',
    'camaçari': 'Camaçari',
    'feira de santana': 'Feira de Santana',
    'caetite': 'Caateté',
    'caateté': 'Caateté'
};

const TERRITORY_ALIASES = {
    'itaparica': 'Itaparica',
    'sao francisco': 'São Francisco',
    'vale do sao francisco': 'Vale do São Francisco',
    'vale do são francisco': 'Vale do São Francisco',
    'chapada diamantina': 'Chapada Diamantina',
    'medio rio de contas': 'Médio Rio de Contas',
    'medio rio': 'Médio Rio',
    'reconcavo': 'Recôncavo',
    'recôncavo': 'Recôncavo',
    'litoral norte': 'Litoral Norte',
    'litoral sul': 'Litoral Sul',
    'sul da bahia': 'Sul da Bahia',
    'extremo sul': 'Extremo Sul',
    'campo alegre de lourdes': 'Campo Alegre de Lourdes'
};

function getStatusLabel(statusValue) {
    return STATUS_LABELS[String(statusValue || '').toUpperCase()] || 'Em Aberto';
}

function normalizeStatusValue(rawStatus) {
    const cleaned = stripDiacritics(normalizeText(rawStatus, 'EM_ABERTO')).toLowerCase();

    if (cleaned.includes('conclu') || cleaned.includes('atendid') || cleaned.includes('entreg') || cleaned.includes('finaliz')) return 'ATENDIDO';
    if (cleaned.includes('conven')) return 'CONVENIO';
    if (cleaned.includes('licit')) return 'LICITACAO';
    if (cleaned.includes('estud') || cleaned.includes('analis') || cleaned.includes('avali')) return 'EM_ESTUDO';
    if (cleaned.includes('aberto') || cleaned.includes('pend')) return 'EM_ABERTO';
    if (cleaned.includes('cancel')) return 'CANCELADO';
    return 'EM_ABERTO';
}

function getPriorityLabel(priorityValue) {
    return PRIORITY_LABELS[String(priorityValue || '').toUpperCase()] || 'Baixa';
}

function getPriorityBadgeClasses(priorityValue) {
    switch (String(priorityValue || '').toUpperCase()) {
        case 'ALTA':
            return 'bg-rose-100 text-rose-800';
        case 'MÉDIA':
        case 'MEDIA':
            return 'bg-amber-100 text-amber-800';
        default:
            return 'bg-slate-100 text-slate-700';
    }
}

function getStatusBadgeClasses(statusValue) {
    switch (String(statusValue || '').toUpperCase()) {
        case 'ATENDIDO':
            return 'bg-emerald-100 text-emerald-800';
        case 'CONVENIO':
            return 'bg-red-100 text-red-800';
        case 'LICITACAO':
            return 'bg-amber-100 text-amber-800';
        case 'EM_ABERTO':
        case 'EM_ESTUDO':
            return 'bg-rose-100 text-rose-800';
        case 'CANCELADO':
            return 'bg-slate-200 text-slate-700';
        default:
            return 'bg-slate-100 text-slate-800';
    }
}

function normalizeText(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
    return String(value).trim();
}

function cleanExportText(value) {
    if (value === null || value === undefined) return '';

    return String(value)
        .replace(/\u00a0/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\r\n|\r|\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeHeaderKey(value) {
    return stripDiacritics(cleanExportText(value)).toLowerCase();
}

function parseDateForExport(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value;
    }

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

    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
    if (isoMatch) {
        const date = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const brMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (brMatch) {
        const year = brMatch[3].length === 2 ? Number(`20${brMatch[3]}`) : Number(brMatch[3]);
        const date = new Date(
            year,
            Number(brMatch[2]) - 1,
            Number(brMatch[1]),
            Number(brMatch[4] || 0),
            Number(brMatch[5] || 0),
            Number(brMatch[6] || 0)
        );
        return Number.isNaN(date.getTime()) ? null : date;
    }

    return null;
}

function dateToExcelSerial(dateValue) {
    const date = dateValue instanceof Date ? dateValue : parseDateForExport(dateValue);
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

    const utcMillis = Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
    );

    return (utcMillis - Date.UTC(1899, 11, 30)) / 86400000;
}

function parsePercentForExport(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value > 1 ? value / 100 : value;
    }

    const text = cleanExportText(value).replace('%', '').trim();
    if (!text) return null;

    const normalized = text.replace(/\./g, '').replace(/,/g, '.');
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return null;
    return parsed > 1 ? parsed / 100 : parsed;
}

function parseNumericLikeForExport(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    const text = cleanExportText(value);
    if (!text) return null;

    const normalized = text
        .replace(/^R\$\s*/i, '')
        .replace(/\./g, '')
        .replace(/,/g, '.')
        .replace(/\s+/g, '');

    if (!/^[-+]?\d*(?:\.\d+)?$/.test(normalized)) {
        return null;
    }

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

            if (['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'ao', 'a', 'as', 'os'].includes(lower)) {
                return lower;
            }

            if (lower === 's/a' || lower === 'sa') {
                return 'S.A.';
            }

            if (index > 0 && /^(sic|cme|dce|sud|sesab|seduc|seinfra|setur|sepromi|seagri|saeb|sae|seds|sedur|serin)$/.test(lower)) {
                return lower.toUpperCase();
            }

            return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(' ');
}

function inferExportColumnProfile(header, samples = []) {
    const headerKey = normalizeHeaderKey(header);
    const sampleValues = samples.filter(value => value !== null && value !== undefined && value !== '');
    const sampleText = sampleValues.map(value => cleanExportText(value)).filter(Boolean);

    if (/situa|status|estag|fase|andamento/.test(headerKey)) {
        return 'status';
    }

    if (/percent|porcent|taxa|indice|índice|\bperc\b|%/.test(headerKey) || sampleText.some(text => /%$/.test(text))) {
        return 'percent';
    }

    if (/data|dt\b|inicio|início|fim|prazo|emissao|emissão|vencimento|publicacao|publicação|assinatura|atualizacao|atualização/.test(headerKey) || sampleValues.some(value => parseDateForExport(value))) {
        return 'date';
    }

    if (/valor|invest|orcam|orçam|custo|montante|recurso|despesa|total|r\$/.test(headerKey)) {
        return 'currency';
    }

    if (/quant|qtd|qtde|\bnr\b|numero|número|\bnº\b|\bnum\b|\bid\b/.test(headerKey) && !/process|sei|pleito|protoc|cpf|cnpj|codigo|código/.test(headerKey)) {
        return 'integer';
    }

    if (/process|sei|pleito|protoc|cpf|cnpj|codigo|código|registro|ident|chave|matric|cep|contrat|pedido|id/.test(headerKey)) {
        return 'identifier';
    }

    return 'text';
}

function cleanExportCell(value, profile, header) {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    if (value instanceof Date || profile === 'date') {
        const parsed = parseDateForExport(value);
        return parsed || cleanExportText(value);
    }

    if (profile === 'currency') {
        const parsed = parseNumericLikeForExport(value);
        return parsed === null ? cleanExportText(value) : parsed;
    }

    if (profile === 'percent') {
        const parsed = parsePercentForExport(value);
        return parsed === null ? cleanExportText(value) : parsed;
    }

    if (profile === 'integer') {
        const numeric = parseNumericLikeForExport(value);
        if (numeric === null || !Number.isFinite(numeric)) {
            return cleanExportText(value);
        }

        if (Number.isInteger(numeric)) {
            return numeric;
        }

        return Math.trunc(numeric);
    }

    if (profile === 'status') {
        return canonicalizeStatusForExport(value);
    }

    const headerKey = normalizeHeaderKey(header);
    if (/muni|cidade|localidade/.test(headerKey)) {
        return normalizeMunicipioName(value, cleanExportText(value));
    }

    if (/territ/.test(headerKey)) {
        return normalizeTerritorioName(value, cleanExportText(value));
    }

    if (/orgao|órgão|secretar|pasta|autarquia|fundacao|fundação/.test(headerKey)) {
        return canonicalizeOrganForExport(value);
    }

    return cleanExportText(value);
}

function stripDiacritics(value) {
    return normalizeText(value, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeNameKey(value) {
    const cleaned = stripDiacritics(normalizeText(value, '')).toLowerCase();
    return cleaned
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function canonicalizeDisplayName(value, fallback = '') {
    const raw = normalizeText(value, fallback);
    if (!raw) return fallback;

    const parts = raw
        .replace(/\s+/g, ' ')
        .replace(/\s*[-–—]\s*/g, ' ')
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((part, index) => {
            const lower = part.toLowerCase();
            const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
            if (index === 0) return capitalized;
            if (['da', 'de', 'do', 'dos', 'das', 'e', 'em', 'na', 'no', 'a', 'ao', 'as', 'os'].includes(lower)) {
                return lower;
            }
            return capitalized;
        });

    return parts.join(' ');
}

function normalizeMunicipioName(value, fallback = 'Não Especificado') {
    const raw = normalizeText(value, fallback);
    if (!raw || raw === 'Não Especificado') return fallback;

    const key = normalizeNameKey(raw);
    if (!key) return fallback;

    return MUNICIPALITY_ALIASES[key] || canonicalizeDisplayName(raw, fallback);
}

function normalizeTerritorioName(value, fallback = 'não consta') {
    const raw = normalizeText(value, fallback);
    if (!raw || raw === 'não consta') return fallback;

    const key = normalizeNameKey(raw);
    if (!key) return fallback;

    return TERRITORY_ALIASES[key] || canonicalizeDisplayName(raw, fallback);
}

function hygienizeMunicipioAndTerritorioRows(rows) {
    const seen = new Set();
    const nextRows = [];

    rows.forEach((row) => {
        const muniValue = row.muni || row.municipio || row.MUNICIPIO || row['Município'] || 'Não Especificado';
        const territorioValue = row.territorio || row.territory || row.TERRITORIO || row['Território'] || row['territorio de identidade'] || 'não consta';
        const plainMuni = normalizeMunicipioName(muniValue);
        const plainTerritorio = normalizeTerritorioName(territorioValue);

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

        const rowKey = JSON.stringify({
            muni: normalizeNameKey(cleanedRow.muni),
            territorio: normalizeNameKey(cleanedRow.territorio || 'não consta'),
            organ: normalizeNameKey(cleanedRow.organ || cleanedRow.orgao || 'Geral'),
            desc: normalizeNameKey(cleanedRow.desc || cleanedRow.descricao || 'Sem Descrição'),
            status: normalizeNameKey(cleanedRow.status || cleanedRow.statusRaw || 'Em Aberto'),
            area: normalizeNameKey(cleanedRow.area || 'Infraestrutura e Geral'),
            val: Number(cleanedRow.val ?? 0)
        });

        if (!seen.has(rowKey)) {
            seen.add(rowKey);
            nextRows.push(cleanedRow);
        }
    });

    return nextRows;
}

function parseNumericValue(value) {
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string') {
        const cleaned = value
            .replace(/R\$/gi, '')
            .replace(/\./g, '')
            .replace(/,/g, '.')
            .replace(/\s+/g, '')
            .trim();
        const parsed = Number.parseFloat(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

function isOpenStatus(statusValue) {
    return OPEN_STATUS_SET.has(String(statusValue || '').toUpperCase());
}

function isAttendedStatus(statusValue) {
    return ATTENDED_STATUS_SET.has(String(statusValue || '').toUpperCase());
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

function getRecordsMatchingCurrentFilters() {
    const f = AppState.filters;

    return AppState.normalizedRecords.filter(r => {
        const matchMuni = f.municipality === 'ALL' || r.muni === f.municipality;
        const matchTerritory = f.territory === 'ALL' || (r.territorio || 'não consta') === f.territory;
        const matchOrgan = f.organ === 'ALL' || r.organ === f.organ;
        const matchStatus = matchesStatusFilter(r.statusStd, f.status);
        const matchSearch = !f.search ||
            r.muni.toLowerCase().includes(f.search) ||
            (r.territorio || 'não consta').toLowerCase().includes(f.search) ||
            r.organ.toLowerCase().includes(f.search) ||
            r.desc.toLowerCase().includes(f.search) ||
            (r.area || '').toLowerCase().includes(f.search);

        return matchMuni && matchTerritory && matchOrgan && matchStatus && matchSearch;
    });
}

// CURRENCY & NUMBER FORMATTERS
function formatBRL(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

const ui = {
    get(id) {
        return document.getElementById(id);
    },
    text(id, value) {
        const el = this.get(id);
        if (el) el.textContent = value;
        return el;
    },
    width(id, value) {
        const el = this.get(id);
        if (el) el.style.width = `${value}%`;
        return el;
    }
};

function updateEmptyDatasetUI() {
    ui.text('kpi-exec-muni-count', '0 municípios');
    ui.text('active-filters-count', 'Sem dados carregados');
}

// INITIALIZATION
function initApp() {
    AppState.datasetLabel = 'Nenhuma planilha carregada';
    AppState.rawRecords = [];
    AppState.normalizedRecords = [];
    AppState.filteredRecords = [];
    AppState.pendingUploadedJson = null;
    AppState.qualityScore = 0;

    restoreDashboardState();
    initMobileMenu();
    bindFilterInputs();

    updateEmptyDatasetUI();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    btn?.addEventListener('click', () => menu.classList.toggle('hidden'));
}

function switchViewMode(mode) {
    AppState.viewMode = mode;
    const execContainer = document.getElementById('view-executive-mode');
    const analystContainer = document.getElementById('view-analyst-mode');
    const btnExec = document.getElementById('btn-mode-exec');
    const btnAnalyst = document.getElementById('btn-mode-analyst');

    if (mode === 'executive') {
        execContainer.classList.remove('hidden');
        analystContainer.classList.add('hidden');
        btnExec.className = "px-3 py-1.5 text-xs font-bold rounded-md bg-red-600 text-white shadow transition";
        btnAnalyst.className = "px-3 py-1.5 text-xs font-bold rounded-md text-slate-400 hover:text-white transition";
    } else {
        execContainer.classList.add('hidden');
        analystContainer.classList.remove('hidden');
        btnExec.className = "px-3 py-1.5 text-xs font-bold rounded-md text-slate-400 hover:text-white transition";
        btnAnalyst.className = "px-3 py-1.5 text-xs font-bold rounded-md bg-red-600 text-white shadow transition";
        renderAnalystModeViews();
    }
}

function scheduleDatasetAnalysis() {
    if (AppState.datasetAnalysisTimer) {
        clearTimeout(AppState.datasetAnalysisTimer);
    }

    AppState.datasetAnalysisTimer = setTimeout(() => {
        auditDataQuality();
        detectDuplicates();
    }, 0);
}

// CORE DATA PIPELINE: NORMALIZATION, VALIDATION, CLASSIFICATION
function loadInitialDataset(rawList, label) {
    AppState.datasetLabel = label;
    AppState.rawRecords = rawList;
    AppState.filters = { municipality: 'ALL', territory: 'ALL', organ: 'ALL', status: 'ALL', search: '' };
    saveDashboardDataset();

    // 1. Normalize Records preserving original values
    AppState.normalizedRecords = rawList.map((item, idx) => {
        const normMuni = normalizeMunicipioName(item.muni || item.municipio || "Não Especificado");
        const normTerritorio = normalizeTerritorioName(item.territorio || item.territory || item.TERRITORIO || "não consta");
        const normOrgan = normalizeText(item.organ || item.orgao || "Geral");
        const normDesc = normalizeText(item.desc || item.descricao || item.pleito || "Sem Descrição");
        const normVal = parseNumericValue(item.val ?? item.valor ?? item.valorTratado ?? 0);
        const normStatusRaw = normalizeText(item.status || item.situacao || "Em Aberto");
        const stdStatus = normalizeStatusValue(normStatusRaw);
        const normArea = normalizeText(item.area || item.eixo || classifyAreaByText(normDesc));
        const priority = computePriority(normVal, stdStatus);

        return {
            id: idx + 1,
            sourceJsonIndex: Number.isInteger(item.sourceJsonIndex) ? item.sourceJsonIndex : idx,
            sourceAoaRowIndex: Number.isInteger(item.sourceAoaRowIndex) ? item.sourceAoaRowIndex : (Number.isInteger(item.sourceJsonIndex) ? item.sourceJsonIndex + 1 : idx + 1),
            original: { ...item },
            muni: normMuni,
            territorio: normTerritorio,
            organ: normOrgan,
            desc: normDesc,
            val: normVal,
            statusRaw: normStatusRaw,
            statusStd: stdStatus,
            area: normArea,
            priority: priority
        };
    });

    // 2. Data Quality Audit (lightweight first, heavier duplicate pass deferred)
    auditDataQuality();
    scheduleDatasetAnalysis();

    // 3. Populate Filter Dropdowns
    populateFilterOptions();

    // 4. Apply Current Filters
    applyFilters();
}

// RULE-BASED CLASSIFICATION ENGINE
function classifyAreaByText(desc) {
    const d = normalizeText(desc, '').toLowerCase();
    if (d.includes("escola") || d.includes("colegio") || d.includes("quadra") || d.includes("ginasio") || d.includes("creche")) return "Educação e Esporte";
    if (d.includes("agua") || d.includes("esgoto") || d.includes("drenagem") || d.includes("canal") || d.includes("eta")) return "Saneamento, Drenagem e Água";
    if (d.includes("pista") || d.includes("paviment") || d.includes("estrada") || d.includes("acesso") || d.includes("ponte")) return "Infraestrutura e Mobilidade";
    if (d.includes("casa") || d.includes("habitac") || d.includes("praca") || d.includes("lagoa")) return "Habitação e Urbanização";
    if (d.includes("mercado") || d.includes("feira") || d.includes("cacau") || d.includes("rural")) return "Desenvolvimento Rural e Feiras";
    if (d.includes("hospital") || d.includes("ubs") || d.includes("policia") || d.includes("delegacia")) return "Saúde e Segurança Pública";
    return "Infraestrutura e Geral";
}

function computePriority(val, statusStd) {
    const status = String(statusStd || '').toUpperCase();

    if (status === 'CANCELADO') return 'BAIXA';
    if (status === 'ATENDIDO' || status === 'CONVENIO') {
        return val >= 10000000 ? 'MÉDIA' : 'BAIXA';
    }
    if (status === 'LICITACAO') {
        return val >= 5000000 ? 'ALTA' : 'MÉDIA';
    }
    if (status === 'EM_ESTUDO') {
        return val >= 7000000 ? 'ALTA' : val >= 2000000 ? 'MÉDIA' : 'BAIXA';
    }
    if (isOpenStatus(status)) {
        return val >= 8000000 ? 'ALTA' : val >= 2000000 ? 'MÉDIA' : 'BAIXA';
    }
    return 'BAIXA';
}

// DATA QUALITY AUDITOR
function auditDataQuality() {
    const total = AppState.normalizedRecords.length;
    if (total === 0) {
        AppState.qualityScore = 0;
        AppState.fieldStats = {};
        return;
    }

    let muniValid = 0, organValid = 0, descValid = 0, valValid = 0, statusValid = 0;

    AppState.normalizedRecords.forEach(r => {
        if (r.muni && r.muni !== "Não Especificado") muniValid++;
        if (r.organ && r.organ !== "Geral") organValid++;
        if (r.desc && r.desc !== "Sem Descrição") descValid++;
        if (typeof r.val === 'number' && !isNaN(r.val) && r.val >= 0) valValid++;
        if (r.statusRaw) statusValid++;
    });

    AppState.fieldStats = {
        muni: Math.round((muniValid / total) * 100),
        organ: Math.round((organValid / total) * 100),
        desc: Math.round((descValid / total) * 100),
        val: Math.round((valValid / total) * 100),
        status: Math.round((statusValid / total) * 100)
    };

    const avg = (AppState.fieldStats.muni + AppState.fieldStats.organ + AppState.fieldStats.desc + AppState.fieldStats.val + AppState.fieldStats.status) / 5;
    AppState.qualityScore = Math.round(avg);
}

// SIMILARITY DUPLICATE DETECTOR
function detectDuplicates() {
    const list = AppState.normalizedRecords;
    const dupes = [];

    for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
            const r1 = list[i];
            const r2 = list[j];

            if (r1.muni.toLowerCase() === r2.muni.toLowerCase() && r1.organ.toLowerCase() === r2.organ.toLowerCase()) {
                const sim = stringSimilarity(r1.desc, r2.desc);
                if (sim >= 0.75) {
                    dupes.push({ item1: r1, item2: r2, similarity: Math.round(sim * 100) });
                }
            }
        }
    }

    AppState.detectedDuplicates = dupes;
    const badge = document.getElementById('duplicates-count-badge');
    if (badge) badge.innerText = `${dupes.length} Duplicidades Suspeitas`;
}

function stringSimilarity(s1, s2) {
    const str1 = s1.toLowerCase().replace(/[^\w\s]/gi, '');
    const str2 = s2.toLowerCase().replace(/[^\w\s]/gi, '');
    if (str1 === str2) return 1.0;

    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
}

// FILTERS ENGINE
function bindFilterInputs() {
    document.getElementById('filter-municipality').addEventListener('change', (e) => {
        AppState.filters.municipality = e.target.value;
        applyFilters();
    });

    document.getElementById('filter-territory').addEventListener('change', (e) => { AppState.filters.territory = e.target.value; applyFilters(); });
    document.getElementById('filter-organ').addEventListener('change', (e) => { AppState.filters.organ = e.target.value; applyFilters(); });
    document.getElementById('filter-status').addEventListener('change', (e) => { AppState.filters.status = e.target.value; applyFilters(); });
    document.getElementById('filter-search').addEventListener('input', (e) => { AppState.filters.search = e.target.value.toLowerCase().trim(); applyFilters(); });
}

function syncFilterSelectValue(elementId, selectedValue) {
    const filterSelect = document.getElementById(elementId);

    if (filterSelect) {
        const validValue = [...filterSelect.options].some(option => option.value === selectedValue) ? selectedValue : 'ALL';
        filterSelect.value = validValue;
        return validValue;
    }

    return 'ALL';
}

function populateFilterOptions() {
    const munis = [...new Set(AppState.normalizedRecords.map(r => r.muni))].sort();
    const territories = [...new Set(AppState.normalizedRecords.map(r => r.territorio || 'não consta'))].sort();
    const organs = [...new Set(AppState.normalizedRecords.map(r => r.organ))].sort();

    const selMuni = document.getElementById('filter-municipality');
    selMuni.innerHTML = '<option value="ALL">Todos os Municípios</option>';
    munis.forEach(m => selMuni.add(new Option(m, m)));

    const selTerritory = document.getElementById('filter-territory');
    selTerritory.innerHTML = '<option value="ALL">Todos os Territórios</option>';
    territories.forEach(t => selTerritory.add(new Option(t, t)));

    const selOrgan = document.getElementById('filter-organ');
    selOrgan.innerHTML = '<option value="ALL">Todos os Órgãos</option>';
    organs.forEach(o => selOrgan.add(new Option(o, o)));

    AppState.filters.municipality = syncFilterSelectValue('filter-municipality', AppState.filters.municipality || 'ALL');
    AppState.filters.territory = syncFilterSelectValue('filter-territory', AppState.filters.territory || 'ALL');
}

function applyFilters() {
    AppState.filteredRecords = getRecordsMatchingCurrentFilters();

    const maxPage = Math.max(1, Math.ceil(AppState.filteredRecords.length / AppState.pageSize) || 1);
    AppState.currentPage = Math.min(AppState.currentPage, maxPage);

    renderActivePills();
    renderExecutiveModeViews();
    if (AppState.viewMode === 'analyst') renderAnalystModeViews();
    saveDashboardState();
}

function renderActivePills() {
    const container = document.getElementById('active-pills-container');
    const countLabel = document.getElementById('active-filters-count');
    container.innerHTML = '';

    let count = 0;
    const f = AppState.filters;

    const addPill = (label, key) => {
        count++;
        const pill = document.createElement('span');
        pill.className = 'filter-pill inline-flex items-center gap-1.5 px-2.5 py-1 text-red-800 text-xs font-bold rounded-md';
        pill.innerHTML = `${label} <button onclick="clearSingleFilter('${key}')" class="text-red-600 hover:text-red-900 font-bold" aria-label="Remover filtro ${label}">&times;</button>`;
        container.appendChild(pill);
    };

    if (f.municipality !== 'ALL') addPill(`Município: ${f.municipality}`, 'municipality');
    if (f.territory !== 'ALL') addPill(`Território: ${f.territory}`, 'territory');
    if (f.organ !== 'ALL') addPill(`Órgão: ${f.organ}`, 'organ');
    if (f.status !== 'ALL') addPill(`Situação: ${f.status}`, 'status');
    if (f.search) addPill(`Busca: "${f.search}"`, 'search');

    countLabel.innerText = count > 0 ? `${count} filtro(s) ativo(s)` : 'Sem filtros ativos';
}

function clearSingleFilter(key) {
    if (key === 'search') {
        AppState.filters.search = '';
        document.getElementById('filter-search').value = '';
    } else if (key === 'municipality') {
        AppState.filters.municipality = 'ALL';
        document.getElementById('filter-municipality').value = 'ALL';
    } else if (key === 'territory') {
        AppState.filters.territory = 'ALL';
        document.getElementById('filter-territory').value = 'ALL';
    } else {
        AppState.filters[key] = 'ALL';
        document.getElementById(`filter-${key}`).value = 'ALL';
    }
    applyFilters();
}

function resetAllFilters() {
    AppState.filters = { municipality: 'ALL', territory: 'ALL', organ: 'ALL', status: 'ALL', search: '' };
    document.getElementById('filter-municipality').value = 'ALL';
    document.getElementById('filter-territory').value = 'ALL';
    document.getElementById('filter-organ').value = 'ALL';
    document.getElementById('filter-status').value = 'ALL';
    document.getElementById('filter-search').value = '';
    applyFilters();
}

function formatWhatsAppShortCurrency(value) {
    const amount = Number(value || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
        return 'R$ 0,00';
    }

    if (amount >= 1000000) {
        return `R$ ${(amount / 1000000).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} mi`;
    }

    if (amount >= 1000) {
        return `R$ ${(amount / 1000).toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })} mil`;
    }

    return formatBRL(amount);
}

function getWhatsAppAreaIcon(area) {
    const text = normalizeText(area, '').toLowerCase();

    if (text.includes('infraestrutura') || text.includes('mobilidade') || text.includes('rodovia') || text.includes('estrada')) {
        return '🛣️';
    }

    if (text.includes('educação') || text.includes('educacao') || text.includes('esporte')) {
        return text.includes('esporte') ? '⚽' : '🎓';
    }

    if (text.includes('saneamento') || text.includes('água') || text.includes('agua') || text.includes('drenagem')) {
        return '💧';
    }

    if (text.includes('saúde') || text.includes('saude')) {
        return '🏥';
    }

    if (text.includes('segurança') || text.includes('seguranca')) {
        return '🚔';
    }

    if (text.includes('rural') || text.includes('desenvolvimento')) {
        return '🌾';
    }

    if (text.includes('habitação') || text.includes('habitacao') || text.includes('urbanização') || text.includes('urbanizacao')) {
        return '🏘️';
    }

    if (text.includes('lazer') || text.includes('praça') || text.includes('praca')) {
        return '🏞️';
    }

    return '📌';
}

function getWhatsAppAreaTitle(area) {
    const text = normalizeText(area, 'Infraestrutura e Geral').toLowerCase();

    if (text.includes('infraestrutura') || text.includes('mobilidade') || text.includes('rodovia')) {
        return 'INFRAESTRUTURA E RODOVIAS';
    }

    if (text.includes('educação') || text.includes('educacao')) {
        return 'EDUCAÇÃO';
    }

    if (text.includes('saneamento') || text.includes('água') || text.includes('agua') || text.includes('drenagem')) {
        return 'ÁGUA E SANEAMENTO';
    }

    if (text.includes('esporte')) {
        return 'ESPORTE E LAZER';
    }

    if (text.includes('saúde') || text.includes('saude')) {
        return 'SAÚDE';
    }

    if (text.includes('segurança') || text.includes('seguranca')) {
        return 'SEGURANÇA PÚBLICA';
    }

    if (text.includes('rural') || text.includes('desenvolvimento')) {
        return 'DESENVOLVIMENTO RURAL';
    }

    if (text.includes('habitação') || text.includes('habitacao') || text.includes('urbanização') || text.includes('urbanizacao')) {
        return 'HABITAÇÃO E URBANIZAÇÃO';
    }

    return 'OUTRAS ÁREAS';
}

function shortenWhatsAppDescription(description, maxLength = 240) {
    const text = normalizeText(description, 'Sem Descrição')
        .replace(/\s+/g, ' ')
        .trim();

    if (text.length <= maxLength) {
        return text;
    }

    return `${text.substring(0, maxLength - 3).trim()}...`;
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

    const found = candidates.find(value => normalizeText(value, '').trim());

    if (found) {
        return normalizeText(found).trim();
    }

    const desc = normalizeText(record?.desc, '');

    const patterns = [
        /na\s+(Sede[^,.]*)/i,
        /no\s+(Distrito[^,.]*)/i,
        /na\s+(Comunidade[^,.]*)/i,
        /no\s+(Bairro[^,.]*)/i
    ];

    for (const pattern of patterns) {
        const match = desc.match(pattern);

        if (match && match[1]) {
            return match[1].trim();
        }
    }

    return '';
}

function buildWhatsAppExecutiveSummary(sourceRecords) {
    const records = Array.isArray(sourceRecords) ? [...sourceRecords] : [];

    if (!records.length) {
        return '*RESUMO DE INVESTIMENTOS E AÇÕES*\n\nNenhum registro encontrado para o recorte atual.';
    }

    const selectedMunicipality = AppState?.filters?.municipality;
    const selectedTerritory = AppState?.filters?.territory;

    const municipalities = [
        ...new Set(
            records
                .map(record => normalizeMunicipioName(record.muni || record.municipio || ''))
                .filter(Boolean)
        )
    ];

    const territories = [
        ...new Set(
            records
                .map(record => normalizeTerritorioName(record.territorio || record.territory || ''))
                .filter(Boolean)
        )
    ];

    let municipalityName = 'BAHIA';

    if (selectedMunicipality && selectedMunicipality !== 'ALL') {
        municipalityName = selectedMunicipality.toUpperCase();
    } else if (selectedTerritory && selectedTerritory !== 'ALL') {
        municipalityName = `TERRITÓRIO ${selectedTerritory}`.toUpperCase();
    } else if (municipalities.length === 1) {
        municipalityName = municipalities[0].toUpperCase();
    } else if (territories.length === 1) {
        municipalityName = `TERRITÓRIO ${territories[0]}`.toUpperCase();
    }

    const attendedRecords = records.filter(record => isAttendedStatus(record.statusStd));
    const openRecords = records.filter(record => isOpenStatus(record.statusStd));
    const licensingRecords = records.filter(record => String(record.statusStd || '').toUpperCase() === 'LICITACAO');
    const cancelledRecords = records.filter(record => String(record.statusStd || '').toUpperCase() === 'CANCELADO');

    const attendedValue = attendedRecords.reduce((total, record) => total + Number(record.val || 0), 0);
    const licensingValue = licensingRecords.reduce((total, record) => total + Number(record.val || 0), 0);

    const lines = [];

    lines.push(`*RESUMO DE INVESTIMENTOS E AÇÕES – ${municipalityName}*`);
    lines.push('');
    lines.push('*PANORAMA GERAL*');
    lines.push('━━━━━━━━━━━━━━━━━━');
    lines.push(`• Total de pleitos: *${records.length}*`);
    lines.push(`• Atendidos / Publicados: *${attendedRecords.length}*`);
    lines.push(`• Em aberto: *${openRecords.length}*`);
    lines.push(`• Investimentos atendidos/publicados: *${formatWhatsAppShortCurrency(attendedValue)}*`);
    lines.push(`• Aproximadamente *${formatBRL(attendedValue)}*`);

    if (cancelledRecords.length > 0) {
        lines.push(`• Cancelados: *${cancelledRecords.length}*`);
    }

    const attendedWithValue = attendedRecords
        .filter(record => Number(record.val || 0) > 0)
        .sort((a, b) => Number(b.val || 0) - Number(a.val || 0));

    const attendedWithoutValue = attendedRecords.filter(record => Number(record.val || 0) <= 0);

    const groupedAreas = {};

    attendedWithValue.forEach(record => {
        const area = getWhatsAppAreaTitle(record.area);

        if (!groupedAreas[area]) {
            groupedAreas[area] = [];
        }

        groupedAreas[area].push(record);
    });

    const areaEntries = Object.entries(groupedAreas)
        .sort(([, recordsA], [, recordsB]) => {
            const totalA = recordsA.reduce((sum, record) => sum + Number(record.val || 0), 0);
            const totalB = recordsB.reduce((sum, record) => sum + Number(record.val || 0), 0);

            return totalB - totalA;
        });

    if (attendedWithValue.length > 0 || attendedWithoutValue.length > 0) {
        lines.push('');
        lines.push('━━━━━━━━━━━━━━━━━━');
        lines.push('*DESTAQUES – MAIORES INVESTIMENTOS*');
        lines.push('━━━━━━━━━━━━━━━━━━');

        areaEntries.forEach(([area, areaRecords]) => {
            if (!areaRecords.length) return;

            lines.push('');
            lines.push(`*${area}*`);

            const organs = [
                ...new Set(
                    areaRecords
                        .map(record => normalizeText(record.organ, ''))
                        .filter(Boolean)
                )
            ];

            if (organs.length > 0) {
                lines.push(`Secretaria: *${organs.join(' / ')}*`);
            }

            areaRecords
                .sort((a, b) => Number(b.val || 0) - Number(a.val || 0))
                .slice(0, 5)
                .forEach(record => {
                    const value = Number(record.val || 0);
                    const description = shortenWhatsAppDescription(record.desc);

                    lines.push('');
                    lines.push(`*${formatWhatsAppShortCurrency(value)}*`);
                    lines.push(`• ${description}`);

                    const location = extractWhatsAppLocation(record);

                    if (location) {
                        lines.push(`• Local: ${location}`);
                    }
                });
        });

        if (attendedWithoutValue.length > 0) {
            lines.push('');
            lines.push('*VALOR NÃO INFORMADO*');

            attendedWithoutValue
                .slice(0, 8)
                .forEach(record => {
                    lines.push(`• ${shortenWhatsAppDescription(record.desc)}`);

                    const organ = normalizeText(record.organ, '');

                    if (organ) {
                        lines.push(`• Secretaria: *${organ}*`);
                    }
                });
        }
    }

    if (licensingRecords.length > 0) {
        lines.push('');
        lines.push('━━━━━━━━━━━━━━━━━━');
        lines.push('*EM LICITAÇÃO*');
        lines.push('━━━━━━━━━━━━━━━━━━');

        licensingRecords
            .sort((a, b) => Number(b.val || 0) - Number(a.val || 0))
            .slice(0, 10)
            .forEach(record => {
                const value = Number(record.val || 0);

                lines.push('');

                if (value > 0) {
                    lines.push(`*${formatWhatsAppShortCurrency(value)}*`);
                } else {
                    lines.push('*Valor não informado*');
                }

                lines.push(`• ${shortenWhatsAppDescription(record.desc)}`);

                const location = extractWhatsAppLocation(record);

                if (location) {
                    lines.push(`• Local: ${location}`);
                }

                const organ = normalizeText(record.organ, '');

                if (organ) {
                    lines.push(`• Secretaria: *${organ}*`);
                }
            });
    }

    if (openRecords.length > 0) {
        lines.push('');
        lines.push('━━━━━━━━━━━━━━━━━━');
        lines.push('*PLEITOS EM ABERTO*');
        lines.push('━━━━━━━━━━━━━━━━━━');

        const orderedOpen = [...openRecords].sort((a, b) => Number(b.val || 0) - Number(a.val || 0));

        orderedOpen
            .slice(0, 15)
            .forEach(record => {
                const organ = normalizeText(record.organ, '');

                lines.push('');

                if (organ) {
                    lines.push(`• Secretaria: *${organ}*`);
                } else {
                    lines.push('• Secretaria: *Órgão não informado*');
                }

                lines.push(`• ${shortenWhatsAppDescription(record.desc, 300)}`);
            });
    }

    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━');
    lines.push('*RESUMO*');

    lines.push(`• *${attendedRecords.length}* pleitos atendidos/publicados`);
    lines.push(`• *${openRecords.length}* pleitos em aberto`);
    lines.push(`• *${formatWhatsAppShortCurrency(attendedValue)}* em investimentos atendidos/publicados`);

    if (licensingRecords.length > 0) {
        lines.push(
            `• *${formatWhatsAppShortCurrency(licensingValue)}* em obras em licitação`
        );
    }

    return lines
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function buildWhatsAppSummaryText() {
    const sourceRecords =
        AppState.filteredRecords.length
            ? AppState.filteredRecords
            : AppState.normalizedRecords;

    return buildWhatsAppExecutiveSummary(sourceRecords);
}

function openSummaryModal() {
    const summaryText = buildWhatsAppSummaryText();

    const modal = document.getElementById('summary-modal');
    const textarea = document.getElementById('summary-copy-text');

    if (!modal || !textarea) return;

    textarea.value = summaryText;

    modal.classList.remove('hidden');

    setTimeout(() => textarea.focus(), 50);
}

function closeSummaryModal() {
    const modal = document.getElementById('summary-modal');

    if (modal) {
        modal.classList.add('hidden');
    }
}

async function copySummaryText() {
    const textarea = document.getElementById('summary-copy-text');

    if (!textarea) return;

    const text = textarea.value;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
        }

        const button = document.getElementById('summary-copy-button');

        if (button) {
            const previous = button.textContent;

            button.textContent = 'Copiado!';

            setTimeout(() => {
                button.textContent = previous;
            }, 1200);
        }
    } catch (error) {
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
    }
}

function generateWhatsAppSummary() {
    openSummaryModal();
}

// RENDER MODO EXECUTIVO
function renderExecutiveModeViews() {
    const data = AppState.filteredRecords;
    const totalPleitos = data.length;
    const attendedList = data.filter(r => isAttendedStatus(r.statusStd));
    const openList = data.filter(r => isOpenStatus(r.statusStd));

    const totalAttendedCount = attendedList.length;
    const totalOpenCount = openList.length;
    const rate = totalPleitos > 0 ? ((totalAttendedCount / totalPleitos) * 100).toFixed(1) : 0;

    const valAttended = attendedList.reduce((acc, r) => acc + r.val, 0);
    const valOpen = openList.reduce((acc, r) => acc + r.val, 0);
    const avgTicket = totalAttendedCount > 0 ? valAttended / totalAttendedCount : 0;

    ui.text('kpi-exec-total', totalPleitos);
    ui.text('kpi-exec-attended-count', totalAttendedCount);
    ui.text('kpi-exec-rate-badge', `${rate}%`);
    ui.width('kpi-exec-rate-bar', rate);
    ui.text('kpi-exec-val-attended', formatBRL(valAttended));
    ui.text('kpi-exec-ticket-avg', `Ticket Médio Atendido: ${formatBRL(avgTicket)}`);
    ui.text('kpi-exec-open-count', `${totalOpenCount} Pleitos`);
    ui.text('kpi-exec-val-open', formatBRL(valOpen));

    renderExecutiveInsights(totalPleitos, totalAttendedCount, rate, valAttended, valOpen);
    renderParetoAnalysis(data, valAttended);
    renderExecutiveSecretariatMatrix();
    renderGeneralExecutiveTable();
}

function formatCompactBRL(value) {
    const numericValue = Number(value) || 0;
    const abs = Math.abs(numericValue);

    if (abs >= 1_000_000_000) {
        const compact = numericValue / 1_000_000_000;
        return `R$ ${compact.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} bi`;
    }

    if (abs >= 1_000_000) {
        const compact = numericValue / 1_000_000;
        return `R$ ${compact.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} mi`;
    }

    if (abs >= 1_000) {
        const compact = numericValue / 1_000;
        return `R$ ${compact.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} mil`;
    }

    return formatBRL(numericValue);
}

function formatInteger(value) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function renderExecutiveSecretariatMatrix() {
    const summaryGrid = document.getElementById('secretariat-summary-grid');
    const cardsGrid = document.getElementById('secretariat-cards-grid');

    if (!summaryGrid || !cardsGrid) return;

    const agencies = [...new Set(AppState.filteredRecords.map(r => r.organ))]
        .filter(agency => agency && agency.trim().toLowerCase() !== 'geral')
        .sort((a, b) => {
            const valB = AppState.filteredRecords.filter(r => r.organ === b).reduce((sum, item) => sum + item.val, 0);
            const valA = AppState.filteredRecords.filter(r => r.organ === a).reduce((sum, item) => sum + item.val, 0);
            return valB - valA;
        });

    const agenciesSummary = agencies.map((agency) => {
        const items = AppState.filteredRecords.filter(r => r.organ === agency);
        const total = items.length;
        const atendidos = items.filter(r => ATTENDED_STATUS_SET.has(r.statusStd)).length;
        const valorAtendido = items.filter(r => ATTENDED_STATUS_SET.has(r.statusStd)).reduce((sum, item) => sum + item.val, 0);
        const emAberto = items.filter(r => isOpenStatus(r.statusStd)).length;
        const percentual = total > 0 ? (atendidos / total) * 100 : 0;

        return {
            agency,
            total,
            atendidos,
            valorAtendido,
            emAberto,
            percentual
        };
    });

    const totalPleitos = AppState.filteredRecords.length;
    const totalAtendidos = AppState.filteredRecords.filter(r => ATTENDED_STATUS_SET.has(r.statusStd)).length;
    const totalValorAtendido = AppState.filteredRecords.filter(r => ATTENDED_STATUS_SET.has(r.statusStd)).reduce((sum, item) => sum + item.val, 0);
    const totalEmAberto = AppState.filteredRecords.filter(r => isOpenStatus(r.statusStd)).length;
    const taxaAtendimento = totalPleitos > 0 ? (totalAtendidos / totalPleitos) * 100 : 0;

    const summaryItems = [
        { label: 'Total de Pleitos', value: formatInteger(totalPleitos) },
        { label: 'Atendidos / Publicados', value: formatInteger(totalAtendidos) },
        { label: 'Percentual de Atendimento', value: `${taxaAtendimento.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` },
        { label: 'Valor Total Atendido', value: formatCompactBRL(totalValorAtendido) },
        { label: 'Em Aberto', value: formatInteger(totalEmAberto) }
    ];

    summaryGrid.innerHTML = summaryItems.map((item) => `
        <div class="secretariat-summary-item">
            <span class="secretariat-summary-label">${item.label}</span>
            <div class="secretariat-summary-value">${item.value}</div>
        </div>
    `).join('');

    if (agenciesSummary.length === 0) {
        cardsGrid.innerHTML = `
            <div class="secretariat-empty-state">
                <strong>Sem dados para exibir</strong>
                <span>O recorte atual não possui órgãos com registros válidos para comparação.</span>
            </div>
        `;
        return;
    }

    cardsGrid.innerHTML = agenciesSummary.map((item) => {
        const percentual = item.total > 0 ? (item.atendidos / item.total) * 100 : 0;
        const fullValue = formatBRL(item.valorAtendido);
        const compactValue = formatCompactBRL(item.valorAtendido);

        return `
            <article class="secretariat-card" title="${item.agency} - Total: ${item.total} - Atendidos: ${item.atendidos} - Valor atendido: ${fullValue} - Em aberto: ${item.emAberto}">
                <div class="secretariat-card-header">${item.agency}</div>
                <div class="secretariat-card-body">
                    <div class="secretariat-metric-row">
                        <span class="secretariat-metric-label">Total</span>
                        <span class="secretariat-metric-value">${formatInteger(item.total)}</span>
                    </div>
                    <div class="secretariat-metric-row">
                        <span class="secretariat-metric-label">Atendidos</span>
                        <span class="secretariat-metric-value positive">${formatInteger(item.atendidos)}</span>
                    </div>
                    <div class="secretariat-metric-row">
                        <span class="secretariat-metric-label">Atendimento</span>
                        <span class="secretariat-metric-value positive">${percentual.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>
                    </div>
                    <div class="secretariat-progress-wrap">
                        <div class="secretariat-progress-bar" style="width: ${Math.min(percentual, 100)}%;"></div>
                    </div>
                    <div class="secretariat-metric-row">
                        <span class="secretariat-metric-label">💰 Valor</span>
                        <span class="secretariat-metric-value positive" title="${fullValue}">${compactValue}</span>
                    </div>
                    <div class="secretariat-metric-row">
                        <span class="secretariat-metric-label">🟡 Em Aberto</span>
                        <span class="secretariat-metric-value danger">${formatInteger(item.emAberto)}</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

function toggleGeneralExecutiveTable() {
    AppState.showGeneralExecutiveTable = !AppState.showGeneralExecutiveTable;
    renderGeneralExecutiveTable();
}

function renderGeneralExecutiveTable() {
    const container = document.getElementById('general-table-container');
    const button = document.getElementById('toggle-general-table');
    const tbody = document.getElementById('general-report-table-body');
    const countLabel = document.getElementById('general-table-count-label');

    if (!container || !button || !tbody || !countLabel) return;

    button.textContent = AppState.showGeneralExecutiveTable ? 'Ocultar tabela geral' : 'Exibir tabela geral';
    container.classList.toggle('hidden', !AppState.showGeneralExecutiveTable);

    const rows = [...AppState.filteredRecords].sort((a, b) => b.val - a.val);
    countLabel.textContent = `${rows.length} registros no recorte atual`;
    tbody.innerHTML = '';

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-500">Nenhum registro encontrado para o filtro atual.</td></tr>';
        return;
    }

    rows.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 border-b border-slate-100';
        tr.innerHTML = `
                    <td class="p-3 font-black text-red-700 min-w-0 break-words" style="overflow-wrap: anywhere; word-break: break-word;">${idx + 1}</td>
                    <td class="p-3 font-bold text-slate-800 min-w-0 break-words" style="overflow-wrap: anywhere; word-break: break-word;">${item.muni}</td>
                    <td class="p-3 font-semibold text-slate-600 min-w-0 whitespace-nowrap" style="white-space: nowrap; overflow-wrap: normal;">${item.organ}</td>
                    <td class="p-3 text-slate-700 min-w-0 break-words" style="overflow-wrap: anywhere; word-break: break-word;">${item.desc}</td>
                    <td class="p-3 text-right font-extrabold text-slate-900 min-w-0 whitespace-nowrap" style="white-space: nowrap; overflow-wrap: normal;">${formatBRL(item.val)}</td>
                    <td class="p-3 text-center min-w-0">
                        <span class="inline-block whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold ${getStatusBadgeClasses(item.statusStd)}">
                            ${getStatusLabel(item.statusStd)}
                        </span>
                    </td>
                `;
        tbody.appendChild(tr);
    });
}

function renderExecutiveInsights(total, attended, rate, valAttended, valOpen) {
    const list = document.getElementById('executive-insights-list');

    if (!list) return;

    list.innerHTML = '';

    const topMuni = getTopMuniByVal();
    const topOrgan = getTopOrganByVal();

    const bullets = [
        `• O recorte atual concentra <strong>${formatBRL(valAttended)}</strong> em ${attended} demandas atendidas ou concluídas, refletindo uma taxa de resolutividade de <strong>${rate}%</strong>.`,
        `• O painel indica que <strong>${attended}</strong> de <strong>${total}</strong> solicitações estão em condição de atendimento concluído ou conveniado, com foco no cumprimento do ciclo de execução.`,
        `• O município com maior volume financeiro em execução/entrega é <strong>${topMuni.name}</strong>, com <strong>${formatBRL(topMuni.val)}</strong> acumulados no cenário atual.`,
        `• A atuação institucional se concentra em <strong>${topOrgan.name}</strong>, que detém o maior volume de recursos no território monitorado, somando <strong>${formatBRL(topOrgan.val)}</strong>.`,
        `• O passivo em aberto ainda representa <strong>${formatBRL(valOpen)}</strong>, exigindo acompanhamento prioritário de execução, cronograma e desdobramento de demandas pendentes.`
    ];

    bullets.forEach(b => {
        const div = document.createElement('div');
        div.className = 'bg-red-950/40 p-3 rounded-lg border border-red-800/40 text-slate-200';
        div.innerHTML = b;
        list.appendChild(div);
    });
}

function getTopMuniByVal() {
    const map = {};
    AppState.filteredRecords.forEach(r => {
        if (r.statusStd === 'ATENDIDO' || r.statusStd === 'CONVENIO') {
            map[r.muni] = (map[r.muni] || 0) + r.val;
        }
    });
    let topName = "Nenhum", maxVal = 0;
    Object.entries(map).forEach(([m, v]) => {
        if (v > maxVal) { maxVal = v; topName = m; }
    });
    return { name: topName, val: maxVal };
}

function getTopOrganByVal() {
    const map = {};
    AppState.filteredRecords.forEach(r => {
        if (r.statusStd === 'ATENDIDO' || r.statusStd === 'CONVENIO') {
            map[r.organ] = (map[r.organ] || 0) + r.val;
        }
    });
    let topName = "Nenhum", maxVal = 0;
    Object.entries(map).forEach(([o, v]) => {
        if (v > maxVal) { maxVal = v; topName = o; }
    });
    return { name: topName, val: maxVal };
}

function renderParetoAnalysis(data, totalAttendedVal) {
    const muniMap = {};
    data.forEach(r => {
        if (r.statusStd === 'ATENDIDO' || r.statusStd === 'CONVENIO') {
            muniMap[r.muni] = (muniMap[r.muni] || 0) + r.val;
        }
    });
    const sortedMuni = Object.values(muniMap).sort((a, b) => b - a);
    const top5Val = sortedMuni.slice(0, 5).reduce((acc, v) => acc + v, 0);
    const top5Pct = totalAttendedVal > 0 ? ((top5Val / totalAttendedVal) * 100).toFixed(1) : 0;

    ui.text('pareto-top5-pct', `${top5Pct}%`);
    ui.width('pareto-top5-bar', top5Pct);
    ui.text('pareto-top5-desc', `Os 5 maiores municípios concentram ${formatBRL(top5Val)} do total de recursos.`);

    const organMap = {};
    data.forEach(r => {
        if (r.statusStd === 'ATENDIDO' || r.statusStd === 'CONVENIO') {
            organMap[r.organ] = (organMap[r.organ] || 0) + r.val;
        }
    });
    const sortedOrgan = Object.values(organMap).sort((a, b) => b - a);
    const top3OrganVal = sortedOrgan.slice(0, 3).reduce((acc, v) => acc + v, 0);
    const top3OrganPct = totalAttendedVal > 0 ? ((top3OrganVal / totalAttendedVal) * 100).toFixed(1) : 0;

    ui.text('pareto-top3-organ-pct', `${top3OrganPct}%`);
    ui.width('pareto-top3-organ-bar', top3OrganPct);
    ui.text('pareto-top3-organ-desc', `Os 3 maiores órgãos gerenciam ${formatBRL(top3OrganVal)} dos investimentos territoriais.`);
}

// RENDER MODO ANALISTA
function renderAnalystModeViews() {
    renderFieldQualityGrid();
    renderDuplicatesList();
    renderFullAnalyticsTable();
}

function renderFieldQualityGrid() {
    const grid = document.getElementById('field-quality-grid');
    grid.innerHTML = '';
    const stats = AppState.fieldStats;

    const fields = [
        { label: 'Município', pct: stats.muni || 0 },
        { label: 'Órgão', pct: stats.organ || 0 },
        { label: 'Descrição', pct: stats.desc || 0 },
        { label: 'Valor', pct: stats.val || 0 },
        { label: 'Situação', pct: stats.status || 0 }
    ];

    fields.forEach(f => {
        const card = document.createElement('div');
        card.className = 'bg-slate-50 p-3 rounded-xl border border-slate-200 text-center space-y-1';
        card.innerHTML = `
                    <div class="text-[11px] font-bold text-slate-500 uppercase">${f.label}</div>
                    <div class="text-lg font-extrabold ${f.pct >= 90 ? 'text-emerald-600' : 'text-amber-600'}">${f.pct}%</div>
                    <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div class="h-1.5 rounded-full ${f.pct >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}" style="width: ${f.pct}%;"></div>
                    </div>
                `;
        grid.appendChild(card);
    });
}

function renderDuplicatesList() {
    const container = document.getElementById('duplicates-container');
    container.innerHTML = '';
    const dupes = AppState.detectedDuplicates;

    if (dupes.length === 0) {
        container.innerHTML = '<div class="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">Nenhuma duplicidade crítica detectada nesta base.</div>';
        return;
    }

    dupes.forEach((pair, idx) => {
        const div = document.createElement('div');
        div.className = 'bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3';
        div.innerHTML = `
                    <div class="space-y-1">
                        <span class="font-bold text-amber-900">Similaridade: ${pair.similarity}%</span>
                        <div class="text-slate-700"><strong>Reg #1:</strong> ${pair.item1.muni} (${pair.item1.organ}) - ${pair.item1.desc}</div>
                        <div class="text-slate-700"><strong>Reg #2:</strong> ${pair.item2.muni} (${pair.item2.organ}) - ${pair.item2.desc}</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="ignoreDuplicate(${idx})" class="px-2.5 py-1 bg-white border border-slate-300 rounded font-bold hover:bg-slate-100">Manter Ambos</button>
                    </div>
                `;
        container.appendChild(div);
    });
}

function ignoreDuplicate(idx) {
    AppState.detectedDuplicates.splice(idx, 1);
    renderDuplicatesList();
}

function renderFullAnalyticsTable() {
    const tbody = document.getElementById('table-full-analytics-body');
    tbody.innerHTML = '';

    const start = (AppState.currentPage - 1) * AppState.pageSize;
    const end = start + AppState.pageSize;
    const pageRecords = AppState.filteredRecords.slice(start, end);

    pageRecords.forEach(r => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 border-b border-slate-100 cursor-pointer';
        tr.onclick = () => openDetailModal(r.id);
        tr.innerHTML = `
                    <td class="p-3 font-bold text-slate-400">#${r.id}</td>
                    <td class="p-3 font-bold text-slate-800">${r.muni}</td>
                    <td class="p-3 font-semibold text-slate-600">${r.organ}</td>
                    <td class="p-3 text-slate-700">${r.desc}</td>
                    <td class="p-3 text-right font-bold text-slate-900">${formatBRL(r.val)}</td>
                    <td class="p-3 text-center"><span class="whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold ${getStatusBadgeClasses(r.statusStd)}">${getStatusLabel(r.statusStd)}</span></td>
                    <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadgeClasses(r.priority)}">${getPriorityLabel(r.priority)}</span></td>
                    <td class="p-3 text-center"><button class="text-red-600 hover:underline font-bold">Audit</button></td>
                `;
        tbody.appendChild(tr);
    });

    document.getElementById('table-page-indicator').innerText = `Pág ${AppState.currentPage} de ${Math.ceil(AppState.filteredRecords.length / AppState.pageSize) || 1}`;
}

function changePage(dir) {
    const maxPage = Math.ceil(AppState.filteredRecords.length / AppState.pageSize) || 1;
    AppState.currentPage = Math.min(Math.max(1, AppState.currentPage + dir), maxPage);
    renderFullAnalyticsTable();
}

function changePageSize(size) {
    AppState.pageSize = parseInt(size);
    AppState.currentPage = 1;
    renderFullAnalyticsTable();
}

function openDetailModal(recordId) {
    const r = AppState.normalizedRecords.find(x => x.id === recordId);
    if (!r) return;

    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('detail-modal-content');

    content.innerHTML = `
                <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <span class="font-bold text-slate-900 uppercase">Dado Tratado / Normalizado</span>
                    <div><strong>ID:</strong> #${r.id}</div>
                    <div><strong>Município:</strong> ${r.muni}</div>
                    <div><strong>Órgão:</strong> ${r.organ}</div>
                    <div><strong>Descrição:</strong> ${r.desc}</div>
                    <div><strong>Valor Tratado:</strong> ${formatBRL(r.val)}</div>
                    <div><strong>Situação Padronizada:</strong> ${r.statusStd} (Original: "${r.statusRaw}")</div>
                    <div><strong>Prioridade Analítica:</strong> ${r.priority}</div>
                </div>
                <div class="bg-amber-50 p-3 rounded-lg border border-amber-200 space-y-1">
                    <span class="font-bold text-amber-900 uppercase">Registro Original da Planilha (Não Alterado)</span>
                    <pre class="text-[11px] text-amber-800 overflow-x-auto">${JSON.stringify(r.original, null, 2)}</pre>
                </div>
            `;
    modal.classList.remove('hidden');
}

function closeDetailModal() {
    document.getElementById('detail-modal').classList.add('hidden');
}

function showLoadingStatus(message = 'Carregando informações da planilha', details = 'Aguarde um momento enquanto os dados são processados...') {
    const el = document.getElementById('loading-status');
    const title = document.getElementById('loading-status-title');
    const subtitle = document.getElementById('loading-status-subtitle');

    if (!el || !title || !subtitle) return;

    title.textContent = message;
    subtitle.textContent = details;
    el.classList.remove('hidden');
}

function hideLoadingStatus() {
    const el = document.getElementById('loading-status');
    if (!el) return;
    el.classList.add('hidden');
}

// SHEETJS FILE PARSER & MAPPER MODAL
document.getElementById('file-input').addEventListener('change', (e) => {
    if (e.target.files.length) handleSpreadsheetUpload(e.target.files[0]);
});

function handleSpreadsheetUpload(file) {
    showLoadingStatus('Lendo planilha...', 'Validando estrutura do arquivo e preparando os dados para análise...');
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonRaw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            const json = jsonRaw.map((row, idx) => {
                const sourceAoaRowIndex = Number.isInteger(row.__rowNum__) ? row.__rowNum__ : idx + 1;
                return {
                    ...row,
                    __sourceAoaRowIndex: sourceAoaRowIndex
                };
            });
            const aoa = XLSX.utils.sheet_to_json(sheet, {
                header: 1,
                defval: "",
                raw: false
            });

            if (!json || json.length === 0) {
                hideLoadingStatus();
                alert("A planilha enviada está vazia.");
                return;
            }

            AppState.pendingUploadedJson = json;
            AppState.pendingUploadedAoa = aoa;
            AppState.importedSheetName = workbook.SheetNames[0] || 'Planilha 1';
            showLoadingStatus('Normalizando registros...', 'Padronizando municípios, status, valores e áreas da planilha...');
            setTimeout(() => {
                hideLoadingStatus();
                autoDetectColumnsAndOpenMapper(json, file.name);
            }, 400);
        } catch (err) {
            hideLoadingStatus();
            console.error(err);
            alert("Erro ao ler planilha Excel/CSV.");
        }
    };
    reader.onerror = () => {
        hideLoadingStatus();
        alert("Não foi possível carregar a planilha. Tente novamente.");
    };
    reader.readAsArrayBuffer(file);
}

function autoDetectColumnsAndOpenMapper(json) {
    const sample = json[0] || {};
    const keys = Object.keys(sample);

    const findBestMatch = (candidates) => {
        return keys.find(k => {
            const cleanK = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            return candidates.some(c => cleanK.includes(c));
        }) || "";
    };

    AppState.columnMappings = {
        muni: findBestMatch(['municipio', 'cidade', 'localidade']),
        organ: findBestMatch(['orgao', 'secretaria', 'pasta']),
        desc: findBestMatch(['descricao', 'objeto', 'pleito', 'acao', 'titulo']),
        val: findBestMatch(['valor', 'investimento', 'orcamento']),
        status: findBestMatch(['situacao', 'status', 'estagio', 'fase']),
        territorio: findBestMatch(['territorio', 'territorio de identidade', 'territory'])
    };

    const container = document.getElementById('mapper-fields-list');
    container.innerHTML = '';

    const targetFields = [
        { key: 'muni', label: 'Município (Obrigatório)', req: true },
        { key: 'territorio', label: 'Território de Identidade', req: false },
        { key: 'organ', label: 'Órgão / Secretaria', req: false },
        { key: 'desc', label: 'Descrição / Pleito (Obrigatório)', req: true },
        { key: 'val', label: 'Valor (R$)', req: false },
        { key: 'status', label: 'Situação / Status', req: false }
    ];

    targetFields.forEach(f => {
        const div = document.createElement('div');
        div.className = 'flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg';

        let selectHtml = `<select id="map-select-${f.key}" class="bg-white border border-slate-300 rounded p-1 text-xs font-semibold focus:ring-2 focus:ring-red-500">`;
        selectHtml += `<option value="">[ Ignorar ou Ausente ]</option>`;
        keys.forEach(k => {
            const isSel = AppState.columnMappings[f.key] === k ? 'selected' : '';
            selectHtml += `<option value="${k}" ${isSel}>${k}</option>`;
        });
        selectHtml += `</select>`;

        div.innerHTML = `<span class="font-bold text-slate-800">${f.label}</span>${selectHtml}`;
        container.appendChild(div);
    });

    document.getElementById('column-mapper-modal').classList.remove('hidden');
}

function confirmColumnMapping() {
    const getVal = (k) => document.getElementById(`map-select-${k}`).value;
    const mappings = {
        muni: getVal('muni'),
        territorio: getVal('territorio'),
        organ: getVal('organ'),
        desc: getVal('desc'),
        val: getVal('val'),
        status: getVal('status')
    };

    AppState.filters = { municipality: 'ALL', territory: 'ALL', organ: 'ALL', status: 'ALL', search: '' };
    const filterMunicipio = document.getElementById('filter-municipality');
    if (filterMunicipio) filterMunicipio.value = 'ALL';
    const filterTerritorio = document.getElementById('filter-territory');
    if (filterTerritorio) filterTerritorio.value = 'ALL';

    if (!mappings.muni || !mappings.desc) {
        document.getElementById('mapper-warning-msg').innerText = "⚠ Selecione colunas válidas para Município e Descrição.";
        return;
    }

    const parsedList = AppState.pendingUploadedJson
        .map((row, idx) => {
            const rawMuni = normalizeText(row[mappings.muni], 'Não Especificado');
            const rawTerritorio = normalizeText(row[mappings.territorio], 'não consta');
            const rawOrgan = normalizeText(row[mappings.organ], 'Geral');
            const rawDesc = normalizeText(row[mappings.desc], 'Sem Descrição');
            const rawStatus = normalizeText(row[mappings.status], 'Em Aberto');
            const rawValue = parseNumericValue(row[mappings.val] ?? 0);

            if (!rawMuni || !rawDesc) {
                return null;
            }

            return {
                sourceAoaRowIndex: Number.isInteger(row.__sourceAoaRowIndex) ? row.__sourceAoaRowIndex : idx + 1,
                sourceJsonIndex: idx,
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
        document.getElementById('mapper-warning-msg').innerText = "⚠ Nenhum registro válido foi encontrado após o mapeamento da planilha.";
        return;
    }

    const hygienizedList = hygienizeMunicipioAndTerritorioRows(parsedList);
    AppState.pendingUploadedJson = hygienizedList;
    closeMapperModal();
    loadInitialDataset(hygienizedList, "Planilha Personalizada do Usuário");
    saveDashboardDataset();
}

function closeMapperModal() {
    document.getElementById('column-mapper-modal').classList.add('hidden');
}

function buildExportRangeFromAoa(aoa) {
    const rowCount = Array.isArray(aoa) ? aoa.length : 0;
    const columnCount = rowCount ? Math.max(...aoa.map(row => Array.isArray(row) ? row.length : 0)) : 0;
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
    const textLength = Math.max(
        cleanExportText(header).length,
        ...samples.map(value => cleanExportText(value).length)
    );

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
            horizontal: profile === 'currency' || profile === 'percent' || profile === 'integer' ? 'right' : 'left',
            wrapText: profile === 'text' || profile === 'status' || profile === 'identifier'
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

function exportMultiTabExcel() {
    const sourceAoa = Array.isArray(AppState.pendingUploadedAoa) ? AppState.pendingUploadedAoa : [];
    const filteredRecords = getRecordsMatchingCurrentFilters();

    if (!sourceAoa.length) {
        alert('Importe uma planilha antes de gerar a planilha tratada.');
        return;
    }

    if (!filteredRecords.length) {
        alert('Não há registros no recorte atual para gerar a planilha tratada.');
        return;
    }

    const headerRow = sourceAoa[0] || [];
    const filteredRowIndexes = new Set(
        filteredRecords
            .map(record => Number(record.sourceAoaRowIndex))
            .filter(index => Number.isInteger(index) && index > 0)
    );
    const dataRows = sourceAoa
        .slice(1)
        .map((row, index) => ({ row, sourceAoaRowIndex: index + 1 }))
        .filter(entry => filteredRowIndexes.has(entry.sourceAoaRowIndex))
        .map(entry => entry.row);

    if (!dataRows.length) {
        alert('Não há registros no recorte atual para gerar a planilha tratada.');
        return;
    }

    const exportHeaderRow = headerRow;
    const exportDataRows = dataRows;
    const { columnCount } = buildExportRangeFromAoa(sourceAoa);

    if (!columnCount) {
        alert('A planilha importada não possui colunas válidas para exportação.');
        return;
    }

    const wb = XLSX.utils.book_new();
    const ws = {};
    const columnProfiles = exportHeaderRow.map((header, colIndex) => {
        const samples = exportDataRows.slice(0, 200).map(row => row?.[colIndex]);
        return inferExportColumnProfile(header, samples);
    });
    const columnWidths = exportHeaderRow.map((header, colIndex) => {
        const samples = exportDataRows.slice(0, 200).map(row => cleanExportCell(row?.[colIndex], columnProfiles[colIndex], header));
        return { wch: estimateColumnWidth(header, samples, columnProfiles[colIndex]) };
    });

    for (let colIndex = 0; colIndex < columnCount; colIndex++) {
        const address = `${getExcelColumnName(colIndex)}1`;
        const headerValue = cleanExportText(exportHeaderRow[colIndex] ?? '');
        ws[address] = createStyledCell(headerValue, 'text', true, false, false);
    }

    exportDataRows.forEach((row, rowIndex) => {
        const excelRowIndex = rowIndex + 2;
        const isAltRow = rowIndex % 2 === 1;

        for (let colIndex = 0; colIndex < columnCount; colIndex++) {
            const headerValue = exportHeaderRow[colIndex] ?? '';
            const profile = columnProfiles[colIndex] || 'text';
            const originalValue = Array.isArray(row) ? row[colIndex] : '';
            const cleanedValue = cleanExportCell(originalValue, profile, headerValue);
            const address = `${getExcelColumnName(colIndex)}${excelRowIndex}`;
            const isStatus = /situa|status|estag|fase|andamento/.test(normalizeHeaderKey(headerValue));

            ws[address] = createStyledCell(cleanedValue, profile, false, isAltRow, isStatus);
        }
    });

    ws['!ref'] = `A1:${getExcelColumnName(columnCount - 1)}${exportDataRows.length + 1}`;
    ws['!cols'] = columnWidths;
    ws['!autofilter'] = { ref: ws['!ref'] };
    ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };
    ws['!rows'] = [{ hpt: 24 }].concat(exportDataRows.map((row, rowIndex) => {
        const rowValues = Array.isArray(row) ? row : [];
        const rowText = rowValues.map((cell, colIndex) => cleanExportCell(cell, columnProfiles[colIndex], exportHeaderRow[colIndex]));
        const longest = Math.max(...rowText.map(text => cleanExportText(text).length), 0);
        const height = Math.min(96, Math.max(18, Math.ceil(longest / 35) * 18));
        return { hpt: rowIndex === 0 ? 24 : height };
    }));
    ws['!pageSetup'] = {
        orientation: columnCount > 5 ? 'landscape' : 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
    };

    XLSX.utils.book_append_sheet(wb, ws, 'Planilha Tratada');
    wb.Workbook = wb.Workbook || {};
    wb.Workbook.Views = [{ RTL: false }];

    const outputName = `planilha_tratada_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, outputName, { cellStyles: true, bookSST: true });
}

// ADAPTIVE A4 PDF RENDERER (print-based, paginated)
const PDF_LAYOUT = {
    pageTitle: 'Relatório Executivo de Investimentos',
    pageSize: 'A4',
    cardsPerRow: 3,
    maxCharsPerChunk: 500
};

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDateTimeForReport(date = new Date()) {
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(date);
}

function getPdfScopeLabel() {
    const selectedMunicipio = AppState?.filters?.municipality;
    if (selectedMunicipio && selectedMunicipio !== 'ALL') {
        return selectedMunicipio;
    }

    const selectedTerritorio = AppState?.filters?.territory;
    if (selectedTerritorio && selectedTerritorio !== 'ALL') {
        return `Território ${selectedTerritorio}`;
    }

    return 'Recorte Geral';
}

function getPdfSourceRecords() {
    if (Array.isArray(AppState.filteredRecords) && AppState.filteredRecords.length) {
        return [...AppState.filteredRecords];
    }
    return Array.isArray(AppState.normalizedRecords) ? [...AppState.normalizedRecords] : [];
}

function buildPdfDataset(records) {
    const sortedRecords = [...records].sort((a, b) => Number(b.val || 0) - Number(a.val || 0));
    const attended = sortedRecords.filter(item => isAttendedStatus(item.statusStd));
    const open = sortedRecords.filter(item => isOpenStatus(item.statusStd));
    const attendedValue = attended.reduce((sum, item) => sum + Number(item.val || 0), 0);
    const openValue = open.reduce((sum, item) => sum + Number(item.val || 0), 0);
    const avgTicket = attended.length ? attendedValue / attended.length : 0;

    const uniqueMunicipalities = new Set(sortedRecords.map(item => item.muni).filter(Boolean));
    const uniqueOrgans = new Set(sortedRecords.map(item => item.organ).filter(Boolean));
    const uniqueTerritories = new Set(sortedRecords.map(item => item.territorio || 'não consta').filter(Boolean));

    const kpis = [
        { label: 'Total de Pleitos', value: formatInteger(sortedRecords.length), note: 'Volume total no recorte atual' },
        { label: 'Atendidos / Publicados', value: formatInteger(attended.length), note: 'Status atendido ou convênio' },
        { label: 'Em Aberto / Em Estudo', value: formatInteger(open.length), note: 'Demandas pendentes no monitoramento' },
        {
            label: 'Taxa de Atendimento',
            value: `${sortedRecords.length ? ((attended.length / sortedRecords.length) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0,0'}%`,
            note: 'Atendidos sobre total de pleitos'
        },
        { label: 'Investimento Atendido', value: formatBRL(attendedValue), note: 'Valor total executado/publicado' },
        { label: 'Passivo em Aberto', value: formatBRL(openValue), note: 'Valor pendente de execução' },
        { label: 'Ticket Médio Atendido', value: formatBRL(avgTicket), note: 'Média por demanda atendida' },
        { label: 'Órgãos no Recorte', value: formatInteger(uniqueOrgans.size), note: 'Secretarias e órgãos envolvidos' }
    ];

    const organCards = [...uniqueOrgans]
        .map((organName) => {
            const items = sortedRecords.filter(item => item.organ === organName);
            const total = items.length;
            const attendedCount = items.filter(item => isAttendedStatus(item.statusStd)).length;
            const openCount = items.filter(item => isOpenStatus(item.statusStd)).length;
            const amount = items.reduce((sum, item) => sum + Number(item.val || 0), 0);
            const rate = total ? (attendedCount / total) * 100 : 0;

            return {
                organ: organName || 'Órgão não informado',
                total,
                attendedCount,
                openCount,
                amount,
                rate
            };
        })
        .sort((a, b) => b.amount - a.amount);

    return {
        generatedAt: formatDateTimeForReport(new Date()),
        scope: getPdfScopeLabel(),
        total: sortedRecords.length,
        municipalities: uniqueMunicipalities.size,
        territories: uniqueTerritories.size,
        organs: uniqueOrgans.size,
        kpis,
        organCards,
        records: sortedRecords
    };
}

function createPdfPageElement(pageIndex, meta) {
    const page = document.createElement('section');
    page.className = 'pdf-page';
    page.dataset.pageIndex = String(pageIndex);
    page.innerHTML = `
        <div class="pdf-page-header">
            <div class="pdf-page-title">${escapeHtml(PDF_LAYOUT.pageTitle)}</div>
            <div class="pdf-page-subtitle">Escopo: <strong>${escapeHtml(meta.scope)}</strong> • Gerado em: <strong>${escapeHtml(meta.generatedAt)}</strong> • Formato: <strong>${escapeHtml(PDF_LAYOUT.pageSize)}</strong></div>
        </div>
        <div class="pdf-page-content"></div>
        <div class="pdf-page-footer">
            <span>Plataforma de Inteligência Territorial</span>
            <span class="pdf-page-number">Página ${pageIndex}</span>
        </div>
    `;

    return {
        page,
        content: page.querySelector('.pdf-page-content'),
        pageNumber: page.querySelector('.pdf-page-number')
    };
}

function createPdfSectionElement(title, bodyMarkup) {
    const section = document.createElement('section');
    section.className = 'pdf-section';
    section.innerHTML = `
        <div class="pdf-section-title">${escapeHtml(title)}</div>
        <div class="pdf-section-body">${bodyMarkup}</div>
    `;
    return section;
}

function hasContentOverflow(contentElement) {
    return contentElement.scrollHeight > contentElement.clientHeight;
}

function tryAppendBlock(contentElement, blockElement) {
    contentElement.appendChild(blockElement);
    if (hasContentOverflow(contentElement)) {
        blockElement.remove();
        return false;
    }
    return true;
}

function chunkCards(cards, size) {
    const chunks = [];
    for (let i = 0; i < cards.length; i += size) {
        chunks.push(cards.slice(i, i + size));
    }
    return chunks;
}

function chunkLongText(text, limit = PDF_LAYOUT.maxCharsPerChunk) {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return [''];
    if (normalized.length <= limit) return [normalized];

    const words = normalized.split(' ');
    const parts = [];
    let current = '';

    for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (next.length > limit && current) {
            parts.push(current);
            current = word;
        } else {
            current = next;
        }
    }

    if (current) parts.push(current);
    return parts;
}

function expandRecordForLargeDescription(record) {
    const descriptionParts = chunkLongText(record.desc, PDF_LAYOUT.maxCharsPerChunk);

    return descriptionParts.map((part, index) => ({
        ...record,
        desc: part,
        continuation: index > 0,
        continuationLabel: index > 0 ? `continuação (${index + 1})` : ''
    }));
}

function buildTableRowHtml(record, position) {
    const statusLabel = getStatusLabel(record.statusStd);
    const continuationTag = record.continuation ? ` <em>(${escapeHtml(record.continuationLabel)})</em>` : '';

    return `
        <tr>
            <td class="num">${record.continuation ? '' : escapeHtml(position)}</td>
            <td>${record.continuation ? '' : escapeHtml(record.muni || 'Não Especificado')}</td>
            <td>${record.continuation ? '' : escapeHtml(record.territorio || 'não consta')}</td>
            <td>${record.continuation ? '' : escapeHtml(record.organ || 'Geral')}</td>
            <td>${escapeHtml(record.desc || 'Sem descrição')}${continuationTag}</td>
            <td class="money">${record.continuation ? '' : escapeHtml(formatBRL(record.val || 0))}</td>
            <td class="status">${record.continuation ? '' : escapeHtml(statusLabel)}</td>
        </tr>
    `;
}

function createTableSectionSkeleton(title) {
    return createPdfSectionElement(title, `
        <div class="pdf-table-wrap">
            <table class="pdf-table">
                <colgroup>
                    <col style="width: 5%">
                    <col style="width: 13%">
                    <col style="width: 13%">
                    <col style="width: 16%">
                    <col style="width: 25%">
                    <col style="width: 19%">
                    <col style="width: 9%">
                </colgroup>
                <thead>
                    <tr>
                        <th>Pos.</th>
                        <th>Município</th>
                        <th>Território</th>
                        <th>Órgão / Secretaria</th>
                        <th>Descrição / Pleito</th>
                        <th>Valor (R$)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `);
}

function createMetaSectionMarkup(dataset) {
    return `
        <div class="pdf-meta">
            <div class="pdf-meta-item">
                <div class="label">Escopo</div>
                <div class="value">${escapeHtml(dataset.scope)}</div>
            </div>
            <div class="pdf-meta-item">
                <div class="label">Total de Registros</div>
                <div class="value">${escapeHtml(formatInteger(dataset.total))}</div>
            </div>
            <div class="pdf-meta-item">
                <div class="label">Municípios no Recorte</div>
                <div class="value">${escapeHtml(formatInteger(dataset.municipalities))}</div>
            </div>
            <div class="pdf-meta-item">
                <div class="label">Territórios no Recorte</div>
                <div class="value">${escapeHtml(formatInteger(dataset.territories))}</div>
            </div>
            <div class="pdf-meta-item">
                <div class="label">Órgãos Envolvidos</div>
                <div class="value">${escapeHtml(formatInteger(dataset.organs))}</div>
            </div>
            <div class="pdf-meta-item">
                <div class="label">Geração</div>
                <div class="value">${escapeHtml(dataset.generatedAt)}</div>
            </div>
        </div>
    `;
}

function createKpiSection(dataset) {
    const cards = dataset.kpis.map((item) => `
        <article class="pdf-kpi-card">
            <div class="pdf-kpi-label">${escapeHtml(item.label)}</div>
            <div class="pdf-kpi-value">${escapeHtml(item.value)}</div>
            <div class="pdf-kpi-note">${escapeHtml(item.note)}</div>
        </article>
    `).join('');

    return createPdfSectionElement('Indicadores Gerais', `<div class="pdf-kpi-grid">${cards}</div>`);
}

function createOrganCardMarkup(card) {
    return `
        <article class="pdf-card">
            <div class="pdf-card-head">${escapeHtml(card.organ)}</div>
            <div class="pdf-card-body">
                <div class="pdf-card-row"><span>Total</span><span>${escapeHtml(formatInteger(card.total))}</span></div>
                <div class="pdf-card-row"><span>Atendidos</span><span>${escapeHtml(formatInteger(card.attendedCount))}</span></div>
                <div class="pdf-card-row"><span>Em Aberto</span><span>${escapeHtml(formatInteger(card.openCount))}</span></div>
                <div class="pdf-card-row"><span>Taxa</span><span>${escapeHtml(card.rate.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }))}%</span></div>
                <div class="pdf-card-row"><span>Valor Total</span><span>${escapeHtml(formatBRL(card.amount))}</span></div>
            </div>
        </article>
    `;
}

function renderAdaptivePrintReport(records) {
    const root = document.getElementById('print-report-root');
    if (!root) {
        throw new Error('Container de impressão não encontrado.');
    }

    root.style.display = 'block';
    root.style.position = 'fixed';
    root.style.left = '-12000px';
    root.style.top = '0';
    root.style.width = '210mm';
    root.style.visibility = 'hidden';
    root.style.pointerEvents = 'none';
    root.style.zIndex = '-1';
    root.innerHTML = '';

    const dataset = buildPdfDataset(records);
    const report = document.createElement('div');
    report.className = 'pdf-report';
    root.appendChild(report);

    const pages = [];
    let activePage = null;
    let pageIndex = 0;

    const createNextPage = () => {
        pageIndex += 1;
        const nextPage = createPdfPageElement(pageIndex, {
            scope: dataset.scope,
            generatedAt: dataset.generatedAt
        });

        report.appendChild(nextPage.page);
        pages.push(nextPage);
        activePage = nextPage;
    };

    const ensurePage = () => {
        if (!activePage) createNextPage();
        return activePage;
    };

    const appendWholeBlock = (block) => {
        ensurePage();
        if (tryAppendBlock(activePage.content, block)) return;

        if (activePage.content.childElementCount === 0) {
            activePage.content.appendChild(block);
            return;
        }

        createNextPage();
        if (!tryAppendBlock(activePage.content, block)) {
            activePage.content.appendChild(block);
        }
    };

    createNextPage();

    const kpiSection = createKpiSection(dataset);
    appendWholeBlock(kpiSection);

    const organChunks = chunkCards(dataset.organCards, PDF_LAYOUT.cardsPerRow);
    let organSection = null;
    let organGrid = null;
    let organSectionStarted = false;

    const openOrganSection = (isContinuation = false) => {
        const title = isContinuation ? 'Indicadores por Secretaria (continuação)' : 'Indicadores por Secretaria';
        organSection = createPdfSectionElement(title, '<div class="pdf-cards-grid"></div>');
        organGrid = organSection.querySelector('.pdf-cards-grid');
        appendWholeBlock(organSection);
        organSectionStarted = true;
    };

    if (organChunks.length) {
        openOrganSection(false);

        for (const rowCards of organChunks) {
            const rowFragment = document.createDocumentFragment();
            rowCards.forEach((card) => {
                const holder = document.createElement('div');
                holder.innerHTML = createOrganCardMarkup(card);
                rowFragment.appendChild(holder.firstElementChild);
            });

            const insertedCards = [];
            Array.from(rowFragment.childNodes).forEach((cardNode) => {
                organGrid.appendChild(cardNode);
                insertedCards.push(cardNode);
            });

            if (hasContentOverflow(activePage.content)) {
                insertedCards.forEach((node) => node.remove());

                if (!organSectionStarted || organGrid.children.length === 0) {
                    createNextPage();
                } else {
                    createNextPage();
                }

                openOrganSection(true);

                rowCards.forEach((card) => {
                    const holder = document.createElement('div');
                    holder.innerHTML = createOrganCardMarkup(card);
                    organGrid.appendChild(holder.firstElementChild);
                });
            }
        }
    }

    let tableSection = null;
    let tableBody = null;
    let isTableContinuation = false;

    const openTableSection = () => {
        const sectionTitle = isTableContinuation ? 'Tabela Geral (continuação)' : 'Tabela Geral do Relatório';
        tableSection = createTableSectionSkeleton(sectionTitle);
        tableBody = tableSection.querySelector('tbody');
        appendWholeBlock(tableSection);
        isTableContinuation = true;
    };

    openTableSection();

    const expandedRows = [];
    dataset.records.forEach((record) => {
        expandedRows.push(...expandRecordForLargeDescription(record));
    });

    let absolutePosition = 0;

    for (const record of expandedRows) {
        if (!record.continuation) {
            absolutePosition += 1;
        }

        const rowHolder = document.createElement('tbody');
        rowHolder.innerHTML = buildTableRowHtml(record, absolutePosition);
        const rowElement = rowHolder.firstElementChild;
        tableBody.appendChild(rowElement);

        if (hasContentOverflow(activePage.content)) {
            rowElement.remove();
            createNextPage();
            openTableSection();
            tableBody.appendChild(rowElement);

            if (hasContentOverflow(activePage.content)) {
                rowElement.remove();
                const forcedParts = expandRecordForLargeDescription({
                    ...record,
                    desc: record.desc,
                    continuation: false,
                    continuationLabel: ''
                });

                for (let idx = 0; idx < forcedParts.length; idx++) {
                    const forced = {
                        ...forcedParts[idx],
                        continuation: idx > 0,
                        continuationLabel: idx > 0 ? `continuação (${idx + 1})` : ''
                    };
                    const forceHolder = document.createElement('tbody');
                    forceHolder.innerHTML = buildTableRowHtml(forced, absolutePosition);
                    const forceRow = forceHolder.firstElementChild;
                    tableBody.appendChild(forceRow);

                    if (hasContentOverflow(activePage.content)) {
                        forceRow.remove();
                        createNextPage();
                        openTableSection();
                        tableBody.appendChild(forceRow);
                    }
                }
            }
        }
    }

    const totalPages = pages.length;
    pages.forEach((entry, index) => {
        entry.pageNumber.textContent = `Página ${index + 1} de ${totalPages}`;
    });
}

function clearAdaptivePrintReport() {
    document.body.classList.remove('is-printing-pdf');
    const root = document.getElementById('print-report-root');
    if (root) {
        root.innerHTML = '';
        root.removeAttribute('style');
    }
}

function generateExecutivePdf() {
    const records = getPdfSourceRecords();

    if (!records.length) {
        alert('Não há dados disponíveis para gerar o PDF.');
        return;
    }

    try {
        document.body.classList.add('is-printing-pdf');
        renderAdaptivePrintReport(records);
        const root = document.getElementById('print-report-root');

        if (root) {
            root.style.position = 'static';
            root.style.left = 'auto';
            root.style.top = 'auto';
            root.style.width = 'auto';
            root.style.visibility = 'visible';
            root.style.pointerEvents = 'auto';
            root.style.zIndex = 'auto';
        }

        setTimeout(() => {
            window.print();
        }, 80);
    } catch (error) {
        clearAdaptivePrintReport();
        console.error(error);
        alert(`Erro ao gerar o relatório PDF: ${error?.message || error}`);
    }
}

window.addEventListener('afterprint', clearAdaptivePrintReport);
window.generateExecutivePdf = generateExecutivePdf;