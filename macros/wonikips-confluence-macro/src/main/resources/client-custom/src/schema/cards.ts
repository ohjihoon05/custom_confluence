import { z } from 'zod';

export const HrefTypeSchema = z.enum(['external', 'attachment', 'page']);
export const HrefTargetSchema = z.enum(['_blank', '_self']);

export const CardSchema = z.object({
  title: z.string().default('WonikIPS Card'),
  body: z.string().default('Replace this text with your own content'),
  href: z.string().default(''),
  hrefType: HrefTypeSchema.default('external'),
  hrefTarget: HrefTargetSchema.default('_blank'),
  color: z.string().default('default'),
  icon: z.string().default('faPaperPlane'),
});

export const AlignmentSchema = z.enum(['left', 'center', 'right']);
export const CardTypeSchema = z.enum(['text', 'icon', 'image']);
export const DesignSchema = z.enum(['light', 'dark', 'aura', 'aura-accent', 'fabric']);
export const HoverEffectSchema = z.enum(['none', 'elevate', 'shrink']);

export const CardsParamsSchema = z.object({
  alignment: AlignmentSchema.default('center'),
  cardType: CardTypeSchema.default('icon'),
  columns: z.number().int().min(1).max(6).default(3),
  design: DesignSchema.default('light'),
  hoverEffect: HoverEffectSchema.default('elevate'),
  marginBetween: z.number().int().min(0).max(50).default(10),
  paddingInside: z.number().int().min(0).max(50).default(0),
  fullWidth: z.boolean().default(false),
  cards: z.array(CardSchema).default([]),
});

export type Card = z.infer<typeof CardSchema>;
export type CardsParams = z.infer<typeof CardsParamsSchema>;
export type Alignment = z.infer<typeof AlignmentSchema>;
export type CardType = z.infer<typeof CardTypeSchema>;
export type Design = z.infer<typeof DesignSchema>;
export type HoverEffect = z.infer<typeof HoverEffectSchema>;
export type HrefType = z.infer<typeof HrefTypeSchema>;
export type HrefTarget = z.infer<typeof HrefTargetSchema>;
