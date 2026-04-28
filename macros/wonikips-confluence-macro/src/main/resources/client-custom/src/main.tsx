import { createRoot } from 'react-dom/client';
import { CardsEditor } from './editors/CardsEditor/CardsEditor';

declare global {
  interface Window {
    __wonikipsEditor?: {
      version: string;
      loadedAt: number;
      mountCardsEditor?: (
        container: HTMLElement,
        options: { initial?: unknown; onSave?: (params: unknown) => void; onCancel?: () => void }
      ) => void;
    };
  }
}

console.log('[WonikIPS Editor] bundle loaded');

window.__wonikipsEditor = {
  version: '0.2.0-cards-editor',
  loadedAt: Date.now(),
  mountCardsEditor: (container, options) => {
    const root = createRoot(container);
    root.render(
      <CardsEditor
        initial={(options.initial as Parameters<typeof CardsEditor>[0]['initial']) ?? undefined}
        onSave={(params) => options.onSave?.(params)}
        onCancel={() => options.onCancel?.()}
      />
    );
  },
};

console.log('[WonikIPS Editor] Hello WonikIPS', window.__wonikipsEditor);

const isDemoMode =
  typeof document !== 'undefined' &&
  document.getElementById('wonikips-editor-demo-root');

if (isDemoMode) {
  const root = createRoot(isDemoMode);
  root.render(
    <CardsEditor
      onSave={(params) => {
        console.log('Demo save:', params);
        alert('Demo save — see console for params');
      }}
      onCancel={() => console.log('Demo cancel')}
    />
  );
  console.log('[WonikIPS Editor] Demo mode mounted on #wonikips-editor-demo-root');
}
