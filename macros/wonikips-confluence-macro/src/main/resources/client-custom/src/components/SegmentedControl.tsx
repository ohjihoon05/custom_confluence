import { type ReactNode } from 'react';
import styles from './SegmentedControl.module.css';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
}

export interface SegmentedControlProps<T extends string | number> {
  value: T;
  onChange: (next: T) => void;
  label: string;
  options: SegmentedOption<T>[];
  columns?: number;
  disabled?: boolean;
}

export function SegmentedControl<T extends string | number>({
  value,
  onChange,
  label,
  options,
  columns,
  disabled = false,
}: SegmentedControlProps<T>) {
  const cols = columns ?? options.length;
  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>{label}</div>
      <div
        className={styles.group}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            className={`${styles.option} ${opt.value === value ? styles.optionSelected : ''}`}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            aria-label={opt.ariaLabel ?? String(opt.value)}
            aria-pressed={opt.value === value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
