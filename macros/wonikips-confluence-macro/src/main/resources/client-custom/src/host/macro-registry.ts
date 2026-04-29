import type { MacroBrowserMacro } from './types';
import type { IconMeta } from '../components';

export interface MacroEntry {
  name: string;
  opener: (macro: MacroBrowserMacro) => void;
}

const registry = new Map<string, MacroEntry>();

export function registerMacro(
  name: string,
  entry: Omit<MacroEntry, 'name'>
): void {
  if (registry.has(name)) {
    console.warn(
      `[WonikIPS Editor] Macro '${name}' re-registered (last wins)`
    );
  }
  registry.set(name, { name, ...entry });
}

export function getMacro(name: string): MacroEntry | undefined {
  return registry.get(name);
}

export function listMacros(): string[] {
  return Array.from(registry.keys());
}

// Single shared icon-data provider for all macros' IconPickers.
// Per-macro openers should read via getGlobalIconData(); the host (main.tsx)
// installs the real provider once iconData has finished loading.
let iconDataProvider: () => Record<string, IconMeta> = () => ({});

export function setGlobalIconDataProvider(
  provider: () => Record<string, IconMeta>
): void {
  iconDataProvider = provider;
}

export function getGlobalIconData(): Record<string, IconMeta> {
  return iconDataProvider();
}
