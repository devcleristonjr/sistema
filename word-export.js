/* ============================================================
   RELATÓRIO WORD — Dashboard de Inteligência
   Usa o template: TIMBRADO_JERO_template.docx
   ============================================================ */

(function () {
    "use strict";

    const TEMPLATE_URL = new URL(
        "TIMBRADO_JERO_template.docx",
        document.baseURI
    ).href;

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if ([...document.scripts].some(s => s.src.includes(src))) {
                resolve();
                return;
            }
            const script = document.createElement("script");
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error("Não foi possível carregar " + src));
            document.head.appendChild(script);
        });
    }

    async function ensureLibraries() {
        if (!window.docxtemplater) {
            await loadScript("https://unpkg.com/docxtemplater@3.69.3/build/docxtemplater.js");
        }
        if (!window.PizZip) {
            await loadScript("https://unpkg.com/pizzip@3.2.0/dist/pizzip.js");
        }
        if (!window.PizZipUtils) {
            await loadScript("https://unpkg.com/pizzip@3.2.0/dist/pizzip-utils.js");
        }
        if (!window.saveAs) {
            await loadScript("https://unpkg.com/file-saver@1.3.8/FileSaver.js");
        }
    }

    function getRecords() {
        const state = AppState;
        if (!state) return [];

        // O relatório usa exatamente o resultado atual dos filtros do dashboard.
        const source = Array.isArray(state.filteredRecords)
            ? state.filteredRecords
            : [];

        return source.map(r => ({
            municipio: String(r.muni || r.municipio || "Não Especificado").trim(),
            territorio: String(r.territorio || "não consta").trim(),
            organ: String(r.organ || r.orgao || "Geral").trim(),
            desc: String(r.desc || r.descricao || r.pleito || "Sem Descrição").trim(),
            val: Number(r.val || r.valor || 0) || 0,
            status: String(r.statusStd || r.status || "").toUpperCase(),
            area: String(r.area || "Infraestrutura e Geral").trim()
        }));
    }

    function brl(value) {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(Number(value) || 0);
    }

    function millions(value) {
        return `R$ ${((Number(value) || 0) / 1000000).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} milhões`;
    }

    function filename(value) {
        return String(value || "municipio")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .toLowerCase();
    }

    function getMunicipio(records) {
        const selected = AppState?.filters?.municipality;

        if (selected && selected !== "ALL") {
            return selected;
        }

        const municipalities = [...new Set(records.map(r => r.municipio).filter(Boolean))];

        if (municipalities.length === 1) return municipalities[0];

        throw new Error(
            "Selecione um município no filtro antes de gerar o relatório Word."
        );
    }

    function buildData(records) {
        const attended = records.filter(r =>
            r.status === "ATENDIDO" || r.status === "CONVENIO"
        );

        const open = records.filter(r =>
            ["EM_ABERTO", "EM_ESTUDO", "LICITACAO"].includes(r.status)
        );

        const attendedInvestment = attended.reduce((sum, r) => sum + r.val, 0);

        // Maiores investimentos: somente os atendidos/publicados.
        const highlights = [...attended]
            .sort((a, b) => b.val - a.val)
            .slice(0, 5)
            .map(r => ({
                area: r.area,
                organ: r.organ,
                valor: brl(r.val),
                desc: r.desc
            }));

        // Pleitos em aberto agrupados por órgão.
        const groups = new Map();

        for (const r of open) {
            if (!groups.has(r.organ)) groups.set(r.organ, []);
            groups.get(r.organ).push({
                descricao: r.desc
            });
        }

        const abertos = [...groups.entries()]
            .sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))
            .map(([orgao, itens]) => ({
                orgao,
                itens
            }));

        return {
            municipio: getMunicipio(records),
            totalPleitos: String(records.length),
            atendidos: String(attended.length),
            emAberto: String(open.length),
            investimentoMi: millions(attendedInvestment),
            investimentoTotal: brl(attendedInvestment),
            destaques: highlights,
            abertos
        };
    }

    async function loadTemplate() {
        console.log("[WORD] Procurando template em:", TEMPLATE_URL);

        const response = await fetch(TEMPLATE_URL, {
            cache: "no-store"
        });

        console.log("[WORD] Status do template:", response.status);

        if (!response.ok) {
            throw new Error(
                `Template não encontrado. HTTP ${response.status} — ${TEMPLATE_URL}`
            );
        }

        const buffer = await response.arrayBuffer();

        if (!buffer.byteLength) {
            throw new Error("O template foi encontrado, mas está vazio.");
        }

        console.log(
            "[WORD] Template carregado:",
            buffer.byteLength,
            "bytes"
        );

        return buffer;
    }

    async function generateWordReport() {
        const records = getRecords();

        if (!records.length) {
            alert("Não há dados filtrados para gerar o relatório.");
            return;
        }

        const button = document.getElementById("btn-word-report");
        const originalText = button?.innerHTML;

        try {
            if (button) {
                button.disabled = true;
                button.innerHTML = "⏳ Gerando Word...";
            }

            await ensureLibraries();

            const content = await loadTemplate();
            const zip = new PizZip(content);

            const doc = new window.docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true
            });

            doc.render(buildData(records));

            const data = doc.getZip().generate({
                type: "blob",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            });
            const municipio = buildData(records).municipio;

            saveAs(
                data,
                `relatorio-investimentos-${filename(municipio)}.docx`
            );
        } catch (error) {
            console.error("=================================");
            console.error("[WORD] ERRO AO GERAR RELATÓRIO");

            // Novo código para detalhar os erros do template
            if (error.properties && error.properties.errors instanceof Array) {
                console.error("Encontrados", error.properties.errors.length, "erros no template Word:");

                error.properties.errors.forEach(function (err, index) {
                    console.error(`Erro ${index + 1}:`, err.message);
                    if (err.properties && err.properties.explanation) {
                        console.error("  Motivo:", err.properties.explanation);
                    }
                });

                alert("O arquivo de template do Word possui erros nas tags (veja o Console F12 para detalhes).");
            } else {
                console.error(error);
                alert("Erro ao gerar o relatório Word:\n\n" + (error?.message || error));
            }
            console.error("=================================");
        } finally {
            if (button) {
                button.disabled = false;
                button.innerHTML = originalText || "📝 Relatório Word";
            }
        }
    }

    function injectButton() {
        if (document.getElementById("btn-word-report")) return;

        const excelButton = document.querySelector(
            'button[onclick="exportMultiTabExcel()"]'
        );

        if (!excelButton?.parentElement) return;

        const button = document.createElement("button");
        button.id = "btn-word-report";
        button.type = "button";
        button.className =
            "bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow transition flex items-center gap-1.5 no-print";
        button.title = "Gerar relatório Word com o modelo timbrado";
        button.innerHTML = "📝 Relatório Word";
        button.addEventListener("click", generateWordReport);

        excelButton.parentElement.insertBefore(
            button,
            excelButton.nextSibling
        );
    }

    window.generateWordReport = generateWordReport;

    function boot() {
        injectButton();

        // O app pode montar os botões depois do carregamento inicial.
        setTimeout(injectButton, 500);
        setTimeout(injectButton, 1500);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
