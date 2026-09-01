
        // DEFAULT DATASET (183 Records from Médio Rio de Contas Report)
        const DEFAULT_DATASET = [
            { muni: "Dário Meira", organ: "CONDER", desc: "Obra de Macrodrenagem de Canal para o Rio Gongoji (Novo PAC)", val: 22875029.55, status: "Concluído", area: "Saneamento, Drenagem e Água" },
            { muni: "Dário Meira", organ: "SEC", desc: "Nova Sede do Colégio Estadual de Tempo Integral", val: 14081647.00, status: "Concluído", area: "Educação e Esporte" },
            { muni: "Dário Meira", organ: "CONDER", desc: "Construção de 145 Unidades Habitacionais (Bahia Minha Casa / Convênios)", val: 19100000.00, status: "Concluído", area: "Habitação e Urbanização" },
            { muni: "Dário Meira", organ: "CERB", desc: "Sistema de Água em Ibitupã e ETA Dário Meira", val: 4210000.00, status: "Concluído", area: "Saneamento, Drenagem e Água" },
            { muni: "Dário Meira", organ: "CAR", desc: "Reforma do Mercado Municipal e Feira", val: 1500000.00, status: "Concluído", area: "Desenvolvimento Rural e Feiras" },
            { muni: "Dário Meira", organ: "CAR", desc: "Equipamentos Agrícolas e Unidades Agroindustriais", val: 800000.00, status: "Concluído", area: "Desenvolvimento Rural e Feiras" },
            { muni: "Dário Meira", organ: "CONDER", desc: "Novo Mercado Municipal", val: 0, status: "Em Aberto", area: "Desenvolvimento Rural e Feiras" },
            { muni: "Dário Meira", organ: "SESAB", desc: "Reforma da UBS Centro", val: 0, status: "Em Aberto", area: "Saúde e Segurança Pública" },
            { muni: "Dário Meira", organ: "PMBA / SSP", desc: "Unidade Integrada da Delegacia Territorial e Pelotão PM", val: 0, status: "Em Aberto", area: "Saúde e Segurança Pública" },
            { muni: "Dário Meira", organ: "EMBASA", desc: "Sistema de Água no Ponto Novo (30 km da Sede)", val: 0, status: "Em Aberto", area: "Saneamento, Drenagem e Água" },

            { muni: "Ipiaú", organ: "SEINFRA", desc: "Recuperação da Pista de Pouso do Aeródromo", val: 13703688.45, status: "Concluído", area: "Infraestrutura e Mobilidade" },
            { muni: "Ipiaú", organ: "EMBASA", desc: "Implantação de Sistema de Esgotamento Sanitário (Ruas W. Sampaio e Pensilvânia)", val: 13706320.33, status: "Concluído", area: "Saneamento, Drenagem e Água" },
            { muni: "Ipiaú", organ: "SEINFRA", desc: "Pavimentação do Acesso BA-650 a Fazenda do Povo", val: 11767147.94, status: "Concluído", area: "Infraestrutura e Mobilidade" },
            { muni: "Ipiaú", organ: "SEC", desc: "Complexo Poliesportivo Cultural Dr. Salvador da Matta", val: 9067132.15, status: "Concluído", area: "Educação e Esporte" },
            { muni: "Ipiaú", organ: "CONDER", desc: "121 Unidades Habitacionais no Bairro Santa Rita", val: 8956177.15, status: "Concluído", area: "Habitação e Urbanização" },
            { muni: "Ipiaú", organ: "SEC", desc: "Nova Sede do Colégio Estadual de Tempo Integral", val: 7590709.05, status: "Concluído", area: "Educação e Esporte" },
            { muni: "Ipiaú", organ: "SESAB", desc: "Reforma e Ampliação do Hospital Geral de Ipiaú", val: 0, status: "Em Aberto", area: "Saúde e Segurança Pública" },
            { muni: "Ipiaú", organ: "SEINFRA", desc: "Restauração/Ponte do Bairro da Conceição para BR-330", val: 0, status: "Em Aberto", area: "Infraestrutura e Mobilidade" },
            { muni: "Ipiaú", organ: "EMBASA", desc: "Ampliação da 1ª Etapa do SIAA Ipiaú", val: 0, status: "Em Aberto", area: "Saneamento, Drenagem e Água" },
            { muni: "Ipiaú", organ: "CAR", desc: "Galpão e Casas de Fermentação de Cacau em Córrego das Pedras", val: 0, status: "Em Aberto", area: "Desenvolvimento Rural e Feiras" },

            { muni: "Aiquara", organ: "SEINFRA", desc: "Pavimentação Asfáltica (CBUQ) na BA-558", val: 14759709.24, status: "Concluído", area: "Infraestrutura e Mobilidade" },
            { muni: "Aiquara", organ: "SEC", desc: "Creche Proinfância Tipo 1", val: 6500000.00, status: "Concluído", area: "Educação e Esporte" },
            { muni: "Aiquara", organ: "SEC", desc: "Modernização do Colégio Estadual CEA", val: 4750000.00, status: "Concluído", area: "Educação e Esporte" },
            { muni: "Aiquara", organ: "SEINFRA", desc: "Pavimentação na BA-647", val: 2400000.00, status: "Concluído", area: "Infraestrutura e Mobilidade" },
            { muni: "Aiquara", organ: "CAR", desc: "Reforma do Mercado Municipal", val: 2400000.00, status: "Concluído", area: "Desenvolvimento Rural e Feiras" },
            { muni: "Aiquara", organ: "EMBASA", desc: "Nova Estação de Tratamento de Água - ETA EMBASA", val: 3590000.00, status: "Em Aberto", area: "Saneamento, Drenagem e Água" },
            { muni: "Aiquara", organ: "CAR", desc: "11 Habitações Rurais em Pindorama", val: 487520.58, status: "Em Aberto", area: "Habitação e Urbanização" },

            { muni: "Itamari", organ: "SEC", desc: "Nova Unidade Escolar de Tempo Integral Col. João Galvão", val: 20249404.83, status: "Concluído", area: "Educação e Esporte" },
            { muni: "Itamari", organ: "EMBASA", desc: "Ampliação e Melhorias no Sistema de Abastecimento de Água", val: 8495066.44, status: "Concluído", area: "Saneamento, Drenagem e Água" },
            { muni: "Itamari", organ: "CONDER", desc: "Obras de Contenção de Encostas", val: 1850000.00, status: "Concluído", area: "Infraestrutura e Mobilidade" },
            { muni: "Itamari", organ: "CAR", desc: "Praça da Feira e Mercado de Carne", val: 1480000.00, status: "Concluído", area: "Desenvolvimento Rural e Feiras" },
            { muni: "Itamari", organ: "SUDESB", desc: "Construção do Novo Ginásio de Esportes", val: 0, status: "Em Aberto", area: "Educação e Esporte" },

            { muni: "Apuarema", organ: "SEC", desc: "Nova Sede do Colégio Estadual Dr. Vasco Filho", val: 7238425.88, status: "Concluído", area: "Educação e Esporte" },
            { muni: "Apuarema", organ: "SEINFRA", desc: "Acesso Pavimentado ao Colégio", val: 3220000.00, status: "Concluído", area: "Infraestrutura e Mobilidade" },
            { muni: "Apuarema", organ: "CAR", desc: "Reforma do Centro de Abastecimento Municipal", val: 3080000.00, status: "Concluído", area: "Desenvolvimento Rural e Feiras" },
            { muni: "Apuarema", organ: "SUDESB", desc: "Quadra Poliesportiva Coberta no Loteamento José Novaes", val: 2070000.00, status: "Concluído", area: "Educação e Esporte" },

            { muni: "Jitaúna", organ: "SEC", desc: "Reforma do Centro de Ed. Fundamental II Maria Eleonora Cajahyba", val: 11892932.06, status: "Convênio", area: "Educação e Esporte" },
            { muni: "Jitaúna", organ: "SESAB", desc: "Construção de UBS Tipo I", val: 1710000.00, status: "Concluído", area: "Saúde e Segurança Pública" },
            { muni: "Jitaúna", organ: "CONDER", desc: "Pavimentação do Bairro Muniz", val: 1320000.00, status: "Concluído", area: "Infraestrutura e Mobilidade" },
            { muni: "Jitaúna", organ: "CONDER", desc: "Construção de 50 Unidades Habitacionais no Bairro Gilberto Lopes", val: 8043492.63, status: "Em Aberto", area: "Habitação e Urbanização" },

            { muni: "Nova Ibiá", organ: "CERB", desc: "Sistemas de Água CERB: Putumuju/Ganduzinho", val: 3570000.00, status: "Concluído", area: "Saneamento, Drenagem e Água" },
            { muni: "Nova Ibiá", organ: "CONDER", desc: "Construção da Praça de Eventos", val: 1580000.00, status: "Concluído", area: "Habitação e Urbanização" },
            { muni: "Nova Ibiá", organ: "SUDESB", desc: "Reforma do Estádio Valdivino José Brás", val: 890000.00, status: "Concluído", area: "Educação e Esporte" },

            { muni: "Ubatá", organ: "SEC", desc: "Modernização do Colégio Estadual de Ubatá", val: 12574740.94, status: "Concluído", area: "Educação e Esporte" },
            { muni: "Ubatá", organ: "SUDESB", desc: "Areninha Society e Praça do Trabalhador", val: 1730424.82, status: "Concluído", area: "Educação e Esporte" },
            { muni: "Ubatá", organ: "CONDER", desc: "26 Unidades Habitacionais no Bairro Comissão", val: 0, status: "Em Aberto", area: "Habitação e Urbanização" },

            { muni: "Itagibá", organ: "SEC", desc: "Modernização do Colégio Estadual Dulce Almeida", val: 7587419.24, status: "Concluído", area: "Educação e Esporte" },
            { muni: "Itagibá", organ: "PMBA / SSP", desc: "Pelotão da Polícia Militar", val: 1399459.43, status: "Concluído", area: "Saúde e Segurança Pública" },
            { muni: "Itagibá", organ: "CONDER", desc: "Pavimentação Asfáltica no Bairro Kleber Barreto", val: 4573946.56, status: "Em Aberto", area: "Infraestrutura e Mobilidade" },

            { muni: "Itagi", organ: "SEC", desc: "Reforma/Ampliação da Escola Municipal Walter Mascarenhas", val: 4950000.00, status: "Concluído", area: "Educação e Esporte" },
            { muni: "Itagi", organ: "CAR", desc: "Cobertura da Praça da Feira Livre", val: 2390000.00, status: "Concluído", area: "Desenvolvimento Rural e Feiras" },

            { muni: "Ibirataia", organ: "SEC", desc: "Complexo Poliesportivo Educacional", val: 6430000.00, status: "Licitação", area: "Educação e Esporte" },
            { muni: "Ibirataia", organ: "CONDER", desc: "61 Unidades Habitacionais no Bairro José Firmino", val: 4400000.00, status: "Em Aberto", area: "Habitação e Urbanização" },
            { muni: "Ibirataia", organ: "PMBA / SSP", desc: "Unidade Integrada da Delegacia e Pelotão PM", val: 2920000.00, status: "Em Aberto", area: "Saúde e Segurança Pública" },
            { muni: "Ibirataia", organ: "CONDER", desc: "Urbanização da Lagoa", val: 2680000.00, status: "Concluído", area: "Habitação e Urbanização" },

            { muni: "Barra do Rocha", organ: "CONDER", desc: "Pavimentação em Paralelepípedo nos Bairros Ananias e Lagoa", val: 2332600.09, status: "Em Aberto", area: "Infraestrutura e Mobilidade" },
            { muni: "Barra do Rocha", organ: "SUDESB", desc: "Quadra Coberta no Assentamento Coroa Verde", val: 1940000.00, status: "Concluído", area: "Educação e Esporte" },
            { muni: "Barra do Rocha", organ: "CONDER", desc: "25 Unidades Habitacionais no Bairro Ananias Maciel", val: 1850000.00, status: "Concluído", area: "Habitação e Urbanização" },

            { muni: "Gongogi", organ: "CAR", desc: "Requalificação da Unidade de Beneficiamento de Frutas em Santa Irene", val: 1280000.00, status: "Concluído", area: "Desenvolvimento Rural e Feiras" },
            { muni: "Gongogi", organ: "EMBASA", desc: "Elaboração do Projeto Básico de Ampliação do SAA Gongogi", val: 0, status: "Em Aberto", area: "Saneamento, Drenagem e Água" }
        ];

        // GLOBAL APPLICATION STATE
        const AppState = {
            viewMode: 'executive', // 'executive' | 'analyst'
            datasetLabel: "Médio Rio de Contas (Dados Relatório Padrão)",
            rawRecords: [],
            normalizedRecords: [],
            filteredRecords: [],
            selectedCitiesForComparison: [],
            showGeneralExecutiveTable: true,
            qualityScore: 100,
            fieldStats: {},
            detectedDuplicates: [],
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

        const STATUS_OPTIONS = [
            'ATENDIDO',
            'EM_ABERTO',
            'EM_ESTUDO',
            'CONVENIO',
            'LICITACAO',
            'CANCELADO'
        ];

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
                    return 'bg-sky-100 text-sky-800';
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

        // CHART INSTANCES
        let chartExecMuni = null, chartExecArea = null, chartExecOrgan = null, chartExecStatus = null;

        function normalizeText(value, fallback = '') {
            if (value === null || value === undefined) return fallback;
            return String(value).trim();
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

        function formatMillions(val) {
            return `R$ ${(val / 1000000).toFixed(1)} Mi`;
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
            html(id, value) {
                const el = this.get(id);
                if (el) el.innerHTML = value;
                return el;
            },
            width(id, value) {
                const el = this.get(id);
                if (el) el.style.width = `${value}%`;
                return el;
            }
        };

        // INITIALIZATION
        function initApp() {
            initMobileMenu();
            bindFilterInputs();
            loadInitialDataset(DEFAULT_DATASET, "Médio Rio de Contas (Dados Relatório Padrão)");
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
                btnExec.className = "px-3 py-1.5 text-xs font-bold rounded-md bg-sky-600 text-white shadow transition";
                btnAnalyst.className = "px-3 py-1.5 text-xs font-bold rounded-md text-slate-400 hover:text-white transition";
            } else {
                execContainer.classList.add('hidden');
                analystContainer.classList.remove('hidden');
                btnExec.className = "px-3 py-1.5 text-xs font-bold rounded-md text-slate-400 hover:text-white transition";
                btnAnalyst.className = "px-3 py-1.5 text-xs font-bold rounded-md bg-sky-600 text-white shadow transition";
                renderAnalystModeViews();
            }
        }

        // CORE DATA PIPELINE: NORMALIZATION, VALIDATION, CLASSIFICATION
        function loadInitialDataset(rawList, label) {
            AppState.datasetLabel = label;
            AppState.rawRecords = rawList;
            
            // 1. Normalize Records preserving original values
            AppState.normalizedRecords = rawList.map((item, idx) => {
                const normMuni = normalizeText(item.muni || item.municipio || "Não Especificado");
                const normOrgan = normalizeText(item.organ || item.orgao || "Geral");
                const normDesc = normalizeText(item.desc || item.descricao || item.pleito || "Sem Descrição");
                const normVal = parseNumericValue(item.val ?? item.valor ?? item.valorTratado ?? 0);
                const normStatusRaw = normalizeText(item.status || item.situacao || "Em Aberto");
                const stdStatus = classifyStatus(normStatusRaw);
                const normArea = normalizeText(item.area || item.eixo || classifyAreaByText(normDesc));
                const priority = computePriority(normVal, stdStatus);

                return {
                    id: idx + 1,
                    original: { ...item },
                    muni: normMuni,
                    organ: normOrgan,
                    desc: normDesc,
                    val: normVal,
                    statusRaw: normStatusRaw,
                    statusStd: stdStatus,
                    area: normArea,
                    priority: priority
                };
            });

            // 2. Data Quality Audit
            auditDataQuality();

            // 3. Duplicate Detection
            detectDuplicates();

            // 4. Populate Filter Dropdowns
            populateFilterOptions();

            // 5. Apply Current Filters
            applyFilters();
        }

        // RULE-BASED CLASSIFICATION ENGINE
        function classifyStatus(rawStatus) {
            const s = normalizeText(rawStatus, 'EM_ABERTO').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            if (s.includes("conclu") || s.includes("atendid") || s.includes("entreg") || s.includes("finaliz")) return "ATENDIDO";
            if (s.includes("conven")) return "CONVENIO";
            if (s.includes("licit")) return "LICITACAO";
            if (s.includes("estud") || s.includes("anali")) return "EM_ESTUDO";
            if (s.includes("cancel")) return "CANCELADO";
            if (s.includes("aberto") || s.includes("pend")) return "EM_ABERTO";
            return "EM_ABERTO";
        }

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

            // Update Quality Score Badge in Header
            const scoreEl = ui.get('quality-score-badge');
            if (scoreEl) {
                scoreEl.innerHTML = `<span>${AppState.qualityScore}%</span><span class="text-[9px] uppercase font-normal">Score</span>`;
            }
            ui.text('dataset-name-label', `Base Ativa: ${AppState.datasetLabel}`);
            ui.text('dataset-stats-summary', `${total} registros analíticos • Quality Score: ${AppState.qualityScore}%`);
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
            document.getElementById('filter-municipality').addEventListener('change', (e) => { AppState.filters.municipality = e.target.value; applyFilters(); });
            document.getElementById('filter-organ').addEventListener('change', (e) => { AppState.filters.organ = e.target.value; applyFilters(); });
            document.getElementById('filter-status').addEventListener('change', (e) => { AppState.filters.status = e.target.value; applyFilters(); });
            document.getElementById('filter-area').addEventListener('change', (e) => { AppState.filters.area = e.target.value; applyFilters(); });
            document.getElementById('filter-search').addEventListener('input', (e) => { AppState.filters.search = e.target.value.toLowerCase().trim(); applyFilters(); });
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
                pill.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-100 text-sky-800 text-xs font-bold rounded-md border border-sky-200';
                pill.innerHTML = `${label} <button onclick="clearSingleFilter('${key}')" class="text-sky-600 hover:text-sky-900 font-bold">&times;</button>`;
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

            // Update KPIs
            ui.text('kpi-exec-total', totalPleitos);
            ui.text('kpi-exec-attended-count', totalAttendedCount);
            ui.text('kpi-exec-rate-badge', `${rate}%`);
            ui.width('kpi-exec-rate-bar', rate);
            ui.text('kpi-exec-val-attended', formatBRL(valAttended));
            ui.text('kpi-exec-ticket-avg', `Ticket Médio Atendido: ${formatBRL(avgTicket)}`);
            ui.text('kpi-exec-open-count', `${totalOpenCount} Pleitos`);
            ui.text('kpi-exec-val-open', formatBRL(valOpen));

            // Render Insights Narrative
            renderExecutiveInsights(totalPleitos, totalAttendedCount, rate, valAttended, valOpen);

            // Render Executive Charts
            renderExecutiveCharts(data);

            // Render Pareto Concentration Analysis
            renderParetoAnalysis(data, valAttended);

            // Render Top 15 Major Investments Table
            renderTopInvestmentsTable(data);

            // Render City Comparison Tool
            renderCityComparisonTool();

            // Render Open Demands Priority Grid
            renderPriorityOpenDemandsGrid(openList);

            // Render executive secretariat matrix
            renderExecutiveSecretariatMatrix();

            // Render full general table toggle section
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
                    <td class="p-3 font-black text-sky-700">${idx + 1}</td>
                    <td class="p-3 font-bold text-slate-800">${item.muni}</td>
                    <td class="p-3 font-semibold text-slate-600">${item.organ}</td>
                    <td class="p-3 text-slate-600">${item.area || 'Sem área'}</td>
                    <td class="p-3 text-slate-700">${item.desc}</td>
                    <td class="p-3 text-right font-extrabold text-slate-900">${formatBRL(item.val)}</td>
                    <td class="p-3 text-center">
                        <span class="px-2 py-0.5 text-[10px] font-bold rounded ${getStatusBadgeClasses(item.statusStd)}">
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
                div.className = 'bg-sky-950/40 p-3 rounded-lg border border-sky-800/40 text-slate-200';
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

        function renderExecutiveCharts(data) {
            // 1. Muni Chart
            const muniMap = {};
            data.forEach(r => {
                if (r.statusStd === 'ATENDIDO' || r.statusStd === 'CONVENIO') {
                    muniMap[r.muni] = (muniMap[r.muni] || 0) + r.val;
                }
            });
            const sortedMuni = Object.entries(muniMap).sort((a,b) => b[1] - a[1]);

            if (chartExecMuni) chartExecMuni.destroy();
            chartExecMuni = new Chart(document.getElementById('chartExecMuni').getContext('2d'), {
                type: 'bar',
                data: {
                    labels: sortedMuni.map(x => x[0]),
                    datasets: [{
                        label: 'Investimento Atendido (R$ Mi)',
                        data: sortedMuni.map(x => (x[1] / 1000000).toFixed(2)),
                        backgroundColor: '#0284c7',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { title: { display: true, text: 'R$ (Milhões)', font: { size: 10 } } } }
                }
            });

            // 2. Area Chart
            const areaMap = {};
            data.forEach(r => {
                if (r.statusStd === 'ATENDIDO' || r.statusStd === 'CONVENIO') {
                    areaMap[r.area] = (areaMap[r.area] || 0) + r.val;
                }
            });
            const sortedArea = Object.entries(areaMap).sort((a,b) => b[1] - a[1]);

            if (chartExecArea) chartExecArea.destroy();
            chartExecArea = new Chart(document.getElementById('chartExecArea').getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: sortedArea.map(x => x[0]),
                    datasets: [{
                        data: sortedArea.map(x => (x[1] / 1000000).toFixed(2)),
                        backgroundColor: ['#0284c7', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#64748b']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } }
                }
            });

            // 3. Organ Chart
            const organMap = {};
            data.forEach(r => {
                if (r.statusStd === 'ATENDIDO' || r.statusStd === 'CONVENIO') {
                    organMap[r.organ] = (organMap[r.organ] || 0) + r.val;
                }
            });
            const sortedOrgan = Object.entries(organMap).sort((a,b) => b[1] - a[1]);

            if (chartExecOrgan) chartExecOrgan.destroy();
            chartExecOrgan = new Chart(document.getElementById('chartExecOrgan').getContext('2d'), {
                type: 'bar',
                data: {
                    labels: sortedOrgan.map(x => x[0]),
                    datasets: [{
                        label: 'Investimento (R$ Mi)',
                        data: sortedOrgan.map(x => (x[1] / 1000000).toFixed(2)),
                        backgroundColor: '#10b981',
                        borderRadius: 4
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });

            // 4. Status Chart
            const statusCount = STATUS_OPTIONS.reduce((acc, status) => {
                acc[status] = 0;
                return acc;
            }, {});

            data.forEach(r => {
                const key = String(r.statusStd || '').toUpperCase();
                if (statusCount[key] !== undefined) {
                    statusCount[key] += 1;
                }
            });

            const statusChartLabels = STATUS_OPTIONS.map(status => getStatusLabel(status));
            const statusChartColors = ['#10b981', '#e11d48', '#f59e0b', '#0284c7', '#6366f1', '#94a3b8'];

            if (chartExecStatus) chartExecStatus.destroy();
            chartExecStatus = new Chart(document.getElementById('chartExecStatus').getContext('2d'), {
                type: 'pie',
                data: {
                    labels: statusChartLabels,
                    datasets: [{
                        data: STATUS_OPTIONS.map(status => statusCount[status] || 0),
                        backgroundColor: statusChartColors
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } }
                }
            });
        }

        function renderParetoAnalysis(data, totalAttendedVal) {
            const muniMap = {};
            data.forEach(r => {
                if (r.statusStd === 'ATENDIDO' || r.statusStd === 'CONVENIO') {
                    muniMap[r.muni] = (muniMap[r.muni] || 0) + r.val;
                }
            });
            const sortedMuni = Object.values(muniMap).sort((a,b) => b - a);
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
            const sortedOrgan = Object.values(organMap).sort((a,b) => b - a);
            const top3OrganVal = sortedOrgan.slice(0, 3).reduce((acc, v) => acc + v, 0);
            const top3OrganPct = totalAttendedVal > 0 ? ((top3OrganVal / totalAttendedVal) * 100).toFixed(1) : 0;

            ui.text('pareto-top3-organ-pct', `${top3OrganPct}%`);
            ui.width('pareto-top3-organ-bar', top3OrganPct);
            ui.text('pareto-top3-organ-desc', `Os 3 maiores órgãos gerenciam ${formatBRL(top3OrganVal)} dos investimentos territoriais.`);
        }

        function renderTopInvestmentsTable(data) {
            const tbody = document.getElementById('table-top-investments-body');
            tbody.innerHTML = '';
            const topList = [...data].sort((a,b) => b.val - a.val).slice(0, 15);

            topList.forEach((item, idx) => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-50 border-b border-slate-100';
                tr.innerHTML = `
                    <td class="p-3 font-black text-sky-700">${idx + 1}º</td>
                    <td class="p-3 font-bold text-slate-800">${item.muni}</td>
                    <td class="p-3 font-semibold text-slate-600">${item.organ}</td>
                    <td class="p-3 text-slate-700">${item.desc}</td>
                    <td class="p-3 text-right font-extrabold text-slate-900">${formatBRL(item.val)}</td>
                    <td class="p-3 text-center">
                        <span class="px-2 py-0.5 text-[10px] font-bold rounded ${getStatusBadgeClasses(item.statusStd)}">
                            ${getStatusLabel(item.statusStd)}
                        </span>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        function renderCityComparisonTool() {
            const munis = [...new Set(AppState.normalizedRecords.map(r => r.muni))].sort();
            const container = document.getElementById('muni-selector-chips');
            container.innerHTML = '';

            munis.forEach(m => {
                const isSelected = AppState.selectedCitiesForComparison.includes(m);
                const btn = document.createElement('button');
                btn.className = `px-2.5 py-1 text-xs font-bold rounded-lg border transition ${isSelected ? 'bg-sky-600 text-white border-sky-600 shadow' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-sky-400'}`;
                btn.innerText = m;
                btn.onclick = () => toggleCityComparison(m);
                container.appendChild(btn);
            });

            // Build Matrix Table
            const head = document.getElementById('muni-comp-head');
            const body = document.getElementById('muni-comp-body');
            head.innerHTML = '';
            body.innerHTML = '';

            const selected = AppState.selectedCitiesForComparison;

            if (selected.length === 0) {
                const trHead = document.createElement('tr');
                trHead.innerHTML = '<th class="p-3 text-slate-900">Métrica / Indicador</th>';
                head.appendChild(trHead);

                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = '<td class="p-5 text-center text-slate-500">Nenhum município selecionado. Clique nos chips acima para comparar até 5 municípios.</td>';
                body.appendChild(emptyRow);
                return;
            }

            const trHead = document.createElement('tr');
            trHead.innerHTML = `<th class="p-3 text-slate-900">Métrica / Indicador</th>` + selected.map(c => `<th class="p-3 text-center text-sky-800 font-extrabold">${c}</th>`).join('');
            head.appendChild(trHead);

            // Row 1: Total Pleitos
            const r1 = document.createElement('tr');
            r1.innerHTML = `<td class="p-3 font-bold text-slate-700">Total de Pleitos Cadastrados</td>` + selected.map(c => {
                const count = AppState.normalizedRecords.filter(r => r.muni === c).length;
                return `<td class="p-3 text-center font-bold">${count}</td>`;
            }).join('');
            body.appendChild(r1);

            // Row 2: Taxa de Atendimento
            const r2 = document.createElement('tr');
            r2.innerHTML = `<td class="p-3 font-bold text-slate-700">Taxa de Atendimento (%)</td>` + selected.map(c => {
                const all = AppState.normalizedRecords.filter(r => r.muni === c);
                const att = all.filter(r => r.statusStd === 'ATENDIDO' || r.statusStd === 'CONVENIO').length;
                const pct = all.length > 0 ? ((att / all.length) * 100).toFixed(1) : 0;
                return `<td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-xs font-bold ${pct >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${pct}%</span></td>`;
            }).join('');
            body.appendChild(r2);

            // Row 3: Valor Atendido
            const r3 = document.createElement('tr');
            r3.innerHTML = `<td class="p-3 font-bold text-slate-700">Valor Atendido (R$)</td>` + selected.map(c => {
                const val = AppState.normalizedRecords.filter(r => r.muni === c && (r.statusStd === 'ATENDIDO' || r.statusStd === 'CONVENIO')).reduce((acc, r) => acc + r.val, 0);
                return `<td class="p-3 text-center font-bold text-emerald-700">${formatBRL(val)}</td>`;
            }).join('');
            body.appendChild(r3);
        }

        function clearCityComparison() {
            AppState.selectedCitiesForComparison = [];
            renderCityComparisonTool();
        }

        function toggleCityComparison(muniName) {
            const idx = AppState.selectedCitiesForComparison.indexOf(muniName);
            if (idx >= 0) {
                AppState.selectedCitiesForComparison.splice(idx, 1);
            } else {
                if (AppState.selectedCitiesForComparison.length >= 5) {
                    alert("Você pode comparar no máximo 5 municípios simultaneamente.");
                    return;
                }
                AppState.selectedCitiesForComparison.push(muniName);
            }
            renderCityComparisonTool();
        }

        function renderPriorityOpenDemandsGrid(openList) {
            const grid = document.getElementById('open-demands-cards-grid');
            if (!grid) return;
            grid.innerHTML = '';

            if (openList.length === 0) {
                grid.innerHTML = '<div class="col-span-3 p-6 text-center text-slate-400 font-semibold bg-white rounded-xl border border-slate-200">Nenhum pleito em aberto foi identificado no recorte atual.</div>';
                return;
            }

            const sorted = [...openList].sort((a,b) => b.val - a.val).slice(0, 9);

            sorted.forEach(item => {
                const card = document.createElement('div');
                const pColor = item.priority === 'ALTA' ? 'bg-rose-100 text-rose-800 border-rose-300' : (item.priority === 'MÉDIA' || item.priority === 'MEDIA' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-700 border-slate-300');
                const areaText = item.area || 'Sem área definida';
                
                card.className = 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition';
                card.innerHTML = `
                    <div class="flex items-start justify-between gap-3">
                        <span class="text-xs font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">${item.muni}</span>
                        <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${pColor}">
                            ${getPriorityLabel(item.priority)}
                        </span>
                    </div>
                    <div class="space-y-2">
                        <p class="text-[10px] uppercase tracking-wide font-bold text-slate-500">Demanda prioritária</p>
                        <h5 class="text-xs font-bold text-slate-900 leading-snug">${item.desc}</h5>
                    </div>
                    <div class="text-sm font-extrabold text-amber-600">${formatBRL(item.val)}</div>
                    <div class="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                        <span>Órgão: <strong>${item.organ}</strong></span>
                        <span>${getStatusLabel(item.statusStd)}</span>
                    </div>
                    <div class="text-[11px] text-slate-500">
                        <span>Área: <strong>${areaText}</strong></span>
                    </div>
                `;
                grid.appendChild(card);
            });
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
                    <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeClasses(r.statusStd)}">${getStatusLabel(r.statusStd)}</span></td>
                    <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadgeClasses(r.priority)}">${getPriorityLabel(r.priority)}</span></td>
                    <td class="p-3 text-center"><button class="text-sky-600 hover:underline font-bold">Audit</button></td>
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

        // SHEETJS FILE PARSER & MAPPER MODAL
        document.getElementById('file-input').addEventListener('change', (e) => {
            if (e.target.files.length) handleSpreadsheetUpload(e.target.files[0]);
        });

        function handleSpreadsheetUpload(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

                    if (!json || json.length === 0) {
                        alert("A planilha enviada está vazia.");
                        return;
                    }

                    AppState.pendingUploadedJson = json;
                    autoDetectColumnsAndOpenMapper(json, file.name);
                } catch (err) {
                    console.error(err);
                    alert("Erro ao ler planilha Excel/CSV.");
                }
            };
            reader.readAsArrayBuffer(file);
        }

        function autoDetectColumnsAndOpenMapper(json, filename) {
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
                area: findBestMatch(['area', 'eixo', 'tematica'])
            };

            // Render Mapper Modal UI
            const container = document.getElementById('mapper-fields-list');
            container.innerHTML = '';

            const targetFields = [
                { key: 'muni', label: 'Município (Obrigatório)', req: true },
                { key: 'organ', label: 'Órgão / Secretaria', req: false },
                { key: 'desc', label: 'Descrição / Pleito (Obrigatório)', req: true },
                { key: 'val', label: 'Valor (R$)', req: false },
                { key: 'status', label: 'Situação / Status', req: false },
                { key: 'area', label: 'Área Temática', req: false }
            ];

            targetFields.forEach(f => {
                const div = document.createElement('div');
                div.className = 'flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg';
                
                let selectHtml = `<select id="map-select-${f.key}" class="bg-white border border-slate-300 rounded p-1 text-xs font-semibold focus:ring-2 focus:ring-sky-500">`;
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
                organ: getVal('organ'),
                desc: getVal('desc'),
                val: getVal('val'),
                status: getVal('status'),
                area: getVal('area')
            };

            if (!mappings.muni || !mappings.desc) {
                document.getElementById('mapper-warning-msg').innerText = "⚠ Selecione colunas válidas para Município e Descrição.";
                return;
            }

            const parsedList = AppState.pendingUploadedJson
                .map((row, index) => {
                    const rawMuni = normalizeText(row[mappings.muni], 'Não Especificado');
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

            closeMapperModal();
            loadInitialDataset(parsedList, "Planilha Personalizada do Usuário");
        }

        function closeMapperModal() {
            document.getElementById('column-mapper-modal').classList.add('hidden');
        }

        // MULTI-TAB EXCEL EXPORT (SHEETJS)
        function exportMultiTabExcel() {
            const wb = XLSX.utils.book_new();

            // Sheet 1: Base Tratada
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

            // Sheet 2: Resumo Executivo
            const summary = [
                { Indicador: "Total de Pleitos", Valor: AppState.filteredRecords.length },
                { Indicador: "Score de Qualidade", Valor: `${AppState.qualityScore}%` },
                { Indicador: "Investimento Atendido", Valor: AppState.filteredRecords.filter(r => r.statusStd==='ATENDIDO').reduce((a,b)=>a+b.val,0) },
                { Indicador: "Investimento em Aberto", Valor: AppState.filteredRecords.filter(r => r.statusStd==='EM_ABERTO').reduce((a,b)=>a+b.val,0) }
            ];
            const wsSummary = XLSX.utils.json_to_sheet(summary);
            XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo Executivo");

            XLSX.writeFile(wb, `relatorio_investimentos_tratado_${new Date().toISOString().slice(0,10)}.xlsx`);
        }
    