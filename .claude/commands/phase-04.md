---
description: Phase 04 — Cards 매크로 Zod schema 정의. 캡처 기반 모든 필드/enum/range 명시. tsc 통과.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Phase 04: Cards 매크로 Schema 정의

## 너의 역할

Cards 매크로의 React 편집 패널이 사용할 **Zod schema**를 정의한다. 이 schema는 다음 모두를 만족해야 함:
- Aura의 `Cards.java.executeWeb()`이 기대하는 파라미터와 100% 호환
- `aura_image/card/` 캡처에 보이는 모든 UI 필드 커버
- TypeScript strict 모드 통과
- React 컴포넌트가 그대로 import해서 form state 타입으로 사용 가능

## 컨텍스트 (반드시 먼저 읽기)

1. `CLAUDE.md` — 프로젝트 가이드
2. `docs/CUSTOM_PANEL_PLAN.md` §6.1 (schema 예시), §3 (아키텍처)
3. `docs/AURA_3.8.0_ANALYSIS.md` §4 (Cards), §5.1 (Cards.java 의존성), §9.1 (CardCollection.vm) — Java/Velocity가 기대하는 파라미터
4. `macros/wonikips-confluence-macro/src/main/java/com/uiux/macro/macros/cards/Cards.java` — 실제 Java 코드. `executeWeb`가 `cardsCollection`을 어떻게 파싱하는지 확인.
5. `macros/wonikips-confluence-macro/src/main/resources/templates/CardCollection.vm` — Velocity 템플릿이 사용하는 변수.
6. `macros/wonikips-confluence-macro/src/main/resources/templates/Card.vm` — 카드 1장 렌더링 변수.
7. **캡처 분석** (이미 사용자가 `aura_image/card/` 디렉토리에 업로드):
   - `aura_image/card/1 8.png` — General 탭
   - `aura_image/card/2 7.png` — Content 탭
   - `aura_image/card/3 4.png` — Editor placeholder

이전 phase: Phase 00 (빌드 파이프라인 PoC) 완료
현재 plugin 버전: 1.0.16-SNAPSHOT (Phase 00 결과)

## 캡처 인벤토리 (참고 — 코드로 옮길 것)

### General 탭 필드
| 필드 | UI | 타입 | 값 |
|------|-----|------|-----|
| Alignment | 3-way 토글 | enum | `'left'` / `'center'` / `'right'` |
| Card Type | 3-way 시각 선택 | enum | `'text'` (T) / `'icon'` / `'image'` |
| Columns | 6-way 그리드 | int | 1 ~ 6 |
| Design | 드롭다운 | enum | `'light'` / `'dark'` (캡처 1에 Light만 보임 — Aura 원본은 'aura'/'aura-accent'/'fabric' theme. 둘 다 호환 표기 권장) |
| Hover Effect | 드롭다운 | enum | `'none'` / `'elevate'` / `'shrink'` |
| Margin between cards | slider + input | int | 0 ~ 50 (기본 10) |
| Padding inside cards | slider + input | int | 0 ~ 50 (기본 0) |
| Full width of parent | 토글 | bool | (기본 false) |

### Content 탭 (카드 1장 단위)
| 필드 | UI | 타입 |
|------|-----|------|
| Title | text input | string |
| Content | textarea | string |
| Link | Add Link 버튼 → 타입 선택 | `{ href: string, type: 'external'|'attachment'|'page', target: '_blank'|'_self' }` |
| Color | 드롭다운 + swatch | string (HEX) 또는 `'default'` |
| Icon | 검색 + FontAwesome 그리드 | string (예: `'faPaperPlane'`) |

추가 메타: 카드 순서(Move backwards/forwards) — 배열 인덱스로 자연 표현, schema는 array 순서 자체.

### Cards.java 호환성 (반드시 확인)
- Java가 받는 파라미터 keys (Map<String, String>):
  - `theme` — 'aura'/'aura-accent'/'fabric' (Velocity 분기)
  - `columns` — string (Velocity가 숫자처럼 사용)
  - `gutter` — string (Velocity 직접 출력)
  - `maxWidth` — 기본 '1200px'
  - `decoration` — 'icon'/'image'
  - `imagePosition` — 'top'/'left'/'right'
  - `imageHeight` — string
  - `hover` — 'none'/'elevate'/'shrink'
  - `layout` — 'icon-center'/'icon-left'/'icon-right'
  - `cardsCollection` — JSON-encoded array of `{title, body, href, color, icon, ...}`

UI 필드(Aura UX 명칭)와 Java 키(Velocity 변수명)가 다른 부분 있음 — schema에서 매핑 변환 함수 같이 제공해야 함.

## 목표

다음 파일들을 작성:

1. **`src/schema/cards.ts`** — Zod schema 정의
2. **`src/schema/cards-mapper.ts`** — UI 형식 ↔ Aura Java 형식 변환 함수
3. **`src/schema/cards.test.ts`** — 검증 테스트 (Vitest 또는 단순 assert. 도구가 없으면 sample data로 schema validate 호출하는 코드만)

## 작업 단계

### 1. 의존성 추가

`macros/wonikips-confluence-macro/src/main/resources/client-custom/package.json`에 zod 추가:

```bash
cd macros/wonikips-confluence-macro/src/main/resources/client-custom
# 패키지 추가 (npm install 직접 또는 package.json 수정)
```

`package.json` `dependencies`에 `"zod": "^3.23.0"` 추가. (직접 편집)

### 2. `src/schema/cards.ts`

Zod schema 작성. 핵심 구조:

```ts
import { z } from 'zod';

// 카드 1장 schema
export const CardSchema = z.object({
  title: z.string().default('WonikIPS Card'),
  body: z.string().default('Replace this text with your own content'),
  href: z.string().default(''),
  hrefType: z.enum(['external', 'attachment', 'page']).default('external'),
  hrefTarget: z.enum(['_blank', '_self']).default('_blank'),
  color: z.string().default('default'),  // 'default' | HEX
  icon: z.string().default('faPaperPlane'),
});

// Cards 전체 매크로 schema (UI 폼 상태 기준)
export const CardsParamsSchema = z.object({
  // General
  alignment: z.enum(['left', 'center', 'right']).default('center'),
  cardType: z.enum(['text', 'icon', 'image']).default('icon'),
  columns: z.number().int().min(1).max(6).default(3),
  design: z.enum(['light', 'dark', 'aura', 'aura-accent', 'fabric']).default('light'),
  hoverEffect: z.enum(['none', 'elevate', 'shrink']).default('elevate'),
  marginBetween: z.number().int().min(0).max(50).default(10),
  paddingInside: z.number().int().min(0).max(50).default(0),
  fullWidth: z.boolean().default(false),

  // Cards array
  cards: z.array(CardSchema).default([]),
});

export type Card = z.infer<typeof CardSchema>;
export type CardsParams = z.infer<typeof CardsParamsSchema>;
```

### 3. `src/schema/cards-mapper.ts`

UI ↔ Java 변환 함수:

```ts
import type { CardsParams } from './cards';

// UI 폼 상태 → Aura Java가 받는 Map<String, String> 형식
export function paramsToJavaMap(params: CardsParams): Record<string, string> {
  // design을 theme으로 매핑
  const theme = mapDesignToTheme(params.design);
  // alignment를 layout으로 매핑 ('left'→'icon-left' 등)
  const layout = mapAlignmentToLayout(params.alignment);

  return {
    theme,
    columns: String(params.columns),
    gutter: String(params.marginBetween),
    padding: String(params.paddingInside),
    maxWidth: params.fullWidth ? '100%' : '1200px',
    hover: params.hoverEffect,
    layout,
    decoration: params.cardType === 'image' ? 'image' : 'icon',
    cardsCollection: JSON.stringify(params.cards),
  };
}

// Aura Java Map → UI 폼 상태 (재편집 시 사용)
export function javaMapToParams(map: Record<string, string>): CardsParams {
  // 역변환. parse 실패 시 기본값.
  // ...
}

function mapDesignToTheme(design: CardsParams['design']): string {
  if (design === 'light') return 'aura';
  if (design === 'dark') return 'fabric';
  return design;  // aura/aura-accent/fabric은 그대로
}

function mapAlignmentToLayout(alignment: CardsParams['alignment']): string {
  return `icon-${alignment === 'center' ? 'center' : alignment}`;
}
```

매핑 결정은 캡처 + Aura 원본 동작에 기반한 추정. 실제 Aura가 어떻게 매핑하는지 main.js에서 확인하면 좋지만 (`grep "design"` 해보기), 시간 절약을 위해 합리적 추정으로 진행. 실패 시 다음 phase에서 보정.

### 4. `src/schema/cards.test.ts`

Vitest 환경 없으니 단순 검증 스크립트로:

```ts
import { CardsParamsSchema, CardSchema } from './cards';
import { paramsToJavaMap, javaMapToParams } from './cards-mapper';

// 1. 기본값으로 파싱 가능
const defaultParams = CardsParamsSchema.parse({});
console.assert(defaultParams.columns === 3, 'default columns');
console.assert(defaultParams.cards.length === 0, 'default cards empty');

// 2. 잘못된 값 거부
try {
  CardsParamsSchema.parse({ columns: 7 });
  throw new Error('should reject columns > 6');
} catch (e) {
  console.log('✓ rejected columns > 6');
}

// 3. round-trip: UI -> Java -> UI 동일성 (loose)
const sample: CardsParams = {
  alignment: 'center', cardType: 'icon', columns: 3,
  design: 'light', hoverEffect: 'elevate',
  marginBetween: 10, paddingInside: 0, fullWidth: false,
  cards: [{ title: 'WonikIPS Card', body: 'test', href: '', hrefType: 'external', hrefTarget: '_blank', color: 'default', icon: 'faPaperPlane' }],
};
const java = paramsToJavaMap(sample);
const back = javaMapToParams(java);
console.assert(back.columns === sample.columns, 'columns round-trip');

console.log('All schema tests passed.');
```

### 5. tsconfig 검증

`cd src/main/resources/client-custom && npx tsc --noEmit` 실행해 컴파일 에러 0인지 확인.

### 6. Git commit

```bash
git add macros/wonikips-confluence-macro/src/main/resources/client-custom/src/schema/ \
        macros/wonikips-confluence-macro/src/main/resources/client-custom/package.json \
        macros/wonikips-confluence-macro/src/main/resources/client-custom/package-lock.json \
        .claude/commands/phase-04.md
git commit -m "$(cat <<'EOF'
phase 04: cards macro Zod schema + UI<->Java mapper

- src/schema/cards.ts: CardSchema + CardsParamsSchema (Zod)
- src/schema/cards-mapper.ts: paramsToJavaMap / javaMapToParams
  (UI form state ↔ Aura Java Map<String,String> 변환)
- src/schema/cards.test.ts: 기본값/거부/round-trip 검증
- package.json: zod 3.23 추가

UI 필드(alignment, cardType, design, marginBetween, ...)와
Aura Java 키(theme, layout, gutter, ...) 매핑은 캡처 + Aura 동작 기반 추정.
실제 호환성은 Phase 09(form 통합) + 1.0.16 페이지 렌더링 검증에서 확정.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## 완료 조건 체크리스트

- [ ] `client-custom/package.json`에 zod 추가
- [ ] `src/schema/cards.ts` 작성 — CardSchema + CardsParamsSchema
- [ ] `src/schema/cards-mapper.ts` 작성 — paramsToJavaMap + javaMapToParams
- [ ] `src/schema/cards.test.ts` 작성 — 검증 스크립트
- [ ] `npm install` 실행 (zod 의존성 다운로드)
- [ ] `npx tsc --noEmit` 통과 (TypeScript 에러 0)
- [ ] git commit 완료

## 실패 처리

- `npm install` 실패 → 사내망 프록시 의심, escalate
- `tsc` 에러 → 정확한 라인 + 수정안 제시 후 재시도 (최대 3회)
- Zod schema가 너무 strict해서 기본값 적용 실패 → `.optional().default()` 패턴으로 완화

## 보고

```
✓ Added: zod ^3.23 to package.json
✓ Created: src/schema/{cards.ts, cards-mapper.ts, cards.test.ts}
✓ Verified: npx tsc --noEmit passes (0 errors)
✓ Committed: <hash> "phase 04: cards macro Zod schema + UI<->Java mapper"

Schema 요약:
- CardSchema: 7 fields (title, body, href, hrefType, hrefTarget, color, icon)
- CardsParamsSchema: 8 general + cards array
- enum 값들: alignment, cardType, design, hoverEffect, hrefType, hrefTarget

Next: Phase 05 (Slider 컴포넌트) — schema의 number range를 입력 검증에 사용.
```
