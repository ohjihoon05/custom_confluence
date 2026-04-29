import type { MacroBrowserMacro } from './types';

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
