import { useState, useMemo } from 'react';
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
  PanelParamsSchema,
  type PanelParams,
  type PanelHorizontal,
  type PanelBorderStyle,
  type PanelTextAlign,
  type PanelFontWeight,
  type ShadowPreset,
  type RoundedPreset,
  SHADOW_PRESETS,
  ROUNDED_PRESETS,
  detectShadowPreset,
  detectRoundedPreset,
} from '../../schema/panel';
import styles from './PanelEditor.module.css';

const ALIGN_OPTIONS: { value: PanelHorizontal; label: string }[] = [
  { value: 'start', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'end', label: 'Right' },
];

const TEXT_ALIGN_OPTIONS: { value: PanelTextAlign; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

const FONT_WEIGHT_OPTIONS: { value: PanelFontWeight; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'bold', label: 'Bold' },
];

const BORDER_STYLE_OPTIONS: { value: PanelBorderStyle; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'double', label: 'Double' },
];

const ROUNDED_OPTIONS: { value: RoundedPreset; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const SHADOW_OPTIONS: { value: ShadowPreset; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'grounded', label: 'Grounded' },
  { value: 'raised', label: 'Raised' },
  { value: 'floating', label: 'Floating' },
];

export interface PanelEditorProps {
  initial?: Partial<PanelParams>;
  value?: PanelParams;
  onChange?: (next: PanelParams) => void;
  iconData?: Record<string, IconMeta>;
  onSave?: (params: PanelParams) => void;
  onCancel?: () => void;
  hideFooter?: boolean;
}

export function PanelEditor({
  initial,
  value,
  onChange,
  iconData = {},
  onSave,
  onCancel,
  hideFooter = false,
}: PanelEditorProps) {
  const [internalParams, setInternalParams] = useState<PanelParams>(() =>
    PanelParamsSchema.parse(initial ?? {})
  );
  const params = value ?? internalParams;
  const setParams = (next: PanelParams | ((prev: PanelParams) => PanelParams)): void => {
    const resolved = typeof next === 'function' ? next(params) : next;
    if (onChange) onChange(resolved);
    else setInternalParams(resolved);
  };

  const base = params.base ?? {};
  const headline = params.headline;
  const header = params.header;
  const body = params.body;

  const updateBase = (patch: Partial<typeof base>): void => {
    setParams((prev) => ({ ...prev, base: { ...prev.base, ...patch } }));
  };
  const updateBaseBorder = (patch: Partial<NonNullable<typeof base.border>>): void => {
    setParams((prev) => {
      const cur = prev.base?.border ?? {
        color: '#999999',
        style: 'solid' as const,
        width: 2,
        top: true,
        right: true,
        bottom: true,
        left: true,
      };
      return { ...prev, base: { ...prev.base, border: { ...cur, ...patch } } };
    });
  };
  const updateHeadlineText = (patch: Partial<NonNullable<NonNullable<typeof headline>['text']>>): void => {
    setParams((prev) => {
      if (!prev.headline) return prev;
      return {
        ...prev,
        headline: {
          ...prev.headline,
          text: { ...prev.headline.text, ...patch },
        },
      };
    });
  };
  const updateHeadlineAlign = (horizontal: PanelHorizontal): void => {
    setParams((prev) => {
      if (!prev.headline) return prev;
      return { ...prev, headline: { ...prev.headline, alignment: { horizontal } } };
    });
  };
  const updateHeader = (patch: Partial<NonNullable<typeof header>>): void => {
    setParams((prev) => ({
      ...prev,
      header: { ...(prev.header ?? {}), ...patch },
    }));
  };
  const updateHeaderIcon = (patch: Partial<NonNullable<NonNullable<typeof header>['icon']>>): void => {
    setParams((prev) => {
      const cur = prev.header?.icon ?? { name: 'faPaperPlane', color: '#333333', size: 18 };
      return {
        ...prev,
        header: { ...(prev.header ?? {}), icon: { ...cur, ...patch } },
      };
    });
  };
  const updateBodyText = (patch: Partial<typeof body.text>): void => {
    setParams((prev) => ({
      ...prev,
      body: { ...prev.body, text: { ...prev.body.text, ...patch } },
    }));
  };

  const toggleHeadline = (on: boolean): void => {
    setParams((prev) => ({
      ...prev,
      headline: on
        ? prev.headline ?? {
            alignment: { horizontal: 'start' as const },
            text: {
              text: 'Wonik Panel Title',
              fontSize: 18,
              color: '#152A29',
              textAlign: 'left' as const,
              fontWeight: 'bold' as const,
            },
            border: {
              color: '#999999',
              style: 'solid' as const,
              width: 1,
              top: false,
              right: false,
              bottom: true,
              left: false,
            },
          }
        : null,
    }));
  };

  const toggleHeaderIcon = (on: boolean): void => {
    setParams((prev) => ({
      ...prev,
      header: {
        ...(prev.header ?? {}),
        icon: on
          ? prev.header?.icon ?? { name: 'faPaperPlane', color: '#333333', size: 18 }
          : null,
      },
    }));
  };

  const currentRounded = detectRoundedPreset(base.borderRadius?.radius);
  const currentShadow = detectShadowPreset(base.boxShadow);

  const setRounded = (preset: RoundedPreset): void => {
    updateBase({ borderRadius: { radius: ROUNDED_PRESETS[preset] } });
  };
  const setShadow = (preset: ShadowPreset): void => {
    const shadows = SHADOW_PRESETS[preset];
    if (shadows.length === 0) {
      updateBase({ boxShadow: null });
    } else {
      updateBase({ boxShadow: { shadows } });
    }
  };

  const previewIcon = useMemo(
    () => (header?.icon?.name ? iconData[header.icon.name] : undefined),
    [header?.icon?.name, iconData]
  );

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <h3 className={styles.section}>Header</h3>
        <Toggle
          label="Show title"
          value={!!headline}
          onChange={toggleHeadline}
        />
        {headline && (
          <>
            <TextInput
              label="Title text"
              value={headline.text?.text ?? ''}
              onChange={(text) => updateHeadlineText({ text })}
            />
            <Slider
              label="Title size"
              value={headline.text?.fontSize ?? 18}
              onChange={(fontSize) => updateHeadlineText({ fontSize })}
              min={12}
              max={48}
              step={1}
              unit="px"
            />
            <ColorPicker
              label="Title color"
              value={headline.text?.color ?? '#152A29'}
              onChange={(color) => updateHeadlineText({ color })}
              allowDefault={false}
            />
            <SegmentedControl
              label="Title weight"
              value={headline.text?.fontWeight ?? 'bold'}
              onChange={(fontWeight) => updateHeadlineText({ fontWeight })}
              options={FONT_WEIGHT_OPTIONS}
            />
            <SegmentedControl
              label="Title alignment"
              value={headline.alignment?.horizontal ?? 'start'}
              onChange={updateHeadlineAlign}
              options={ALIGN_OPTIONS}
            />
          </>
        )}

        <Toggle
          label="Show icon"
          value={!!header?.icon}
          onChange={toggleHeaderIcon}
        />
        {header?.icon && (
          <>
            <IconPicker
              label="Icon"
              value={header.icon.name}
              onChange={(name) => updateHeaderIcon({ name })}
              iconData={iconData}
            />
            <Slider
              label="Icon size"
              value={header.icon.size}
              onChange={(size) => updateHeaderIcon({ size })}
              min={12}
              max={48}
              step={1}
              unit="px"
            />
            <ColorPicker
              label="Icon color"
              value={header.icon.color}
              onChange={(color) => updateHeaderIcon({ color })}
              allowDefault={false}
            />
          </>
        )}
        <ColorPicker
          label="Header background"
          value={header?.backgroundColor?.color ?? '#eeeeee'}
          onChange={(color) =>
            updateHeader({ backgroundColor: { color } })
          }
          allowDefault={false}
        />

        <h3 className={styles.section}>General</h3>
        <Slider
          label="Width"
          value={typeof base.size?.width === 'number' ? base.size.width : 400}
          onChange={(width) => updateBase({ size: { ...base.size, width } })}
          min={200}
          max={1200}
          step={10}
          unit="px"
        />
        <ColorPicker
          label="Background color"
          value={base.backgroundColor?.color ?? '#ffffff'}
          onChange={(color) => updateBase({ backgroundColor: { color } })}
          allowDefault={false}
        />

        <h4 className={styles.subSection}>Border</h4>
        <ColorPicker
          label="Border color"
          value={base.border?.color ?? '#999999'}
          onChange={(color) => updateBaseBorder({ color })}
          allowDefault={false}
        />
        <Slider
          label="Border width"
          value={base.border?.width ?? 2}
          onChange={(width) => updateBaseBorder({ width })}
          min={0}
          max={10}
          step={1}
          unit="px"
        />
        <Select
          label="Border style"
          value={base.border?.style ?? 'solid'}
          onChange={(style) => updateBaseBorder({ style })}
          options={BORDER_STYLE_OPTIONS}
        />
        <div className={styles.row}>
          <Toggle
            label="Top"
            value={base.border?.top ?? true}
            onChange={(top) => updateBaseBorder({ top })}
          />
          <Toggle
            label="Right"
            value={base.border?.right ?? true}
            onChange={(right) => updateBaseBorder({ right })}
          />
        </div>
        <div className={styles.row}>
          <Toggle
            label="Bottom"
            value={base.border?.bottom ?? true}
            onChange={(bottom) => updateBaseBorder({ bottom })}
          />
          <Toggle
            label="Left"
            value={base.border?.left ?? true}
            onChange={(left) => updateBaseBorder({ left })}
          />
        </div>

        <SegmentedControl
          label="Rounded corners"
          value={currentRounded}
          onChange={setRounded}
          options={ROUNDED_OPTIONS}
        />
        <Select
          label="Shadow"
          value={currentShadow}
          onChange={setShadow}
          options={SHADOW_OPTIONS}
        />

        <h3 className={styles.section}>Body text</h3>
        <Slider
          label="Body font size"
          value={body.text.fontSize}
          onChange={(fontSize) => updateBodyText({ fontSize })}
          min={10}
          max={32}
          step={1}
          unit="px"
        />
        <ColorPicker
          label="Body color"
          value={body.text.color}
          onChange={(color) => updateBodyText({ color })}
          allowDefault={false}
        />
        <SegmentedControl
          label="Body alignment"
          value={body.text.texAlign}
          onChange={(texAlign) => updateBodyText({ texAlign })}
          options={TEXT_ALIGN_OPTIONS}
        />
        <SegmentedControl
          label="Body weight"
          value={body.text.fontWeight}
          onChange={(fontWeight) => updateBodyText({ fontWeight })}
          options={FONT_WEIGHT_OPTIONS}
        />
      </aside>

      <main className={styles.preview}>
        <PanelPreview params={params} icon={previewIcon} />
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

interface PanelPreviewProps {
  params: PanelParams;
  icon: IconMeta | undefined;
}

function PanelPreview({ params, icon }: PanelPreviewProps) {
  const base = params.base ?? {};
  const headline = params.headline;
  const header = params.header;
  const body = params.body;

  const widthCss = typeof base.size?.width === 'number'
    ? `${base.size.width}px`
    : (base.size?.width ?? '400px');

  const borderCss = base.border
    ? buildBorderCss(base.border)
    : {};
  const radiusCss = base.borderRadius
    ? `${base.borderRadius.radius}px`
    : '0';
  const shadowCss = base.boxShadow
    ? base.boxShadow.shadows
        .map((s) => `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`)
        .join(', ')
    : 'none';
  const bgCss = base.backgroundColor?.color ?? '#ffffff';

  const showHeaderArea = !!headline || !!header?.icon;
  const headerBg = header?.backgroundColor?.color ?? 'transparent';
  const alignJustify = headline?.alignment?.horizontal === 'center'
    ? 'center'
    : headline?.alignment?.horizontal === 'end'
      ? 'flex-end'
      : 'flex-start';

  const headlineBorderBottom = headline?.border && headline.border.bottom
    ? `${headline.border.width}px ${headline.border.style} ${headline.border.color}`
    : 'none';

  return (
    <div
      style={{
        width: widthCss,
        background: bgCss,
        borderRadius: radiusCss,
        boxShadow: shadowCss,
        ...borderCss,
        overflow: 'hidden',
      }}
    >
      {showHeaderArea && (
        <div
          style={{
            background: headerBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: alignJustify,
            gap: '8px',
            padding: '10px 12px',
            borderBottom: headlineBorderBottom,
          }}
        >
          {header?.icon && icon && (
            <span
              style={{
                width: header.icon.size,
                height: header.icon.size,
                color: header.icon.color,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <svg
                viewBox={`0 0 ${icon.width ?? 512} ${icon.height ?? 512}`}
                width={header.icon.size}
                height={header.icon.size}
              >
                <path d={icon.path} fill="currentColor" />
              </svg>
            </span>
          )}
          {headline && (
            <span
              style={{
                color: headline.text?.color,
                fontSize: headline.text?.fontSize,
                fontWeight: headline.text?.fontWeight,
                textAlign: headline.text?.textAlign,
              }}
            >
              {headline.text?.text}
            </span>
          )}
        </div>
      )}
      <div
        style={{
          padding: '12px',
          color: body.text.color,
          fontSize: body.text.fontSize,
          fontWeight: body.text.fontWeight,
          textAlign: body.text.texAlign,
          minHeight: '60px',
        }}
      >
        Insert your content in edit mode.
      </div>
    </div>
  );
}

function buildBorderCss(border: NonNullable<PanelParams['base']>['border']): Record<string, string> {
  if (!border) return {};
  const css: Record<string, string> = {};
  const v = `${border.width}px ${border.style} ${border.color}`;
  if (border.top) css.borderTop = v;
  if (border.right) css.borderRight = v;
  if (border.bottom) css.borderBottom = v;
  if (border.left) css.borderLeft = v;
  return css;
}
