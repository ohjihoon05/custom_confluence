import { z } from 'zod';

// Aura BackgroundImage Java keys (truly flat — BackgroundImage.executeWeb
// reads map.get(...) directly, no serializedStyles wrapper):
//   contentPosition       — 'flex-start' | 'center' | 'bottom-right'
//   containerMinHeight    — number string, default '400'
//   padding               — number string, default '10'
//   backgroundColor       — hex (optional). Presence toggles colour layer.
//   backgroundImageHref   — URL or attachment id (optional)
//   backgroundImageHrefType — 'link' (external URL) | 'aura-hosted' (built-in)
//                           | absent (legacy external URL — Java treats as raw url)
//   backgroundPosition    — CSS background-position, default 'center center'
//   backgroundSize        — 'cover' | 'contain', default 'cover'
//
// 1.1.8 노출 컨트롤: contentPosition, containerMinHeight, padding,
// backgroundColor toggle, backgroundImageHref toggle (외부 URL only).
// backgroundPosition/Size는 default로 고정 — 후속 빌드에서 노출.

export const BackgroundContentPositionSchema = z.enum([
  'flex-start',
  'center',
  'bottom-right',
]);

export const BackgroundSizeSchema = z.enum(['cover', 'contain']);

export const BackgroundImageParamsSchema = z.object({
  contentPosition: BackgroundContentPositionSchema.default('flex-start'),
  containerMinHeight: z.number().int().min(0).max(1000).default(400),
  padding: z.number().int().min(0).max(100).default(10),

  // Background colour layer — null when toggled off.
  backgroundColor: z.string().nullable().default(null),

  // External URL only in 1.1.8. null when toggled off.
  backgroundImageHref: z.string().nullable().default(null),

  // Hidden until a future build exposes the controls.
  backgroundPosition: z.string().default('center center'),
  backgroundSize: BackgroundSizeSchema.default('cover'),
});

export type BackgroundImageParams = z.infer<typeof BackgroundImageParamsSchema>;
export type BackgroundContentPosition = z.infer<typeof BackgroundContentPositionSchema>;
