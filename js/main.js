'use strict';

function initLeavesArchive(containerElement, store) {
    if (!containerElement) {
        console.error('initLeavesArchive: containerElement è obbligatorio');
        return;
    }

    // Crea il DOM dal template literal (come in BuyInCloud)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = store.template.trim();
    const rootElement = tempDiv.firstElementChild;

    // Inserisce il root nel container
    containerElement.appendChild(rootElement);

    store.setState('root', rootElement);
}
