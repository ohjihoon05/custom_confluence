import { TitleParamsSchema, type TitleParams } from './title';

export type JavaParamMap = Record<string, string>;

const FONT_WEIGHT_TO_CSS: Record<TitleParams['fontWeight'], string> = {
  light: '300',
  normal: '400',
  medium: '500',
  bold: '700',
};

function cssToFontWeight(s: string | undefined): TitleParams['fontWeight'] {
  if (s === '300') return 'light';
  if (s === '400' || s === 'normal') return 'normal';
  if (s === '500') return 'medium';
  if (s === '700' || s === 'bold') return 'bold';
  return 'bold';
}

export function paramsToJavaMap(params: TitleParams): JavaParamMap {
  const lineHeight = params.autoLineHeight ? params.fontSize : params.lineHeight;
  const map: JavaParamMap = {
    tag: params.tag,
    fontSize: String(params.fontSize),
    lineHeight: String(lineHeight),
    fontWeight: FONT_WEIGHT_TO_CSS[params.fontWeight],
    textAlign: params.textAlign,
  };
  // 'default'면 색 키 자체 안 보냄 → Aura가 'inherit' fallback
  if (params.color !== 'default') {
    map.color = params.color;
  }
  return map;
}

export function javaMapToParams(map: JavaParamMap): TitleParams {
  const fontSize = parseIntSafe(map.fontSize, 48);
  const lh = parseIntSafe(map.lineHeight, fontSize);
  const autoLineHeight = lh === fontSize;

  return TitleParamsSchema.parse({
    tag: (['h1', 'h2', 'h3', 'h4'] as const).includes(map.tag as TitleParams['tag'])
      ? map.tag
      : undefined,
    fontSize,
    autoLineHeight,
    lineHeight: lh,
    fontWeight: cssToFontWeight(map.fontWeight),
    textAlign: (['left', 'center', 'right'] as const).includes(
      map.textAlign as TitleParams['textAlign']
    )
      ? map.textAlign
      : undefined,
    color: map.color && map.color !== 'inherit' ? map.color : 'default',
  });
}

function parseIntSafe(s: string | undefined, fallback: number): number {
  if (!s) return fallback;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : fallback;
}
