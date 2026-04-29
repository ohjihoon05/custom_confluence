import type { ConfluenceWindow, MacroBrowserMacro, MacroEditorHost } from './types';
import { getMacro, listMacros } from './macro-registry';

interface V4AdapterOptions {
  iconLoader?: () => Promise<unknown>;
}

function getConfluenceWindow(): ConfluenceWindow | null {
  if (typeof window === 'undefined') return null;
  return window as unknown as ConfluenceWindow;
}

let registered = false;
let monkeyPatched = false;

function installMonkeyPatch(): boolean {
  const cw = getConfluenceWindow();
  if (!cw?.AJS?.MacroBrowser?.setMacroJsOverride) return false;
  if (monkeyPatched) return true;

  const original = cw.AJS.MacroBrowser.setMacroJsOverride.bind(cw.AJS.MacroBrowser);

  const patched = function (
    this: unknown,
    name: string,
    override: { opener: (macro: MacroBrowserMacro) => void }
  ): void {
    const entry = getMacro(name);
    if (entry) {
      original(name, { opener: entry.opener });
      return;
    }
    original(name, override);
  };
  (patched as unknown as { __wonikipsPatched: boolean }).__wonikipsPatched = true;

  cw.AJS!.MacroBrowser!.setMacroJsOverride =
    patched as unknown as typeof cw.AJS.MacroBrowser.setMacroJsOverride;

  // 등록된 모든 매크로를 즉시 한 번씩 등록
  const names = listMacros();
  for (const name of names) {
    const entry = getMacro(name);
    if (entry) original(name, { opener: entry.opener });
  }
  monkeyPatched = true;
  console.log(
    '[WonikIPS Editor] Monkey-patched setMacroJsOverride (via registry):',
    names.join(', ')
  );
  return true;
}

function tryRegister(): boolean {
  const cw = getConfluenceWindow();
  if (!cw?.AJS?.MacroBrowser?.setMacroJsOverride) return false;
  installMonkeyPatch();
  registered = true;
  console.log(
    '[WonikIPS Editor] Registered V4 override for',
    listMacros().join(', ')
  );
  return true;
}

export function createV4Host(_options: V4AdapterOptions = {}): MacroEditorHost {
  return {
    registerMacros: (): void => {
      if (registered) return;
      const cw = getConfluenceWindow();
      if (!cw) return;

      const initialResult = tryRegister();

      // Aura가 setMacroJsOverride를 다시 정의했을 경우 대비 재시도
      const reRegister = (): void => {
        const cw2 = getConfluenceWindow();
        if (!cw2?.AJS?.MacroBrowser?.setMacroJsOverride) return;
        const fn = cw2.AJS.MacroBrowser.setMacroJsOverride as unknown as {
          __wonikipsPatched?: boolean;
        };
        if (!fn.__wonikipsPatched) {
          monkeyPatched = false;
          installMonkeyPatch();
        } else {
          console.log('[WonikIPS Editor] Monkey-patch still active');
        }
      };

      try {
        cw.AJS?.bind?.('init.rte', reRegister);
        cw.AJS?.bind?.('page-edit-loaded', reRegister);
        cw.AJS?.toInit?.(reRegister);
      } catch (err) {
        console.warn('[WonikIPS Editor] AJS bind failed:', err);
      }

      if (initialResult) return;

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
        tryRegister();
      }, 500);
    },
  };
}
