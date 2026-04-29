import { createRoot, type Root } from 'react-dom/client';
import { createElement, useState } from 'react';
import { ButtonEditor } from '../editors/ButtonEditor/ButtonEditor';
import { javaMapToParams, paramsToJavaMap } from '../schema/button-mapper';
import { ButtonParamsSchema, type ButtonParams } from '../schema/button';
import type { IconMeta } from '../components';
import type { ConfluenceWindow, MacroBrowserMacro } from '../host/types';
import { registerMacro } from '../host/macro-registry';
import dialogStyles from '../host/dialog.module.css';

const MACRO_NAME = 'aura-button';
const DIALOG_ID = 'wonikips-button-editor-overlay';

let getIconData: () => Record<string, IconMeta> = () => ({});

export function setIconDataProvider(
  provider: () => Record<string, IconMeta>
): void {
  getIconData = provider;
}

interface ButtonDialogShellProps {
  initial: ButtonParams;
  iconData: Record<string, IconMeta>;
  onInsert: (params: ButtonParams) => void;
  onCancel: () => void;
}

function ButtonDialogShell({
  initial,
  iconData,
  onInsert,
  onCancel,
}: ButtonDialogShellProps) {
  const [params, setParams] = useState<ButtonParams>(initial);
  return createElement(
    'div',
    { className: dialogStyles.dialog },
    createElement(
      'div',
      { className: dialogStyles.header },
      createElement('h2', { className: dialogStyles.title }, 'WonikIPS Button'),
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
      createElement(ButtonEditor, {
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

export function openButtonDialog(macro: MacroBrowserMacro): void {
  const cw = getConfluenceWindow();
  if (!cw) return;

  const iconData = getIconData();
  const overlay = ensureOverlay();
  overlay.className = dialogStyles.overlay ?? '';

  let initial: ButtonParams;
  if (macro.params && Object.keys(macro.params).length > 0) {
    try {
      initial = javaMapToParams(macro.params);
    } catch (e) {
      console.warn(
        '[WonikIPS] failed to parse existing button macro params; using defaults',
        e
      );
      initial = ButtonParamsSchema.parse({});
    }
  } else {
    initial = ButtonParamsSchema.parse({});
  }

  const root = createRoot(overlay);

  const handleInsert = (params: ButtonParams): void => {
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
    createElement(ButtonDialogShell, {
      initial,
      iconData,
      onInsert: handleInsert,
      onCancel: handleCancel,
    })
  );
}

registerMacro(MACRO_NAME, { opener: openButtonDialog });
