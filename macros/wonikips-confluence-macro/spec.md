# spec.md — Page Title 커스텀 매크로 편집 UI

## 피처 요약

Confluence DC 7.19.8 P2 플러그인으로 **Page Title 매크로의 커스텀 편집 다이얼로그**를 구현한다.  
Aura Title과 동일하게 매크로 삽입·편집 시 좌우 패널 구조의 커스텀 UI가 팝업으로 열리고, 저장 시 파라미터가 Confluence 페이지 스토리지에 기록된다.

---

## 사용자

| 역할 | 대상 | 행동 |
|------|------|------|
| 문서 작성자 | 원익IPS SW팀 엔지니어 / 기획자 | 편집기에서 매크로 삽입, UI로 스타일 조정, 저장 |
| 매크로 관리자 | Confluence 관리자 | .jar 업로드, 플러그인 활성화 |
| 개발자 | 플러그인 제작자 (1인) | 빌드·배포·유지보수 |

---

## 기능 요구사항

### F-01. 커스텀 편집 다이얼로그

`AJS.MacroBrowser.setMacroJsOverride()`를 사용해 기본 매크로 브라우저 다이얼로그를 대체한다.

**좌측 파라미터 패널:**

| 컨트롤 | 타입 | 범위/옵션 | 기본값 |
|--------|------|----------|--------|
| Font Weight | 드롭다운 | Normal / Bold | Bold |
| Font Size | 슬라이더 + 숫자 입력 | 12–96 px | 48 |
| Text Alignment | 아이콘 버튼 3종 | left / center / right | left |
| Color | 네이티브 color picker (`<input type="color">`) | 자유 HEX 선택 | #000000 |
| HTML Tag | 드롭다운 | h1 / h2 / h3 / h4 / h5 / h6 | h1 |

**우측 미리보기 패널:**
- 미리보기 텍스트: 편집기 DOM에서 현재 페이지 제목 읽기 (`.page-title` 요소 → fallback `document.title` → fallback "Demo Title")
- 파라미터 변경 시 debounce 없이 즉시 업데이트

**구현 방식 (확정):**
- `AJS.MacroBrowser.setMacroJsOverride()` + AUI Dialog2 (동일 DOM, iframe 없음)
- 기존 `macros/wonikips-confluence-macro/` 스켈레톤 재활용

**하단 버튼:**
- Save: `tinymce.confluence.MacroUtils.insertMacro()` 호출 후 다이얼로그 닫기
- Close: 변경사항 버리고 닫기

### F-02. 매크로 렌더링 (Java + Velocity)

- `PageTitleMacro.java`: `Macro` 인터페이스 구현, 파라미터 추출 및 기본값 대체
- `page-title.vm`: 파라미터를 인라인 스타일로 변환하여 HTML 출력
- 출력 예시: `<h1 style="font-size:48px; font-weight:bold; text-align:left; color:#000000;">페이지 제목</h1>`

### F-03. 플러그인 등록

- `atlassian-plugin.xml`에 `xhtml-macro` 모듈 + `web-resource`(`context: macro-browser`) 등록
- web-resource는 `macro-browser` context에서만 로드 (불필요한 전역 로드 방지)

---

## 성공 기준

| 번호 | 기준 | 측정 방법 |
|------|------|----------|
| SC-01 | 매크로 삽입 시 커스텀 다이얼로그가 2초 이내 열린다 | 직접 클릭 후 스톱워치 측정 |
| SC-02 | 파라미터 5종 모두 변경 시 미리보기가 즉시 반영된다 | 슬라이더·버튼·드롭다운 각각 조작 확인 |
| SC-03 | Save 후 페이지 뷰 모드에서 설정값 그대로 렌더링된다 | 저장 → 페이지 공개 → 스타일 태그 확인 |
| SC-04 | `atlas-package` → `.jar` 업로드 → 매크로 사용 사이클이 에러 없이 완성된다 | 빌드 로그 + Confluence 앱 관리 화면 |
| SC-05 | 기존 매크로 편집 시 저장된 파라미터가 다이얼로그에 복원된다 | 저장 후 편집 재진입, 이전 값 확인 |

---

## 보안 요구사항

- 파라미터 값은 Velocity 렌더링 시 `$esc.html()` 또는 인라인 스타일 속성으로만 출력 (XSS 방지)
- Color HEX 값은 정규식 `^#[0-9A-Fa-f]{6}$` 검증 후 기본값 fallback (CSS injection 방지)
- 편집 UI JS는 `macro-browser` context에만 로드 — 일반 페이지 뷰에서 비활성화
- Confluence 기본 권한 모델 사용 (별도 ACL 불필요 — 페이지 편집 권한 = 매크로 사용 권한)

---

## 엣지 케이스 및 에러 처리

| 상황 | 처리 |
|------|------|
| FontSize에 숫자 외 입력 | 기본값 48로 fallback |
| Color에 잘못된 HEX | 기본값 #000000으로 fallback |
| 페이지 제목이 빈 문자열 | `(제목 없음)` 표시 |
| 페이지 제목에 HTML 특수문자 | `$esc.html()` 이스케이프 |
| 매크로 편집 재진입 시 기존 파라미터 없음 | 각 파라미터 기본값으로 초기화 |
| `AJS.MacroBrowser` API 미존재 (구버전) | 콘솔 경고 후 기본 폼으로 fallback |
| `tinymce.confluence.MacroUtils` 미존재 | 콘솔 에러 로그, 다이얼로그 유지 |

---

## 성능 목표

| 항목 | 목표 |
|------|------|
| 편집 다이얼로그 열기 | 2초 이내 |
| 페이지 렌더링 추가 지연 | 100ms 이하 (동기 Velocity 렌더링) |
| 미리보기 업데이트 | 파라미터 변경 즉시 (< 16ms, requestAnimationFrame 불필요) |

---

## Out of Scope (이번 PoC에서 하지 않는 것)

- Confluence Marketplace 배포 및 인증
- Confluence Cloud / 8.x 지원
- 다국어(i18n) 지원
- Page Title 외 다른 매크로 종류
- 매크로 사용 통계 수집
- 사용자 권한별 접근 제어 (페이지 권한으로 대체)
- Line Height 수동 설정 (기본 CSS 상속으로 처리)
- 다크모드 자동 대응

---

## 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| 플러그인 프레임워크 | Atlassian P2 (OSGi) | SDK 9.1.1 |
| 렌더링 | Java + Velocity | JDK 11, Velocity 1.7 |
| 편집 UI | Vanilla JS + AUI Dialog2 | Confluence 내장 AUI |
| 매크로 오버라이드 API | `AJS.MacroBrowser.setMacroJsOverride()` | Confluence 7.x 내장 |
| 빌드 | Maven (atlas-package) | 3.9.6 |
| 대상 환경 | Confluence DC | 7.19.8 (Docker) |
