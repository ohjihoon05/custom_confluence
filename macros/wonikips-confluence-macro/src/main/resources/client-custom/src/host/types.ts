import type { CardsParams } from '../schema/cards';

export interface MacroEditorHost {
  registerCardsMacro: () => void;
}

export interface MacroBrowserMacro {
  name: string;
  params?: Record<string, string>;
  defaultParameterValue?: string;
}

export interface ConfluenceWindow extends Window {
  AJS?: {
    MacroBrowser?: {
      setMacroJsOverride: (
        name: string,
        override: { opener: (macro: MacroBrowserMacro) => void }
      ) => void;
    };
    bind?: (event: string, handler: () => void) => void;
    toInit?: (handler: () => void) => void;
  };
  tinymce?: {
    confluence?: {
      macrobrowser?: {
        macroBrowserComplete: (result: {
          name: string;
          params?: Record<string, string>;
          bodyHtml?: string;
        }) => void;
      };
    };
  };
}

export type CardsBootstrapResult = {
  initial: Partial<CardsParams> | undefined;
  onSave: (params: CardsParams) => void;
  onCancel: () => void;
};
