---
description: Phase 05 — Slider 컴포넌트. 숫자 슬라이더 + numeric input. WonikIPS 디자인.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Phase 05: Slider 컴포넌트

## 컨텍스트

1. `CLAUDE.md`, `docs/CUSTOM_PANEL_PLAN.md` §6.2 (Slider props)
2. `docs/AURA_3.8.0_ANALYSIS.md` §17 (절대 금지 식별자)
3. **참조 캡처**: `aura_image/card/1 8.png` Advanced 섹션의 "Margin between cards" 슬라이더 (label + horizontal track + numeric input + 단위)
4. Schema 참조: `macros/wonikips-confluence-macro/src/main/resources/client-custom/src/schema/cards.ts` — `marginBetween`, `paddingInside` 가 0~50 int

## 목표

`src/components/Slider.tsx` 단독 컴포넌트 작성. 다른 컴포넌트와 완전 독립. 컴포넌트 import 없이 React만 사용.

## Props 명세

```ts
interface SliderProps {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;        // 기본 1
  label: string;
  unit?: string;        // 'px', '%' 등 (옵션)
  disabled?: boolean;
}
```

## UI 레이아웃 (캡처 기반)

```
┌─────────────────────────────────────┐
│ Margin between cards                │   ← label
│ ┌───────────────┬───────┐           │
│ │  ────●────────│  10   │  px       │   ← track + thumb + numeric input + unit
│ └───────────────┴───────┘           │
└─────────────────────────────────────┘
```

- label은 컴포넌트 위 (한 줄)
- 슬라이더 track + 숫자 input은 같은 줄에 나란히 (track flex:1, input width 60px)
- numeric input과 슬라이더는 양방향 동기화 (input 변경 → onChange, slider 변경 → onChange)
- input value 범위 밖이면 clamp 후 onChange

## 스타일

`src/components/Slider.module.css` 별도 파일. 디자인 토큰은 임시 하드코딩 OK (Phase 4에서 토큰화):
- 슬라이더 active 색: `#0052CC` (Atlassian blue 톤)
- 슬라이더 track 배경: `#DFE1E6`
- 입력박스 border: `1px solid #DFE1E6`, focus 시 `#4C9AFF`
- 폰트: 시스템 sans-serif, 14px

## 작업 단계

1. `src/components/Slider.tsx` 작성 (React functional component, TypeScript strict)
2. `src/components/Slider.module.css` 작성
3. `src/components/index.ts`가 있으면 export 추가, 없으면 신규 작성하여 `export { Slider } from './Slider';`
4. (선택) `src/components/Slider.demo.tsx` — Vite dev에서 단독 검증용 페이지. main.tsx가 demo 모드일 때만 마운트하는 식이어도 OK. 강제 아님.
5. **commit 안 함** (병렬 안전을 위해). 작업 완료 보고만.

## 검증

`cd macros/wonikips-confluence-macro/src/main/resources/client-custom && npx tsc --noEmit` 출력 0이어야 함.

## 보고

```
✓ Created: src/components/Slider.tsx (XXX lines)
✓ Created: src/components/Slider.module.css (YYY lines)
✓ Updated: src/components/index.ts (export Slider)
✓ Verified: npx tsc --noEmit passes
- staged: false (parallel safety; user commits later)
```
