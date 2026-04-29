import { z } from 'zod';

// Aura Divider Java keys: type ('regular'/'text'/'icon') + serializedStyles JSON
//   serializedStyles = { alignment, icon, text, border, size }

export const DividerTypeSchema = z.enum(['regular', 'text', 'icon']);
export const DividerAlignmentSchema = z.enum(['start', 'center', 'end']);
export const DividerLineStyleSchema = z.enum(['solid', 'dashed', 'dotted', 'double']);
export const DividerFontWeightSchema = z.enum(['normal', 'bold']);
export const DividerTextAlignSchema = z.enum(['left', 'center', 'right']);

export const DividerParamsSchema = z.object({
  type: DividerTypeSchema.default('regular'),
  alignment: DividerAlignmentSchema.default('start'),
  fullWidth: z.boolean().default(true),
  width: z.number().int().min(50).max(2000).default(200), // px (fullWidth=false 일 때)

  // Line (border.bottom)
  lineColor: z.string().default('#0385E7'),
  lineWidth: z.number().int().min(1).max(20).default(2),
  lineStyle: DividerLineStyleSchema.default('solid'),

  // Text (type='text'일 때)
  text: z.string().default('Aura Divider'),
  textColor: z.string().default('#172B4D'),
  textFontSize: z.number().int().min(10).max(72).default(24),
  textFontWeight: DividerFontWeightSchema.default('bold'),
  textAlign: DividerTextAlignSchema.default('left'),

  // Icon (type='icon'일 때)
  iconName: z.string().default('faPaperPlane'),
  iconColor: z.string().default('#334455'),
  iconSize: z.number().int().min(12).max(96).default(24),
});

export type DividerParams = z.infer<typeof DividerParamsSchema>;
export type DividerType = z.infer<typeof DividerTypeSchema>;
export type DividerAlignment = z.infer<typeof DividerAlignmentSchema>;
export type DividerLineStyle = z.infer<typeof DividerLineStyleSchema>;
