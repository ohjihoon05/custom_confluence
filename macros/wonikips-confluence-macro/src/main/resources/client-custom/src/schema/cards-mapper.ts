import { CardsParamsSchema, type CardsParams, type Design, type Alignment } from './cards';

export type JavaParamMap = Record<string, string>;

function designToTheme(design: Design): string {
  if (design === 'light') return 'aura';
  if (design === 'dark') return 'fabric';
  return design;
}

function themeToDesign(theme: string | undefined): Design {
  if (theme === 'aura') return 'light';
  if (theme === 'fabric') return 'dark';
  if (theme === 'aura-accent') return 'aura-accent';
  return 'light';
}

function alignmentToLayout(alignment: Alignment): string {
  return `icon-${alignment}`;
}

function layoutToAlignment(layout: string | undefined): Alignment {
  if (layout === 'icon-left') return 'left';
  if (layout === 'icon-right') return 'right';
  return 'center';
}

export function paramsToJavaMap(params: CardsParams): JavaParamMap {
  return {
    theme: designToTheme(params.design),
    columns: String(params.columns),
    gutter: String(params.marginBetween),
    padding: String(params.paddingInside),
    maxWidth: params.fullWidth ? '100%' : '1200px',
    hover: params.hoverEffect,
    layout: alignmentToLayout(params.alignment),
    decoration: params.cardType === 'image' ? 'image' : 'icon',
    cardsCollection: JSON.stringify(params.cards),
  };
}

export function javaMapToParams(map: JavaParamMap): CardsParams {
  let cards: unknown = [];
  try {
    if (map.cardsCollection) {
      cards = JSON.parse(map.cardsCollection);
    }
  } catch {
    cards = [];
  }

  return CardsParamsSchema.parse({
    alignment: layoutToAlignment(map.layout),
    cardType: map.decoration === 'image' ? 'image' : 'icon',
    columns: parseIntSafe(map.columns, 3),
    design: themeToDesign(map.theme),
    hoverEffect: (map.hover as CardsParams['hoverEffect']) ?? 'elevate',
    marginBetween: parseIntSafe(map.gutter, 10),
    paddingInside: parseIntSafe(map.padding, 0),
    fullWidth: map.maxWidth === '100%',
    cards,
  });
}

function parseIntSafe(s: string | undefined, fallback: number): number {
  if (!s) return fallback;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : fallback;
}
