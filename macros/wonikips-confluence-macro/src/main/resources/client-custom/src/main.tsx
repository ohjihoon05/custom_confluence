import { createRoot } from 'react-dom/client';
import { CardsEditor } from './editors/CardsEditor/CardsEditor';
import { createV4Host } from './host/v4-adapter';
import { setGlobalIconDataProvider } from './host/macro-registry';
import './macros'; // eager self-register all macros into registry
import type { IconMeta } from './components';

declare global {
  interface Window {
    __wonikipsEditor?: {
      version: string;
      loadedAt: number;
      mountCardsEditor?: (
        container: HTMLElement,
        options: {
          initial?: unknown;
          iconData?: Record<string, IconMeta>;
          onSave?: (params: unknown) => void;
          onCancel?: () => void;
        }
      ) => void;
    };
  }
}

console.log('[WonikIPS Editor] bundle loaded');

let iconDataCache: Record<string, IconMeta> = {};
setGlobalIconDataProvider(() => iconDataCache);

window.__wonikipsEditor = {
  version: '0.5.0-registry',
  loadedAt: Date.now(),
  mountCardsEditor: (container, options) => {
    const root = createRoot(container);
    root.render(
      <CardsEditor
        initial={(options.initial as Parameters<typeof CardsEditor>[0]['initial']) ?? undefined}
        iconData={options.iconData ?? {}}
        onSave={(params) => options.onSave?.(params)}
        onCancel={() => options.onCancel?.()}
      />
    );
  },
};

console.log('[WonikIPS Editor] Hello WonikIPS', {
  version: window.__wonikipsEditor.version,
});

async function loadIconData(): Promise<Record<string, IconMeta>> {
  if (import.meta.env.DEV) {
    const mod = await import('../../templates/icondata.json');
    return mod.default as Record<string, IconMeta>;
  }
  const url = '/download/resources/com.uiux.confluence-macro/templates/icondata.json';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load icondata: ${res.status}`);
  return (await res.json()) as Record<string, IconMeta>;
}

const demoRoot =
  typeof document !== 'undefined'
    ? document.getElementById('wonikips-editor-demo-root')
    : null;

if (demoRoot) {
  loadIconData()
    .then((iconData) => {
      iconDataCache = iconData;
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
    })
    .catch((err) => {
      console.error('[WonikIPS Editor] Demo iconData load failed:', err);
    });
} else {
  // Confluence 환경. setMacroJsOverride 자체는 매크로 브라우저 열려야 발동.
  try {
    console.log('[WonikIPS Editor] Scheduling V4 host registration');
    const host = createV4Host();
    host.registerMacros();

    // iconData 비동기 로드 → cache 채우기 (Cards opener가 호출 시점에 provider로 조회)
    loadIconData()
      .then((data) => {
        iconDataCache = data;
        console.log('[WonikIPS Editor] iconData loaded', Object.keys(data).length);
      })
      .catch((err) => {
        console.error('[WonikIPS Editor] iconData load failed:', err);
      });
  } catch (err) {
    console.error('[WonikIPS Editor] Failed to register V4 host:', err);
  }
}
