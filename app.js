// GLOBAL APPLICATION STATE
const AppState = {
    viewMode: 'executive', // 'executive' | 'analyst'
    datasetLabel: "Nenhuma planilha carregada",
    rawRecords: [],
    normalizedRecords: [],
    filteredRecords: [],
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
        organ: 'ALL',
        status: 'ALL',
        area: 'ALL',
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
    AppState.pendingUploadedJson = rawList;
    AppState.filters = { municipality: 'ALL', organ: 'ALL', status: 'ALL', area: 'ALL', search: '' };
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

    document.getElementById('filter-organ').addEventListener('change', (e) => { AppState.filters.organ = e.target.value; applyFilters(); });
    document.getElementById('filter-status').addEventListener('change', (e) => { AppState.filters.status = e.target.value; applyFilters(); });
    document.getElementById('filter-area').addEventListener('change', (e) => { AppState.filters.area = e.target.value; applyFilters(); });
    document.getElementById('filter-search').addEventListener('input', (e) => { AppState.filters.search = e.target.value.toLowerCase().trim(); applyFilters(); });
}

function syncMunicipalitySelectors() {
    const filterSelect = document.getElementById('filter-municipality');
    const selectedValue = AppState.filters.municipality || 'ALL';

    if (filterSelect) {
        const validValue = [...filterSelect.options].some(option => option.value === selectedValue) ? selectedValue : 'ALL';
        filterSelect.value = validValue;
        AppState.filters.municipality = validValue;
    }
}

function populateFilterOptions() {
    const munis = [...new Set(AppState.normalizedRecords.map(r => r.muni))].sort();
    const organs = [...new Set(AppState.normalizedRecords.map(r => r.organ))].sort();
    const areas = [...new Set(AppState.normalizedRecords.map(r => r.area))].sort();

    const selMuni = document.getElementById('filter-municipality');
    selMuni.innerHTML = '<option value="ALL">Todos os Municípios</option>';
    munis.forEach(m => selMuni.add(new Option(m, m)));

    const selOrgan = document.getElementById('filter-organ');
    selOrgan.innerHTML = '<option value="ALL">Todos os Órgãos</option>';
    organs.forEach(o => selOrgan.add(new Option(o, o)));

    const selArea = document.getElementById('filter-area');
    selArea.innerHTML = '<option value="ALL">Todas as Áreas</option>';
    areas.forEach(a => selArea.add(new Option(a, a)));

    syncMunicipalitySelectors();
}

function applyFilters() {
    const f = AppState.filters;
    AppState.filteredRecords = AppState.normalizedRecords.filter(r => {
        const matchMuni = f.municipality === 'ALL' || r.muni === f.municipality;
        const matchOrgan = f.organ === 'ALL' || r.organ === f.organ;
        const matchStatus = matchesStatusFilter(r.statusStd, f.status);
        const matchArea = f.area === 'ALL' || r.area === f.area;
        const matchSearch = !f.search ||
            r.muni.toLowerCase().includes(f.search) ||
            r.organ.toLowerCase().includes(f.search) ||
            r.desc.toLowerCase().includes(f.search) ||
            r.area.toLowerCase().includes(f.search);

        return matchMuni && matchOrgan && matchStatus && matchArea && matchSearch;
    });

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
    if (f.organ !== 'ALL') addPill(`Órgão: ${f.organ}`, 'organ');
    if (f.status !== 'ALL') addPill(`Situação: ${f.status}`, 'status');
    if (f.area !== 'ALL') addPill(`Área: ${f.area}`, 'area');
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
    } else {
        AppState.filters[key] = 'ALL';
        document.getElementById(`filter-${key}`).value = 'ALL';
    }
    applyFilters();
}

function resetAllFilters() {
    AppState.filters = { municipality: 'ALL', organ: 'ALL', status: 'ALL', area: 'ALL', search: '' };
    document.getElementById('filter-municipality').value = 'ALL';
    document.getElementById('filter-organ').value = 'ALL';
    document.getElementById('filter-status').value = 'ALL';
    document.getElementById('filter-area').value = 'ALL';
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
        return '🚨 RESUMO DE INVESTIMENTOS E AÇÕES 🚨\n\nNenhum registro encontrado para o recorte atual.';
    }

    const municipalities = [
        ...new Set(
            records
                .map(record => normalizeMunicipioName(record.muni || record.municipio || ''))
                .filter(Boolean)
        )
    ];

    let municipalityName = 'BAHIA';

    if (municipalities.length === 1) {
        municipalityName = municipalities[0].toUpperCase();
    }

    const attendedRecords = records.filter(record => isAttendedStatus(record.statusStd));
    const openRecords = records.filter(record => isOpenStatus(record.statusStd));
    const licensingRecords = records.filter(record => String(record.statusStd || '').toUpperCase() === 'LICITACAO');
    const cancelledRecords = records.filter(record => String(record.statusStd || '').toUpperCase() === 'CANCELADO');

    const attendedValue = attendedRecords.reduce((total, record) => total + Number(record.val || 0), 0);
    const licensingValue = licensingRecords.reduce((total, record) => total + Number(record.val || 0), 0);

    const lines = [];

    lines.push(`🚨 RESUMO DE INVESTIMENTOS E AÇÕES – ${municipalityName} 🚨`);
    lines.push('');
    lines.push('📊 PANORAMA GERAL');
    lines.push('━━━━━━━━━━━━━━━━━━');
    lines.push(`🔹 Total de pleitos: ${records.length}`);
    lines.push(`🟢 Atendidos / Publicados: ${attendedRecords.length}`);
    lines.push(`🟡 Em aberto: ${openRecords.length}`);
    lines.push(`💰 Investimentos atendidos/publicados: ${formatWhatsAppShortCurrency(attendedValue)}`);
    lines.push(`📌 Aproximadamente ${formatBRL(attendedValue)}`);

    if (cancelledRecords.length > 0) {
        lines.push(`⚫ Cancelados: ${cancelledRecords.length}`);
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
        lines.push('🏆 DESTAQUES – MAIORES INVESTIMENTOS');
        lines.push('━━━━━━━━━━━━━━━━━━');

        areaEntries.forEach(([area, areaRecords]) => {
            if (!areaRecords.length) return;

            const icon = getWhatsAppAreaIcon(area);

            lines.push('');
            lines.push(`${icon} ${area}`);

            const organs = [
                ...new Set(
                    areaRecords
                        .map(record => normalizeText(record.organ, ''))
                        .filter(Boolean)
                )
            ];

            if (organs.length > 0) {
                lines.push(organs.join(' / '));
            }

            areaRecords
                .sort((a, b) => Number(b.val || 0) - Number(a.val || 0))
                .slice(0, 5)
                .forEach(record => {
                    const value = Number(record.val || 0);
                    const description = shortenWhatsAppDescription(record.desc);

                    lines.push('');
                    lines.push(`💰 ${formatWhatsAppShortCurrency(value)}`);
                    lines.push(`➡️ ${description}`);

                    const location = extractWhatsAppLocation(record);

                    if (location) {
                        lines.push(`📍 ${location}`);
                    }
                });
        });

        if (attendedWithoutValue.length > 0) {
            lines.push('');
            lines.push('🏪 VALOR NÃO INFORMADO');

            attendedWithoutValue
                .slice(0, 8)
                .forEach(record => {
                    lines.push(`➡️ ${shortenWhatsAppDescription(record.desc)}`);

                    const organ = normalizeText(record.organ, '');

                    if (organ) {
                        lines.push(`📌 ${organ}`);
                    }
                });
        }
    }

    if (licensingRecords.length > 0) {
        lines.push('');
        lines.push('━━━━━━━━━━━━━━━━━━');
        lines.push('🛠️ EM LICITAÇÃO');
        lines.push('━━━━━━━━━━━━━━━━━━');

        licensingRecords
            .sort((a, b) => Number(b.val || 0) - Number(a.val || 0))
            .slice(0, 10)
            .forEach(record => {
                const value = Number(record.val || 0);

                lines.push('');

                if (value > 0) {
                    lines.push(`💰 ${formatWhatsAppShortCurrency(value)}`);
                } else {
                    lines.push('💰 Valor não informado');
                }

                lines.push(`➡️ ${shortenWhatsAppDescription(record.desc)}`);

                const location = extractWhatsAppLocation(record);

                if (location) {
                    lines.push(`📍 ${location}`);
                }

                const organ = normalizeText(record.organ, '');

                if (organ) {
                    lines.push(`🏗️ ${organ}`);
                }
            });
    }

    if (openRecords.length > 0) {
        lines.push('');
        lines.push('━━━━━━━━━━━━━━━━━━');
        lines.push('🟡 PLEITOS EM ABERTO');
        lines.push('━━━━━━━━━━━━━━━━━━');

        const orderedOpen = [...openRecords].sort((a, b) => Number(b.val || 0) - Number(a.val || 0));

        orderedOpen
            .slice(0, 15)
            .forEach(record => {
                const areaIcon = getWhatsAppAreaIcon(record.area);
                const organ = normalizeText(record.organ, '');

                lines.push('');

                if (organ) {
                    lines.push(`${areaIcon} ${organ}`);
                } else {
                    lines.push(`${areaIcon} Órgão não informado`);
                }

                lines.push(`➡️ ${shortenWhatsAppDescription(record.desc, 300)}`);
            });
    }

    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━');
    lines.push('📌 RESUMO');

    lines.push(`🟢 ${attendedRecords.length} pleitos atendidos/publicados`);
    lines.push(`🟡 ${openRecords.length} pleitos em aberto`);
    lines.push(`💰 ${formatWhatsAppShortCurrency(attendedValue)} em investimentos atendidos/publicados`);

    if (licensingRecords.length > 0) {
        lines.push(
            `🚧 ${formatWhatsAppShortCurrency(licensingValue)} em obras em licitação`
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

function renderExecutiveSecretariatMatrix() {
    const agencies = [...new Set(AppState.filteredRecords.map(r => r.organ))].sort((a, b) => {
        const valB = AppState.filteredRecords.filter(r => r.organ === b).reduce((sum, item) => sum + item.val, 0);
        const valA = AppState.filteredRecords.filter(r => r.organ === a).reduce((sum, item) => sum + item.val, 0);
        return valB - valA;
    }).slice(0, 6);

    const headerIds = ['secretariat-header-0', 'secretariat-header-1', 'secretariat-header-2', 'secretariat-header-3', 'secretariat-header-4', 'secretariat-header-5'];
    headerIds.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = agencies[idx] || '';
        }
    });

    const tbody = document.getElementById('secretariat-matrix-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const totals = agencies.map(org => {
        const items = AppState.filteredRecords.filter(r => r.organ === org);
        const totalCount = items.length;
        const atendidos = items.filter(r => r.statusStd === 'ATENDIDO' || r.statusStd === 'CONVENIO').length;
        const valorAtendido = items.filter(r => r.statusStd === 'ATENDIDO' || r.statusStd === 'CONVENIO').reduce((sum, item) => sum + item.val, 0);
        const emAberto = items.filter(r => isOpenStatus(r.statusStd)).length;
        return { org, totalCount, atendidos, valorAtendido, emAberto };
    });

    const rows = [
        { label: 'TOTAL', values: totals.map(t => t.totalCount) },
        { label: 'ATENDIDOS/PÚBLICADOS', values: totals.map(t => t.atendidos) },
        { label: 'VALOR ATENDIDO', values: totals.map(t => t.valorAtendido) },
        { label: 'EM ABERTO', values: totals.map(t => t.emAberto) }
    ];

    rows.forEach((row) => {
        const tr = document.createElement('tr');
        const cells = [`<td class="border border-slate-300 bg-slate-50 px-2 py-2 font-black text-slate-700 uppercase">${row.label}</td>`];

        row.values.forEach((value) => {
            const style = row.label === 'VALOR ATENDIDO'
                ? 'bg-emerald-50 text-emerald-800 font-extrabold'
                : 'bg-slate-50 text-slate-700 font-bold';

            const formattedValue = row.label === 'VALOR ATENDIDO'
                ? formatBRL(value)
                : value;

            cells.push(`<td class="border border-slate-300 px-2 py-2 text-center ${style}">${formattedValue}</td>`);
        });

        tr.innerHTML = cells.join('');
        tbody.appendChild(tr);
    });
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
        tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-slate-500">Nenhum registro encontrado para o filtro atual.</td></tr>';
        return;
    }

    rows.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 border-b border-slate-100';
        tr.innerHTML = `
                    <td class="p-3 font-black text-red-700">${idx + 1}</td>
                    <td class="p-3 font-bold text-slate-800">${item.muni}</td>
                    <td class="p-3 font-semibold text-slate-600">${item.organ}</td>
                    <td class="p-3 text-slate-600">${item.area || 'Sem área'}</td>
                    <td class="p-3 text-slate-700">${item.desc}</td>
                    <td class="p-3 text-right font-extrabold text-slate-900">${formatBRL(item.val)}</td>
                    <td class="p-3 text-center">
                        <span class="whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold ${getStatusBadgeClasses(item.statusStd)}">
                            ${getStatusLabel(item.statusStd)}
                        </span>
                    </td>
                `;
        tbody.appendChild(tr);
    });
}

function renderExecutiveInsights(total, attended, rate, valAttended, valOpen) {
    const list = document.getElementById('executive-insights-list');
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
                    <div><strong>Área Temática:</strong> ${r.area}</div>
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
            const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

            if (!json || json.length === 0) {
                hideLoadingStatus();
                alert("A planilha enviada está vazia.");
                return;
            }

            AppState.pendingUploadedJson = json;
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
        area: findBestMatch(['area', 'eixo', 'tematica']),
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
        { key: 'status', label: 'Situação / Status', req: false },
        { key: 'area', label: 'Área Temática', req: false }
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
        status: getVal('status'),
        area: getVal('area')
    };

    AppState.filters = { municipality: 'ALL', organ: 'ALL', status: 'ALL', area: 'ALL', search: '' };
    const filterMunicipio = document.getElementById('filter-municipality');
    if (filterMunicipio) filterMunicipio.value = 'ALL';

    if (!mappings.muni || !mappings.desc) {
        document.getElementById('mapper-warning-msg').innerText = "⚠ Selecione colunas válidas para Município e Descrição.";
        return;
    }

    const parsedList = AppState.pendingUploadedJson
        .map((row) => {
            const rawMuni = normalizeText(row[mappings.muni], 'Não Especificado');
            const rawTerritorio = normalizeText(row[mappings.territorio], 'não consta');
            const rawOrgan = normalizeText(row[mappings.organ], 'Geral');
            const rawDesc = normalizeText(row[mappings.desc], 'Sem Descrição');
            const rawArea = normalizeText(row[mappings.area], 'Infraestrutura e Geral');
            const rawStatus = normalizeText(row[mappings.status], 'Em Aberto');
            const rawValue = parseNumericValue(row[mappings.val] ?? 0);

            if (!rawMuni || !rawDesc) {
                return null;
            }

            return {
                muni: rawMuni,
                territorio: rawTerritorio,
                organ: rawOrgan,
                desc: rawDesc,
                val: rawValue,
                status: rawStatus,
                area: rawArea || 'Infraestrutura e Geral'
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

// MULTI-TAB EXCEL EXPORT (SHEETJS)
function exportMultiTabExcel() {
    const wb = XLSX.utils.book_new();

    const dataBase = AppState.filteredRecords.map(r => ({
        ID: r.id,
        Município: r.muni,
        Órgão: r.organ,
        Descrição: r.desc,
        Valor: r.val,
        Situação: r.statusStd,
        Área: r.area,
        Prioridade: r.priority
    }));
    const wsBase = XLSX.utils.json_to_sheet(dataBase);
    XLSX.utils.book_append_sheet(wb, wsBase, "Base Tratada");

    const summary = [
        { Indicador: "Total de Pleitos", Valor: AppState.filteredRecords.length },
        { Indicador: "Investimento Atendido", Valor: AppState.filteredRecords.filter(r => r.statusStd === 'ATENDIDO').reduce((a, b) => a + b.val, 0) },
        { Indicador: "Investimento em Aberto", Valor: AppState.filteredRecords.filter(r => r.statusStd === 'EM_ABERTO').reduce((a, b) => a + b.val, 0) }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo Executivo");

    XLSX.writeFile(wb, `relatorio_investimentos_tratado_${new Date().toISOString().slice(0, 10)}.xlsx`);
}