import { z } from 'zod';

// Aura Button Java keys (decompiled from Button.java + Button.vm):
//   label, size, color, background, outlined, elevation, borderRadius,
//   icon, iconPosition, href, hrefType, hrefTarget

export const ButtonSizeSchema = z.enum(['small', 'medium', 'large']);
export const ButtonHrefTypeSchema = z.enum(['external', 'attachment', 'page']);
export const ButtonHrefTargetSchema = z.enum(['_blank', '_self']);
export const ButtonIconPositionSchema = z.enum(['left', 'right']);

export const ButtonParamsSchema = z.object({
  label: z.string().default('Button Label'),
  size: ButtonSizeSchema.default('medium'),

  // Link
  href: z.string().default(''),
  hrefType: ButtonHrefTypeSchema.default('external'),
  hrefTarget: ButtonHrefTargetSchema.default('_blank'),

  // Appearance
  background: z.string().default('#0052CC'), // hex
  color: z.string().default('#FFFFFF'), // foreground/text hex
  borderRadius: z.number().int().min(0).max(40).default(2),
  outlined: z.boolean().default(false),
  shadow: z.boolean().default(false),

  // Icon
  icon: z.string().default(''),
  iconPosition: ButtonIconPositionSchema.default('left'),
});

export type ButtonParams = z.infer<typeof ButtonParamsSchema>;
export type ButtonSize = z.infer<typeof ButtonSizeSchema>;
export type ButtonHrefType = z.infer<typeof ButtonHrefTypeSchema>;
export type ButtonHrefTarget = z.infer<typeof ButtonHrefTargetSchema>;
export type ButtonIconPosition = z.infer<typeof ButtonIconPositionSchema>;
