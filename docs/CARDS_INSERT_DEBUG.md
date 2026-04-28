# Confluence Cards 매크로 삽입 디버깅 — 질문 정리

## 1. 의도 (Intent)

Confluence DC 7.19.8 환경에서 커스텀 P2 플러그인의 `wonui-cards` 매크로를 편집기에서 삽입할 때, **Aura 원본 플러그인처럼** 다음 동작을 구현하고자 함:

- 사용자가 매크로 브라우저에서 Cards 매크로 선택
- 커스텀 편집 다이얼로그(슬라이더, 컬러 피커 등)가 뜸
- Save 클릭 시 페이지에 `<ac:structured-macro ac:name="wonui-cards">…</ac:structured-macro>` 형태로 삽입됨

**기대 출력 예시 (Aura 원본):**

```xml
<ac:structured-macro ac:name="aura-cards" ac:schema-version="1">
  <ac:parameter ac:name="theme">aura</ac:parameter>
  <ac:parameter ac:name="cardsCollection">[{...}]</ac:parameter>
</ac:structured-macro>
```

## 2. 제약 (Constraints)

- **Confluence Server 7.19.8** 대상 (DC 호환 빌드도 별도 필요)
- **Atlassian Plugin SDK 9.1.1**, JDK 11, atlas-package 빌드
- **React 번들 사용 불가** — Aura 원본은 minified React(`main.js` 2.8MB)로 구현되어 있으나 우리는 vanilla JS + jQuery + AUI Dialog 기반으로 재구현해야 함
- **License 체크 로직 제거** (`IsPluginLicensedCondition` 미사용 — 라이선스 만료 없이 항상 동작)
- **다른 매크로(Panel, Button 등)는 정상 삽입됨** — Confluence 기본 매크로 브라우저로 처리되기 때문. 문제는 Cards처럼 `setMacroJsOverride`로 커스텀 다이얼로그를 띄우는 매크로만 발생.

## 3. 인수 기준 (Acceptance Criteria)

- [ ] 편집기에서 매크로 브라우저 → "wonui-cards" 선택 시 **커스텀 다이얼로그가 뜬다**
- [ ] 커스텀 다이얼로그에서 파라미터 입력 후 Save 클릭 시 **다이얼로그가 닫힌다**
- [ ] **편집기 본문에 매크로가 삽입된다** (페이지 저장 후 DB에 `ac:structured-macro` 저장됨)
- [ ] 삽입된 매크로의 `params`가 사용자가 입력한 값과 일치
- [ ] 브라우저 콘솔에 `setMacroJsOverride` 또는 `macroBrowserComplete` 관련 에러 없음

## 4. 관련 파일

### 우리 플러그인 (작동 안 함)

| 파일 | 역할 |
|------|------|
| `macros/wonikips-confluence-macro/src/main/resources-server/atlassian-plugin.xml` | 매크로 등록, web-resource 정의 |
| `macros/wonikips-confluence-macro/src/main/resources/js/cards-editor.js` | `setMacroJsOverride` 등록 + 커스텀 다이얼로그 + `macroBrowserComplete` 호출 |
| `macros/wonikips-confluence-macro/src/main/java/com/uiux/macro/macros/cards/Cards.java` | 서버 사이드 매크로 렌더링 클래스 |
| `macros/wonikips-confluence-macro/pom.xml` | 빌드 설정 (현재 1.0.5-SNAPSHOT) |

### Aura 원본 (정상 작동 — 디컴파일됨)

| 파일 | 참고 포인트 |
|------|------------|
| `mine/atlassian-plugin.xml` | web-resource는 `atl.general` context, `ajs` 의존성만 |
| `mine/client/static/js/main.js` | `Pa.bootstrapMacroEditor()` — `page-edit-loaded` 이벤트에서 `setMacroJsOverride` 등록, `macroBrowserComplete({name, bodyHtml, params})` 호출 |
| `mine/js/license-expired.js` | `AJS.bind("init.rte", ...)` 패턴 (라이선스 만료 시 폴백) |

## 5. 지금까지 시도한 것 + 현재 증상

### 시도한 수정 (효과 없음)

1. `<context>macro-browser</context>` → `<context>editor</context>` → `<context>atl.general</context>`
2. `tinymce.confluence.MacroUtils.insertMacro()` → `tinymce.confluence.macrobrowser.macroBrowserComplete()`
3. 즉시 실행 → `AJS.bind('init.rte', ...)` → `AJS.bind('page-edit-loaded', ...)`
4. `macroBrowserComplete` 인자에 `body` → `bodyHtml`로 키 변경 (Aura 원본과 동일)
5. `$('#macro-browser-dialog').hide()` 제거 (Confluence 내부 다이얼로그 건드리지 않음)
6. web-resource dependency를 Aura 원본과 동일하게 `com.atlassian.auiplugin:ajs` 단일로 단순화

### 현재 증상

- **매크로 브라우저에서 Cards 선택 후 아무 일도 안 일어남** (커스텀 다이얼로그가 뜨는지 자체가 불확실)
- 또는 다이얼로그는 뜨는데 Save 클릭해도 본문에 아무것도 안 들어감
- Panel 등 커스텀 JS 없는 매크로는 정상 삽입됨

## 6. 진단 결과 — 진짜 원인 (2026-04-28 업데이트)

### 단계별 검증 결과

| 항목 | 결과 |
|------|------|
| Cards가 매크로 브라우저 검색 결과에 표시됨 | ✅ |
| Cards 클릭 시 우리 커스텀 다이얼로그가 뜸 | ✅ |
| `tinymce.confluence.macrobrowser.macroBrowserComplete` 함수 존재 | ✅ (`typeof === 'function'`) |
| 콘솔에서 직접 `macroBrowserComplete({name, params, bodyHtml})` 호출 | ❌ **본문에 매크로 삽입 안 됨** |

### 근본 원인 — Editor V4 Compatibility Mode

브라우저 콘솔에 다음 메시지가 출력됨:
```
Editor V4 Compatibility mode enabled.
Replaced WRM.require by a wrapper function to provide compatibility for the editor upgrade.
```

URL 파라미터에도 `frontend.editor.v4=true` 가 포함됨.

**결론**: Confluence 7.19.8이 **Editor V4 (Fabric editor)** 모드로 실행 중. 레거시 TinyMCE 기반 `setMacroJsOverride` / `macroBrowserComplete` API는 **호환성 stub만 노출**하고 실제 매크로 삽입은 수행하지 않음. 이것이 Panel은 동작하고 Cards는 동작하지 않는 진짜 이유 — Panel은 기본 매크로 브라우저로 처리(V4 자체 경로)되고, Cards는 우리가 레거시 API를 호출하기 때문.

## 7. 해결 방향

### 옵션 A: Editor V4를 완전히 비활성화
- URL 파라미터 `?frontend.editor.v4=false` → 효과 없음 (확인됨)
- Dark feature `disable confluence.frontend.editor.v4` 시도 필요
- 또는 docker-compose 환경변수: `JVM_SUPPORT_RECOMMENDED_ARGS=-Dconfluence.editor.allow.fabric=false`

### 옵션 B: V4 호환 매크로 삽입 API 사용
- Aura는 React 번들로 내부 V4 API에 접근하는 방식 추정
- vanilla JS에서 V4 매크로 삽입 API 호출 방법은 아직 미확인
- Fabric editor 매크로 삽입 표준 패턴 조사 필요

### 옵션 C: `<xhtml-macro>` 만 등록하고 커스텀 다이얼로그 포기
- Confluence 기본 파라미터 입력 폼 사용 (Panel과 동일 방식)
- 슬라이더/컬러 피커 등 커스텀 UI는 불가
- 가장 빠른 우회책

## 8. 다음 단계
1. `disable confluence.frontend.editor.v4` Dark Feature 적용 후 새 페이지에서 재시도
2. 실패 시 옵션 C로 우회하여 일단 매크로 동작 확인
3. 추후 V4 호환 패턴 별도 조사

---

## 9. 해결 (2026-04-28 — 1.0.12-SNAPSHOT 빌드)

### 9.1 진짜 원인

§6의 "V4 호환성 벽" 가설은 **틀렸음.** Aura 원본은 V4에서 정상 동작하며, `setMacroJsOverride` / `macroBrowserComplete` 레거시 API도 V4 호환 셰임이 진짜 매크로 삽입까지 처리한다.

진짜 원인은 **우리 plugin이 Aura 원본에서 핵심 리소스를 누락한 것**:

1. ❌ **`previews/Cards.vm`, `previews/Button.vm`, `previews/Divider.vm` 누락** ← 결정타
   - `Cards.java.getImagePlaceholder()`가 `/aura/macro-preview?templateName=Cards&...` URL을 반환
   - Confluence가 이 URL을 매크로 placeholder iframe src로 사용
   - `MacroPreviewRenderer.renderCards()`가 `previews/Cards.vm`을 Velocity로 렌더하려 함 → **파일이 없어 빈/에러 응답**
   - V4 매크로 브라우저가 placeholder를 못 받으니 `macroBrowserComplete` 호출 후 본문 삽입이 차단됨

2. ❌ `webfonts/` 디렉토리 누락 (FontAwesome 16 파일 + webfonts.css)
   - 아이콘 표시 깨짐. 매크로 삽입엔 직접 영향 적지만 `aura-resources` web-resource 정의가 원본과 달라져 일관성 문제

3. ❌ `composition/` 자산 누락 (15 이미지) — Composition 매크로 패널 일부 깨짐 정도, 영향 적음

### 9.2 해결 방법

`aura-3.8.0.jar`에서 `previews/`, `webfonts/`, `composition/` 디렉토리를 그대로 추출해 `src/main/resources/` 아래에 복사. 추가로 `atlassian-plugin.xml`의 `aura-resources` web-resource에 `webfonts.css`와 `fa-solid-900.woff` 명시:

```xml
<web-resource key="aura-resources" name="WonikIPS View CSS">
    <dependency>com.atlassian.auiplugin:ajs</dependency>
    <resource type="download" name="main.css" location="/client/static/css/main.css"/>
    <resource type="download" name="webfonts.css" location="/webfonts/webfonts.css"/>
    <resource type="download" name="fa-solid-900.woff" location="/webfonts/fa-solid-900.woff">
        <param name="allow-public-use" value="true"/>
    </resource>
    <context>atl.general</context>
</web-resource>
```

### 9.3 검증 결과

`1.0.12-SNAPSHOT-server.jar` 업로드 후 **Cards 매크로 삽입 정상 동작 확인.** 편집 패널 → 파라미터 설정 → Insert → 본문에 `<ac:structured-macro ac:name="aura-cards">` 삽입됨.

### 9.4 교훈

- 미러링 plugin 빌드 시 원본 JAR 인벤토리를 파일 단위로 비교해야 한다. atlassian-plugin.xml과 main.js 정합성만으론 불충분.
- `EditorImagePlaceholder` 인터페이스를 구현하는 매크로(Cards, Button, Divider)는 미리보기 서블릿 응답이 정상이어야 V4가 삽입을 허용한다.
- 의심 우선순위: **리소스 누락 > Spring DI 누락 > xml 식별자 불일치 > main.js 패치**.

상세 비교 절차는 `AURA_3.8.0_ANALYSIS.md` §14 참조.
