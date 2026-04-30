import {
  BackgroundImageParamsSchema,
  type BackgroundImageParams,
} from './background-image';

export type JavaParamMap = Record<string, string>;

// BackgroundImage 매크로의 Java key는 모두 평탄 string. nullable 필드는
// "꺼짐" 상태에서 키 자체를 omit한다 — Java 쪽 BackgroundImage.executeWeb이
// map.containsKey(...)로 분기하기 때문.
export function paramsToJavaMap(params: BackgroundImageParams): JavaParamMap {
  const out: JavaParamMap = {
    contentPosition: params.contentPosition,
    containerMinHeight: String(params.containerMinHeight),
    padding: String(params.padding),
    backgroundPosition: params.backgroundPosition,
    backgroundSize: params.backgroundSize,
  };
  if (params.backgroundColor) {
    out.backgroundColor = params.backgroundColor;
  }
  if (params.backgroundImageHref) {
    out.backgroundImageHref = params.backgroundImageHref;
    // 외부 URL이라도 main.js는 'link'를 명시 — 패턴 보존.
    out.backgroundImageHrefType = 'link';
  }
  return out;
}

export function javaMapToParams(map: JavaParamMap): BackgroundImageParams {
  const num = (v: string | undefined, fallback: number): number => {
    if (v === undefined || v === '') return fallback;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  };
  return BackgroundImageParamsSchema.parse({
    contentPosition: map.contentPosition || undefined,
    containerMinHeight: num(map.containerMinHeight, 400),
    padding: num(map.padding, 10),
    backgroundColor: map.backgroundColor ?? null,
    backgroundImageHref: map.backgroundImageHref ?? null,
    backgroundPosition: map.backgroundPosition || undefined,
    backgroundSize: map.backgroundSize || undefined,
  });
}
