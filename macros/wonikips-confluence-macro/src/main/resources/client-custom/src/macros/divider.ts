import { createRoot, type Root } from 'react-dom/client';
import { createElement, useState } from 'react';
import { DividerEditor } from '../editors/DividerEditor/DividerEditor';
import { javaMapToParams, paramsToJavaMap } from '../schema/divider-mapper';
import { DividerParamsSchema, type DividerParams } from '../schema/divider';
import type { IconMeta } from '../components';
import type { ConfluenceWindow, MacroBrowserMacro } from '../host/types';
import { registerMacro, getGlobalIconData } from '../host/macro-registry';
import dialogStyles from '../host/dialog.module.css';

const MACRO_NAME = 'aura-divider';
const DIALOG_ID = 'wonikips-divider-editor-overlay';

interface DividerDialogShellProps {
  initial: DividerParams;
  iconData: Record<string, IconMeta>;
  onInsert: (params: DividerParams) => void;
  onCancel: () => void;
}

function DividerDialogShell({
  initial,
  iconData,
  onInsert,
  onCancel,
}: DividerDialogShellProps) {
  const [params, setParams] = useState<DividerParams>(initial);
  return createElement(
    'div',
    { className: dialogStyles.dialog },
    createElement(
      'div',
      { className: dialogStyles.header },
      createElement('h2', { className: dialogStyles.title }, 'WonikIPS Divider'),
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
      createElement(DividerEditor, {
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

export function openDividerDialog(macro: MacroBrowserMacro): void {
  const cw = getConfluenceWindow();
  if (!cw) return;

  const iconData = getGlobalIconData();
  const overlay = ensureOverlay();
  overlay.className = dialogStyles.overlay ?? '';

  let initial: DividerParams;
  if (macro.params && Object.keys(macro.params).length > 0) {
    try {
      initial = javaMapToParams(macro.params);
    } catch (e) {
      console.warn(
        '[WonikIPS] failed to parse existing divider macro params; using defaults',
        e
      );
      initial = DividerParamsSchema.parse({});
    }
  } else {
    initial = DividerParamsSchema.parse({});
  }

  const root = createRoot(overlay);

  const handleInsert = (params: DividerParams): void => {
    const javaMap = paramsToJavaMap(params);
    destroyOverlay(root, overlay);
    cw.tinymce?.confluence?.macrobrowser?.macroBrowserComplete({
      name: MACRO_NAME,
      params: javaMap,
    });
  };

  const handleCancel = (): void => {
    destroyOverlay(root, overlay);
  };

  root.render(
    createElement(DividerDialogShell, {
      initial,
      iconData,
      onInsert: handleInsert,
      onCancel: handleCancel,
    })
  );
}

registerMacro(MACRO_NAME, { opener: openDividerDialog });
