import { CardsParamsSchema, type CardsParams } from './cards';
import { paramsToJavaMap, javaMapToParams } from './cards-mapper';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

const defaultParams = CardsParamsSchema.parse({});
assert(defaultParams.columns === 3, 'default columns is 3');
assert(defaultParams.cards.length === 0, 'default cards empty');
assert(defaultParams.alignment === 'center', 'default alignment center');
assert(defaultParams.cardType === 'icon', 'default cardType icon');
assert(defaultParams.marginBetween === 10, 'default margin 10');

const reject = CardsParamsSchema.safeParse({ columns: 7 });
assert(!reject.success, 'rejected columns > 6');

const sample: CardsParams = {
  alignment: 'left',
  cardType: 'icon',
  columns: 4,
  design: 'light',
  hoverEffect: 'elevate',
  marginBetween: 20,
  paddingInside: 5,
  fullWidth: true,
  cards: [
    {
      title: 'WonikIPS Card',
      body: 'test body',
      href: 'https://wonikips.com',
      hrefType: 'external',
      hrefTarget: '_blank',
      color: '#ff0000',
      icon: 'faPaperPlane',
    },
  ],
};

const java = paramsToJavaMap(sample);
assert(java.theme === 'aura', 'light -> aura');
assert(java.columns === '4', 'columns serialized');
assert(java.gutter === '20', 'gutter from marginBetween');
assert(java.maxWidth === '100%', 'fullWidth -> 100%');
assert(java.layout === 'icon-left', 'alignment left -> icon-left');
assert(typeof java.cardsCollection === 'string', 'cardsCollection is JSON string');

const back = javaMapToParams(java);
assert(back.alignment === sample.alignment, 'alignment round-trip');
assert(back.cardType === sample.cardType, 'cardType round-trip');
assert(back.columns === sample.columns, 'columns round-trip');
assert(back.design === sample.design, 'design round-trip');
assert(back.hoverEffect === sample.hoverEffect, 'hoverEffect round-trip');
assert(back.marginBetween === sample.marginBetween, 'marginBetween round-trip');
assert(back.paddingInside === sample.paddingInside, 'paddingInside round-trip');
assert(back.fullWidth === sample.fullWidth, 'fullWidth round-trip');
assert(back.cards.length === 1, 'cards length round-trip');
assert(back.cards[0]?.title === 'WonikIPS Card', 'card title round-trip');

console.log('All cards schema tests passed.');
