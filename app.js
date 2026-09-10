const AppState = {
    apiAccessToken: sessionStorage.getItem('sistema-api-token') || '',
    datasetId: '',
    datasetLabel: 'Nenhuma planilha carregada',
    importedSheetName: '',
    availableColumns: [],
    columnMappings: {},
    normalizedRecords: [],
    filteredRecords: [],
    pageRecords: [],
    detectedDuplicates: [],
    qualityScore: 0,
    fieldStats: {},
    whatsappSummaryText: '',
    showGeneralExecutiveTable: true,
    currentPage: 1,
    pageSize: 25,
    viewMode: 'executive',
    filters: {
        municipality: 'ALL',
        territory: 'ALL',
        organ: 'ALL',
        status: 'ALL',
        search: ''
    },
    filterOptions: {
        municipalities: [],
        territories: [],
        organs: []
    }
};

const DASHBOARD_STORAGE_KEY = 'mrc-dashboard-state-v2';
const STATUS_LABELS = {
    ATENDIDO: 'Atendido',
    EM_ABERTO: 'Em Aberto',
    EM_ESTUDO: 'Em Estudo',
    CONVENIO: 'Convênio',
    LICITACAO: 'Licitação',
    CANCELADO: 'Cancelado'
};
const PRIORITY_LABELS = {
    ALTA: 'Alta',
    'MÉDIA': 'Média',
    BAIXA: 'Baixa'
};
const OPEN_STATUS_SET = new Set(['EM_ABERTO', 'EM_ESTUDO', 'LICITACAO']);
const ATTENDED_STATUS_SET = new Set(['ATENDIDO', 'CONVENIO']);
const PDF_LAYOUT = {
    pageTitle: 'Relatório Executivo de Investimentos',
    pageSize: 'A4',
    cardsPerRow: 3,
    maxCharsPerChunk: 500
};

function normalizeText(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
    return String(value).trim();
}

function getStatusLabel(statusValue) {
    return STATUS_LABELS[String(statusValue || '').toUpperCase()] || 'Em Aberto';
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

function isOpenStatus(statusValue) {
    return OPEN_STATUS_SET.has(String(statusValue || '').toUpperCase());
}

function isAttendedStatus(statusValue) {
    return ATTENDED_STATUS_SET.has(String(statusValue || '').toUpperCase());
}

function formatBRL(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
}

function formatCompactBRL(value) {
    const numericValue = Number(value) || 0;
    const abs = Math.abs(numericValue);

    if (abs >= 1_000_000_000) {
        return `R$ ${(numericValue / 1_000_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} bi`;
    }

    if (abs >= 1_000_000) {
        return `R$ ${(numericValue / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} mi`;
    }

    if (abs >= 1_000) {
        return `R$ ${(numericValue / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} mil`;
    }

    return formatBRL(numericValue);
}

function formatInteger(value) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function formatDateTimeForReport(date = new Date()) {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function escapeHtml(value) {
    return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const ui = {
    get(id) {
        return document.getElementById(id);
    },
    text(id, value) {
        const element = this.get(id);
        if (element) element.textContent = value;
    },
    width(id, value) {
        const element = this.get(id);
        if (element) element.style.width = `${value}%`;
    }
};

function saveDashboardState() {
    try {
        localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify({
            filters: AppState.filters,
            viewMode: AppState.viewMode,
            pageSize: AppState.pageSize
        }));
    } catch (error) {
        console.warn('Não foi possível persistir o estado do dashboard.', error);
    }
}

function restoreDashboardState() {
    try {
        const saved = JSON.parse(localStorage.getItem(DASHBOARD_STORAGE_KEY) || 'null');
        AppState.viewMode = saved?.viewMode === 'analyst' ? 'analyst' : 'executive';
        AppState.pageSize = Number.isInteger(saved?.pageSize) ? saved.pageSize : 25;
        AppState.filters = {
            municipality: saved?.filters?.municipality || 'ALL',
            territory: saved?.filters?.territory || 'ALL',
            organ: saved?.filters?.organ || 'ALL',
            status: saved?.filters?.status || 'ALL',
            search: saved?.filters?.search || ''
        };
    } catch (error) {
        console.warn('Não foi possível restaurar o estado salvo do dashboard.', error);
    }
}

function setAccessToken(token) {
    AppState.apiAccessToken = token;
    if (token) {
        sessionStorage.setItem('sistema-api-token', token);
    } else {
        sessionStorage.removeItem('sistema-api-token');
    }
}

async function apiRequest(url, options = {}, allowRetry = true) {
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');

    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (AppState.apiAccessToken) {
        headers.set('X-App-Access-Token', AppState.apiAccessToken);
    }

    const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body,
        cache: 'no-store'
    });

    if (response.status === 401 && response.headers.get('x-auth-required') === 'true' && allowRetry) {
        const token = window.prompt('Informe o token de acesso configurado no servidor:');
        if (!token) {
            throw new Error('A API exige um token de acesso para continuar.');
        }
        setAccessToken(token.trim());
        return apiRequest(url, options, false);
    }

    if (!response.ok) {
        let message = 'Erro ao processar a requisição.';
        try {
            const payload = await response.json();
            message = payload?.error || message;
        } catch (_error) {
            // Some error responses return plain text instead of JSON.
            message = await response.text() || message;
        }
        throw new Error(message);
    }

    return response;
}

async function apiJson(url, options = {}) {
    const response = await apiRequest(url, options);
    return response.json();
}

async function apiDownload(url, body) {
    const response = await apiRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition') || '';
    const match = /filename="?([^";]+)"?/.exec(disposition);
    const fileName = match?.[1] || 'download.bin';
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
}

function showLoadingStatus(message = 'Carregando informações da planilha', details = 'Aguarde um momento enquanto os dados são processados...') {
    const element = document.getElementById('loading-status');
    const title = document.getElementById('loading-status-title');
    const subtitle = document.getElementById('loading-status-subtitle');
    if (!element || !title || !subtitle) return;
    title.textContent = message;
    subtitle.textContent = details;
    element.classList.remove('hidden');
}

function hideLoadingStatus() {
    document.getElementById('loading-status')?.classList.add('hidden');
}

function updateEmptyDatasetUI() {
    ui.text('kpi-exec-total', '0');
    ui.text('kpi-exec-attended-count', '0');
    ui.text('kpi-exec-rate-badge', '0.0%');
    ui.width('kpi-exec-rate-bar', 0);
    ui.text('kpi-exec-val-attended', 'R$ 0,00');
    ui.text('kpi-exec-ticket-avg', 'Ticket Médio Atendido: R$ 0,00');
    ui.text('kpi-exec-open-count', '0 Pleitos');
    ui.text('kpi-exec-val-open', 'R$ 0,00');
    ui.text('kpi-exec-muni-count', '0 municípios');
    ui.text('active-filters-count', 'Sem dados carregados');
    ui.text('general-table-count-label', '0 registros no recorte atual');
    const duplicatesBadge = document.getElementById('duplicates-count-badge');
    if (duplicatesBadge) duplicatesBadge.textContent = '0 Duplicidades';
}

function populateFilterOptions() {
    const municipalitySelect = document.getElementById('filter-municipality');
    const territorySelect = document.getElementById('filter-territory');
    const organSelect = document.getElementById('filter-organ');

    municipalitySelect.innerHTML = '<option value="ALL">Todos os Municípios</option>';
    territorySelect.innerHTML = '<option value="ALL">Todos os Territórios</option>';
    organSelect.innerHTML = '<option value="ALL">Todos os Órgãos</option>';

    AppState.filterOptions.municipalities.forEach((value) => municipalitySelect.add(new Option(value, value)));
    AppState.filterOptions.territories.forEach((value) => territorySelect.add(new Option(value, value)));
    AppState.filterOptions.organs.forEach((value) => organSelect.add(new Option(value, value)));

    municipalitySelect.value = [...municipalitySelect.options].some((option) => option.value === AppState.filters.municipality) ? AppState.filters.municipality : 'ALL';
    territorySelect.value = [...territorySelect.options].some((option) => option.value === AppState.filters.territory) ? AppState.filters.territory : 'ALL';
    organSelect.value = [...organSelect.options].some((option) => option.value === AppState.filters.organ) ? AppState.filters.organ : 'ALL';
    document.getElementById('filter-status').value = AppState.filters.status || 'ALL';
    document.getElementById('filter-search').value = AppState.filters.search || '';
}

function renderActivePills() {
    const container = document.getElementById('active-pills-container');
    const countLabel = document.getElementById('active-filters-count');
    if (!container || !countLabel) return;

    container.innerHTML = '';
    let count = 0;

    function addPill(label, key) {
        count += 1;
        const pill = document.createElement('span');
        pill.className = 'filter-pill inline-flex items-center gap-1.5 px-2.5 py-1 text-red-800 text-xs font-bold rounded-md';
        pill.textContent = `${label} `;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'text-red-600 hover:text-red-900 font-bold';
        button.setAttribute('aria-label', `Remover filtro ${label}`);
        button.textContent = '×';
        button.addEventListener('click', () => clearSingleFilter(key));
        pill.appendChild(button);
        container.appendChild(pill);
    }

    if (AppState.filters.municipality !== 'ALL') addPill(`Município: ${AppState.filters.municipality}`, 'municipality');
    if (AppState.filters.territory !== 'ALL') addPill(`Território: ${AppState.filters.territory}`, 'territory');
    if (AppState.filters.organ !== 'ALL') addPill(`Órgão: ${AppState.filters.organ}`, 'organ');
    if (AppState.filters.status !== 'ALL') addPill(`Situação: ${AppState.filters.status}`, 'status');
    if (AppState.filters.search) addPill(`Busca: "${AppState.filters.search}"`, 'search');

    countLabel.textContent = count > 0 ? `${count} filtro(s) ativo(s)` : 'Sem filtros ativos';
}

function applySnapshot(snapshot) {
    AppState.datasetId = snapshot.datasetId || AppState.datasetId;
    AppState.datasetLabel = snapshot.datasetLabel || AppState.datasetLabel;
    AppState.importedSheetName = snapshot.importedSheetName || AppState.importedSheetName;
    AppState.filters = snapshot.filters || AppState.filters;
    AppState.filterOptions = snapshot.filterOptions || AppState.filterOptions;
    AppState.qualityScore = snapshot.qualityScore || 0;
    AppState.fieldStats = snapshot.fieldStats || {};
    AppState.detectedDuplicates = snapshot.detectedDuplicates || [];
    AppState.normalizedRecords = snapshot.normalizedRecords || [];
    AppState.filteredRecords = snapshot.filteredRecords || [];
    AppState.pageRecords = snapshot.pageRecords || [];
    AppState.currentPage = snapshot.currentPage || 1;
    AppState.pageSize = snapshot.pageSize || AppState.pageSize;
    AppState.whatsappSummaryText = snapshot.whatsappSummaryText || '';

    populateFilterOptions();
    renderActivePills();
    renderExecutiveModeViews();
    if (AppState.viewMode === 'analyst') {
        renderAnalystModeViews();
    }
    saveDashboardState();
}

async function refreshDatasetView(showSpinner = false) {
    if (!AppState.datasetId) return;
    if (showSpinner) {
        showLoadingStatus('Atualizando dashboard...', 'Aplicando filtros e recalculando o recorte protegido no backend...');
    }

    try {
        const snapshot = await apiJson(`/api/datasets/${AppState.datasetId}/query`, {
            method: 'POST',
            body: JSON.stringify({
                filters: AppState.filters,
                currentPage: AppState.currentPage,
                pageSize: AppState.pageSize
            })
        });
        applySnapshot(snapshot);
    } finally {
        if (showSpinner) hideLoadingStatus();
    }
}

function initMobileMenu() {
    const button = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    button?.addEventListener('click', () => menu.classList.toggle('hidden'));
}

function bindFilterInputs() {
    document.getElementById('filter-municipality').addEventListener('change', (event) => {
        AppState.filters.municipality = event.target.value;
        AppState.currentPage = 1;
        refreshDatasetView();
    });
    document.getElementById('filter-territory').addEventListener('change', (event) => {
        AppState.filters.territory = event.target.value;
        AppState.currentPage = 1;
        refreshDatasetView();
    });
    document.getElementById('filter-organ').addEventListener('change', (event) => {
        AppState.filters.organ = event.target.value;
        AppState.currentPage = 1;
        refreshDatasetView();
    });
    document.getElementById('filter-status').addEventListener('change', (event) => {
        AppState.filters.status = event.target.value;
        AppState.currentPage = 1;
        refreshDatasetView();
    });
    document.getElementById('filter-search').addEventListener('input', (event) => {
        AppState.filters.search = event.target.value.toLowerCase().trim();
        AppState.currentPage = 1;
        refreshDatasetView();
    });
    document.getElementById('file-input').addEventListener('change', (event) => {
        if (event.target.files.length) {
            handleSpreadsheetUpload(event.target.files[0]);
        }
    });

    document.getElementById('table-page-size').addEventListener('change', (event) => {
        changePageSize(event.target.value);
    });
}

function bindActionButtons() {
    document.querySelectorAll('[data-action]').forEach((element) => {
        const action = element.dataset.action;

        element.addEventListener('click', () => {
            switch (action) {
                case 'switch-view':
                    switchViewMode(element.dataset.mode === 'analyst' ? 'analyst' : 'executive');
                    break;
                case 'export-excel':
                    exportMultiTabExcel();
                    break;
                case 'export-pdf':
                    generateExecutivePdf();
                    break;
                case 'open-whatsapp-summary':
                    generateWhatsAppSummary();
                    break;
                case 'trigger-upload':
                    document.getElementById('file-input')?.click();
                    break;
                case 'reset-filters':
                    resetAllFilters();
                    break;
                case 'toggle-general-table':
                    toggleGeneralExecutiveTable();
                    break;
                case 'change-page':
                    changePage(Number.parseInt(element.dataset.direction, 10) || 0);
                    break;
                case 'close-mapper-modal':
                    closeMapperModal();
                    break;
                case 'confirm-column-mapping':
                    confirmColumnMapping();
                    break;
                case 'close-detail-modal':
                    closeDetailModal();
                    break;
                case 'close-summary-modal':
                    closeSummaryModal();
                    break;
                case 'copy-summary-text':
                    copySummaryText();
                    break;
                default:
                    break;
            }
        });
    });
}

function switchViewMode(mode) {
    AppState.viewMode = mode;
    const executiveContainer = document.getElementById('view-executive-mode');
    const analystContainer = document.getElementById('view-analyst-mode');
    const execButton = document.getElementById('btn-mode-exec');
    const analystButton = document.getElementById('btn-mode-analyst');

    if (mode === 'executive') {
        executiveContainer.classList.remove('hidden');
        analystContainer.classList.add('hidden');
        execButton.className = 'px-3 py-1.5 text-xs font-bold rounded-md bg-red-600 text-white shadow transition';
        analystButton.className = 'px-3 py-1.5 text-xs font-bold rounded-md text-slate-400 hover:text-white transition';
    } else {
        executiveContainer.classList.add('hidden');
        analystContainer.classList.remove('hidden');
        execButton.className = 'px-3 py-1.5 text-xs font-bold rounded-md text-slate-400 hover:text-white transition';
        analystButton.className = 'px-3 py-1.5 text-xs font-bold rounded-md bg-red-600 text-white shadow transition';
        renderAnalystModeViews();
    }

    saveDashboardState();
}

async function handleSpreadsheetUpload(file) {
    showLoadingStatus('Enviando planilha...', 'A planilha será processada no backend para manter as regras fora do navegador.');

    try {
        const formData = new FormData();
        formData.append('file', file);

        const payload = await apiJson('/api/datasets/upload', {
            method: 'POST',
            body: formData,
            headers: {}
        });

        AppState.datasetId = payload.datasetId;
        AppState.datasetLabel = payload.datasetLabel;
        AppState.importedSheetName = payload.importedSheetName;
        AppState.availableColumns = payload.availableColumns || [];
        AppState.columnMappings = payload.columnMappings || {};
        hideLoadingStatus();
        openMapperModal();
    } catch (error) {
        hideLoadingStatus();
        alert(error.message || 'Erro ao carregar a planilha.');
    }
}

function openMapperModal() {
    const container = document.getElementById('mapper-fields-list');
    const warning = document.getElementById('mapper-warning-msg');
    const fields = [
        { key: 'muni', label: 'Município (Obrigatório)' },
        { key: 'territorio', label: 'Território de Identidade' },
        { key: 'organ', label: 'Órgão / Secretaria' },
        { key: 'desc', label: 'Descrição / Pleito (Obrigatório)' },
        { key: 'val', label: 'Valor (R$)' },
        { key: 'status', label: 'Situação / Status' }
    ];

    warning.textContent = '';
    container.innerHTML = '';

    fields.forEach((field) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg';

        const select = document.createElement('select');
        select.id = `map-select-${field.key}`;
        select.className = 'bg-white border border-slate-300 rounded p-1 text-xs font-semibold focus:ring-2 focus:ring-red-500';
        select.add(new Option('[ Ignorar ou Ausente ]', ''));

        AppState.availableColumns.forEach((columnName) => {
            select.add(new Option(columnName, columnName, false, AppState.columnMappings[field.key] === columnName));
        });

        const label = document.createElement('span');
        label.className = 'font-bold text-slate-800';
        label.textContent = field.label;

        wrapper.append(label, select);
        container.appendChild(wrapper);
    });

    document.getElementById('column-mapper-modal').classList.remove('hidden');
}

async function confirmColumnMapping() {
    if (!AppState.datasetId) {
        alert('Reimporte a planilha antes de continuar.');
        return;
    }

    const getValue = (key) => document.getElementById(`map-select-${key}`).value;
    const mappings = {
        muni: getValue('muni'),
        territorio: getValue('territorio'),
        organ: getValue('organ'),
        desc: getValue('desc'),
        val: getValue('val'),
        status: getValue('status')
    };

    showLoadingStatus('Validando mapeamento...', 'Normalizando registros e preparando os relatórios no backend...');

    try {
        AppState.filters = { municipality: 'ALL', territory: 'ALL', organ: 'ALL', status: 'ALL', search: '' };
        AppState.currentPage = 1;
        const snapshot = await apiJson(`/api/datasets/${AppState.datasetId}/mapping`, {
            method: 'POST',
            body: JSON.stringify(mappings)
        });
        closeMapperModal();
        applySnapshot(snapshot);
    } catch (error) {
        document.getElementById('mapper-warning-msg').textContent = `⚠ ${error.message}`;
    } finally {
        hideLoadingStatus();
    }
}

function closeMapperModal() {
    document.getElementById('column-mapper-modal').classList.add('hidden');
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

    AppState.currentPage = 1;
    refreshDatasetView();
}

function resetAllFilters() {
    AppState.filters = { municipality: 'ALL', territory: 'ALL', organ: 'ALL', status: 'ALL', search: '' };
    document.getElementById('filter-municipality').value = 'ALL';
    document.getElementById('filter-territory').value = 'ALL';
    document.getElementById('filter-organ').value = 'ALL';
    document.getElementById('filter-status').value = 'ALL';
    document.getElementById('filter-search').value = '';
    AppState.currentPage = 1;
    refreshDatasetView();
}

function renderExecutiveModeViews() {
    const data = AppState.filteredRecords;
    const attendedList = data.filter((record) => isAttendedStatus(record.statusStd));
    const openList = data.filter((record) => isOpenStatus(record.statusStd));
    const totalPleitos = data.length;
    const totalAttendedCount = attendedList.length;
    const totalOpenCount = openList.length;
    const rate = totalPleitos > 0 ? ((totalAttendedCount / totalPleitos) * 100).toFixed(1) : 0;
    const valAttended = attendedList.reduce((sum, record) => sum + Number(record.val || 0), 0);
    const valOpen = openList.reduce((sum, record) => sum + Number(record.val || 0), 0);
    const avgTicket = totalAttendedCount > 0 ? valAttended / totalAttendedCount : 0;
    const municipalities = new Set(data.map((record) => record.muni).filter(Boolean));

    ui.text('kpi-exec-total', totalPleitos);
    ui.text('kpi-exec-attended-count', totalAttendedCount);
    ui.text('kpi-exec-rate-badge', `${rate}%`);
    ui.width('kpi-exec-rate-bar', rate);
    ui.text('kpi-exec-val-attended', formatBRL(valAttended));
    ui.text('kpi-exec-ticket-avg', `Ticket Médio Atendido: ${formatBRL(avgTicket)}`);
    ui.text('kpi-exec-open-count', `${totalOpenCount} Pleitos`);
    ui.text('kpi-exec-val-open', formatBRL(valOpen));
    ui.text('kpi-exec-muni-count', `${municipalities.size} municípios`);

    renderExecutiveInsights(totalPleitos, totalAttendedCount, rate, valAttended, valOpen);
    renderParetoAnalysis(data, valAttended);
    renderExecutiveSecretariatMatrix();
    renderGeneralExecutiveTable();
}

function renderExecutiveSecretariatMatrix() {
    const summaryGrid = document.getElementById('secretariat-summary-grid');
    const cardsGrid = document.getElementById('secretariat-cards-grid');
    if (!summaryGrid || !cardsGrid) return;

    const agencies = [...new Set(AppState.filteredRecords.map((record) => record.organ))]
        .filter((agency) => agency && agency.trim().toLowerCase() !== 'geral')
        .sort((left, right) => {
            const rightValue = AppState.filteredRecords.filter((record) => record.organ === right).reduce((sum, item) => sum + Number(item.val || 0), 0);
            const leftValue = AppState.filteredRecords.filter((record) => record.organ === left).reduce((sum, item) => sum + Number(item.val || 0), 0);
            return rightValue - leftValue;
        });

    const agenciesSummary = agencies.map((agency) => {
        const items = AppState.filteredRecords.filter((record) => record.organ === agency);
        const total = items.length;
        const attended = items.filter((record) => ATTENDED_STATUS_SET.has(record.statusStd)).length;
        const attendedValue = items.filter((record) => ATTENDED_STATUS_SET.has(record.statusStd)).reduce((sum, item) => sum + Number(item.val || 0), 0);
        const openCount = items.filter((record) => isOpenStatus(record.statusStd)).length;
        return {
            agency,
            total,
            attended,
            attendedValue,
            openCount,
            percentage: total > 0 ? (attended / total) * 100 : 0
        };
    });

    const totalPleitos = AppState.filteredRecords.length;
    const totalAttended = AppState.filteredRecords.filter((record) => ATTENDED_STATUS_SET.has(record.statusStd)).length;
    const totalAttendedValue = AppState.filteredRecords.filter((record) => ATTENDED_STATUS_SET.has(record.statusStd)).reduce((sum, item) => sum + Number(item.val || 0), 0);
    const totalOpen = AppState.filteredRecords.filter((record) => isOpenStatus(record.statusStd)).length;
    const serviceRate = totalPleitos > 0 ? (totalAttended / totalPleitos) * 100 : 0;

    summaryGrid.innerHTML = [
        { label: 'Total de Pleitos', value: formatInteger(totalPleitos) },
        { label: 'Atendidos / Publicados', value: formatInteger(totalAttended) },
        { label: 'Percentual de Atendimento', value: `${serviceRate.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` },
        { label: 'Valor Total Atendido', value: formatCompactBRL(totalAttendedValue) },
        { label: 'Em Aberto', value: formatInteger(totalOpen) }
    ].map((item) => `
        <div class="secretariat-summary-item">
            <span class="secretariat-summary-label">${item.label}</span>
            <div class="secretariat-summary-value">${item.value}</div>
        </div>
    `).join('');

    if (!agenciesSummary.length) {
        cardsGrid.innerHTML = `
            <div class="secretariat-empty-state">
                <strong>Sem dados para exibir</strong>
                <span>O recorte atual não possui órgãos com registros válidos para comparação.</span>
            </div>
        `;
        return;
    }

    cardsGrid.innerHTML = agenciesSummary.map((item) => {
        const fullValue = formatBRL(item.attendedValue);
        const compactValue = formatCompactBRL(item.attendedValue);
        return `
            <article class="secretariat-card" title="${escapeHtml(item.agency)} - Total: ${item.total} - Atendidos: ${item.attended} - Valor atendido: ${fullValue} - Em aberto: ${item.openCount}">
                <div class="secretariat-card-header">${escapeHtml(item.agency)}</div>
                <div class="secretariat-card-body">
                    <div class="secretariat-metric-row"><span class="secretariat-metric-label">Total</span><span class="secretariat-metric-value">${formatInteger(item.total)}</span></div>
                    <div class="secretariat-metric-row"><span class="secretariat-metric-label">Atendidos</span><span class="secretariat-metric-value positive">${formatInteger(item.attended)}</span></div>
                    <div class="secretariat-metric-row"><span class="secretariat-metric-label">Atendimento</span><span class="secretariat-metric-value positive">${item.percentage.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span></div>
                    <div class="secretariat-progress-wrap"><div class="secretariat-progress-bar" style="width: ${Math.min(item.percentage, 100)}%;"></div></div>
                    <div class="secretariat-metric-row"><span class="secretariat-metric-label">💰 Valor</span><span class="secretariat-metric-value positive" title="${fullValue}">${compactValue}</span></div>
                    <div class="secretariat-metric-row"><span class="secretariat-metric-label">🟡 Em Aberto</span><span class="secretariat-metric-value danger">${formatInteger(item.openCount)}</span></div>
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

    const rows = [...AppState.filteredRecords].sort((left, right) => Number(right.val || 0) - Number(left.val || 0));
    countLabel.textContent = `${rows.length} registros no recorte atual`;
    tbody.innerHTML = '';

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-500">Nenhum registro encontrado para o filtro atual.</td></tr>';
        return;
    }

    rows.forEach((item, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-50 border-b border-slate-100';
        row.innerHTML = `
            <td class="p-3 font-black text-red-700 min-w-0 break-words" style="overflow-wrap: anywhere; word-break: break-word;">${index + 1}</td>
            <td class="p-3 font-bold text-slate-800 min-w-0 break-words" style="overflow-wrap: anywhere; word-break: break-word;">${escapeHtml(item.muni)}</td>
            <td class="p-3 font-semibold text-slate-600 min-w-0 whitespace-nowrap" style="white-space: nowrap; overflow-wrap: normal;">${escapeHtml(item.organ)}</td>
            <td class="p-3 text-slate-700 min-w-0 break-words" style="overflow-wrap: anywhere; word-break: break-word;">${escapeHtml(item.desc)}</td>
            <td class="p-3 text-right font-extrabold text-slate-900 min-w-0 whitespace-nowrap" style="white-space: nowrap; overflow-wrap: normal;">${formatBRL(item.val)}</td>
            <td class="p-3 text-center min-w-0"><span class="inline-block whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold ${getStatusBadgeClasses(item.statusStd)}">${getStatusLabel(item.statusStd)}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function getTopMuniByVal() {
    const values = {};
    AppState.filteredRecords.forEach((record) => {
        if (isAttendedStatus(record.statusStd)) {
            values[record.muni] = (values[record.muni] || 0) + Number(record.val || 0);
        }
    });

    let topName = 'Nenhum';
    let maxValue = 0;
    Object.entries(values).forEach(([name, value]) => {
        if (value > maxValue) {
            topName = name;
            maxValue = value;
        }
    });
    return { name: topName, val: maxValue };
}

function getTopOrganByVal() {
    const values = {};
    AppState.filteredRecords.forEach((record) => {
        if (isAttendedStatus(record.statusStd)) {
            values[record.organ] = (values[record.organ] || 0) + Number(record.val || 0);
        }
    });

    let topName = 'Nenhum';
    let maxValue = 0;
    Object.entries(values).forEach(([name, value]) => {
        if (value > maxValue) {
            topName = name;
            maxValue = value;
        }
    });
    return { name: topName, val: maxValue };
}

function renderExecutiveInsights(total, attended, rate, valAttended, valOpen) {
    const list = document.getElementById('executive-insights-list');
    if (!list) return;
    list.innerHTML = '';

    const topMuni = getTopMuniByVal();
    const topOrgan = getTopOrganByVal();
    [
        `• O recorte atual concentra <strong>${formatBRL(valAttended)}</strong> em ${attended} demandas atendidas ou concluídas, refletindo uma taxa de resolutividade de <strong>${rate}%</strong>.`,
        `• O painel indica que <strong>${attended}</strong> de <strong>${total}</strong> solicitações estão em condição de atendimento concluído ou conveniado, com foco no cumprimento do ciclo de execução.`,
        `• O município com maior volume financeiro em execução/entrega é <strong>${escapeHtml(topMuni.name)}</strong>, com <strong>${formatBRL(topMuni.val)}</strong> acumulados no cenário atual.`,
        `• A atuação institucional se concentra em <strong>${escapeHtml(topOrgan.name)}</strong>, que detém o maior volume de recursos no território monitorado, somando <strong>${formatBRL(topOrgan.val)}</strong>.`,
        `• O passivo em aberto ainda representa <strong>${formatBRL(valOpen)}</strong>, exigindo acompanhamento prioritário de execução, cronograma e desdobramento de demandas pendentes.`
    ].forEach((bullet) => {
        const block = document.createElement('div');
        block.className = 'bg-red-950/40 p-3 rounded-lg border border-red-800/40 text-slate-200';
        block.innerHTML = bullet;
        list.appendChild(block);
    });
}

function renderParetoAnalysis(data, totalAttendedVal) {
    const municipalityMap = {};
    data.forEach((record) => {
        if (isAttendedStatus(record.statusStd)) {
            municipalityMap[record.muni] = (municipalityMap[record.muni] || 0) + Number(record.val || 0);
        }
    });
    const top5Value = Object.values(municipalityMap).sort((left, right) => right - left).slice(0, 5).reduce((sum, value) => sum + value, 0);
    const top5Pct = totalAttendedVal > 0 ? ((top5Value / totalAttendedVal) * 100).toFixed(1) : 0;
    ui.text('pareto-top5-pct', `${top5Pct}%`);
    ui.width('pareto-top5-bar', top5Pct);
    ui.text('pareto-top5-desc', `Os 5 maiores municípios concentram ${formatBRL(top5Value)} do total de recursos.`);

    const organMap = {};
    data.forEach((record) => {
        if (isAttendedStatus(record.statusStd)) {
            organMap[record.organ] = (organMap[record.organ] || 0) + Number(record.val || 0);
        }
    });
    const top3OrganValue = Object.values(organMap).sort((left, right) => right - left).slice(0, 3).reduce((sum, value) => sum + value, 0);
    const top3OrganPct = totalAttendedVal > 0 ? ((top3OrganValue / totalAttendedVal) * 100).toFixed(1) : 0;
    ui.text('pareto-top3-organ-pct', `${top3OrganPct}%`);
    ui.width('pareto-top3-organ-bar', top3OrganPct);
    ui.text('pareto-top3-organ-desc', `Os 3 maiores órgãos gerenciam ${formatBRL(top3OrganValue)} dos investimentos territoriais.`);
}

function renderFieldQualityGrid() {
    const grid = document.getElementById('field-quality-grid');
    if (!grid) return;
    grid.innerHTML = '';

    [
        { label: 'Município', pct: AppState.fieldStats.muni || 0 },
        { label: 'Órgão', pct: AppState.fieldStats.organ || 0 },
        { label: 'Descrição', pct: AppState.fieldStats.desc || 0 },
        { label: 'Valor', pct: AppState.fieldStats.val || 0 },
        { label: 'Situação', pct: AppState.fieldStats.status || 0 }
    ].forEach((field) => {
        const card = document.createElement('div');
        card.className = 'bg-slate-50 p-3 rounded-xl border border-slate-200 text-center space-y-1';
        card.innerHTML = `
            <div class="text-[11px] font-bold text-slate-500 uppercase">${field.label}</div>
            <div class="text-lg font-extrabold ${field.pct >= 90 ? 'text-emerald-600' : 'text-amber-600'}">${field.pct}%</div>
            <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden"><div class="h-1.5 rounded-full ${field.pct >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}" style="width: ${field.pct}%;"></div></div>
        `;
        grid.appendChild(card);
    });
}

function renderDuplicatesList() {
    const container = document.getElementById('duplicates-container');
    if (!container) return;
    container.innerHTML = '';

    const badge = document.getElementById('duplicates-count-badge');
    if (badge) badge.textContent = `${AppState.detectedDuplicates.length} Duplicidades Suspeitas`;

    if (!AppState.detectedDuplicates.length) {
        container.innerHTML = '<div class="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">Nenhuma duplicidade crítica detectada nesta base.</div>';
        return;
    }

    AppState.detectedDuplicates.forEach((pair, index) => {
        const block = document.createElement('div');
        block.className = 'bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3';
        block.innerHTML = `
            <div class="space-y-1">
                <span class="font-bold text-amber-900">Similaridade: ${pair.similarity}%</span>
                <div class="text-slate-700"><strong>Reg #1:</strong> ${escapeHtml(pair.item1.muni)} (${escapeHtml(pair.item1.organ)}) - ${escapeHtml(pair.item1.desc)}</div>
                <div class="text-slate-700"><strong>Reg #2:</strong> ${escapeHtml(pair.item2.muni)} (${escapeHtml(pair.item2.organ)}) - ${escapeHtml(pair.item2.desc)}</div>
            </div>
            <div class="flex items-center gap-2"><button type="button" class="duplicate-ignore-button px-2.5 py-1 bg-white border border-slate-300 rounded font-bold hover:bg-slate-100">Manter Ambos</button></div>
        `;
        block.querySelector('.duplicate-ignore-button')?.addEventListener('click', () => ignoreDuplicate(index));
        container.appendChild(block);
    });
}

function ignoreDuplicate(index) {
    AppState.detectedDuplicates.splice(index, 1);
    renderDuplicatesList();
}

function renderFullAnalyticsTable() {
    const tbody = document.getElementById('table-full-analytics-body');
    const indicator = document.getElementById('table-page-indicator');
    if (!tbody || !indicator) return;
    tbody.innerHTML = '';

    AppState.pageRecords.forEach((record) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-50 border-b border-slate-100 cursor-pointer';
        row.onclick = () => openDetailModal(record.id);
        row.innerHTML = `
            <td class="p-3 font-bold text-slate-400">#${record.id}</td>
            <td class="p-3 font-bold text-slate-800">${escapeHtml(record.muni)}</td>
            <td class="p-3 font-semibold text-slate-600">${escapeHtml(record.organ)}</td>
            <td class="p-3 text-slate-700">${escapeHtml(record.desc)}</td>
            <td class="p-3 text-right font-bold text-slate-900">${formatBRL(record.val)}</td>
            <td class="p-3 text-center"><span class="whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold ${getStatusBadgeClasses(record.statusStd)}">${getStatusLabel(record.statusStd)}</span></td>
            <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadgeClasses(record.priority)}">${getPriorityLabel(record.priority)}</span></td>
            <td class="p-3 text-center"><button class="text-red-600 hover:underline font-bold">Audit</button></td>
        `;
        tbody.appendChild(row);
    });

    const maxPage = Math.ceil(AppState.filteredRecords.length / AppState.pageSize) || 1;
    indicator.textContent = `Pág ${AppState.currentPage} de ${maxPage}`;
}

function renderAnalystModeViews() {
    renderFieldQualityGrid();
    renderDuplicatesList();
    renderFullAnalyticsTable();
}

function changePage(direction) {
    const maxPage = Math.ceil(AppState.filteredRecords.length / AppState.pageSize) || 1;
    AppState.currentPage = Math.min(Math.max(1, AppState.currentPage + direction), maxPage);
    refreshDatasetView();
}

function changePageSize(size) {
    AppState.pageSize = Number.parseInt(size, 10) || 25;
    AppState.currentPage = 1;
    refreshDatasetView();
}

function openDetailModal(recordId) {
    const record = AppState.normalizedRecords.find((item) => item.id === recordId);
    if (!record) return;

    const content = document.getElementById('detail-modal-content');
    content.innerHTML = `
        <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
            <span class="font-bold text-slate-900 uppercase">Dado Tratado / Normalizado</span>
            <div><strong>ID:</strong> #${record.id}</div>
            <div><strong>Município:</strong> ${escapeHtml(record.muni)}</div>
            <div><strong>Órgão:</strong> ${escapeHtml(record.organ)}</div>
            <div><strong>Descrição:</strong> ${escapeHtml(record.desc)}</div>
            <div><strong>Valor Tratado:</strong> ${formatBRL(record.val)}</div>
            <div><strong>Situação Padronizada:</strong> ${escapeHtml(record.statusStd)} (Original: "${escapeHtml(record.statusRaw)}")</div>
            <div><strong>Prioridade Analítica:</strong> ${escapeHtml(record.priority)}</div>
        </div>
        <div class="bg-amber-50 p-3 rounded-lg border border-amber-200 space-y-1">
            <span class="font-bold text-amber-900 uppercase">Registro Original da Planilha (Não Alterado)</span>
            <pre class="text-[11px] text-amber-800 overflow-x-auto">${escapeHtml(JSON.stringify(record.original, null, 2))}</pre>
        </div>
    `;
    document.getElementById('detail-modal').classList.remove('hidden');
}

function closeDetailModal() {
    document.getElementById('detail-modal').classList.add('hidden');
}

function openSummaryModal() {
    const modal = document.getElementById('summary-modal');
    const textarea = document.getElementById('summary-copy-text');
    if (!modal || !textarea) return;
    textarea.value = AppState.whatsappSummaryText || '*RESUMO DE INVESTIMENTOS E AÇÕES*\n\nNenhum registro encontrado para o recorte atual.';
    modal.classList.remove('hidden');
    setTimeout(() => textarea.focus(), 50);
}

function closeSummaryModal() {
    document.getElementById('summary-modal')?.classList.add('hidden');
}

async function copySummaryText() {
    const textarea = document.getElementById('summary-copy-text');
    if (!textarea) return;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(textarea.value);
        } else {
            // Legacy fallback for browsers without Clipboard API support.
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
    } catch (_error) {
        // Keep a final fallback for restricted browser contexts.
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
    }
}

function generateWhatsAppSummary() {
    if (!AppState.datasetId) {
        alert('Importe uma planilha antes de gerar o resumo.');
        return;
    }
    openSummaryModal();
}

async function exportMultiTabExcel() {
    if (!AppState.datasetId) {
        alert('Importe uma planilha antes de gerar a planilha tratada.');
        return;
    }

    try {
        await apiDownload(`/api/datasets/${AppState.datasetId}/exports/excel`, { filters: AppState.filters });
    } catch (error) {
        alert(error.message || 'Erro ao gerar a planilha tratada.');
    }
}

async function generateWordReport() {
    if (!AppState.datasetId) {
        alert('Importe uma planilha antes de gerar o relatório Word.');
        return;
    }

    const button = document.getElementById('btn-word-report');
    const originalText = button?.innerHTML;

    try {
        if (button) {
            button.disabled = true;
            button.innerHTML = '⏳ Gerando Word...';
        }
        await apiDownload(`/api/datasets/${AppState.datasetId}/exports/word`, { filters: AppState.filters });
    } catch (error) {
        alert(error.message || 'Erro ao gerar o relatório Word.');
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText || '📝 Relatório Word';
        }
    }
}

function getPdfScopeLabel() {
    if (AppState.filters.municipality !== 'ALL') return AppState.filters.municipality;
    if (AppState.filters.territory !== 'ALL') return `Território ${AppState.filters.territory}`;
    return 'Recorte Geral';
}

function getPdfSourceRecords() {
    if (AppState.filteredRecords.length) return [...AppState.filteredRecords];
    return [...AppState.normalizedRecords];
}

function buildPdfDataset(records) {
    const sortedRecords = [...records].sort((left, right) => Number(right.val || 0) - Number(left.val || 0));
    const attended = sortedRecords.filter((item) => isAttendedStatus(item.statusStd));
    const open = sortedRecords.filter((item) => isOpenStatus(item.statusStd));
    const attendedValue = attended.reduce((sum, item) => sum + Number(item.val || 0), 0);
    const openValue = open.reduce((sum, item) => sum + Number(item.val || 0), 0);
    const avgTicket = attended.length ? attendedValue / attended.length : 0;
    const uniqueMunicipalities = new Set(sortedRecords.map((item) => item.muni).filter(Boolean));
    const uniqueOrgans = new Set(sortedRecords.map((item) => item.organ).filter(Boolean));
    const uniqueTerritories = new Set(sortedRecords.map((item) => item.territorio || 'não consta').filter(Boolean));

    return {
        generatedAt: formatDateTimeForReport(new Date()),
        scope: getPdfScopeLabel(),
        kpis: [
            { label: 'Total de Pleitos', value: formatInteger(sortedRecords.length), note: 'Volume total no recorte atual' },
            { label: 'Atendidos / Publicados', value: formatInteger(attended.length), note: 'Status atendido ou convênio' },
            { label: 'Em Aberto / Em Estudo', value: formatInteger(open.length), note: 'Demandas pendentes no monitoramento' },
            { label: 'Taxa de Atendimento', value: `${sortedRecords.length ? ((attended.length / sortedRecords.length) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0,0'}%`, note: 'Atendidos sobre total de pleitos' },
            { label: 'Investimento Atendido', value: formatBRL(attendedValue), note: 'Valor total executado/publicado' },
            { label: 'Passivo em Aberto', value: formatBRL(openValue), note: 'Valor pendente de execução' },
            { label: 'Ticket Médio Atendido', value: formatBRL(avgTicket), note: 'Média por demanda atendida' },
            { label: 'Órgãos no Recorte', value: formatInteger(uniqueOrgans.size), note: 'Secretarias e órgãos envolvidos' }
        ],
        organCards: [...uniqueOrgans].map((organName) => {
            const items = sortedRecords.filter((item) => item.organ === organName);
            const total = items.length;
            const attendedCount = items.filter((item) => isAttendedStatus(item.statusStd)).length;
            const openCount = items.filter((item) => isOpenStatus(item.statusStd)).length;
            const amount = items.reduce((sum, item) => sum + Number(item.val || 0), 0);
            return {
                organ: organName || 'Órgão não informado',
                total,
                attendedCount,
                openCount,
                amount,
                rate: total ? (attendedCount / total) * 100 : 0
            };
        }).sort((left, right) => right.amount - left.amount),
        records: sortedRecords,
        meta: {
            municipalities: uniqueMunicipalities.size,
            territories: uniqueTerritories.size,
            organs: uniqueOrgans.size
        }
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
        <div class="pdf-page-footer"><span>Plataforma de Inteligência Territorial</span><span class="pdf-page-number">Página ${pageIndex}</span></div>
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
    for (let index = 0; index < cards.length; index += size) {
        chunks.push(cards.slice(index, index + size));
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
    return chunkLongText(record.desc, PDF_LAYOUT.maxCharsPerChunk).map((part, index) => ({
        ...record,
        desc: part,
        continuation: index > 0,
        continuationLabel: index > 0 ? `continuação (${index + 1})` : ''
    }));
}

function buildTableRowHtml(record, position) {
    const continuationTag = record.continuation ? ` <em>(${escapeHtml(record.continuationLabel)})</em>` : '';
    return `
        <tr>
            <td class="num">${record.continuation ? '' : escapeHtml(position)}</td>
            <td>${record.continuation ? '' : escapeHtml(record.muni || 'Não Especificado')}</td>
            <td>${record.continuation ? '' : escapeHtml(record.territorio || 'não consta')}</td>
            <td>${record.continuation ? '' : escapeHtml(record.organ || 'Geral')}</td>
            <td>${escapeHtml(record.desc || 'Sem descrição')}${continuationTag}</td>
            <td class="money">${record.continuation ? '' : escapeHtml(formatBRL(record.val || 0))}</td>
            <td class="status">${record.continuation ? '' : escapeHtml(getStatusLabel(record.statusStd))}</td>
        </tr>
    `;
}

function createTableSectionSkeleton(title) {
    return createPdfSectionElement(title, `
        <div class="pdf-table-wrap">
            <table class="pdf-table">
                <colgroup>
                    <col style="width: 5%"><col style="width: 13%"><col style="width: 13%"><col style="width: 16%"><col style="width: 25%"><col style="width: 19%"><col style="width: 9%">
                </colgroup>
                <thead>
                    <tr><th>Pos.</th><th>Município</th><th>Território</th><th>Órgão / Secretaria</th><th>Descrição / Pleito</th><th>Valor (R$)</th><th>Status</th></tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `);
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
    if (!root) throw new Error('Container de impressão não encontrado.');

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
    };

    const appendWholeBlock = (block) => {
        ensurePage();
        if (tryAppendBlock(activePage.content, block)) return;
        if (activePage.content.childElementCount !== 0) {
            createNextPage();
        }
        if (!tryAppendBlock(activePage.content, block)) {
            activePage.content.appendChild(block);
        }
    };

    createNextPage();
    appendWholeBlock(createKpiSection(dataset));

    const organChunks = chunkCards(dataset.organCards, PDF_LAYOUT.cardsPerRow);
    let organGrid = null;

    const openOrganSection = (continuation = false) => {
        const section = createPdfSectionElement(continuation ? 'Indicadores por Secretaria (continuação)' : 'Indicadores por Secretaria', '<div class="pdf-cards-grid"></div>');
        organGrid = section.querySelector('.pdf-cards-grid');
        appendWholeBlock(section);
    };

    if (organChunks.length) {
        openOrganSection(false);
        for (const rowCards of organChunks) {
            const insertedCards = [];
            rowCards.forEach((card) => {
                const holder = document.createElement('div');
                holder.innerHTML = createOrganCardMarkup(card);
                organGrid.appendChild(holder.firstElementChild);
                insertedCards.push(organGrid.lastElementChild);
            });

            if (hasContentOverflow(activePage.content)) {
                insertedCards.forEach((node) => node?.remove());
                createNextPage();
                openOrganSection(true);
                rowCards.forEach((card) => {
                    const holder = document.createElement('div');
                    holder.innerHTML = createOrganCardMarkup(card);
                    organGrid.appendChild(holder.firstElementChild);
                });
            }
        }
    }

    let tableBody = null;
    let tableContinuation = false;
    const openTableSection = () => {
        const section = createTableSectionSkeleton(tableContinuation ? 'Tabela Geral (continuação)' : 'Tabela Geral do Relatório');
        tableBody = section.querySelector('tbody');
        appendWholeBlock(section);
        tableContinuation = true;
    };

    openTableSection();
    const expandedRows = [];
    dataset.records.forEach((record) => expandedRows.push(...expandRecordForLargeDescription(record)));
    let absolutePosition = 0;

    for (const record of expandedRows) {
        if (!record.continuation) absolutePosition += 1;
        const holder = document.createElement('tbody');
        holder.innerHTML = buildTableRowHtml(record, absolutePosition);
        const row = holder.firstElementChild;
        tableBody.appendChild(row);

        if (hasContentOverflow(activePage.content)) {
            row.remove();
            createNextPage();
            openTableSection();
            tableBody.appendChild(row);
        }
    }

    pages.forEach((entry, index) => {
        entry.pageNumber.textContent = `Página ${index + 1} de ${pages.length}`;
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
        setTimeout(() => window.print(), 80);
    } catch (error) {
        clearAdaptivePrintReport();
        alert(`Erro ao gerar o relatório PDF: ${error?.message || error}`);
    }
}

function initApp() {
    restoreDashboardState();
    initMobileMenu();
    bindFilterInputs();
    bindActionButtons();
    updateEmptyDatasetUI();
    switchViewMode(AppState.viewMode);

    if (window.location.protocol === 'file:') {
        alert('Abra a aplicação pelo servidor local: use npm run dev e acesse http://localhost:3000.');
    }
}

window.addEventListener('afterprint', clearAdaptivePrintReport);
window.switchViewMode = switchViewMode;
window.resetAllFilters = resetAllFilters;
window.clearSingleFilter = clearSingleFilter;
window.changePage = changePage;
window.changePageSize = changePageSize;
window.confirmColumnMapping = confirmColumnMapping;
window.closeMapperModal = closeMapperModal;
window.toggleGeneralExecutiveTable = toggleGeneralExecutiveTable;
window.closeDetailModal = closeDetailModal;
window.generateWhatsAppSummary = generateWhatsAppSummary;
window.closeSummaryModal = closeSummaryModal;
window.copySummaryText = copySummaryText;
window.exportMultiTabExcel = exportMultiTabExcel;
window.generateExecutivePdf = generateExecutivePdf;
window.generateWordReport = generateWordReport;
window.ignoreDuplicate = ignoreDuplicate;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
