import { useId, useState, useEffect } from 'react';
import styles from './ColorPicker.module.css';

const DEFAULT_PALETTE = [
  '#0052CC',
  '#172B4D',
  '#36B37E',
  '#FF5630',
  '#FFAB00',
  '#6554C0',
  '#00B8D9',
  '#97A0AF',
];

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export interface ColorPickerProps {
  value: string;
  onChange: (next: string) => void;
  label: string;
  palette?: string[];
  allowDefault?: boolean;
  disabled?: boolean;
}

export function ColorPicker({
  value,
  onChange,
  label,
  palette = DEFAULT_PALETTE,
  allowDefault = true,
  disabled = false,
}: ColorPickerProps) {
  const id = useId();
  const isDefault = value === 'default';
  const [hexDraft, setHexDraft] = useState(isDefault ? (palette[0] ?? '#0052CC') : value);

  useEffect(() => {
    if (!isDefault) {
      setHexDraft(value);
    }
  }, [value, isDefault]);

  const handleSelectChange = (next: string): void => {
    if (next === 'default') {
      onChange('default');
    } else {
      onChange(hexDraft);
    }
  };

  const handleHexChange = (next: string): void => {
    setHexDraft(next);
    if (HEX_PATTERN.test(next)) {
      onChange(next);
    }
  };

  const handleSwatchClick = (color: string): void => {
    setHexDraft(color);
    onChange(color);
  };

  const hexInvalid = !isDefault && !HEX_PATTERN.test(hexDraft);

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {allowDefault && (
        <select
          id={id}
          className={styles.select}
          value={isDefault ? 'default' : 'custom'}
          onChange={(e) => handleSelectChange(e.target.value)}
          disabled={disabled}
        >
          <option value="default">Default</option>
          <option value="custom">Custom</option>
        </select>
      )}
      <div className={styles.swatchRow}>
        {palette.map((color) => (
          <button
            key={color}
            type="button"
            className={`${styles.swatch} ${value === color ? styles.swatchSelected : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => handleSwatchClick(color)}
            disabled={disabled}
            aria-label={`Pick color ${color}`}
          />
        ))}
      </div>
      {!isDefault && (
        <input
          className={`${styles.hexInput} ${hexInvalid ? styles.hexInputInvalid : ''}`}
          type="text"
          value={hexDraft}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#RRGGBB"
          maxLength={7}
          disabled={disabled}
        />
      )}
    </div>
  );
}
