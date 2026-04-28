import { createRoot } from 'react-dom/client';
import { CardsEditor } from './editors/CardsEditor/CardsEditor';
import { createV4Host } from './host/v4-adapter';
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

window.__wonikipsEditor = {
  version: '0.4.0-safe-boot',
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
  // Confluence 환경 — 모든 페이지에서 V4 host 등록 시도.
  // setMacroJsOverride 자체는 매크로 브라우저 열려야 발동하니 일반 페이지엔 무해.
  // URL 패턴 매칭(editpage/resumedraft/createpage 등 다양)이 깨지기 쉬워 가드 제거.
  try {
    console.log('[WonikIPS Editor] Scheduling V4 host registration');
    const host = createV4Host({
      iconData: {},
      iconLoader: loadIconData,
    });
    host.registerCardsMacro();
  } catch (err) {
    console.error('[WonikIPS Editor] Failed to register V4 host:', err);
  }
}
