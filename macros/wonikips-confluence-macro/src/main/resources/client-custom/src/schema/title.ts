import { z } from 'zod';

// Aura PrettyTitle Java keys: tag, fontSize, lineHeight, color, fontWeight, textAlign
// + body (PLAIN_TEXT) = the title text content

export const TitleTagSchema = z.enum(['h1', 'h2', 'h3', 'h4']);
export const TitleAlignSchema = z.enum(['left', 'center', 'right']);
export const TitleFontWeightSchema = z.enum(['light', 'normal', 'medium', 'bold']);

export const TitleParamsSchema = z.object({
  text: z.string().default('Demo Title'),
  tag: TitleTagSchema.default('h1'),
  fontSize: z.number().int().min(10).max(120).default(48),
  fontWeight: TitleFontWeightSchema.default('bold'),
  textAlign: TitleAlignSchema.default('left'),
  // 'default' = inherit (Aura가 'inherit' 처리). 그 외엔 hex.
  color: z.string().default('default'),
  autoLineHeight: z.boolean().default(true),
  lineHeight: z.number().int().min(10).max(200).default(48),
});

export type TitleParams = z.infer<typeof TitleParamsSchema>;
export type TitleTag = z.infer<typeof TitleTagSchema>;
export type TitleAlign = z.infer<typeof TitleAlignSchema>;
export type TitleFontWeight = z.infer<typeof TitleFontWeightSchema>;
