import { useState } from 'react';
import {
  TextInput,
  Slider,
  ColorPicker,
  SegmentedControl,
  Select,
  Toggle,
} from '../../components';
import {
  TitleParamsSchema,
  type TitleParams,
  type TitleTag,
  type TitleAlign,
  type TitleFontWeight,
} from '../../schema/title';
import styles from './TitleEditor.module.css';

const TAG_OPTIONS: { value: TitleTag; label: string }[] = [
  { value: 'h1', label: 'Headline 1' },
  { value: 'h2', label: 'Headline 2' },
  { value: 'h3', label: 'Headline 3' },
  { value: 'h4', label: 'Headline 4' },
];

const FONT_WEIGHT_OPTIONS: { value: TitleFontWeight; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Medium' },
  { value: 'bold', label: 'Bold' },
];

const ALIGN_OPTIONS: { value: TitleAlign; label: string; ariaLabel: string }[] = [
  { value: 'left', label: '⇤', ariaLabel: 'Align left' },
  { value: 'center', label: '⇔', ariaLabel: 'Align center' },
  { value: 'right', label: '⇥', ariaLabel: 'Align right' },
];

export interface TitleEditorProps {
  initial?: Partial<TitleParams>;
  value?: TitleParams;
  onChange?: (next: TitleParams) => void;
  onSave?: (params: TitleParams) => void;
  onCancel?: () => void;
  hideFooter?: boolean;
}

export function TitleEditor({
  initial,
  value,
  onChange,
  onSave,
  onCancel,
  hideFooter = false,
}: TitleEditorProps) {
  const [internalParams, setInternalParams] = useState<TitleParams>(() =>
    TitleParamsSchema.parse(initial ?? {})
  );
  const params = value ?? internalParams;
  const setParams = (next: TitleParams | ((prev: TitleParams) => TitleParams)): void => {
    const resolved = typeof next === 'function' ? next(params) : next;
    if (onChange) onChange(resolved);
    else setInternalParams(resolved);
  };
  const update = (patch: Partial<TitleParams>): void => {
    setParams((prev) => ({ ...prev, ...patch }));
  };

  const previewColor = params.color === 'default' ? 'inherit' : params.color;
  const previewLineHeight = params.autoLineHeight ? params.fontSize : params.lineHeight;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <h3 className={styles.section}>Content</h3>
        <TextInput
          label="Title text"
          value={params.text}
          onChange={(text) => update({ text })}
        />

        <div className={styles.row}>
          <Select
            label="Font Weight"
            value={params.fontWeight}
            onChange={(fontWeight) => update({ fontWeight })}
            options={FONT_WEIGHT_OPTIONS}
          />
          <SegmentedControl
            label="Text Alignment"
            value={params.textAlign}
            onChange={(textAlign) => update({ textAlign })}
            options={ALIGN_OPTIONS}
          />
        </div>

        <Slider
          label="Font Size"
          value={params.fontSize}
          onChange={(fontSize) => update({ fontSize })}
          min={10}
          max={120}
          step={1}
          unit="px"
        />

        <Toggle
          label="Select line height manually"
          value={!params.autoLineHeight}
          onChange={(manual) => update({ autoLineHeight: !manual })}
        />
        {!params.autoLineHeight && (
          <Slider
            label="Line height"
            value={params.lineHeight}
            onChange={(lineHeight) => update({ lineHeight })}
            min={10}
            max={200}
            step={1}
            unit="px"
          />
        )}

        <ColorPicker
          label="Color"
          value={params.color}
          onChange={(color) => update({ color })}
          allowDefault
        />

        <h3 className={styles.section}>Advanced</h3>
        <Select
          label="HTML Tag"
          value={params.tag}
          onChange={(tag) => update({ tag })}
          options={TAG_OPTIONS}
        />
      </aside>

      <main className={styles.preview}>
        <div
          className={styles.previewHeading}
          style={{
            color: previewColor,
            fontSize: `${params.fontSize}px`,
            lineHeight: `${previewLineHeight}px`,
            fontWeight:
              params.fontWeight === 'light'
                ? 300
                : params.fontWeight === 'medium'
                ? 500
                : params.fontWeight === 'bold'
                ? 700
                : 400,
            textAlign: params.textAlign,
          }}
        >
          {params.text || 'Title'}
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
