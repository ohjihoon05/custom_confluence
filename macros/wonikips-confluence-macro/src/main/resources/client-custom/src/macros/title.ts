import { createRoot, type Root } from 'react-dom/client';
import { createElement, useState } from 'react';
import { TitleEditor } from '../editors/TitleEditor/TitleEditor';
import { javaMapToParams, paramsToJavaMap } from '../schema/title-mapper';
import { TitleParamsSchema, type TitleParams } from '../schema/title';
import type { ConfluenceWindow, MacroBrowserMacro } from '../host/types';
import { registerMacro } from '../host/macro-registry';
import dialogStyles from '../host/dialog.module.css';

const MACRO_NAME = 'aura-pretty-title';
const DIALOG_ID = 'wonikips-title-editor-overlay';

interface TitleDialogShellProps {
  initial: TitleParams;
  onInsert: (params: TitleParams) => void;
  onCancel: () => void;
}

function TitleDialogShell({ initial, onInsert, onCancel }: TitleDialogShellProps) {
  const [params, setParams] = useState<TitleParams>(initial);
  return createElement(
    'div',
    { className: dialogStyles.dialog },
    createElement(
      'div',
      { className: dialogStyles.header },
      createElement('h2', { className: dialogStyles.title }, 'WonikIPS Title'),
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
      createElement(TitleEditor, {
        value: params,
        onChange: setParams,
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

export function openTitleDialog(macro: MacroBrowserMacro): void {
  const cw = getConfluenceWindow();
  if (!cw) return;

  const overlay = ensureOverlay();
  overlay.className = dialogStyles.overlay ?? '';

  let initial: TitleParams;
  if (macro.params && Object.keys(macro.params).length > 0) {
    try {
      initial = javaMapToParams(macro.params);
    } catch (e) {
      console.warn(
        '[WonikIPS] failed to parse existing title macro params; using defaults',
        e
      );
      initial = TitleParamsSchema.parse({});
    }
  } else {
    initial = TitleParamsSchema.parse({});
  }

  const root = createRoot(overlay);

  const handleInsert = (params: TitleParams): void => {
    const javaMap = paramsToJavaMap(params);
    // PrettyTitle은 PLAIN_TEXT body. 텍스트는 escape하고 줄바꿈은 Java가 <br />로 변환.
    const bodyHtml = escapeHtml(params.text);
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
    createElement(TitleDialogShell, {
      initial,
      onInsert: handleInsert,
      onCancel: handleCancel,
    })
  );
}

registerMacro(MACRO_NAME, { opener: openTitleDialog });
