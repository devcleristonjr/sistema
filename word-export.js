(function () {
    'use strict';

    function injectButton() {
        if (document.getElementById('btn-word-report')) return;

        const excelButton = document.getElementById('btn-export-excel-desktop');

        if (!excelButton?.parentElement) return;

        const button = document.createElement('button');
        button.id = 'btn-word-report';
        button.type = 'button';
        button.className = 'bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow transition flex items-center gap-1.5 no-print';
        button.title = 'Gerar relatório Word com o modelo timbrado';
        button.innerHTML = '📝 Relatório Word';
        button.addEventListener('click', () => window.generateWordReport?.());

        excelButton.parentElement.insertBefore(button, excelButton.nextSibling);
    }

    function boot() {
        injectButton();
        setTimeout(injectButton, 500);
        setTimeout(injectButton, 1500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();