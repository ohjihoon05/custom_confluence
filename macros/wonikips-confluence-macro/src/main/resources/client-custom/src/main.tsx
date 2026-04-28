import { createRoot } from 'react-dom/client';
import { CardsEditor } from './editors/CardsEditor/CardsEditor';
import { createV4Host } from './host/v4-adapter';
import iconDataRaw from '../../templates/icondata.json';
import type { IconMeta } from './components';

const iconData = iconDataRaw as Record<string, IconMeta>;

declare global {
  interface Window {
    __wonikipsEditor?: {
      version: string;
      loadedAt: number;
      iconCount: number;
      mountCardsEditor?: (
        container: HTMLElement,
        options: { initial?: unknown; onSave?: (params: unknown) => void; onCancel?: () => void }
      ) => void;
    };
  }
}

console.log('[WonikIPS Editor] bundle loaded');

window.__wonikipsEditor = {
  version: '0.3.0-v4-host',
  loadedAt: Date.now(),
  iconCount: Object.keys(iconData).length,
  mountCardsEditor: (container, options) => {
    const root = createRoot(container);
    root.render(
      <CardsEditor
        initial={(options.initial as Parameters<typeof CardsEditor>[0]['initial']) ?? undefined}
        iconData={iconData}
        onSave={(params) => options.onSave?.(params)}
        onCancel={() => options.onCancel?.()}
      />
    );
  },
};

console.log('[WonikIPS Editor] Hello WonikIPS', window.__wonikipsEditor);

const demoRoot =
  typeof document !== 'undefined'
    ? document.getElementById('wonikips-editor-demo-root')
    : null;

if (demoRoot) {
  const root = createRoot(demoRoot);
  root.render(
    <CardsEditor
      iconData={iconData}
      onSave={(params) => {
        console.log('Demo save:', params);
        alert('Demo save — see console for params');
      }}
      onCancel={() => console.log('Demo cancel')}
    />
  );
  console.log('[WonikIPS Editor] Demo mode mounted', {
    iconCount: Object.keys(iconData).length,
  });
} else {
  // Confluence 환경에서 V4 매크로 브라우저 통합 자동 등록
  const host = createV4Host({ iconData });
  host.registerCardsMacro();
}
