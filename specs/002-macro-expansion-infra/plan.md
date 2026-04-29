# Implementation Plan: 매크로 확장 인프라

> spec.md 기준 기술 구현 계획.
> 작성: 2026-04-29

## 1. 아키텍처 개요

### 1.1 레이어 구조

```
src/
├── main.tsx                # 진입점. 'macros' 디렉토리 import + V4 host 등록
├── host/
│   ├── v4-adapter.ts       # monkey-patch + macro-registry 조회 (변경)
│   ├── macro-registry.ts   # 매크로 핸들러 등록/조회 (신규)
│   ├── dialog.module.css
│   └── types.ts
├── macros/                 # 매크로 self-register 디렉토리 (신규)
│   ├── index.ts            # barrel: 모든 매크로 import
│   └── cards.ts            # Cards self-register (신규 — 마이그레이션)
├── editors/CardsEditor/    # 기존 그대로
├── components/             # 기존 그대로
└── schema/                 # 기존 그대로
```

### 1.2 설계 결정 + 근거

| 결정 | 근거 |
|------|------|
| **레지스트리 패턴** (단일 `Map<name, opener>`) | spec C-2 + 1:1 매칭 보장. host/v4-adapter.ts 수정 0줄로 매크로 추가 가능 (SC-1) |
| **eager self-register** (import 시 즉시 등록) | spec C-1 + Vite IIFE에서 lazy import 분리 효과 없음 |
| **macros/index.ts barrel** | spec C-3 + main.tsx 수정 0줄 (SC-2). 새 매크로는 `macros/` 디렉토리에 파일만 추가 |
| **Cards 마이그레이션 동일 commit** | spec C-3 + 인프라 검증의 첫 사례. 분리 시 인프라 동작 검증 불가 |
| **Map vs object** (TypeScript) | `Map<string, MacroEntry>`이 type-safe하고 has/get/set 명확 |
| **monkey-patch 유지** | Cards 1.0.21에서 검증된 유일한 Aura 후속 등록 우회 방법 (ADR-016) |
| **git worktree** vs branch switching | worktree는 디스크 4배지만 npm install 캐시 공유, 빠른 iteration |
| **pom.xml 버전 정책** (worktree에서 bump 금지) | spec §4.4 + 머지 충돌 회피 |

### 1.3 데이터 흐름

```
[Confluence 페이지 로드]
        ↓
[wonikips-editor.js 실행]
        ↓
main.tsx
  → import './macros'                    (eager)
        ↓
macros/index.ts
  → import './cards'  → cards.ts: registerMacro('aura-cards', { opener: openCardsDialog })
  → import './button' → button.ts: registerMacro('aura-button', { opener: openButtonDialog })  (향후)
  → ...
        ↓
main.tsx
  → createV4Host() → registerCardsMacro()
        ↓
host/v4-adapter.ts: installMonkeyPatch()
  → AJS.MacroBrowser.setMacroJsOverride 자체를 가로챔
  → patched(name, override) 호출 시
       → if (registry.has(name)) → original(name, { opener: registry.get(name).opener })
       → else → original(name, override)  (Aura 통과)
        ↓
[사용자 매크로 클릭]
        ↓
patched 호출 → registry.get('aura-cards').opener(macro)
        ↓
openCardsDialog → React 모달 → 삽입 → macroBrowserComplete
```

## 2. 기술 스택

기존 그대로 (변경 없음):
- React 18 + TypeScript 5.5 + Vite 5 (lib mode IIFE)
- frontend-maven-plugin 1.15 + Atlassian Plugin SDK 9.1.1
- Confluence DC 7.19.8 (V4 fabric editor 호환 셰임)

**신규 의존성: 0개** — Map/Set은 ES2015 표준.

## 3. 구현 단위

### 3.1 신규 파일

#### `src/host/macro-registry.ts` (~50 lines)

```ts
import type { MacroBrowserMacro } from './types';

export interface MacroEntry {
  name: string;          // 'aura-cards' 등
  opener: (macro: MacroBrowserMacro) => void;
}

const registry = new Map<string, MacroEntry>();

export function registerMacro(name: string, entry: Omit<MacroEntry, 'name'>): void {
  if (registry.has(name)) {
    console.warn(`[WonikIPS Editor] Macro '${name}' re-registered (last wins)`);
  }
  registry.set(name, { name, ...entry });
}

export function getMacro(name: string): MacroEntry | undefined {
  return registry.get(name);
}

export function listMacros(): string[] {
  return Array.from(registry.keys());
}
```

핵심:
- `Map` 사용 (Object 대신) — type-safe + 명확한 API
- 중복 등록 시 콘솔 경고 + last wins (spec C-2)
- `listMacros()`로 디버깅 시 등록 상태 조회 가능

#### `src/macros/index.ts` (~5 lines)

```ts
// 모든 매크로 self-register. 새 매크로 추가 시 이 파일에 한 줄 import 추가.
import './cards';
// import './button';   ← 새 매크로 추가 시
// import './divider';
// ...
```

barrel 파일. 매크로별 등록 코드는 각 파일에 분리.

#### `src/macros/cards.ts` (~30 lines, Cards 마이그레이션)

```ts
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CardsEditor } from '../editors/CardsEditor/CardsEditor';
import { CardsParamsSchema, type CardsParams } from '../schema/cards';
import { javaMapToParams, paramsToJavaMap } from '../schema/cards-mapper';
import { registerMacro } from '../host/macro-registry';
import type { IconMeta } from '../components';
import type { MacroBrowserMacro, ConfluenceWindow } from '../host/types';
import dialogStyles from '../host/dialog.module.css';

const MACRO_NAME = 'aura-cards';
const DIALOG_ID = 'wonikips-cards-editor-overlay';

let getIconData: () => Record<string, IconMeta> = () => ({});

export function setIconDataProvider(provider: () => Record<string, IconMeta>): void {
  getIconData = provider;
}

function openCardsDialog(macro: MacroBrowserMacro): void {
  // (기존 v4-adapter.ts의 openCardsDialog 로직 그대로 이전)
  // 단 iconData는 getIconData() 호출로 가져옴
  // ...
}

registerMacro(MACRO_NAME, { opener: openCardsDialog });
```

핵심:
- 기존 `host/v4-adapter.ts`의 `openCardsDialog` 함수를 이 파일로 이전
- iconData는 closure 대신 provider 함수로 (main.tsx가 setIconDataProvider 호출)
- 파일 import 시 즉시 `registerMacro` 호출 (eager)

### 3.2 수정 파일

#### `src/host/v4-adapter.ts` (Cards 분기 제거 + 레지스트리 조회)

**변경 전** (현재):
```ts
const patched = function (name: string, override) {
  if (name === 'aura-cards') {
    return original(name, { opener: ourOpener });  // Cards 분기
  }
  return original(name, override);
};
```

**변경 후**:
```ts
import { getMacro } from './macro-registry';

const patched = function (name: string, override) {
  const entry = getMacro(name);
  if (entry) {
    return original(name, { opener: entry.opener });  // 레지스트리 조회
  }
  return original(name, override);
};
```

핵심:
- Cards 관련 코드(openCardsDialog, javaMapToParams, paramsToJavaMap import 등) 모두 `src/macros/cards.ts`로 이전
- v4-adapter.ts는 monkey-patch + registry 조회만 담당
- 새 매크로 추가 시 v4-adapter.ts 수정 불필요 (SC-1)

#### `src/main.tsx`

**변경 전**:
```ts
import { createV4Host } from './host/v4-adapter';
// ...
const host = createV4Host({ iconData: {}, iconLoader: loadIconData });
host.registerCardsMacro();
```

**변경 후**:
```ts
import { createV4Host } from './host/v4-adapter';
import './macros';                                     // ★ 모든 매크로 self-register
import { setIconDataProvider } from './macros/cards';  // 또는 별도 module로 추출

let iconDataCache: Record<string, IconMeta> = {};
setIconDataProvider(() => iconDataCache);

const host = createV4Host({
  iconLoader: async () => {
    iconDataCache = await loadIconData();
    return iconDataCache;
  },
});
host.registerMacros();
```

핵심:
- `import './macros'` 한 줄로 모든 매크로 등록 (SC-2: 새 매크로 추가 시 main.tsx 수정 0줄)
- iconData는 provider 패턴으로 — register 시점엔 비어있고 fetch 후 갱신

### 3.3 신규 문서

#### `docs/PARALLEL_DEV_GUIDE.md` (~150 lines)

- git worktree 사용법
- 각 매크로별 작업 디렉토리 분리
- 머지 시 충돌 방지 정책 (pom.xml 버전 bump 금지, dep 추가 금지)
- claude -p 병렬 실행 (옵션)
- 머지 절차 (PR 또는 fast-forward)

## 4. 위험 요소

| 위험 | 가능성 | 영향 | 완화책 |
|------|--------|------|--------|
| **Cards 마이그레이션 회귀** (1.0.23 동작 깨짐) | 중간 | 높음 | 마이그레이션 후 즉시 server JAR 빌드 + Confluence 업로드 + 콘솔 5줄 + 매크로 삽입/저장/렌더링 검증 |
| **iconData provider 패턴 race condition** (사용자가 빠르게 매크로 클릭 시 iconData 비어있음) | 낮음 | 중간 | provider가 빈 객체 반환 → IconPicker가 "No icons match" 표시 후 await fetch 완료 시 자동 재렌더 |
| **import './macros' tree-shaking 위험** (Vite가 self-register import를 unused로 제거) | 낮음 | 높음 | `vite.config.ts`에 `rollupOptions.treeshake: { moduleSideEffects: ['./src/macros/**'] }` 명시 |
| **monkey-patch 회귀** (registry.get(name) 동작 안 함) | 낮음 | 중간 | 콘솔에 `[WonikIPS Editor] Monkey-patched setMacroJsOverride for aura-cards (via registry)` 로그 추가, 디버깅 시 `listMacros()` 호출 |
| **git worktree dep 충돌** (worktree 작업 중 main에서 npm 패키지 추가) | 낮음 | 중간 | spec §8 정책 — worktree에서 dep 추가 금지. main에서 먼저 추가 후 worktree pull |

## 5. 테스트 전략

### 5.1 자동 검증 (커맨드)

```bash
# A. TypeScript 컴파일 (SC-5)
cd macros/wonikips-confluence-macro/src/main/resources/client-custom
npx tsc --noEmit                    # exit 0

# B. Vite 빌드 (SC-6)
npm run build                        # 성공, dist/wonikips-editor.js 생성

# C. atlas-package 빌드 (SC-7)
cd ../../../..
atlas-package -P server -Dmaven.test.skip=true   # BUILD SUCCESS

# D. JAR 4가지 검증 (SC-7)
JAR=target/wonikips-confluence-macro-1.0.24-SNAPSHOT-server.jar
unzip -l "$JAR" | grep "client-custom-built/wonikips-editor"          # JS + CSS 둘 다
unzip -p "$JAR" atlassian-plugin.xml | grep -c "wonikips-editor.css"   # 1
unzip -p "$JAR" client-custom-built/wonikips-editor.js | grep -c "process\." # 0
unzip -p "$JAR" client-custom-built/wonikips-editor.js | grep -c "Monkey-patched" # 1

# E. 레지스트리 등록 확인
unzip -p "$JAR" client-custom-built/wonikips-editor.js | grep -oc "registerMacro" # ≥ 1
```

### 5.2 수동 검증 (Confluence)

```
[WonikIPS Editor] bundle loaded
[WonikIPS Editor] Hello WonikIPS {version: '0.5.0-registry'}
[WonikIPS Editor] Scheduling V4 host registration
[WonikIPS Editor] Monkey-patched setMacroJsOverride for aura-cards (via registry)
[WonikIPS Editor] iconData loaded 1458
```

브라우저 콘솔에서:
```js
window.__wonikipsEditor                                  // 객체 (version: '0.5.0-registry')
AJS.MacroBrowser.setMacroJsOverride.__wonikipsPatched    // true
```

### 5.3 회귀 검증 (Cards 매크로 — SC-4)

1. 페이지 편집 → 매크로 → "Cards" 클릭 → 풀스크린 React 모달 표시 (1.0.23과 동일)
2. 카드 추가/삭제, 컬러 변경, 아이콘 선택 모두 동작
3. "삽입" 클릭 → 본문에 placeholder 삽입 → 페이지 저장 → 카드 정상 렌더링
4. 기존 페이지의 Cards 매크로(1.0.23으로 삽입한 것)도 정상 표시

### 5.4 병렬 머지 시뮬레이션 (SC-3)

```bash
# 인프라 설치 후, 시뮬레이션:
git worktree add ../wonik-button feature/macro-button
git worktree add ../wonik-divider feature/macro-divider

# 각 worktree에서 새 매크로 파일만 추가 (실제 구현은 stub)
cd ../wonik-button && touch src/.../macros/button.ts && git add . && git commit && git push
cd ../wonik-divider && touch src/.../macros/divider.ts && git add . && git commit && git push

# main에서 머지
cd /c/Users/ohjih/confluence
git merge feature/macro-button     # 충돌 0
git merge feature/macro-divider    # 충돌 0
```

각 매크로가 자기 파일만 추가했으니 머지 충돌 없어야 함.

## 6. 마이그레이션 순서

단일 commit으로 처리:

1. `src/host/macro-registry.ts` 신규
2. `src/macros/cards.ts` 신규 (기존 v4-adapter.ts에서 openCardsDialog 이전 + registerMacro 호출)
3. `src/macros/index.ts` 신규
4. `src/host/v4-adapter.ts` 수정 (Cards 분기 → registry 조회)
5. `src/main.tsx` 수정 (`import './macros'` + iconData provider 패턴)
6. `vite.config.ts` 수정 (treeshake.moduleSideEffects)
7. tsc + build 검증
8. atlas-package + JAR 4가지 검증
9. Confluence 업로드 + 회귀 검증
10. `docs/PARALLEL_DEV_GUIDE.md` 신규 작성
11. pom.xml 버전 bump (1.0.23 → 1.0.24)
12. commit + push

## 7. 다음 phase에 미치는 영향

본 인프라 완료 후:
- Phase 11~16 (Button/Divider/Title/Panel/BG/Tab) 매크로 작업 시 **`src/macros/{macro}.ts` 한 파일 추가**로 등록 완료
- v4-adapter.ts, main.tsx, atlassian-plugin.xml 모두 수정 불필요
- worktree 4개 병렬 작업 가능

## 8. 일정 추정

| 단계 | 작업 | 시간 |
|------|------|------|
| 1 | macro-registry.ts + macros/ 디렉토리 구조 | 30분 |
| 2 | Cards 마이그레이션 (cards.ts로 이전) | 1시간 |
| 3 | v4-adapter.ts + main.tsx 수정 | 30분 |
| 4 | tsc + Vite + atlas-package 빌드 | 30분 |
| 5 | Confluence 업로드 + 회귀 검증 | 30분 |
| 6 | PARALLEL_DEV_GUIDE.md 작성 | 1시간 |
| 7 | 병렬 머지 시뮬레이션 | 30분 |
| 8 | commit + push | 10분 |
| **합계** | | **약 4~5시간** |

## 9. 참조

- `specs/002-macro-expansion-infra/spec.md` — 본 plan의 spec
- `docs/CUSTOM_PANEL_PLAN.md` §13 — Cards 1.0.23 검증 결과
- `CLAUDE.md` "자체 React 매크로 편집 패널" — 검증된 패턴
- `docs/ADR.md` ADR-015~016 — 자체 패널 + monkey-patch 결정
