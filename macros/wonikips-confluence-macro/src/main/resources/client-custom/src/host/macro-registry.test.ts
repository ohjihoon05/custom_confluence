import { registerMacro, getMacro, listMacros, type MacroEntry } from './macro-registry';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

const stubOpener: MacroEntry['opener'] = () => undefined;

assert(getMacro('aura-cards') === undefined, 'empty registry returns undefined');

registerMacro('aura-cards', { opener: stubOpener });
const entry = getMacro('aura-cards');
assert(entry !== undefined, 'registered macro is retrievable');
assert(entry?.name === 'aura-cards', 'entry.name matches');
assert(entry?.opener === stubOpener, 'entry.opener matches');

const before = console.warn;
let warned = false;
console.warn = (msg: string) => {
  if (msg.includes("'aura-cards' re-registered")) warned = true;
};
const newOpener: MacroEntry['opener'] = () => undefined;
registerMacro('aura-cards', { opener: newOpener });
console.warn = before;

assert(warned, 'duplicate register emits console.warn');
assert(getMacro('aura-cards')?.opener === newOpener, 'duplicate register: last wins');

registerMacro('aura-button', { opener: stubOpener });
const macros = listMacros();
assert(macros.length === 2, 'listMacros returns all registered names');
assert(macros.includes('aura-cards') && macros.includes('aura-button'), 'list contents');

console.log('All registry tests passed.');
