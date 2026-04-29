import { createRoot, type Root } from 'react-dom/client';
import { createElement, useState } from 'react';
import { PanelEditor } from '../editors/PanelEditor/PanelEditor';
import { javaMapToParams, paramsToJavaMap } from '../schema/panel-mapper';
import { PanelParamsSchema, type PanelParams } from '../schema/panel';
import type { IconMeta } from '../components';
import type { ConfluenceWindow, MacroBrowserMacro } from '../host/types';
import { registerMacro, getGlobalIconData } from '../host/macro-registry';
import dialogStyles from '../host/dialog.module.css';

const MACRO_NAME = 'aura-panel';
const DIALOG_ID = 'wonikips-panel-editor-overlay';

interface PanelDialogShellProps {
  initial: PanelParams;
  iconData: Record<string, IconMeta>;
  onInsert: (params: PanelParams) => void;
  onCancel: () => void;
}

function PanelDialogShell({
  initial,
  iconData,
  onInsert,
  onCancel,
}: PanelDialogShellProps) {
  const [params, setParams] = useState<PanelParams>(initial);
  return createElement(
    'div',
    { className: dialogStyles.dialog },
    createElement(
      'div',
      { className: dialogStyles.header },
      createElement('h2', { className: dialogStyles.title }, 'WonikIPS Panel'),
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
      createElement(PanelEditor, {
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

export function openPanelDialog(macro: MacroBrowserMacro): void {
  const cw = getConfluenceWindow();
  if (!cw) return;

  const iconData = getGlobalIconData();
  const overlay = ensureOverlay();
  overlay.className = dialogStyles.overlay ?? '';

  let initial: PanelParams;
  if (macro.params && Object.keys(macro.params).length > 0) {
    try {
      initial = javaMapToParams(macro.params);
    } catch (e) {
      console.warn(
        '[WonikIPS] failed to parse existing panel macro params; using defaults',
        e
      );
      initial = PanelParamsSchema.parse({});
    }
  } else {
    initial = PanelParamsSchema.parse({});
  }

  const root = createRoot(overlay);

  const handleInsert = (params: PanelParams): void => {
    const javaMap = paramsToJavaMap(params);
    destroyOverlay(root, overlay);
    // Panel.getBodyType() == RICH_TEXT — server's MacroResource.getMacroBody
    // throws NPE("Missing storage body") if the request omits body. Aura
    // main.js sends `bodyHtml: d`. Empty string is enough for a fresh
    // insert; users fill the body inline after the placeholder lands.
    cw.tinymce?.confluence?.macrobrowser?.macroBrowserComplete({
      name: MACRO_NAME,
      params: javaMap,
      bodyHtml: '',
    });
  };

  const handleCancel = (): void => {
    destroyOverlay(root, overlay);
  };

  root.render(
    createElement(PanelDialogShell, {
      initial,
      iconData,
      onInsert: handleInsert,
      onCancel: handleCancel,
    })
  );
}

registerMacro(MACRO_NAME, { opener: openPanelDialog });
