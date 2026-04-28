import { useId } from 'react';
import styles from './TextInput.module.css';

export interface TextInputProps {
  value: string;
  onChange: (next: string) => void;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
}

export function TextInput({
  value,
  onChange,
  label,
  placeholder,
  multiline = false,
  rows = 4,
  maxLength,
  disabled = false,
}: TextInputProps) {
  const id = useId();

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          className={styles.textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
        />
      ) : (
        <input
          id={id}
          className={styles.input}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
        />
      )}
    </div>
  );
}
