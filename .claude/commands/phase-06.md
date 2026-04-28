---
description: Phase 06 — TextInput 컴포넌트. 단일줄/멀티줄 텍스트 입력.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Phase 06: TextInput 컴포넌트

## 컨텍스트

1. `CLAUDE.md`, `docs/CUSTOM_PANEL_PLAN.md` §6.2
2. **참조 캡처**: `aura_image/card/2 7.png` Content 탭의 Title input + Content textarea
3. Schema: `src/schema/cards.ts` — Card.title (string), Card.body (string)

## 목표

`src/components/TextInput.tsx` — 단독 컴포넌트, 다른 컴포넌트 import 없음.

## Props 명세

```ts
interface TextInputProps {
  value: string;
  onChange: (next: string) => void;
  label: string;
  placeholder?: string;
  multiline?: boolean;   // true면 textarea
  rows?: number;         // multiline일 때만 (기본 4)
  maxLength?: number;
  disabled?: boolean;
}
```

## UI 레이아웃 (캡처 기반)

단일줄:
```
┌─────────────────────────────────────┐
│ Title                               │
│ ┌─────────────────────────────────┐ │
│ │ Aura Card                       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

멀티줄: 같은 구조에서 input 대신 textarea, rows={rows}. 자동 height growth는 안 함 (rows 고정).

## 스타일

`src/components/TextInput.module.css`:
- label: 12px, color `#6B778C`, margin-bottom 4px
- input/textarea: 14px, padding 8px 12px, border `1px solid #DFE1E6`, border-radius 4px
- focus border: `#4C9AFF`, outline 없음, box-shadow `0 0 0 2px rgba(76, 154, 255, 0.2)`
- textarea: resize: vertical (사용자 height 조절 가능)
- disabled 상태: 배경 `#F4F5F7`, color `#A5ADBA`

## 작업 단계

1. `src/components/TextInput.tsx`
2. `src/components/TextInput.module.css`
3. `src/components/index.ts`에 `export { TextInput } from './TextInput';` 추가 (없으면 새로 만들고 다른 컴포넌트 export 자리도 비워둠)
4. **commit 안 함**

## 검증

`cd .../client-custom && npx tsc --noEmit` 0 errors.

## 보고

```
✓ Created: src/components/TextInput.tsx
✓ Created: src/components/TextInput.module.css
✓ Updated: src/components/index.ts (export TextInput)
✓ Verified: npx tsc --noEmit passes
- staged: false (parallel safety)
```
