import { useState } from 'react';
import {
  TextInput,
  Slider,
  ColorPicker,
  Select,
  Toggle,
} from '../../components';
import {
  BackgroundImageParamsSchema,
  type BackgroundImageParams,
  type BackgroundContentPosition,
} from '../../schema/background-image';
import styles from './BackgroundImageEditor.module.css';

const POSITION_OPTIONS: { value: BackgroundContentPosition; label: string }[] = [
  { value: 'flex-start', label: 'Top' },
  { value: 'center', label: 'Center' },
  { value: 'bottom-right', label: 'Bottom' },
];

const DEFAULT_COLOR = '#0052CC';
const DEFAULT_IMAGE_URL =
  'https://images.unsplash.com/photo-1579492450119-80542d516179?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';

export interface BackgroundImageEditorProps {
  initial?: Partial<BackgroundImageParams>;
  value?: BackgroundImageParams;
  onChange?: (next: BackgroundImageParams) => void;
  onSave?: (params: BackgroundImageParams) => void;
  onCancel?: () => void;
  hideFooter?: boolean;
}

export function BackgroundImageEditor({
  initial,
  value,
  onChange,
  onSave,
  onCancel,
  hideFooter = false,
}: BackgroundImageEditorProps) {
  const [internalParams, setInternalParams] = useState<BackgroundImageParams>(
    () => BackgroundImageParamsSchema.parse(initial ?? {})
  );
  const params = value ?? internalParams;
  const setParams = (
    next:
      | BackgroundImageParams
      | ((prev: BackgroundImageParams) => BackgroundImageParams)
  ): void => {
    const resolved = typeof next === 'function' ? next(params) : next;
    if (onChange) onChange(resolved);
    else setInternalParams(resolved);
  };
  const update = (patch: Partial<BackgroundImageParams>): void => {
    setParams((prev) => ({ ...prev, ...patch }));
  };

  const colorEnabled = params.backgroundColor !== null;
  const imageEnabled = params.backgroundImageHref !== null;

  // CSS justify-content는 'bottom-right'을 모름 — 미리보기에서만 'flex-end'로
  // 보여준다. Java/저장된 값은 'bottom-right' 그대로 유지(Aura 호환).
  const previewJustify =
    params.contentPosition === 'bottom-right'
      ? 'flex-end'
      : params.contentPosition;

  const previewBgLayers: string[] = [];
  if (params.backgroundColor) {
    previewBgLayers.push(
      `linear-gradient(${params.backgroundColor}, ${params.backgroundColor})`
    );
  }
  if (params.backgroundImageHref) {
    previewBgLayers.push(`url("${params.backgroundImageHref}")`);
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <h3 className={styles.section}>General</h3>
        <Select
          label="Content Vertical Position"
          value={params.contentPosition}
          onChange={(contentPosition) => update({ contentPosition })}
          options={POSITION_OPTIONS}
        />
        <Slider
          label="Minimum Height"
          value={params.containerMinHeight}
          onChange={(containerMinHeight) => update({ containerMinHeight })}
          min={0}
          max={1000}
          step={10}
          unit="px"
        />
        <Slider
          label="Padding"
          value={params.padding}
          onChange={(padding) => update({ padding })}
          min={0}
          max={100}
          step={1}
          unit="px"
        />

        <h3 className={styles.section}>Color</h3>
        <Toggle
          label="Add Background Color"
          value={colorEnabled}
          onChange={(on) =>
            update({ backgroundColor: on ? DEFAULT_COLOR : null })
          }
        />
        {colorEnabled && (
          <ColorPicker
            label="Background Color"
            value={params.backgroundColor ?? DEFAULT_COLOR}
            onChange={(backgroundColor) => update({ backgroundColor })}
            allowDefault={false}
          />
        )}

        <h3 className={styles.section}>Image</h3>
        <Toggle
          label="Add Background Image"
          value={imageEnabled}
          onChange={(on) =>
            update({ backgroundImageHref: on ? DEFAULT_IMAGE_URL : null })
          }
        />
        {imageEnabled && (
          <TextInput
            label="Image URL"
            value={params.backgroundImageHref ?? ''}
            onChange={(backgroundImageHref) => update({ backgroundImageHref })}
            placeholder="https://..."
          />
        )}
      </aside>

      <main className={styles.preview}>
        <div
          className={styles.previewWrapper}
          style={{
            justifyContent: previewJustify,
            minHeight: `${Math.min(params.containerMinHeight, 400)}px`,
            padding: `${params.padding}px`,
            backgroundImage: previewBgLayers.join(', ') || 'none',
            backgroundPosition: params.backgroundPosition,
            backgroundSize: params.backgroundSize,
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className={styles.demoContent}>
            <div className={styles.demoTitle}>Demo Content</div>
            <div className={styles.demoBody}>
              You will be able to add content after saving the macro.
            </div>
          </div>
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
