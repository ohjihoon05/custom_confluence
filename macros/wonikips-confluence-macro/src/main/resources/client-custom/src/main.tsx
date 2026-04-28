export {};

declare global {
  interface Window {
    __wonikipsEditor?: { version: string; loadedAt: number };
  }
}

console.log('[WonikIPS Editor] bundle loaded');

window.__wonikipsEditor = {
  version: '0.1.0-poc',
  loadedAt: Date.now(),
};

console.log('[WonikIPS Editor] Hello WonikIPS', window.__wonikipsEditor);
