import { useId } from 'react';
import styles from './Slider.module.css';

export interface SliderProps {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  disabled?: boolean;
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  unit,
  disabled = false,
}: SliderProps) {
  const id = useId();

  const clamp = (n: number): number => {
    if (Number.isNaN(n)) return min;
    return Math.min(max, Math.max(min, n));
  };

  const handleNumberChange = (raw: string): void => {
    if (raw === '') return;
    const n = parseInt(raw, 10);
    onChange(clamp(n));
  };

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.row}>
        <input
          id={id}
          className={styles.track}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(clamp(parseInt(e.target.value, 10)))}
          disabled={disabled}
        />
        <input
          className={styles.numberInput}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => handleNumberChange(e.target.value)}
          disabled={disabled}
        />
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
    </div>
  );
}
