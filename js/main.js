export function initLeavesArchive(containerElement, store) {
    if (!containerElement) {
        console.error('initLeavesArchive: containerElement è obbligatorio');
        return;
    }

    // Cerca l'elemento root esistente nel container
    const rootElement = containerElement.querySelector('#leaves-archive-root');

    if (!rootElement) {
        console.error('initLeavesArchive: elemento #leaves-archive-root non trovato nel container');
        return;
    }

    store.setState('root', rootElement);
}
