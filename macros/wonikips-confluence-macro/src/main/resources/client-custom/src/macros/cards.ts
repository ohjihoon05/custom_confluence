import { createRoot, type Root } from 'react-dom/client';
import { createElement, useState } from 'react';
import { CardsEditor } from '../editors/CardsEditor/CardsEditor';
import { javaMapToParams, paramsToJavaMap } from '../schema/cards-mapper';
import { CardsParamsSchema, type CardsParams } from '../schema/cards';
import type { IconMeta } from '../components';
import type { ConfluenceWindow, MacroBrowserMacro } from '../host/types';
import { registerMacro } from '../host/macro-registry';
import dialogStyles from '../host/dialog.module.css';

const MACRO_NAME = 'aura-cards';
const DIALOG_ID = 'wonikips-cards-editor-overlay';

let getIconData: () => Record<string, IconMeta> = () => ({});

export function setIconDataProvider(
  provider: () => Record<string, IconMeta>
): void {
  getIconData = provider;
}

interface CardsDialogShellProps {
  initial: CardsParams;
  iconData: Record<string, IconMeta>;
  onInsert: (params: CardsParams) => void;
  onCancel: () => void;
}

function CardsDialogShell({
  initial,
  iconData,
  onInsert,
  onCancel,
}: CardsDialogShellProps) {
  const [params, setParams] = useState<CardsParams>(initial);
  return createElement(
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
          onClick: onCancel,
          'aria-label': 'Close',
        },
        '×'
      )
    ),
    createElement(
      'div',
      { className: dialogStyles.body },
      createElement(CardsEditor, {
        value: params,
        onChange: setParams,
        iconData,
        hideFooter: true,
      })
    ),
    createElement(
      'div',
      { className: dialogStyles.footer },
      createElement(
        'button',
        { type: 'button', className: dialogStyles.btn, onClick: onCancel },
        '취소'
      ),
      createElement(
        'button',
        {
          type: 'button',
          className: `${dialogStyles.btn} ${dialogStyles.btnPrimary}`,
          onClick: () => onInsert(params),
        },
        '삽입'
      )
    )
  );
}

function getConfluenceWindow(): ConfluenceWindow | null {
  if (typeof window === 'undefined') return null;
  return window as unknown as ConfluenceWindow;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

export function openCardsDialog(macro: MacroBrowserMacro): void {
  const cw = getConfluenceWindow();
  if (!cw) return;

  const iconData = getIconData();
  const overlay = ensureOverlay();
  overlay.className = dialogStyles.overlay ?? '';

  let initial: CardsParams;
  if (macro.params && Object.keys(macro.params).length > 0) {
    try {
      initial = javaMapToParams(macro.params);
    } catch (e) {
      console.warn(
        '[WonikIPS] failed to parse existing macro params; using defaults',
        e
      );
      initial = CardsParamsSchema.parse({});
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

  const handleInsert = (params: CardsParams): void => {
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
    createElement(CardsDialogShell, {
      initial,
      iconData,
      onInsert: handleInsert,
      onCancel: handleCancel,
    })
  );
}

registerMacro(MACRO_NAME, { opener: openCardsDialog });
