# Tasks: 매크로 확장 인프라

> plan.md §6 마이그레이션 순서 기반. 각 task는 의존성 순으로 정렬.
> 작성: 2026-04-29

## Legend

- 🔧 implementation
- 🧪 test (자동/수동 검증)
- 🔒 security
- 📝 documentation
- 🔍 review/verification

---

## T1. 🔧 신규 파일: `src/host/macro-registry.ts`

**의존성**: 없음 (시작 task)

**작업**:
- `Map<string, MacroEntry>` 기반 registry
- 함수 시그니처:
  ```ts
  export interface MacroEntry { name: string; opener: (macro: MacroBrowserMacro) => void; }
  export function registerMacro(name: string, entry: Omit<MacroEntry, 'name'>): void
  export function getMacro(name: string): MacroEntry | undefined
  export function listMacros(): string[]
  ```
- 중복 등록 시 `console.warn`

**완료 기준**:
- 파일 존재 + TypeScript 컴파일 통과 (`npx tsc --noEmit`)
- 구현이 plan.md §3.1 시그니처와 일치

---

## T2. 🧪 단위 테스트: macro-registry 동작 검증

**의존성**: T1

**작업**:
- 임시 검증 스크립트 (vitest 미설치 상태이므로 console.assert 또는 단순 .ts 파일):
  - `register/get/list` 라운드트립
  - 중복 등록 시 last wins 확인 + 콘솔 경고
  - 미등록 이름 조회 시 `undefined`
- `src/host/macro-registry.test.ts` 위치

**완료 기준**:
- `npx tsx src/host/macro-registry.test.ts` (또는 인라인 스크립트) exit 0
- 콘솔 출력에 "All registry tests passed."

---

## T3. 🔧 마이그레이션: `src/macros/cards.ts` 신규

**의존성**: T1

**작업**:
- 기존 `src/host/v4-adapter.ts`에서 `openCardsDialog`, `CardsDialogShell`, `buildBodyHtml`, `escapeHtml`, `ensureOverlay`, `destroyOverlay` 등 Cards 전용 코드 모두 이전
- iconData는 closure가 아닌 provider 패턴:
  ```ts
  let getIconData: () => Record<string, IconMeta> = () => ({});
  export function setIconDataProvider(provider: () => Record<string, IconMeta>): void
  ```
- 파일 끝에 `registerMacro('aura-cards', { opener: openCardsDialog })` 호출
- 모든 import는 새 위치(`../`) 기준

**완료 기준**:
- 파일 존재
- TypeScript 컴파일 통과
- `registerMacro` 호출 라인 존재

**금지사항**:
- 기존 Cards 동작 변경 금지 (모달 UI, 삽입 흐름 모두 1.0.23과 동일해야)
- iconData fetch 로직은 변경 금지 — provider 패턴으로 wrap만

---

## T4. 🔧 신규 파일: `src/macros/index.ts` (barrel)

**의존성**: T3

**작업**:
- `import './cards';` 한 줄
- 향후 매크로는 이 파일에 한 줄 import 추가하는 정책 명시 (주석)

**완료 기준**:
- 파일 존재 + 컴파일 통과

---

## T5. 🔧 수정: `src/host/v4-adapter.ts`

**의존성**: T1, T3

**작업**:
- Cards 전용 코드 모두 제거 (openCardsDialog, CardsDialogShell, buildBodyHtml, escapeHtml, ensureOverlay, destroyOverlay, javaMapToParams import 등)
- monkey-patch에서 Cards 분기 제거, `getMacro(name)` 조회로 대체:
  ```ts
  const patched = function(name, override) {
    const entry = getMacro(name);
    if (entry) return original(name, { opener: entry.opener });
    return original(name, override);
  };
  ```
- `installMonkeyPatch` 시그니처에서 `getIcons` 매개변수 제거 (이제 macros/cards.ts가 직접 처리)
- `MacroEditorHost.registerCardsMacro` → `registerMacros` (복수형)로 변경
- log 메시지: `Monkey-patched setMacroJsOverride for aura-cards (via registry)` 형태로 등록된 매크로 목록 함께 출력

**완료 기준**:
- 파일 라인 수 약 30~40% 감소
- 컴파일 통과
- Cards 전용 코드 흔적 없음 (`grep -c openCardsDialog src/host/v4-adapter.ts` → 0)

---

## T6. 🔧 수정: `src/main.tsx`

**의존성**: T3, T4, T5

**작업**:
- `import './macros';` 추가 (eager self-register)
- `setIconDataProvider`로 iconData 동기화:
  ```ts
  let iconDataCache: Record<string, IconMeta> = {};
  setIconDataProvider(() => iconDataCache);
  ```
- `loadIconData()` 결과를 `iconDataCache`에 할당
- `createV4Host({ iconLoader: ... })` 호출 시 `iconData` 매개변수는 빈 객체 또는 제거
- version 문자열: `'0.5.0-registry'`로 변경

**완료 기준**:
- `import './macros'` 라인 존재
- 컴파일 통과
- demo 모드(`#wonikips-editor-demo-root`)도 `setIconDataProvider` 호출 후 그대로 동작

---

## T7. 🔧 수정: `vite.config.ts` (tree-shaking 보호)

**의존성**: 없음 (병렬 가능)

**작업**:
- `build.rollupOptions.treeshake`에 `moduleSideEffects: ['./src/macros/**']` 추가
- side-effect import 보호 (Vite/Rollup이 unused로 제거하지 않게)

**완료 기준**:
- 빌드 후 `dist/wonikips-editor.js` 안에 `registerMacro` 호출 코드 잔존 (`grep -c registerMacro` ≥ 1)

---

## T8. 🧪 빌드 검증 (자동)

**의존성**: T1~T7 모두

**작업**:
- 다음 커맨드 모두 통과:
  ```bash
  cd src/main/resources/client-custom
  npx tsc --noEmit                # exit 0
  npm run build                   # 성공
  ```
- bundle 크기 측정: 215KB ± 5KB (인프라 추가 < 2KB)

**완료 기준**:
- 모든 커맨드 exit 0
- bundle size 회귀 < 2KB

---

## T9. 🧪 atlas-package + JAR 검증

**의존성**: T8

**작업**:
- pom.xml 버전 bump: `1.0.23-SNAPSHOT` → `1.0.24-SNAPSHOT`
- 빌드:
  ```bash
  atlas-package -P server -Dmaven.test.skip=true
  ```
- JAR 4가지 검증:
  ```bash
  JAR=target/wonikips-confluence-macro-1.0.24-SNAPSHOT-server.jar
  unzip -l "$JAR" | grep "client-custom-built/wonikips-editor"     # JS + CSS 둘 다
  unzip -p "$JAR" atlassian-plugin.xml | grep -c "wonikips-editor.css"   # 1
  unzip -p "$JAR" client-custom-built/wonikips-editor.js | grep -c "process\." # 0
  unzip -p "$JAR" client-custom-built/wonikips-editor.js | grep -c "Monkey-patched" # 1
  unzip -p "$JAR" client-custom-built/wonikips-editor.js | grep -c "registerMacro" # ≥ 1
  ```

**완료 기준**:
- BUILD SUCCESS
- 5개 검증 모두 통과

---

## T10. 🧪 Confluence 회귀 검증 (수동)

**의존성**: T9

**작업** (사용자 액션):
- 1.0.23 제거 → 1.0.24-SNAPSHOT-server.jar 업로드
- `Ctrl+Shift+R`
- 편집 페이지 콘솔 로그 5줄 확인:
  ```
  [WonikIPS Editor] bundle loaded
  [WonikIPS Editor] Hello WonikIPS {version: '0.5.0-registry'}
  [WonikIPS Editor] Scheduling V4 host registration
  [WonikIPS Editor] Monkey-patched setMacroJsOverride for aura-cards (via registry)
  [WonikIPS Editor] iconData loaded 1458
  ```
- Cards 매크로 클릭 → 풀스크린 모달 → 카드 추가/편집 → "삽입" → 본문 삽입 → 페이지 저장 → 렌더링

**완료 기준**:
- 콘솔 5줄 모두 출력
- Cards 매크로 1.0.23과 동일 동작 (UI/삽입/저장/렌더링)
- 기존 페이지의 Cards 매크로 (1.0.23으로 삽입한 것) 정상 표시

---

## T11. 🔒 보안 검증

**의존성**: T8

**작업**:
- macro-registry: 외부 입력 받지 않음 확인 (registerMacro는 코드에서만 호출)
- monkey-patch: `AJS.MacroBrowser.setMacroJsOverride` 외 다른 AJS API 영향 없음 확인
- prototype pollution 가능성: registry는 `Map`(Object 아님)이라 `__proto__` injection 불가
- code review 체크리스트:
  - [ ] registry에 외부 사용자 입력으로 macro 등록되는 경로 없음
  - [ ] opener 호출 시 macro.params 신뢰 검증 (Aura가 보낸 params를 그대로 javaMapToParams에 넘기는데 Zod schema가 검증)
  - [ ] 콘솔 로그에 사용자 입력 그대로 노출 안 함

**완료 기준**:
- 위 4개 체크 모두 ✅

---

## T12. 📝 문서: `docs/PARALLEL_DEV_GUIDE.md` 작성

**의존성**: T10 (인프라 검증 후)

**작업**:
- §1 git worktree 기본 (add/list/remove 명령)
- §2 매크로 작업 worktree 절차 (한 매크로 = 한 worktree)
- §3 충돌 방지 정책:
  - pom.xml 버전 bump 금지 (worktree에서)
  - npm 패키지 추가 금지 (worktree에서, 필요시 main에 먼저 추가)
  - 같은 매크로의 schema/editor만 수정
  - host/v4-adapter.ts, main.tsx 수정 금지 (인프라 완료 후 불필요)
- §4 머지 절차 (PR + fast-forward 또는 직접 merge)
- §5 claude -p 병렬 실행 (옵션, --dangerously-skip-permissions + worktree isolation)
- §6 문제 상황별 대응 (worktree 충돌, dep 불일치 등)

**완료 기준**:
- 파일 존재 + 6 섹션 모두 채워짐
- worktree 명령 실제 검증 (한 번 실행해서 정상 동작)

---

## T13. 🧪 병렬 머지 시뮬레이션

**의존성**: T12

**작업**:
- 임시 worktree 2개 생성 + stub 매크로 파일 추가:
  ```bash
  git worktree add ../wonik-stub-button feature/macro-stub-button
  cd ../wonik-stub-button
  echo "// stub" > macros/wonikips-confluence-macro/src/main/resources/client-custom/src/macros/button.ts
  git add . && git commit -m "stub: button" && git push origin feature/macro-stub-button

  # 같은 절차로 stub-divider
  ```
- main에서 머지:
  ```bash
  git merge feature/macro-stub-button     # 충돌 0
  git merge feature/macro-stub-divider    # 충돌 0
  ```
- 머지 후 worktree 정리:
  ```bash
  git worktree remove ../wonik-stub-button
  git branch -D feature/macro-stub-button
  ```

**완료 기준**:
- 두 머지 모두 충돌 0건
- main에서 빌드 성공 (stub 파일은 빈 모듈이라 컴파일 통과)
- 검증 후 stub commit/branch 삭제 (main에는 흔적 남기지 않음)

---

## T14. 🔧 git commit + push

**의존성**: T1~T13 모두 완료 (T13은 stub 정리 포함)

**작업**:
- 인프라 변경분 한 commit:
  ```
  feat(infra): 매크로 확장을 위한 레지스트리 패턴 + macros 디렉토리

  - host/macro-registry.ts 신규: Map<name, opener>
  - macros/index.ts barrel + macros/cards.ts (Cards 마이그레이션)
  - host/v4-adapter.ts: Cards 분기 제거, registry.getMacro 조회로 대체
  - main.tsx: import './macros' (eager) + setIconDataProvider
  - vite.config.ts: treeshake.moduleSideEffects 추가
  - pom.xml: 1.0.23 → 1.0.24-SNAPSHOT
  - docs/PARALLEL_DEV_GUIDE.md 신규

  검증:
  - tsc 0 errors, Vite build 성공, atlas-package 성공
  - JAR 5가지 검증 통과 (registerMacro 포함)
  - Confluence Cards 매크로 1.0.23 동작 회귀 0
  - 병렬 머지 시뮬레이션 충돌 0건
  ```
- `git push origin main`

**완료 기준**:
- main 브랜치에 commit 추가
- GitHub remote에 push 완료

---

## T15. 🔍 spec/plan/tasks 동기화 검증

**의존성**: T14

**작업**:
- spec.md SC-1 ~ SC-8 모두 만족하는지 최종 확인 (실제 검증 결과 spec 또는 plan에 반영)
- ADR.md에 ADR-017 추가 (레지스트리 패턴 결정 기록)

**완료 기준**:
- SC-1 ~ SC-8 모두 ✅
- ADR-017 작성 완료

---

## 의존성 그래프

```
T1 (registry.ts) ─┬─ T2 (test)
                  ├─ T3 (cards.ts) ──── T4 (index.ts) ──┬─ T5 (v4-adapter.ts)
                  └─ T5 (v4-adapter)                     └─ T6 (main.tsx)

T7 (vite.config) — 병렬 가능

T1~T7 ─────── T8 (build) ── T9 (JAR) ── T10 (Confluence) ─┬─ T12 (docs) ── T13 (시뮬) ── T14 (commit) ── T15 (sync)
                                                            └─ T11 (보안)
```

병렬 가능: T2 (T1 후), T7 (독립), T11 (T8 후 별개 트랙).

---

## 완료 정의 (Definition of Done)

전체 task 완료 시:

- [ ] T1~T15 모두 ✅
- [ ] spec.md SC-1 ~ SC-8 모두 만족
- [ ] CLAUDE.md "자체 React 매크로 편집 패널" 섹션의 검증된 패턴 위배 없음
- [ ] 1.0.24-SNAPSHOT-server.jar 빌드 + Confluence 검증 + push 완료
- [ ] `docs/PARALLEL_DEV_GUIDE.md` 외부 사람이 읽고 따라할 수 있는 수준
- [ ] ADR-017 추가