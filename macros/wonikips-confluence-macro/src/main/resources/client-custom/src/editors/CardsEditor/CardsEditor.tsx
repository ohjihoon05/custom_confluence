import { useState } from 'react';
import {
  Slider,
  TextInput,
  ColorPicker,
  IconPicker,
  type IconMeta,
  SegmentedControl,
  Select,
  Toggle,
} from '../../components';
import {
  CardsParamsSchema,
  type CardsParams,
  type Card,
  type Alignment,
  type CardType,
  type Design,
  type HoverEffect,
} from '../../schema/cards';
import styles from './CardsEditor.module.css';

const ALIGNMENT_OPTIONS = [
  { value: 'left' as Alignment, label: '⇤', ariaLabel: 'Align left' },
  { value: 'center' as Alignment, label: '⇔', ariaLabel: 'Align center' },
  { value: 'right' as Alignment, label: '⇥', ariaLabel: 'Align right' },
];

const CARDTYPE_OPTIONS = [
  { value: 'text' as CardType, label: 'T', ariaLabel: 'Text only' },
  { value: 'icon' as CardType, label: '◯', ariaLabel: 'Icon' },
  { value: 'image' as CardType, label: '▭', ariaLabel: 'Image' },
];

const COLUMNS_OPTIONS = [1, 2, 3, 4, 5, 6].map((n) => ({
  value: n,
  label: '▮'.repeat(n),
  ariaLabel: `${n} columns`,
}));

const DESIGN_OPTIONS = [
  { value: 'light' as Design, label: 'Light' },
  { value: 'dark' as Design, label: 'Dark' },
  { value: 'aura' as Design, label: 'Aura' },
  { value: 'aura-accent' as Design, label: 'Aura Accent' },
  { value: 'fabric' as Design, label: 'Fabric' },
];

const HOVER_OPTIONS = [
  { value: 'none' as HoverEffect, label: 'None' },
  { value: 'elevate' as HoverEffect, label: 'Elevate' },
  { value: 'shrink' as HoverEffect, label: 'Shrink' },
];

const DEFAULT_CARD: Card = {
  title: 'WonikIPS Card',
  body: 'Replace this text with your own content',
  href: '',
  hrefType: 'external',
  hrefTarget: '_blank',
  color: 'default',
  icon: 'faPaperPlane',
};

export interface CardsEditorProps {
  initial?: Partial<CardsParams>;
  iconData?: Record<string, IconMeta>;
  onSave?: (params: CardsParams) => void;
  onCancel?: () => void;
}

type Tab = 'general' | 'content';

export function CardsEditor({
  initial,
  iconData = {},
  onSave,
  onCancel,
}: CardsEditorProps) {
  const [params, setParams] = useState<CardsParams>(() =>
    CardsParamsSchema.parse(initial ?? {})
  );
  const [tab, setTab] = useState<Tab>('general');
  const [selectedCardIdx, setSelectedCardIdx] = useState<number>(0);

  const update = (patch: Partial<CardsParams>): void => {
    setParams((prev) => ({ ...prev, ...patch }));
  };

  const updateCard = (idx: number, patch: Partial<Card>): void => {
    setParams((prev) => ({
      ...prev,
      cards: prev.cards.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }));
  };

  const addCard = (): void => {
    setParams((prev) => ({ ...prev, cards: [...prev.cards, { ...DEFAULT_CARD }] }));
    setSelectedCardIdx(params.cards.length);
    setTab('content');
  };

  const deleteCard = (idx: number): void => {
    setParams((prev) => ({ ...prev, cards: prev.cards.filter((_, i) => i !== idx) }));
    setSelectedCardIdx(Math.max(0, idx - 1));
  };

  const moveCard = (idx: number, dir: -1 | 1): void => {
    const next = idx + dir;
    if (next < 0 || next >= params.cards.length) return;
    setParams((prev) => {
      const arr = [...prev.cards];
      const tmp = arr[idx];
      const swap = arr[next];
      if (tmp && swap) {
        arr[idx] = swap;
        arr[next] = tmp;
      }
      return { ...prev, cards: arr };
    });
    setSelectedCardIdx(next);
  };

  const selectedCard = params.cards[selectedCardIdx];

  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${tab === 'general' ? styles.tabActive : ''}`}
            onClick={() => setTab('general')}
          >
            General
          </button>
          <button
            type="button"
            className={`${styles.tab} ${tab === 'content' ? styles.tabActive : ''}`}
            onClick={() => setTab('content')}
          >
            Content
          </button>
        </div>

        {tab === 'general' && (
          <div className={styles.section}>
            <SegmentedControl
              label="Alignment"
              value={params.alignment}
              onChange={(v) => update({ alignment: v })}
              options={ALIGNMENT_OPTIONS}
            />
            <SegmentedControl
              label="Card Type"
              value={params.cardType}
              onChange={(v) => update({ cardType: v })}
              options={CARDTYPE_OPTIONS}
            />
            <SegmentedControl
              label="Columns"
              value={params.columns}
              onChange={(v) => update({ columns: v })}
              options={COLUMNS_OPTIONS}
              columns={3}
            />
            <Select
              label="Design"
              value={params.design}
              onChange={(v) => update({ design: v })}
              options={DESIGN_OPTIONS}
            />
            <Select
              label="Hover Effect"
              value={params.hoverEffect}
              onChange={(v) => update({ hoverEffect: v })}
              options={HOVER_OPTIONS}
            />
            <h4 className={styles.sectionTitle}>Advanced</h4>
            <Slider
              label="Margin between cards"
              value={params.marginBetween}
              onChange={(v) => update({ marginBetween: v })}
              min={0}
              max={50}
              unit="px"
            />
            <Slider
              label="Padding inside cards"
              value={params.paddingInside}
              onChange={(v) => update({ paddingInside: v })}
              min={0}
              max={50}
              unit="px"
            />
            <Toggle
              label="Full width of parent"
              value={params.fullWidth}
              onChange={(v) => update({ fullWidth: v })}
            />
          </div>
        )}

        {tab === 'content' && (
          <div className={styles.section}>
            {params.cards.length === 0 ? (
              <p style={{ color: '#6B778C', fontSize: 13 }}>
                No cards yet. Click + in preview to add one.
              </p>
            ) : selectedCard ? (
              <>
                <TextInput
                  label="Title"
                  value={selectedCard.title}
                  onChange={(v) => updateCard(selectedCardIdx, { title: v })}
                />
                <TextInput
                  label="Content"
                  value={selectedCard.body}
                  onChange={(v) => updateCard(selectedCardIdx, { body: v })}
                  multiline
                  rows={3}
                />
                <TextInput
                  label="Link"
                  value={selectedCard.href}
                  onChange={(v) => updateCard(selectedCardIdx, { href: v })}
                  placeholder="https://..."
                />
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() => moveCard(selectedCardIdx, -1)}
                    disabled={selectedCardIdx === 0}
                  >
                    ← Move backwards
                  </button>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() => moveCard(selectedCardIdx, 1)}
                    disabled={selectedCardIdx === params.cards.length - 1}
                  >
                    Move forwards →
                  </button>
                </div>
                <hr className={styles.divider} />
                <ColorPicker
                  label="Color"
                  value={selectedCard.color}
                  onChange={(v) => updateCard(selectedCardIdx, { color: v })}
                />
                <hr className={styles.divider} />
                <IconPicker
                  label="Icon"
                  value={selectedCard.icon}
                  onChange={(v) => updateCard(selectedCardIdx, { icon: v })}
                  iconData={iconData}
                  rows={5}
                />
                <hr className={styles.divider} />
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={() => deleteCard(selectedCardIdx)}
                >
                  Delete Selected Card
                </button>
              </>
            ) : null}
          </div>
        )}

        <hr className={styles.divider} />
        <div className={styles.cardActions}>
          {onCancel && (
            <button type="button" className={styles.btn} onClick={onCancel}>
              Close
            </button>
          )}
          {onSave && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => onSave(params)}
            >
              Save
            </button>
          )}
        </div>
      </div>

      <div className={styles.preview}>
        <div
          className={styles.cardGrid}
          style={{
            gridTemplateColumns: `repeat(${params.columns}, 1fr)`,
            gap: `${params.marginBetween}px`,
          }}
        >
          {params.cards.map((card, idx) => {
            const alignClass =
              params.alignment === 'left'
                ? styles.cardAlignLeft
                : params.alignment === 'right'
                ? styles.cardAlignRight
                : styles.cardAlignCenter;
            const hoverClass =
              params.hoverEffect === 'elevate'
                ? styles.cardElevate
                : params.hoverEffect === 'shrink'
                ? styles.cardShrink
                : '';
            return (
            <div
              key={idx}
              className={`${styles.card} ${alignClass} ${hoverClass} ${
                idx === selectedCardIdx ? styles.cardSelected : ''
              }`}
              onClick={() => {
                setSelectedCardIdx(idx);
                setTab('content');
              }}
              style={{
                padding: params.paddingInside > 0 ? `${params.paddingInside + 16}px` : undefined,
                color:
                  card.color !== 'default' && card.color.startsWith('#')
                    ? card.color
                    : undefined,
              }}
            >
              {params.cardType !== 'text' && (
                <div className={styles.cardIcon}>
                  <svg viewBox="0 0 512 512" width="32" height="32">
                    <path
                      d={iconData[card.icon]?.path ?? ''}
                      fill="currentColor"
                    />
                  </svg>
                </div>
              )}
              <div className={styles.cardTitle}>{card.title}</div>
              <div className={styles.cardBody}>{card.body}</div>
            </div>
            );
          })}
          <div className={styles.addCard} onClick={addCard}>
            +
          </div>
        </div>
      </div>
    </div>
  );
}
