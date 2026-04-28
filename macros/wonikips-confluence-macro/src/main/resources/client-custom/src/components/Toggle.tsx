import { useId } from 'react';
import styles from './Toggle.module.css';

export interface ToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({ value, onChange, label, disabled = false }: ToggleProps) {
  const id = useId();
  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={value}
        className={`${styles.button} ${value ? styles.buttonOn : ''}`}
        onClick={() => onChange(!value)}
        disabled={disabled}
      />
    </div>
  );
}
