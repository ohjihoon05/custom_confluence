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
  DividerParamsSchema,
  type DividerParams,
  type DividerType,
  type DividerAlignment,
  type DividerLineStyle,
} from '../../schema/divider';
import styles from './DividerEditor.module.css';

const TYPE_OPTIONS: { value: DividerType; label: string; ariaLabel: string }[] = [
  { value: 'regular', label: '─', ariaLabel: 'Line only' },
  { value: 'text', label: 'T', ariaLabel: 'Text divider' },
  { value: 'icon', label: '✈', ariaLabel: 'Icon divider' },
];

const ALIGNMENT_OPTIONS: { value: DividerAlignment; label: string }[] = [
  { value: 'start', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'end', label: 'Right' },
];

const LINE_STYLE_OPTIONS: { value: DividerLineStyle; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'double', label: 'Double' },
];

const TEXT_ALIGN_OPTIONS = [
  { value: 'left' as const, label: '⇤', ariaLabel: 'Align left' },
  { value: 'center' as const, label: '⇔', ariaLabel: 'Align center' },
  { value: 'right' as const, label: '⇥', ariaLabel: 'Align right' },
];

const FONT_WEIGHT_OPTIONS = [
  { value: 'normal' as const, label: 'Normal' },
  { value: 'bold' as const, label: 'Bold' },
];

export interface DividerEditorProps {
  initial?: Partial<DividerParams>;
  value?: DividerParams;
  onChange?: (next: DividerParams) => void;
  iconData?: Record<string, IconMeta>;
  onSave?: (params: DividerParams) => void;
  onCancel?: () => void;
  hideFooter?: boolean;
}

export function DividerEditor({
  initial,
  value,
  onChange,
  iconData = {},
  onSave,
  onCancel,
  hideFooter = false,
}: DividerEditorProps) {
  const [internalParams, setInternalParams] = useState<DividerParams>(() =>
    DividerParamsSchema.parse(initial ?? {})
  );
  const params = value ?? internalParams;
  const setParams = (next: DividerParams | ((prev: DividerParams) => DividerParams)): void => {
    const resolved = typeof next === 'function' ? next(params) : next;
    if (onChange) onChange(resolved);
    else setInternalParams(resolved);
  };
  const update = (patch: Partial<DividerParams>): void => {
    setParams((prev) => ({ ...prev, ...patch }));
  };

  const previewIcon = params.iconName ? iconData[params.iconName] : undefined;

  // 미리보기 스타일 계산
  const showLeftLine = params.alignment !== 'start' || params.type === 'regular';
  const showRightLine = params.alignment !== 'end' || params.type === 'regular';
  const lineStyle = `${params.lineWidth}px ${params.lineStyle} ${params.lineColor}`;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <h3 className={styles.section}>Type</h3>
        <SegmentedControl
          label=""
          value={params.type}
          onChange={(type) => update({ type })}
          options={TYPE_OPTIONS}
        />

        <h3 className={styles.section}>Alignment</h3>
        <SegmentedControl
          label=""
          value={params.alignment}
          onChange={(alignment) => update({ alignment })}
          options={ALIGNMENT_OPTIONS}
        />

        <h3 className={styles.section}>Width</h3>
        <Toggle
          label="Full width"
          value={params.fullWidth}
          onChange={(fullWidth) => update({ fullWidth })}
        />
        {!params.fullWidth && (
          <Slider
            label="Width"
            value={params.width}
            onChange={(width) => update({ width })}
            min={50}
            max={2000}
            step={10}
            unit="px"
          />
        )}

        <h3 className={styles.section}>Line</h3>
        <ColorPicker
          label="Color"
          value={params.lineColor}
          onChange={(lineColor) => update({ lineColor })}
          allowDefault={false}
        />
        <Slider
          label="Width"
          value={params.lineWidth}
          onChange={(lineWidth) => update({ lineWidth })}
          min={1}
          max={20}
          step={1}
          unit="px"
        />
        <Select
          label="Style"
          value={params.lineStyle}
          onChange={(lineStyle) => update({ lineStyle })}
          options={LINE_STYLE_OPTIONS}
        />

        {params.type === 'text' && (
          <>
            <h3 className={styles.section}>Text</h3>
            <TextInput
              label="Text"
              value={params.text}
              onChange={(text) => update({ text })}
            />
            <ColorPicker
              label="Text color"
              value={params.textColor}
              onChange={(textColor) => update({ textColor })}
              allowDefault={false}
            />
            <Slider
              label="Font size"
              value={params.textFontSize}
              onChange={(textFontSize) => update({ textFontSize })}
              min={10}
              max={72}
              step={1}
              unit="px"
            />
            <Select
              label="Font weight"
              value={params.textFontWeight}
              onChange={(textFontWeight) => update({ textFontWeight })}
              options={FONT_WEIGHT_OPTIONS}
            />
            <SegmentedControl
              label="Text align"
              value={params.textAlign}
              onChange={(textAlign) => update({ textAlign })}
              options={TEXT_ALIGN_OPTIONS}
            />
          </>
        )}

        {params.type === 'icon' && (
          <>
            <h3 className={styles.section}>Icon</h3>
            <IconPicker
              label="Icon"
              value={params.iconName}
              onChange={(iconName) => update({ iconName })}
              iconData={iconData}
            />
            <ColorPicker
              label="Icon color"
              value={params.iconColor}
              onChange={(iconColor) => update({ iconColor })}
              allowDefault={false}
            />
            <Slider
              label="Icon size"
              value={params.iconSize}
              onChange={(iconSize) => update({ iconSize })}
              min={12}
              max={96}
              step={1}
              unit="px"
            />
          </>
        )}
      </aside>

      <main className={styles.preview}>
        <div
          className={styles.previewWrapper}
          style={{
            justifyContent:
              params.alignment === 'center'
                ? 'center'
                : params.alignment === 'end'
                ? 'flex-end'
                : 'flex-start',
            width: params.fullWidth ? '100%' : `${params.width}px`,
            margin: params.alignment === 'center' ? '0 auto' : params.alignment === 'end' ? '0 0 0 auto' : '0',
          }}
        >
          {showLeftLine && <div className={styles.line} style={{ borderTop: lineStyle }} />}
          {params.type === 'text' && (
            <div
              className={styles.content}
              style={{
                color: params.textColor,
                fontSize: params.textFontSize,
                fontWeight: params.textFontWeight,
                textAlign: params.textAlign,
              }}
            >
              {params.text}
            </div>
          )}
          {params.type === 'icon' && previewIcon && (
            <div className={styles.content} style={{ color: params.iconColor }}>
              <svg
                viewBox={`0 0 ${previewIcon.width ?? 512} ${previewIcon.height ?? 512}`}
                width={params.iconSize}
                height={params.iconSize}
              >
                <path d={previewIcon.path} fill="currentColor" />
              </svg>
            </div>
          )}
          {showRightLine && <div className={styles.line} style={{ borderTop: lineStyle }} />}
        </div>
      </main>

      {!hideFooter && (
        <div className={styles.footer}>
          <button type="button" className={styles.btn} onClick={() => onCancel?.()}>
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
