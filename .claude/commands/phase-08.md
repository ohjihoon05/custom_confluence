---
description: Phase 08 — IconPicker 컴포넌트. FontAwesome icondata.json 재활용. 검색 + 그리드.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Phase 08: IconPicker 컴포넌트

## 컨텍스트

1. `CLAUDE.md`, `docs/CUSTOM_PANEL_PLAN.md` §6.2
2. **참조 캡처**: `aura_image/card/2 7.png` Decoration > Icon 섹션
   - "Search for icon" input + 6×5 아이콘 그리드 (FontAwesome solid)
3. **데이터 소스**: `macros/wonikips-confluence-macro/src/main/resources/templates/icondata.json` (1.1MB FontAwesome 메타).
   - 구조: `{ "faAd": { "path": "M157...", ... }, "faPaperPlane": {...}, ... }`
4. Schema: `src/schema/cards.ts` — `Card.icon: string` (key 이름, 예: `'faPaperPlane'`)

## 목표

`src/components/IconPicker.tsx` — 단독 컴포넌트.

## Props 명세

```ts
interface IconPickerProps {
  value: string;            // 'faPaperPlane' 등
  onChange: (next: string) => void;
  label: string;
  iconData: Record<string, IconMeta>;  // icondata.json 직접 받음 (caller가 import 후 전달)
  rows?: number;            // 보일 행 수 (기본 5, 스크롤로 더 보기)
  iconsPerRow?: number;     // 기본 6
}

interface IconMeta {
  path: string;
  width?: number;
  height?: number;
  // icondata.json의 다른 필드들도 optional로 가질 수 있음
}
```

`iconData`를 props로 받는 이유: 1.1MB 파일을 컴포넌트가 직접 import하면 dev 서버/번들 크기 폭발. caller가 lazy load 또는 lib/icondata.ts에서 가공해서 전달.

## UI 레이아웃 (캡처 기반)

```
Icon
┌───────────────────────────┐
│ 🔍 Search for icon        │   ← 검색 input
└───────────────────────────┘
┌──┬──┬──┬──┬──┬──┐
│• │  │  │  │  │  │   ← 그리드 (• = 선택 표시), 6 per row
├──┼──┼──┼──┼──┼──┤
│  │  │  │  │  │  │
├──┼──┼──┼──┼──┼──┤
│  │  │  │  │  │  │
└──┴──┴──┴──┴──┴──┘   ← 5 rows 표시, 스크롤 가능
```

- 각 셀: 아이콘 SVG (24px × 24px) + 호버 시 아이콘명 툴팁
- 검색: 키 이름의 'fa' 제거 후 단어 단위 부분 매칭 (case-insensitive). 예: 'paper'로 검색 → faPaperPlane, faNewspaper 등
- selected는 진한 배경 + border `2px solid #0052CC`
- 셀 클릭 시 `onChange(key)`

## SVG 렌더링

icondata.json의 path 데이터를 svg 태그로 렌더:
```tsx
<svg viewBox={`0 0 ${meta.width ?? 512} ${meta.height ?? 512}`} width="20" height="20">
  <path d={meta.path} fill="currentColor" />
</svg>
```

## 스타일

`src/components/IconPicker.module.css`:
- 그리드: `display: grid; grid-template-columns: repeat(var(--cols, 6), 1fr); gap: 4px;`
- 셀: 36px × 36px, border-radius 4px, hover background `#F4F5F7`, selected `#DEEBFF` + border `2px solid #0052CC`
- 셀 색: 기본 `#172B4D`, hover/selected `#0052CC`
- 검색 input: TextInput과 같은 토큰

## 작업 단계

1. `src/components/IconPicker.tsx`
2. `src/components/IconPicker.module.css`
3. `src/components/index.ts`에 export 추가
4. 만약 `iconData` 형식이 README 등 너무 풍부한 메타로 들어와있으면, 컴포넌트는 `path` 필드만 신뢰하고 나머지는 optional로 처리
5. **commit 안 함**

## 검증

`npx tsc --noEmit` 0 errors.

`icondata.json`을 실제로 import하는 demo 코드까지는 작성 안 해도 됨. 컴포넌트 시그니처만 통과하면 OK.

## 보고

```
✓ Created: src/components/IconPicker.tsx
✓ Created: src/components/IconPicker.module.css
✓ Updated: src/components/index.ts (export IconPicker)
✓ Verified: npx tsc --noEmit passes
- staged: false
```
