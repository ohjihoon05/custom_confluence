# 다른 매크로 자체 패널화 계획

> Cards 매크로(1.0.23)에서 검증된 패턴을 다른 매크로로 확장.
> 작성: 2026-04-29
> 진행: Phase 11(Button 1.0.26) → Phase 12(Divider) → Phase 13(Title 1.1.1~1.1.3) → **Phase 14(Panel 1.1.4~1.1.7) ✓**. 다음 = Phase 15(BackgroundImage).

---

## 0. 한 줄 요약

7개 매크로(Button, Panel, Tab, TabCollection, Title, Divider, Background Image)를 **검증된 Cards 패턴 그대로 복사**해 자체 React 패널화.

---

## 1. 매크로 인벤토리 + 복잡도

| 매크로 | 파라미터 수 | 특수 사항 | 복잡도 | 예상 일수 |
|--------|------------|-----------|--------|----------|
| **Button** | ~10 | label/color/size/outlined/icon/href | 낮음 | 1.5~2일 |
| **Divider** | ~7 | height/text/icon/lineStyle/borders | 낮음 | 1일 |
| **PrettyTitle** | ~8 | fontSize/color/alignment/accent line | 낮음 | 1일 |
| **Panel** | ~13 | + 매크로 body 처리 (Velocity `$body`) | 중간 | 2~3일 |
| **BackgroundImage** | ~8 | + 이미지 업로드 컴포넌트 신규 필요 | 중간 | 2~3일 |
| **TabCollection + Tab** | ~15 (각각) | + nested macro (Tab은 TabCollection 안) | 높음 | 5~7일 |

**합계**: 약 13~17일 (1인). 디자인 토큰 + i18n + DC 배포까지 + 1주 → **약 3~4주**.

---

## 2. 권장 진행 순서 — 단순부터

```
Phase 11 ✓ Button         (1.0.26)
Phase 12 ✓ Divider
Phase 13 ✓ PrettyTitle    (1.1.1~1.1.3)
Phase 14 ✓ Panel          (1.1.4~1.1.7)  ← RICH_TEXT body + nested JSON 직렬화 패턴 추가
Phase 15 → BackgroundImage (2~3일)        ← 다음. 이미지 업로드 컴포넌트 신규 + RICH_TEXT body 재사용
Phase 16 → Tab/TabCollection (5~7일)       ← nested macro 추상화
Phase 17 → 디자인 토큰 통합 + 한국어 i18n (3일)
Phase 18 → DC 배포 + 회귀 검증 (1일)
```

이유:
- Button으로 **Cards 외 첫 매크로** 패턴 검증 (Schema, Editor, DialogShell, monkey-patch 분기 추가)
- Divider/Title은 거의 동일 패턴, 빠른 양산
- Panel에서 body 처리 추상화 (Velocity `$body`를 어떻게 미리보기/저장할지)
- BackgroundImage에서 이미지 업로드 UI 신규 컴포넌트 추가
- Tab/TabCollection은 가장 복잡(nested) → 마지막

---

## 3. 매크로별 작업 명세

### 3.1 Button (Phase 11)

```
schema/button.ts:
  - label, color, background, size('small'|'medium'|'large'),
    outlined('regular'|'outlined'), borderRadius, elevation,
    icon, iconPosition('left'|'right'),
    href, hrefType, hrefTarget

editors/ButtonEditor/ButtonEditor.tsx:
  - 단일 폼 (탭 없음)
  - 미리보기: 실제 버튼 렌더 (호버/active 상태)
  - 사용 컴포넌트: TextInput, ColorPicker, SegmentedControl, Slider, Toggle, IconPicker

host/v4-adapter.ts:
  - openButtonDialog 추가
  - monkey-patch에 'aura-button' 분기 추가
  - ButtonDialogShell 컴포넌트 (CardsDialogShell 복사)

mapper:
  - UI ↔ Java 매핑 (대부분 1:1)
```

산출물 4개: schema, editor, dialog shell, monkey-patch 분기.

### 3.2 Divider (Phase 12)

가장 단순. 라인 스타일 미리보기(SVG)만 약간 까다로움.
```
schema: height, text, icon, lineStyle('solid'|'dashed'|'dotted'|'double'),
        lineColor, lineWidth, textColor, showFirstBorder, showSecondBorder
```

### 3.3 PrettyTitle (Phase 13)

```
schema: text, fontSize, fontWeight, color, accentColor,
        alignment, accentLineWidth, accentLinePosition('top'|'bottom'|'none')
```

### 3.4 Panel (Phase 14) — 완료 (1.1.4~1.1.7)

**새 추상화 추가됨**:
1. **단일 `styles` 키 nested JSON 직렬화** — Cards/Button/Divider는 평탄 K=V map인데, Panel은 `styles` 한 키에 `{base, headline, header, body}` 4섹션 nested JSON. Schema도 nested Zod, mapper는 `JSON.stringify(stripNulls(params))`. ADR-021.
2. **RICH_TEXT body 처리** — Panel.getBodyType()=RICH_TEXT. `macroBrowserComplete` 호출 시 `bodyHtml: ''` 명시 안 하면 `MacroResource.getMacroBody`가 NPE → 500. ADR-019. 향후 BackgroundImage/Tab/TabCollection에 동일.
3. **Optional 섹션 토글** — headline/header.icon이 nullable. UI에서 Toggle on/off로 set ↔ null 전환. mapper `stripNulls`가 null 키 자동 제거.
4. **Aura JSON 구조 보존** — `body.text.texAlign` 오타 그대로(`textAlign` 아님), Aura default JSON과 byte-level 호환. 색상/크기/그림자/border 4면 toggle/rounded preset/shadow preset 모두 Aura 원본 동작과 시각 일치.

**chrome 라벨**: 1.1.6에서 `\"Aura Panel\"` → `\"Wonik Panel\"` byte 패치(main.js + main-min.js). docs/AURA_3.8.0_ANALYSIS.md §17.7 표 참조.

**Templates 탭(12+ 프리셋)**: 1.1.4에서는 Advanced Config만 구현. Templates는 후속 빌드(1.2.x)에서 "프리셋 → form 값 채워넣기" 한 겹 위에 얹기로 분리.

**iconData provider 회귀 fix(동봉)**: 1.0.24 registry 패턴 도입 후 main.tsx가 cards의 setIconDataProvider만 호출하던 구조라 Button/Divider/Panel의 IconPicker가 빈 상태였음(노출은 1.1.4 Panel header.icon이 핵심 UX라 처음). macro-registry로 통합. ADR-020.

### 3.5 BackgroundImage (Phase 15)

**새 컴포넌트 필요**: ImageUploader (또는 ImageUrlInput).

옵션:
- (a) **URL input 단순화**: 외부 이미지 URL만 입력. 가장 빠름.
- (b) **Confluence attachment picker**: AJS API 활용 (`AJS.AttachmentPicker` 또는 자체 구현).
- (c) **Drag & drop 업로드**: 신규 첨부 + URL 사용.

권장 진행: (a) 먼저 → 나중에 (b)/(c) 보강.

### 3.6 TabCollection + Tab (Phase 16)

**가장 복잡**. nested macro pattern:
- TabCollection은 컨테이너, 안에 여러 Tab. body XML이 `<ac:macro-tab>` 중첩 구조.
- Aura는 TabCollection 편집 패널에서 "Tab 추가/제거/순서 변경" UI 제공.

처리 전략:
- TabCollection 패널: tabs 배열 + 각 tab의 메타(title, icon)
- 개별 Tab 콘텐츠는 매크로 삽입 후 편집기 인라인으로 (body 처리)
- monkey-patch: 'aura-tab', 'aura-tab-collection' 둘 다 분기

### 3.7 Phase 17 (디자인 토큰 통합)

지금 색은 Atlassian 톤(`#0052CC` 등). WonikIPS 디자인 시스템 토큰 정리:
- 색상 (primary/secondary/accent)
- 타이포 (font-family, sizes)
- 간격, 그림자, border-radius

CSS Modules의 `:root` 변수 또는 `theme/tokens.css`로 통합. 모든 컴포넌트가 토큰 참조.

### 3.8 Phase 18 (DC 배포)

```bash
atlas-package -P dc -Dmaven.test.skip=true
# 운영 DC 환경에 1.X.0-dc.jar 업로드
# 회귀 검증: 모든 매크로 삽입/저장/렌더링
```

---

## 4. 재사용 자산 (이미 만들어진 것)

다 그대로 쓰면 됨:

| 항목 | 위치 |
|------|------|
| Vite 빌드 파이프라인 | `pom.xml` + `vite.config.ts` |
| 컴포넌트 라이브러리 | `src/components/` (Slider, TextInput, ColorPicker, IconPicker, SegmentedControl, Select, Toggle) |
| Schema 패턴 (Zod) | `src/schema/cards.ts` 복사해서 macro별로 |
| Mapper 패턴 (UI↔Java) | `src/schema/cards-mapper.ts` 동일 |
| DialogShell 패턴 | `host/v4-adapter.ts`의 `CardsDialogShell` 복사 |
| Monkey-patch | `host/v4-adapter.ts`의 `installMonkeyPatch` (분기만 추가) |
| icondata.json fetch | `main.tsx`의 `loadIconData` |
| atlassian-plugin.xml 구조 | 그대로 |
| CSS Modules + 디자인 톤 | 임시 색은 그대로, Phase 17에서 토큰화 |

신규 필요:
- ImageUploader 컴포넌트 (BackgroundImage용)
- Nested macro 패턴 (TabCollection 안의 Tab — 새 추상화)

---

## 5. 위험 요소

| 위험 | 가능성 | 영향 | 완화 |
|------|--------|------|------|
| Tab/TabCollection nested 처리가 예상보다 복잡 | 높음 | 일정 +3~5일 | Phase 16 일정 여유 두기. 안 되면 우선 단순화 버전(탭 3개 고정) |
| 다른 매크로 monkey-patch 충돌 | 낮음 | — | 분기마다 `name === ...` 정확히 매칭 |
| 매크로 body 처리 — Velocity `$body`가 실제로 어떻게 들어오는지 미확인 | 중간 | 일정 +1~2일 | Phase 14에서 실증 후 확정 |
| BackgroundImage 이미지 업로드 — Confluence attachment API 학습 곡선 | 중간 | — | 처음엔 URL input만으로 → 후속 보강 |
| 매크로별 Aura 캡처 추가로 필요 | 낮음 | 사용자 시간 1~2시간/매크로 | 매크로별 phase 시작 전 사용자가 캡처 |

---

## 6. 진행 흐름 (각 매크로 phase 공통)

```
1. (사용자) Aura 라이선스 활성 후 매크로 편집 패널 캡처 → aura_image/{macro}/
2. Schema 정의 (src/schema/{macro}.ts) — Aura 파라미터 매핑
3. Editor 컴포넌트 (src/editors/{Macro}Editor/)
4. Mapper (UI ↔ Java)
5. DialogShell + monkey-patch 분기 추가
6. Vite build → tsc 통과 확인
7. atlas-package → JAR 빌드
8. Confluence 업로드 → 콘솔 로그 + 시각 확인
9. 매크로 삽입 + 저장 + 렌더링 회귀 확인
10. commit + push
```

각 phase 평균 1~3일. claude -p로 자동화 가능 (--dangerously-skip-permissions + max-turns 30).

---

## 7. 결정 포인트 (시작 전 확정)

1. **진행 순서**:
   - (a) 단순부터 (Button → Divider → Title → Panel → BG → Tab)  ← **추천**
   - (b) 자주 쓰는 것부터 (Panel → Tab → Button → 나머지)
   - (c) 다른 순서

2. **일정**:
   - (a) 급함 (3주)
   - (b) 보통 (5~6주)  ← **추천**
   - (c) 여유 (3개월+)

3. **Tab/TabCollection**:
   - (a) 포함 (nested 처리 다 함)  ← **추천**
   - (b) 우선 빼고 나중에 (다른 매크로 다 끝나고)
   - (c) 단순화 버전(탭 3개 고정)으로 시작

4. **디자인 토큰**:
   - (a) 처음부터 (Phase 11에 토큰 시스템 먼저)
   - (b) 일괄 적용 (모든 매크로 후 Phase 17에서)  ← **추천**
   - (c) 점진 (매크로별 적용)

5. **claude -p 자동화 활용도**:
   - (a) 적극 (각 phase prompt 작성) — 1.0.16~1.0.23 회귀 추적 패턴 익숙해진 후 가능
   - (b) 혼합 (간단한 phase는 prompt, 복잡한 건 인터랙티브)  ← **추천**
   - (c) 인터랙티브 only

내 추천: **(a, b, a, b, b)** — 단순부터, 5~6주, Tab 포함, 토큰 일괄, 혼합 자동화.

---

## 8. 다음 액션

위 5개 결정 답해주면:
1. Phase 11 (Button) 시작
2. (a) 캡처 → Schema → Editor 순으로
3. 첫 phase 끝나면 동일 패턴 다른 매크로에 복사 — 빠른 양산

캡처는 사용자가 Aura 라이선스 활성 후 진행. 다른 작업은 Claude가 코드 작성.

---

## 9. 참조

- `docs/CUSTOM_PANEL_PLAN.md` — Cards 4주 일정 + 검증 결과
- `docs/AURA_3.8.0_ANALYSIS.md` §4 — 각 매크로 파라미터 명세
- `docs/ADR.md` ADR-015~016 — 자체 React 패널 + monkey-patch 결정
- `docs/DEVELOPMENT_GUIDE.md` §10 — 새 매크로 추가 절차 7단계
