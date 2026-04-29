import { DividerParamsSchema, type DividerParams } from './divider';

export type JavaParamMap = Record<string, string>;

interface SerializedStyles {
  alignment: { horizontal: 'start' | 'center' | 'end' };
  icon: { name: string; color: string; size: number };
  text: {
    color: string;
    fontSize: number;
    textAlign: 'left' | 'center' | 'right';
    fontWeight: 'normal' | 'bold';
    text: string;
  };
  border: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
    color: string;
    style: 'solid' | 'dashed' | 'dotted' | 'double';
    width: number;
  };
  size: { width: number | string };
}

export function paramsToJavaMap(params: DividerParams): JavaParamMap {
  const styles: SerializedStyles = {
    alignment: { horizontal: params.alignment },
    icon: {
      name: params.iconName,
      color: params.iconColor,
      size: params.iconSize,
    },
    text: {
      color: params.textColor,
      fontSize: params.textFontSize,
      textAlign: params.textAlign,
      fontWeight: params.textFontWeight,
      text: params.text,
    },
    border: {
      top: false,
      right: false,
      bottom: true,
      left: false,
      color: params.lineColor,
      style: params.lineStyle,
      width: params.lineWidth,
    },
    size: { width: params.fullWidth ? '100%' : params.width },
  };

  return {
    type: params.type,
    serializedStyles: JSON.stringify(styles),
  };
}

export function javaMapToParams(map: JavaParamMap): DividerParams {
  let styles: Partial<SerializedStyles> = {};
  try {
    if (map.serializedStyles) styles = JSON.parse(map.serializedStyles);
  } catch {
    styles = {};
  }

  const sizeWidth = styles.size?.width;
  const fullWidth = sizeWidth === '100%' || sizeWidth === undefined;

  return DividerParamsSchema.parse({
    type: map.type ?? undefined,
    alignment: styles.alignment?.horizontal ?? undefined,
    fullWidth,
    width: typeof sizeWidth === 'number' ? sizeWidth : 200,
    lineColor: styles.border?.color ?? undefined,
    lineWidth: styles.border?.width ?? undefined,
    lineStyle: styles.border?.style ?? undefined,
    text: styles.text?.text ?? undefined,
    textColor: styles.text?.color ?? undefined,
    textFontSize: styles.text?.fontSize ?? undefined,
    textFontWeight: styles.text?.fontWeight ?? undefined,
    textAlign: styles.text?.textAlign ?? undefined,
    iconName: styles.icon?.name ?? undefined,
    iconColor: styles.icon?.color ?? undefined,
    iconSize: styles.icon?.size ?? undefined,
  });
}
