import { createRoot, type Root } from 'react-dom/client';
import { CardsEditor } from '../editors/CardsEditor/CardsEditor';
import { javaMapToParams, paramsToJavaMap } from '../schema/cards-mapper';
import { CardsParamsSchema, type CardsParams } from '../schema/cards';
import type { IconMeta } from '../components';
import type { ConfluenceWindow, MacroBrowserMacro, MacroEditorHost } from './types';
import dialogStyles from './dialog.module.css';
import { createElement, Fragment } from 'react';

const MACRO_NAME = 'aura-cards';
const DIALOG_ID = 'wonikips-cards-editor-overlay';

interface V4AdapterOptions {
  iconData: Record<string, IconMeta>;
  iconLoader?: () => Promise<Record<string, IconMeta>>;
}

function getConfluenceWindow(): ConfluenceWindow | null {
  if (typeof window === 'undefined') return null;
  return window as unknown as ConfluenceWindow;
}

function buildBodyHtml(params: CardsParams): string {
  const cards = params.cards
    .map(
      (c) =>
        `<div class="aura-card-preview"><h5>${escapeHtml(c.title)}</h5><p>${escapeHtml(c.body)}</p></div>`
    )
    .join('');
  return `<div class="wonikips-cards-placeholder" data-columns="${params.columns}">${cards || '<em>No cards</em>'}</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ensureOverlay(): HTMLDivElement {
  let overlay = document.getElementById(DIALOG_ID) as HTMLDivElement | null;
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = DIALOG_ID;
    document.body.appendChild(overlay);
  }
  return overlay;
}

function destroyOverlay(root: Root | null, overlay: HTMLElement): void {
  try {
    root?.unmount();
  } catch {
    // ignore
  }
  if (overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
}

function openCardsDialog(
  macro: MacroBrowserMacro,
  iconData: Record<string, IconMeta>
): void {
  const cw = getConfluenceWindow();
  if (!cw) return;

  const overlay = ensureOverlay();
  overlay.className = dialogStyles.overlay ?? '';

  let initial: Partial<CardsParams> | undefined;
  if (macro.params && Object.keys(macro.params).length > 0) {
    try {
      initial = javaMapToParams(macro.params);
    } catch (e) {
      console.warn('[WonikIPS] failed to parse existing macro params; using defaults', e);
      initial = undefined;
    }
  } else {
    initial = CardsParamsSchema.parse({
      cards: [
        {
          title: 'WonikIPS Card',
          body: 'Replace this text with your own content',
          icon: 'faPaperPlane',
        },
      ],
    });
  }

  const root = createRoot(overlay);

  const handleSave = (params: CardsParams): void => {
    const javaMap = paramsToJavaMap(params);
    const bodyHtml = buildBodyHtml(params);
    destroyOverlay(root, overlay);
    cw.tinymce?.confluence?.macrobrowser?.macroBrowserComplete({
      name: MACRO_NAME,
      params: javaMap,
      bodyHtml,
    });
  };

  const handleCancel = (): void => {
    destroyOverlay(root, overlay);
  };

  root.render(
    createElement(
      Fragment,
      null,
      createElement(
        'div',
        { className: dialogStyles.dialog },
        createElement(
          'div',
          { className: dialogStyles.header },
          createElement('h2', { className: dialogStyles.title }, 'WonikIPS Cards'),
          createElement(
            'button',
            {
              type: 'button',
              className: dialogStyles.closeBtn,
              onClick: handleCancel,
              'aria-label': 'Close',
            },
            '×'
          )
        ),
        createElement(
          'div',
          { className: dialogStyles.body },
          createElement(CardsEditor, {
            initial,
            iconData,
            onSave: handleSave,
            onCancel: handleCancel,
          })
        )
      )
    )
  );
}

let registered = false;

function tryRegister(getIcons: () => Record<string, IconMeta>): boolean {
  const cw = getConfluenceWindow();
  if (!cw?.AJS?.MacroBrowser?.setMacroJsOverride) return false;
  cw.AJS.MacroBrowser.setMacroJsOverride(MACRO_NAME, {
    opener: (macro) => openCardsDialog(macro, getIcons()),
  });
  registered = true;
  console.log('[WonikIPS Editor] Registered V4 override for', MACRO_NAME);
  return true;
}

export function createV4Host({
  iconData,
  iconLoader,
}: V4AdapterOptions): MacroEditorHost {
  let cachedIcons = iconData;
  let loadingPromise: Promise<Record<string, IconMeta>> | null = null;

  const getIcons = (): Record<string, IconMeta> => {
    if (Object.keys(cachedIcons).length > 0) return cachedIcons;
    if (iconLoader && !loadingPromise) {
      loadingPromise = iconLoader()
        .then((data) => {
          cachedIcons = data;
          console.log('[WonikIPS Editor] iconData loaded', Object.keys(data).length);
          return data;
        })
        .catch((err) => {
          console.error('[WonikIPS Editor] iconData load failed:', err);
          return {};
        });
    }
    return cachedIcons;
  };

  return {
    registerCardsMacro: (): void => {
      if (registered) return;
      const cw = getConfluenceWindow();
      if (!cw) return;

      if (iconLoader && Object.keys(cachedIcons).length === 0) {
        getIcons();
      }

      if (tryRegister(getIcons)) return;

      const onReady = (): void => {
        if (!registered) tryRegister(getIcons);
      };

      try {
        cw.AJS?.bind?.('init.rte', onReady);
        cw.AJS?.bind?.('page-edit-loaded', onReady);
        cw.AJS?.toInit?.(onReady);
      } catch (err) {
        console.warn('[WonikIPS Editor] AJS bind failed:', err);
      }

      let attempts = 0;
      const interval = window.setInterval(() => {
        attempts += 1;
        if (registered || attempts > 20) {
          window.clearInterval(interval);
          if (!registered && attempts > 20) {
            console.warn(
              '[WonikIPS Editor] Failed to register V4 override after 20 attempts'
            );
          }
          return;
        }
        tryRegister(getIcons);
      }, 500);
    },
  };
}
