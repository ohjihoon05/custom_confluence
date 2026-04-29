import { ButtonParamsSchema, type ButtonParams } from './button';

export type JavaParamMap = Record<string, string>;

export function paramsToJavaMap(params: ButtonParams): JavaParamMap {
  const map: JavaParamMap = {
    label: params.label,
    size: params.size,
    background: params.background,
    color: params.color,
    borderRadius: String(params.borderRadius),
    outlined: params.outlined ? 'outlined' : 'regular',
    elevation: params.shadow ? 'elevated' : 'flat',
    iconPosition: params.iconPosition,
  };

  if (params.icon) map.icon = params.icon;
  if (params.href) {
    map.href = params.href;
    map.hrefType = params.hrefType;
    map.hrefTarget = params.hrefTarget;
  }
  return map;
}

export function javaMapToParams(map: JavaParamMap): ButtonParams {
  return ButtonParamsSchema.parse({
    label: map.label ?? undefined,
    size: (['small', 'medium', 'large'] as const).includes(
      map.size as ButtonParams['size']
    )
      ? map.size
      : undefined,
    href: map.href ?? '',
    hrefType: (['external', 'attachment', 'page'] as const).includes(
      map.hrefType as ButtonParams['hrefType']
    )
      ? map.hrefType
      : undefined,
    hrefTarget: (['_blank', '_self'] as const).includes(
      map.hrefTarget as ButtonParams['hrefTarget']
    )
      ? map.hrefTarget
      : undefined,
    background: map.background ?? undefined,
    color: map.color ?? undefined,
    borderRadius: parseIntSafe(map.borderRadius, 2),
    outlined: map.outlined === 'outlined',
    shadow: map.elevation === 'elevated',
    icon: map.icon ?? '',
    iconPosition: (['left', 'right'] as const).includes(
      map.iconPosition as ButtonParams['iconPosition']
    )
      ? map.iconPosition
      : undefined,
  });
}

function parseIntSafe(s: string | undefined, fallback: number): number {
  if (!s) return fallback;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : fallback;
}
