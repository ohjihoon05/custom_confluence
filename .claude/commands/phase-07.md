---
description: Phase 07 — ColorPicker 컴포넌트. Default/Custom 드롭다운 + 팔레트 swatches + HEX input.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Phase 07: ColorPicker 컴포넌트

## 컨텍스트

1. `CLAUDE.md`, `docs/CUSTOM_PANEL_PLAN.md` §6.2
2. **참조 캡처**: `aura_image/card/2 7.png` Appearance > Color 섹션
   - 'Default' 드롭다운 + 6개 swatch (왼쪽이 selected)
3. Schema: `src/schema/cards.ts` — `Card.color: string` (`'default'` 또는 HEX)

## 목표

`src/components/ColorPicker.tsx` — 단독 컴포넌트.

## Props 명세

```ts
interface ColorPickerProps {
  value: string;          // 'default' | '#RRGGBB'
  onChange: (next: string) => void;
  label: string;
  palette?: string[];     // HEX 배열 (옵션). 미지정 시 기본 8색
  allowDefault?: boolean; // true면 'Default' 옵션 표시 (기본 true)
  disabled?: boolean;
}
```

기본 palette (`palette` 미지정 시): `['#0052CC','#172B4D','#36B37E','#FF5630','#FFAB00','#6554C0','#00B8D9','#97A0AF']`

## UI 레이아웃 (캡처 기반)

```
Color
┌───────────────────────────┐
│ Default            ▼      │   ← 드롭다운: 'Default' / 'Custom'
└───────────────────────────┘
┌──┬──┬──┬──┬──┬──┐
│• │  │  │  │  │  │  ← swatch 배열 (• = 선택 표시)
└──┴──┴──┴──┴──┴──┘

(Custom 선택 시 추가)
┌─────────────────┐
│ #FF5630         │   ← HEX input
└─────────────────┘
```

- 드롭다운 변경 → 'Default' 선택 시 onChange('default'), 'Custom' 선택 시 onChange(현재 HEX 또는 palette 첫 번째)
- swatch 클릭 → 해당 HEX로 onChange (자동으로 'Custom' 모드 전환)
- HEX input → 유효한 HEX(`/^#[0-9A-Fa-f]{6}$/`)일 때만 onChange. invalid면 빨간 border 표시

## 스타일

`src/components/ColorPicker.module.css`:
- swatch: 32px × 32px, border-radius 4px, border `2px solid transparent`, selected 시 `2px solid #0052CC`
- swatch row: gap 6px, flex
- 드롭다운 + HEX input: TextInput과 같은 디자인 토큰

## 작업 단계

1. `src/components/ColorPicker.tsx`
2. `src/components/ColorPicker.module.css`
3. `src/components/index.ts`에 export 추가
4. **commit 안 함**

## 검증

`npx tsc --noEmit` 0 errors.

## 보고

```
✓ Created: src/components/ColorPicker.tsx
✓ Created: src/components/ColorPicker.module.css
✓ Updated: src/components/index.ts (export ColorPicker)
✓ Verified: npx tsc --noEmit passes
- staged: false
```
