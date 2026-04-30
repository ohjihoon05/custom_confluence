import { createRoot, type Root } from 'react-dom/client';
import { createElement, useState } from 'react';
import { BackgroundImageEditor } from '../editors/BackgroundImageEditor/BackgroundImageEditor';
import {
  javaMapToParams,
  paramsToJavaMap,
} from '../schema/background-image-mapper';
import {
  BackgroundImageParamsSchema,
  type BackgroundImageParams,
} from '../schema/background-image';
import type { ConfluenceWindow, MacroBrowserMacro } from '../host/types';
import { registerMacro } from '../host/macro-registry';
import dialogStyles from '../host/dialog.module.css';

const MACRO_NAME = 'aura-background-image';
const DIALOG_ID = 'wonikips-background-image-editor-overlay';

interface DialogShellProps {
  initial: BackgroundImageParams;
  onInsert: (params: BackgroundImageParams) => void;
  onCancel: () => void;
}

function BackgroundImageDialogShell({
  initial,
  onInsert,
  onCancel,
}: DialogShellProps) {
  const [params, setParams] = useState<BackgroundImageParams>(initial);
  return createElement(
    'div',
    { className: dialogStyles.dialog },
    createElement(
      'div',
      { className: dialogStyles.header },
      createElement(
        'h2',
        { className: dialogStyles.title },
        'WonikIPS Background Content'
      ),
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
      createElement(BackgroundImageEditor, {
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

export function openBackgroundImageDialog(macro: MacroBrowserMacro): void {
  const cw = getConfluenceWindow();
  if (!cw) return;

  const overlay = ensureOverlay();
  overlay.className = dialogStyles.overlay ?? '';

  let initial: BackgroundImageParams;
  if (macro.params && Object.keys(macro.params).length > 0) {
    try {
      initial = javaMapToParams(macro.params);
    } catch (e) {
      console.warn(
        '[WonikIPS] failed to parse existing background-image macro params; using defaults',
        e
      );
      initial = BackgroundImageParamsSchema.parse({});
    }
  } else {
    initial = BackgroundImageParamsSchema.parse({});
  }

  const root = createRoot(overlay);

  const handleInsert = (params: BackgroundImageParams): void => {
    const javaMap = paramsToJavaMap(params);
    destroyOverlay(root, overlay);
    // BackgroundImage.getBodyType() == RICH_TEXT — Panel과 동일하게
    // bodyHtml 누락 시 MacroResource.getMacroBody NPE → 500. (ADR-019)
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
    createElement(BackgroundImageDialogShell, {
      initial,
      onInsert: handleInsert,
      onCancel: handleCancel,
    })
  );
}

registerMacro(MACRO_NAME, { opener: openBackgroundImageDialog });
