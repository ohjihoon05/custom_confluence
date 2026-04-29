import { z } from 'zod';

// Aura Panel: single Java macro param `styles` carrying the JSON below.
// Field names match aurastyles.* Java classes exactly (Gson-deserialised).
// Default values are taken from Panel.java's hard-coded fallback JSON
// (see Panel.java:75 in the decompiled source) — preserved verbatim
// (including the `texAlign` typo in body.text — Aura ships that typo).

export const PanelHorizontalSchema = z.enum(['start', 'center', 'end']);
export const PanelBorderStyleSchema = z.enum(['solid', 'dashed', 'dotted', 'double']);
export const PanelTextAlignSchema = z.enum(['left', 'center', 'right']);
export const PanelFontWeightSchema = z.enum(['normal', 'bold']);

export const PanelSizeSchema = z.object({
  width: z.union([z.number(), z.string()]).optional(),
  height: z.union([z.number(), z.string()]).optional(),
});

export const PanelBorderSchema = z.object({
  color: z.string(),
  style: PanelBorderStyleSchema,
  width: z.number(),
  top: z.boolean(),
  right: z.boolean(),
  bottom: z.boolean(),
  left: z.boolean(),
});

export const PanelBorderRadiusSchema = z.object({
  radius: z.number(),
});

export const PanelBackgroundColorSchema = z.object({
  color: z.string(),
});

export const PanelShadowItemSchema = z.object({
  color: z.string(),
  x: z.number(),
  y: z.number(),
  blur: z.number(),
  spread: z.number(),
});

export const PanelBoxShadowSchema = z.object({
  shadows: z.array(PanelShadowItemSchema),
});

export const PanelTextSchema = z.object({
  text: z.string().optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: PanelFontWeightSchema.optional(),
  textAlign: PanelTextAlignSchema.optional(),
  tag: z.string().optional(),
});

export const PanelIconSchema = z.object({
  name: z.string(),
  color: z.string(),
  size: z.number(),
});

export const PanelAlignmentSchema = z.object({
  horizontal: PanelHorizontalSchema,
});

export const PanelLinkSchema = z.object({
  value: z.string().optional(),
  type: z.string().optional(),
  target: z.string().optional(),
});

const PanelBaseSchema = z.object({
  size: PanelSizeSchema.nullable().optional(),
  boxShadow: PanelBoxShadowSchema.nullable().optional(),
  border: PanelBorderSchema.nullable().optional(),
  borderRadius: PanelBorderRadiusSchema.nullable().optional(),
  backgroundColor: PanelBackgroundColorSchema.nullable().optional(),
});

const PanelHeadlineSchema = z.object({
  text: PanelTextSchema.optional(),
  border: PanelBorderSchema.nullable().optional(),
  alignment: PanelAlignmentSchema.nullable().optional(),
});

const PanelHeaderSchema = z.object({
  backgroundColor: PanelBackgroundColorSchema.nullable().optional(),
  icon: PanelIconSchema.nullable().optional(),
  link: PanelLinkSchema.nullable().optional(),
});

const PanelBodyTextSchema = z.object({
  fontSize: z.number(),
  color: z.string(),
  // NOTE: `texAlign` typo is preserved from Aura's default JSON.
  texAlign: PanelTextAlignSchema,
  fontWeight: PanelFontWeightSchema,
});

const PanelBodySchema = z.object({
  text: PanelBodyTextSchema,
});

export const PanelParamsSchema = z.object({
  base: PanelBaseSchema.default({
    borderRadius: { radius: 8 },
    backgroundColor: { color: '#ffffff' },
    border: {
      color: '#999999',
      style: 'solid',
      width: 2,
      bottom: true,
      top: true,
      left: true,
      right: true,
    },
    size: { width: 400 },
    boxShadow: {
      shadows: [
        { color: 'rgba(0, 0, 0, 0.08)', x: 0, y: 1, blur: 1, spread: 0 },
        { color: 'rgba(0, 0, 0, 0.16)', x: 0, y: 1, blur: 3, spread: 1 },
      ],
    },
  }),
  headline: PanelHeadlineSchema.nullable().default({
    alignment: { horizontal: 'start' },
    text: {
      text: 'Wonik Panel Title',
      fontSize: 18,
      color: '#152A29',
      textAlign: 'left',
      fontWeight: 'bold',
    },
    border: {
      color: '#999999',
      style: 'solid',
      top: false,
      right: false,
      bottom: true,
      left: false,
      width: 1,
    },
  }),
  header: PanelHeaderSchema.nullable().default({
    backgroundColor: { color: '#eeeeee' },
    icon: { size: 18, name: 'faPaperPlane', color: '#333333' },
  }),
  body: PanelBodySchema.default({
    text: {
      fontSize: 14,
      color: '#333333',
      texAlign: 'left',
      fontWeight: 'normal',
    },
  }),
});

export type PanelParams = z.infer<typeof PanelParamsSchema>;
export type PanelHorizontal = z.infer<typeof PanelHorizontalSchema>;
export type PanelBorderStyle = z.infer<typeof PanelBorderStyleSchema>;
export type PanelTextAlign = z.infer<typeof PanelTextAlignSchema>;
export type PanelFontWeight = z.infer<typeof PanelFontWeightSchema>;
export type PanelBorder = z.infer<typeof PanelBorderSchema>;
export type PanelBoxShadow = z.infer<typeof PanelBoxShadowSchema>;
export type PanelShadowItem = z.infer<typeof PanelShadowItemSchema>;

// Shadow presets (Aura캡처에는 Grounded만 노출, 다른 옵션 미확인 — 1.1.5에서 보강)
export const SHADOW_PRESETS: Record<string, PanelShadowItem[]> = {
  none: [],
  grounded: [
    { color: 'rgba(0, 0, 0, 0.08)', x: 0, y: 1, blur: 1, spread: 0 },
    { color: 'rgba(0, 0, 0, 0.16)', x: 0, y: 1, blur: 3, spread: 1 },
  ],
  raised: [
    { color: 'rgba(0, 0, 0, 0.10)', x: 0, y: 4, blur: 8, spread: 0 },
    { color: 'rgba(0, 0, 0, 0.06)', x: 0, y: 1, blur: 2, spread: 0 },
  ],
  floating: [
    { color: 'rgba(0, 0, 0, 0.16)', x: 0, y: 12, blur: 24, spread: -4 },
    { color: 'rgba(0, 0, 0, 0.10)', x: 0, y: 4, blur: 8, spread: -2 },
  ],
};

export type ShadowPreset = keyof typeof SHADOW_PRESETS;

export function detectShadowPreset(shadow: PanelBoxShadow | null | undefined): ShadowPreset {
  if (!shadow || !shadow.shadows || shadow.shadows.length === 0) return 'none';
  for (const [key, preset] of Object.entries(SHADOW_PRESETS)) {
    if (preset.length !== shadow.shadows.length) continue;
    const match = preset.every((p, i) => {
      const s = shadow.shadows[i];
      return (
        s.color === p.color &&
        s.x === p.x &&
        s.y === p.y &&
        s.blur === p.blur &&
        s.spread === p.spread
      );
    });
    if (match) return key as ShadowPreset;
  }
  return 'grounded';
}

// Rounded corners preset → radius value
export const ROUNDED_PRESETS = {
  small: 4,
  medium: 8,
  large: 16,
} as const;

export type RoundedPreset = keyof typeof ROUNDED_PRESETS;

export function detectRoundedPreset(radius: number | undefined | null): RoundedPreset {
  if (radius === undefined || radius === null) return 'medium';
  if (radius <= 5) return 'small';
  if (radius <= 12) return 'medium';
  return 'large';
}
