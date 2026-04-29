import { PanelParamsSchema, type PanelParams } from './panel';

export type JavaParamMap = Record<string, string>;

// Panel macro carries everything in a single `styles` JSON param.
// Java's Panel.executeWeb() routes to the legacy renderLegacyMacro() if a
// `background` key is present — we never emit `background` so the modern
// renderPanel() path is always used.

export function paramsToJavaMap(params: PanelParams): JavaParamMap {
  const stylesJson = JSON.stringify(stripNulls(params));
  return { styles: stylesJson };
}

export function javaMapToParams(map: JavaParamMap): PanelParams {
  let parsed: unknown = {};
  if (map.styles) {
    try {
      parsed = JSON.parse(map.styles);
    } catch {
      parsed = {};
    }
  }
  return PanelParamsSchema.parse(parsed);
}

// Recursively drop keys whose value is null / undefined so the serialized
// JSON stays compact and matches Aura's shape (Aura omits sections it
// considers "off" rather than emitting nulls).
function stripNulls<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripNulls(v)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === null || v === undefined) continue;
      out[k] = stripNulls(v);
    }
    return out as T;
  }
  return value;
}
