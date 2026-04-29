import { useState } from 'react';
import {
  TextInput,
  Slider,
  ColorPicker,
  IconPicker,
  type IconMeta,
  SegmentedControl,
  Select,
  Toggle,
} from '../../components';
import {
  ButtonParamsSchema,
  type ButtonParams,
  type ButtonSize,
  type ButtonHrefType,
  type ButtonHrefTarget,
  type ButtonIconPosition,
} from '../../schema/button';
import styles from './ButtonEditor.module.css';

const SIZE_OPTIONS: { value: ButtonSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const HREFTYPE_OPTIONS: { value: ButtonHrefType; label: string }[] = [
  { value: 'external', label: 'External URL' },
  { value: 'attachment', label: 'Attachment' },
  { value: 'page', label: 'Page' },
];

const HREFTARGET_OPTIONS: { value: ButtonHrefTarget; label: string }[] = [
  { value: '_blank', label: 'New tab' },
  { value: '_self', label: 'Same tab' },
];

const ICONPOS_OPTIONS: { value: ButtonIconPosition; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

export interface ButtonEditorProps {
  initial?: Partial<ButtonParams>;
  value?: ButtonParams;
  onChange?: (next: ButtonParams) => void;
  iconData?: Record<string, IconMeta>;
  onSave?: (params: ButtonParams) => void;
  onCancel?: () => void;
  hideFooter?: boolean;
}

export function ButtonEditor({
  initial,
  value,
  onChange,
  iconData = {},
  onSave,
  onCancel,
  hideFooter = false,
}: ButtonEditorProps) {
  const [internalParams, setInternalParams] = useState<ButtonParams>(() =>
    ButtonParamsSchema.parse(initial ?? {})
  );
  const params = value ?? internalParams;
  const setParams = (next: ButtonParams | ((prev: ButtonParams) => ButtonParams)): void => {
    const resolved = typeof next === 'function' ? next(params) : next;
    if (onChange) onChange(resolved);
    else setInternalParams(resolved);
  };

  const update = (patch: Partial<ButtonParams>): void => {
    setParams((prev) => ({ ...prev, ...patch }));
  };

  const sizePx = params.size === 'small' ? 12 : params.size === 'large' ? 20 : 16;
  const previewIcon = params.icon ? iconData[params.icon] : undefined;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <h3 className={styles.section}>Content</h3>
        <TextInput
          label="Label"
          value={params.label}
          onChange={(label) => update({ label })}
        />
        <SegmentedControl
          label="Size"
          value={params.size}
          onChange={(size) => update({ size })}
          options={SIZE_OPTIONS}
        />

        <h4 className={styles.subSection}>Link</h4>
        <TextInput
          label="URL"
          value={params.href}
          onChange={(href) => update({ href })}
          placeholder="https://..."
        />
        <Select
          label="Link type"
          value={params.hrefType}
          onChange={(hrefType) => update({ hrefType })}
          options={HREFTYPE_OPTIONS}
        />
        <Select
          label="Open in"
          value={params.hrefTarget}
          onChange={(hrefTarget) => update({ hrefTarget })}
          options={HREFTARGET_OPTIONS}
        />

        <h3 className={styles.section}>Appearance</h3>
        <ColorPicker
          label="Background color"
          value={params.background}
          onChange={(background) => update({ background })}
          allowDefault={false}
        />
        <ColorPicker
          label="Text color"
          value={params.color}
          onChange={(color) => update({ color })}
          allowDefault={false}
        />
        <Slider
          label="Rounded edges"
          value={params.borderRadius}
          onChange={(borderRadius) => update({ borderRadius })}
          min={0}
          max={40}
          step={1}
          unit="px"
        />
        <div className={styles.row}>
          <Toggle
            label="Outlined"
            value={params.outlined}
            onChange={(outlined) => update({ outlined })}
          />
          <Toggle
            label="Shadow"
            value={params.shadow}
            onChange={(shadow) => update({ shadow })}
          />
        </div>

        <h3 className={styles.section}>Icon</h3>
        <IconPicker
          label="Icon"
          value={params.icon}
          onChange={(icon) => update({ icon })}
          iconData={iconData}
        />
        {params.icon && (
          <SegmentedControl
            label="Icon position"
            value={params.iconPosition}
            onChange={(iconPosition) => update({ iconPosition })}
            options={ICONPOS_OPTIONS}
          />
        )}
      </aside>

      <main className={styles.preview}>
        <ButtonPreview params={params} sizePx={sizePx} icon={previewIcon} />
      </main>

      {!hideFooter && (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => onCancel?.()}
          >
            취소
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => onSave?.(params)}
          >
            삽입
          </button>
        </div>
      )}
    </div>
  );
}

interface ButtonPreviewProps {
  params: ButtonParams;
  sizePx: number;
  icon: IconMeta | undefined;
}

function ButtonPreview({ params, sizePx, icon }: ButtonPreviewProps) {
  const padV = sizePx === 12 ? 8 : sizePx === 20 ? 14 : 11;
  const padH = sizePx === 12 ? 14 : sizePx === 20 ? 24 : 18;
  const fg = params.outlined ? params.background : params.color;
  const bg = params.outlined ? 'transparent' : params.background;
  const border = params.outlined
    ? `2px solid ${params.background}`
    : `2px solid ${params.background}`;
  const shadowCss = params.shadow ? `0 0.2rem 0.5rem ${params.background}99` : 'none';

  const iconNode = icon ? (
    <span
      className={styles.btnIcon}
      style={{ height: sizePx, width: sizePx, color: fg }}
    >
      <svg
        viewBox={`0 0 ${icon.width ?? 512} ${icon.height ?? 512}`}
        width={sizePx}
        height={sizePx}
      >
        <path d={icon.path} fill="currentColor" />
      </svg>
    </span>
  ) : null;

  return (
    <div className={styles.previewCanvas}>
      <span
        className={styles.previewBtn}
        style={{
          color: fg,
          background: bg,
          border,
          borderRadius: `${params.borderRadius}px`,
          padding: `${padV}px ${padH}px`,
          fontSize: `${sizePx}px`,
          boxShadow: shadowCss,
          flexDirection:
            params.iconPosition === 'right' ? 'row-reverse' : 'row',
          gap: params.icon && params.label ? '8px' : '0',
        }}
      >
        {iconNode}
        {params.label && <span>{params.label}</span>}
      </span>
    </div>
  );
}
