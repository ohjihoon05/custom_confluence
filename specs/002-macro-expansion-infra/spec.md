# Feature Spec: 매크로 확장 인프라

## 1. 한 줄 요약

7개 매크로(Button, Divider, Title, Panel, BackgroundImage, Tab, TabCollection)를 자체 React 패널로 만드는 작업을 **병렬로 진행 가능한 인프라** 구축.

## 2. 사용자

- **주 사용자**: 매크로 자체 패널화 작업을 수행하는 개발자 (Claude Code 또는 사람)
- **간접 영향**: 향후 매크로 추가 작업 시 본 인프라를 사용하는 모든 개발자

## 3. 배경 / 왜 필요한가

Cards 매크로(1.0.23) 자체 패널화 완료. 동일 패턴을 다른 7개 매크로에 적용할 예정. 현재 구조로 그냥 진행하면:

- `host/v4-adapter.ts` 한 파일에서 모든 매크로의 `monkey-patch` 분기를 추가 → 4개 worktree 병렬 작업 시 머지 충돌
- `main.tsx`에서 모든 매크로 register import → 동일 충돌
- `pom.xml` 버전 동시 bump → 충돌

병렬 개발(git worktree) 시 머지 충돌이 발생하면 인프라 셋업으로 이득 본 시간을 충돌 해결로 까먹음. 사전 정리 필요.

## 4. 범위 (In Scope)

### 4.1 monkey-patch 레지스트리 패턴

`host/v4-adapter.ts`에서 매크로별 분기 제거. 대신 `host/macro-registry.ts` 신규 모듈:

```ts
// 각 매크로가 자기 모듈에서 self-register
registerMacro('aura-button', { opener: openButtonDialog });
registerMacro('aura-cards', { opener: openCardsDialog });
```

`v4-adapter.ts`의 monkey-patch는 레지스트리만 조회.

### 4.2 main.tsx auto-import

```
src/macros/
├── index.ts       # 모든 매크로 barrel
├── cards.ts       # Cards self-register
├── button.ts      # Button self-register (병렬 작업 시 신규)
├── divider.ts
└── ...
```

`main.tsx`는 `import './macros';` 한 줄. 새 매크로 추가 시 `main.tsx` 수정 불필요.

### 4.3 git worktree 가이드

`docs/PARALLEL_DEV_GUIDE.md` 신규 — 명령 + workflow + 충돌 방지 규칙.

### 4.4 pom.xml 버전 정책

병렬 worktree에서는 버전 bump 안 함. main 머지 후 통합 빌드 직전에 한 번만 bump.

## 5. 범위 외 (Out of Scope)

- 실제 매크로 구현 (Button, Divider, Title 등) — 별도 task (Phase 11~16)
- DC 배포 — 별도 task (Phase 18)
- 디자인 토큰 통합 — 별도 task (Phase 17)
- Tab/TabCollection nested 추상화 — 별도 task
- BackgroundImage용 ImageUploader 컴포넌트 — 별도 task

## 6. 성공 기준 (측정 가능)

| # | 기준 | 검증 방법 | 결과 (1.0.24) |
|---|------|----------|---------------|
| SC-1 | 새 매크로 추가 시 `host/v4-adapter.ts` 수정 0줄 | git diff 검사 | ✅ registry 패턴 — 매크로 추가 시 v4-adapter 무수정 |
| SC-2 | 새 매크로 추가 시 `main.tsx` 수정 0줄 | git diff 검사 | ✅ `import './macros'` barrel 경유 |
| SC-3 | 4개 worktree에서 4개 매크로 병렬 작업 시 main 머지 충돌 0건 | feature/macro-* 머지 시뮬레이션 | ✅ T13 stub 시뮬 통과 |
| SC-4 | Cards 매크로 회귀 0 (1.0.23 동작 그대로 보존) | Confluence에서 Cards 삽입/저장/렌더링 동일 | ✅ T10 수동 검증 통과 |
| SC-5 | TypeScript 빌드 통과 | `npx tsc --noEmit` exit 0 | ✅ 0 errors |
| SC-6 | Vite 빌드 통과 | `npm run build` 성공 | ✅ 216.60 KB (215±5KB 이내) |
| SC-7 | atlas-package 빌드 통과 | BUILD SUCCESS + JAR 5가지 검증 | ✅ 5/5 통과 (registerMacro 포함) |
| SC-8 | 콘솔 검증 5줄 정상 | Confluence 편집 페이지에서 `[WonikIPS Editor]` 로그 5개 표시 | ✅ T10 검증 통과 |

## 7. 사용자 시나리오

### 시나리오 1: 새 매크로 추가 (병렬 worktree)

```bash
# 1. main에서 worktree 분기
git worktree add ../wonik-button feature/macro-button
cd ../wonik-button

# 2. 매크로 모듈 신규 작성 (이 매크로만의 파일들)
src/schema/button.ts          (신규)
src/editors/ButtonEditor/     (신규)
src/macros/button.ts          (신규 — 여기서 registerMacro 호출)

# 3. 빌드 검증
npm run build
atlas-package -P server -Dmaven.test.skip=true

# 4. 머지
git push origin feature/macro-button
# main에서 머지 → 충돌 0건 (자기 파일만 추가했으니)
```

### 시나리오 2: Cards 회귀 검증

기존 Cards 코드는 새 레지스트리 패턴으로 마이그레이션:
- `host/v4-adapter.ts`의 Cards 분기 → `src/macros/cards.ts`에서 register
- 빌드 + 업로드 → Cards 매크로 동작 동일해야

## 8. 엣지 케이스 / 실패 케이스

- **레지스트리에 동일 이름 두 번 register**: 두 번째 호출이 첫 번째 덮어씀 (last wins). 콘솔 경고 출력.
- **monkey-patch가 Aura보다 늦게 적용**: 레지스트리 + 즉시 등록 + 이벤트 재등록 모두 유지 (1.0.21 패턴 그대로).
- **레지스트리 비어있을 때 patched 호출**: 모든 매크로 호출이 원본으로 통과. Aura가 default 핸들러 등록 → Aura 패널 그대로 뜸 (회귀 아님).
- **worktree에서 의존성 추가** (예: 새 npm 패키지): `package.json` 충돌. → 정책: worktree에서 새 dep 추가 금지. 필요 시 main에서 먼저 추가 후 worktree pull.

## 9. 보안 고려사항

- monkey-patch는 `AJS.MacroBrowser.setMacroJsOverride` 함수만 가로챔. 다른 AJS API 영향 없음.
- 레지스트리는 메모리 내 객체. 외부 입력 없음 → injection 무관.
- self-register 호출은 빌드 시점에 import 트리에 들어가는 코드만 실행 → 동적 코드 실행 없음.
- (해당없음) 인증/권한/외부 데이터 — 본 인프라 작업은 클라이언트 React 코드 정리만.

## 10. 성능 목표

- (해당없음) 본 인프라 자체는 성능 영향 없음 (빌드 시점 정적 import).
- 번들 크기: 현재 215KB (Cards만). 7개 매크로 추가 후 예상 500~700KB. 인프라 자체 추가 비용 < 2KB.

## 11. 의존성

- 기존: Cards 매크로 코드 (`src/editors/CardsEditor/`, `src/host/v4-adapter.ts` 등)
- 변경 대상 파일: `src/host/v4-adapter.ts`, `src/main.tsx`
- 신규 파일: `src/host/macro-registry.ts`, `src/macros/index.ts`, `src/macros/cards.ts`
- 외부 라이브러리 추가 없음

## 12. 마이그레이션

Cards 코드를 새 레지스트리 패턴으로 마이그레이션 (downtime 없음, 단일 commit으로 처리).

```
Before:
  v4-adapter.ts: openCardsDialog 정의 + monkey-patch 안에 if (name === 'aura-cards') 분기
  main.tsx: createV4Host({ iconData, iconLoader }) 호출

After:
  v4-adapter.ts: monkey-patch가 macro-registry 조회
  src/macros/cards.ts: registerMacro('aura-cards', { opener: openCardsDialog })
  src/macros/index.ts: import './cards';
  main.tsx: import './macros';
```

## 13.5. 명확화 (CLARIFY 결과)

다음 결정은 PHASE 2(CLARIFY) 단계에서 확정:

- **C-1 등록 시점**: **eager** — `import './macros'` 시 모든 매크로 즉시 `registerMacro` 호출. (lazy는 Vite IIFE format에서 어차피 분리 안 됨)
- **C-2 레지스트리 데이터 구조**: 한 macro name당 단일 핸들러 (`Map<string, opener>`). 동일 이름 재등록 시 **last-register-wins** + 콘솔 경고. (Aura 매크로는 1:1 매칭이라 multi-handler 불필요)
- **C-3 Cards 마이그레이션**: 본 phase에 **포함** — 인프라 설계의 첫 검증 사례라 분리 불가. 단일 commit으로 마이그레이션 + 회귀 검증.
- **C-4 git worktree 가이드 위치**: `docs/PARALLEL_DEV_GUIDE.md` (일반 문서). 슬래시 명령은 추후 필요시 추가.
- **C-5 Tab/TabCollection nested 추상화**: 본 인프라엔 **포함 안 함** — 추상화는 실제 요구 시점(Tab phase)에 다듬는다. 지금은 단순 1매크로=1핸들러로 시작.

## 14. 참조 문서

- `docs/CUSTOM_PANEL_PLAN.md` §13 (Cards 검증 결과)
- `docs/MACRO_EXPANSION_PLAN.md` (7 매크로 일정)
- `docs/DEVELOPMENT_GUIDE.md` §10 (새 매크로 추가 7단계)
- `.claude/commands/harness.md` (워크플로우 가이드)
- `CLAUDE.md` "자체 React 매크로 편집 패널" 섹션
