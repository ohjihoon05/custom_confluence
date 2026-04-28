import { useId, useMemo, useState } from 'react';
import styles from './IconPicker.module.css';

export interface IconMeta {
  path: string;
  width?: number;
  height?: number;
}

export interface IconPickerProps {
  value: string;
  onChange: (next: string) => void;
  label: string;
  iconData: Record<string, IconMeta>;
  rows?: number;
  iconsPerRow?: number;
}

function normalizeKey(key: string): string {
  return key.replace(/^fa/, '').toLowerCase();
}

export function IconPicker({
  value,
  onChange,
  label,
  iconData,
  rows = 5,
  iconsPerRow = 6,
}: IconPickerProps) {
  const id = useId();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const allKeys = Object.keys(iconData);
    if (!query.trim()) return allKeys;
    const q = query.toLowerCase();
    return allKeys.filter((k) => normalizeKey(k).includes(q));
  }, [iconData, query]);

  const cellSize = 36;
  const gap = 4;
  const padding = 8;
  const gridHeight = rows * cellSize + (rows - 1) * gap + padding * 2;

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={styles.search}
        type="text"
        placeholder="Search for icon"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${iconsPerRow}, 1fr)`,
          maxHeight: gridHeight,
        }}
      >
        {filtered.length === 0 ? (
          <div className={styles.empty} style={{ gridColumn: `span ${iconsPerRow}` }}>
            No icons match "{query}"
          </div>
        ) : (
          filtered.map((key) => {
            const meta = iconData[key];
            if (!meta) return null;
            const selected = key === value;
            return (
              <button
                key={key}
                type="button"
                className={`${styles.cell} ${selected ? styles.cellSelected : ''}`}
                onClick={() => onChange(key)}
                title={key}
                aria-label={key}
              >
                <svg
                  viewBox={`0 0 ${meta.width ?? 512} ${meta.height ?? 512}`}
                  width="20"
                  height="20"
                >
                  <path d={meta.path} fill="currentColor" />
                </svg>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
