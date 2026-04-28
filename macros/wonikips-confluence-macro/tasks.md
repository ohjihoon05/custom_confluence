# tasks.md — Page Title 커스텀 매크로 편집 UI

의존성 순서대로 정렬. 각 태스크는 이전 태스크 완료 후 진행.

---

## T-01. pom.xml confluence.version 수정
**상태**: ✅ 완료  
**작업**: `confluence.version` 8.5.4 → 7.19.8 수정  
**완료 기준**: pom.xml에 `<confluence.version>7.19.8</confluence.version>` 확인

---

## T-02. atlassian-plugin.xml — xhtml-macro 모듈 등록
**의존**: T-01  
**작업**: 기존 atlassian-plugin.xml에 `<xhtml-macro>` 모듈 + 5개 파라미터 추가  
**완료 기준**: XML 문법 오류 없음, macro key = `page-title-macro`

---

## T-03. atlassian-plugin.xml — web-resource 등록
**의존**: T-02  
**작업**: `macro-browser` context web-resource 추가 (JS + CSS + Dialog2 dependency)  
**완료 기준**: `<context>macro-browser</context>` 포함, 3개 `<dependency>` 포함

---

## T-04. PageTitleMacro.java 구현
**의존**: T-02  
**작업**:
- `com.ohjih.macro.PageTitleMacro` 클래스 생성
- `Macro` 인터페이스 구현 (`execute()`)
- 5개 파라미터 추출 + 기본값 처리
- `sanitizeColor()` 메서드 (HEX 정규식 검증)
- 페이지 제목 `escapeHtml4()` 처리
- Velocity 템플릿 렌더링

**완료 기준**: 컴파일 성공, `sanitizeColor("#xyz")` → `"#000000"` 반환

---

## T-05. [보안] 입력값 검증 강화
**의존**: T-04  
**작업**:
- `sanitizeColor()`: 정규식 `^#[0-9A-Fa-f]{6}$` 검증
- `fontSize` 파라미터: 숫자 파싱 실패 시 기본값 48 적용
- `htmlTag` 파라미터: 허용 목록(`h1`~`h6`) 외 값 → `h1` fallback
- `alignment` 파라미터: 허용 목록(`left`, `center`, `right`) 외 값 → `left` fallback

**완료 기준**: 각 케이스 단위 테스트 통과

---

## T-06. PageTitleMacroTest.java — 단위 테스트
**의존**: T-04, T-05  
**작업**:
- `sanitizeColor()` 정상/비정상 케이스
- fontSize 비숫자 입력 → 기본값
- htmlTag 허용 목록 외 값 → h1
- 페이지 제목 HTML 특수문자 이스케이프 (`<script>` → `&lt;script&gt;`)

**완료 기준**: `mvn test` 통과, 4개 이상 테스트 케이스 green

---

## T-07. page-title.vm 작성
**의존**: T-04  
**작업**: Velocity 템플릿으로 인라인 스타일 HTML 출력  
**완료 기준**: `<h1 style="font-size:48px; ...">제목</h1>` 형태 출력

---

## T-08. page-title-editor.css 작성
**의존**: T-03  
**작업**:
- 좌우 패널 레이아웃 (flex)
- 슬라이더, 정렬 버튼 3종, 컬러 피커 스타일
- 미리보기 영역 (체크무늬 배경 — 투명도 확인용)
- 모든 클래스명 prefix `pt-` (AUI 충돌 방지)

**완료 기준**: 다이얼로그 열었을 때 좌우 패널 정상 표시

---

## T-09. page-title-editor.js 구현
**의존**: T-03, T-08  
**작업**:
- `AJS.toInit()` 래핑
- `AJS.MacroBrowser.setMacroJsOverride('page-title-macro', { opener })` 등록
- AUI Dialog2 HTML 생성 및 DOM 삽입
- 기존 파라미터 복원 (매크로 편집 재진입 시)
- 미리보기 텍스트: `.page-title` DOM → `document.title` → "Demo Title" fallback
- 이벤트 리스너: 슬라이더, color input, 드롭다운, 정렬 버튼
- `updatePreview()` 함수
- Save: `tinymce.confluence.MacroUtils.insertMacro()` 호출
- Close: dialog.hide() + DOM cleanup

**완료 기준**: 다이얼로그 열림, 5개 파라미터 모두 미리보기 반영, Save 후 매크로 삽입 확인

---

## T-10. atlas-package 빌드 검증
**의존**: T-06, T-07, T-09  
**작업**: `cd macros/wonikips-confluence-macro && atlas-package`  
**완료 기준**: `BUILD SUCCESS`, `target/wonikips-confluence-macro-1.0.0-SNAPSHOT.jar` 생성

---

## T-11. Docker Confluence 업로드 + 통합 테스트
**의존**: T-10  
**작업**:
- Confluence 관리자 → 앱 관리 → `.jar` 업로드
- 새 페이지 편집 → 매크로 삽입 → `page-title` 검색
- 커스텀 다이얼로그 열림 확인
- 파라미터 조작 → 미리보기 반영 확인
- Save → 페이지 뷰 모드에서 렌더링 확인
- 편집 재진입 → 파라미터 복원 확인

**완료 기준**: SC-01 ~ SC-05 성공 기준 전체 통과

---

## T-12. 에러 케이스 통합 테스트
**의존**: T-11  
**작업**:
- 빈 페이지 제목 → `(제목 없음)` 표시 확인
- HTML 특수문자 포함 제목 → 이스케이프 확인
- FontSize 슬라이더 12, 96 극단값 렌더링 확인

**완료 기준**: 에러 없이 기본값 또는 정의된 fallback으로 동작

---

## 태스크 요약

| ID | 설명 | 의존 | 유형 |
|----|------|------|------|
| T-01 | pom.xml 버전 수정 | — | 설정 (완료) |
| T-02 | xhtml-macro 등록 | T-01 | 설정 |
| T-03 | web-resource 등록 | T-02 | 설정 |
| T-04 | PageTitleMacro.java | T-02 | 구현 |
| T-05 | 입력값 검증 (보안) | T-04 | 보안 |
| T-06 | 단위 테스트 | T-04, T-05 | 테스트 |
| T-07 | page-title.vm | T-04 | 구현 |
| T-08 | editor.css | T-03 | 구현 |
| T-09 | editor.js | T-03, T-08 | 구현 |
| T-10 | 빌드 검증 | T-06, T-07, T-09 | 검증 |
| T-11 | 통합 테스트 | T-10 | 테스트 |
| T-12 | 에러 케이스 테스트 | T-11 | 테스트 |
