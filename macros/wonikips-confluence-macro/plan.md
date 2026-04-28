# plan.md — Page Title 커스텀 매크로 편집 UI

## 구현 전략 요약

기존 `wonikips-confluence-macro` 스켈레톤을 재활용하여 두 레이어를 구현한다:
1. **Java 레이어**: `PageTitleMacro.java` — 파라미터 수신 + Velocity 렌더링
2. **JS 레이어**: `page-title-editor.js` — `AJS.MacroBrowser.setMacroJsOverride()` + AUI Dialog2

---

## 아키텍처 결정 및 근거

| 결정 | 선택 | 이유 |
|------|------|------|
| 편집 UI 메커니즘 | `AJS.MacroBrowser.setMacroJsOverride()` | Aura가 7.19.8에서 동작 → 동일 API 사용 가능 확인됨 |
| 다이얼로그 방식 | AUI Dialog2 (iframe 없음) | 동일 DOM — postMessage 없이 직접 DOM 조작, 단순함 |
| 매크로 삽입 | `tinymce.confluence.MacroUtils.insertMacro()` | Confluence 7.x Server/DC 표준 API |
| 미리보기 텍스트 | `.page-title` DOM 읽기 | 실제 페이지 제목 반영, 별도 API 불필요 |
| 렌더링 | Velocity + inline style | Java 의존성 최소, 추가 라이브러리 불필요 |
| 스켈레톤 재활용 | 기존 `wonikips-confluence-macro` | atlas-create 재실행 불필요, 빌드 설정 이미 구성됨 |

---

## 파일별 구현 계획

### 신규/수정 파일 목록

```
macros/wonikips-confluence-macro/
├── pom.xml                                          ← 수정 (confluence.version 7.19.8 완료)
├── src/main/
│   ├── java/com/ohjih/
│   │   └── macro/
│   │       └── PageTitleMacro.java                  ← 신규
│   └── resources/
│       ├── atlassian-plugin.xml                     ← 수정 (xhtml-macro + web-resource 추가)
│       ├── templates/
│       │   └── page-title.vm                        ← 신규
│       ├── js/
│       │   └── page-title-editor.js                 ← 신규 (기존 .js 교체)
│       └── css/
│           └── page-title-editor.css                ← 신규 (기존 .css 교체)
```

---

### 1. `PageTitleMacro.java`

**역할**: Confluence `Macro` 인터페이스 구현. 파라미터 추출 → 기본값 대체 → Velocity 렌더링

```java
// 핵심 로직
public String execute(Map<String, String> params, String body, ConversionContext context)
    throws MacroExecutionException {
    // 파라미터 추출 + 기본값
    String fontSize   = getParam(params, "fontSize",   "48");
    String fontWeight = getParam(params, "fontWeight", "bold");
    String alignment  = getParam(params, "alignment",  "left");
    String color      = sanitizeColor(getParam(params, "color", "#000000"));
    String htmlTag    = getParam(params, "htmlTag",    "h1");
    // 페이지 제목
    String title = context.getEntity() != null
        ? StringEscapeUtils.escapeHtml4(context.getEntity().getTitle())
        : "";
    // Velocity 렌더링
    VelocityUtils.getRenderedTemplate("templates/page-title.vm", contextMap);
}
```

**보안 처리**:
- `sanitizeColor()`: `^#[0-9A-Fa-f]{6}$` 검증 → 실패 시 `#000000` 반환
- 페이지 제목: `StringEscapeUtils.escapeHtml4()` (Apache Commons Text — Confluence 제공)

---

### 2. `page-title.vm`

```velocity
<$htmlTag style="font-size:${fontSize}px; font-weight:${fontWeight}; text-align:${alignment}; color:${color}; overflow-wrap:break-word;">
$title
</$htmlTag>
```

---

### 3. `atlassian-plugin.xml` 추가 모듈

```xml
<!-- 매크로 모듈 -->
<xhtml-macro name="page-title" key="page-title-macro"
             class="com.ohjih.macro.PageTitleMacro"
             icon="/download/resources/com.ohjih.wonikips-confluence-macro/images/pluginIcon.png">
    <category name="formatting"/>
    <description key="macro.page-title.description"/>
    <parameters>
        <parameter name="fontSize"   type="string"  default="48"/>
        <parameter name="fontWeight" type="enum"    default="bold">
            <value name="normal"/><value name="bold"/>
        </parameter>
        <parameter name="alignment"  type="enum"    default="left">
            <value name="left"/><value name="center"/><value name="right"/>
        </parameter>
        <parameter name="color"      type="string"  default="#000000"/>
        <parameter name="htmlTag"    type="enum"    default="h1">
            <value name="h1"/><value name="h2"/><value name="h3"/>
            <value name="h4"/><value name="h5"/><value name="h6"/>
        </parameter>
    </parameters>
</xhtml-macro>

<!-- 편집 UI 리소스 -->
<web-resource key="page-title-editor-resources">
    <dependency>confluence.web.resources:ajs</dependency>
    <dependency>confluence.web.resources:dialog2</dependency>
    <dependency>confluence.web.resources:tinymce-macrobrowser</dependency>
    <resource type="download" name="page-title-editor.js"  location="/js/page-title-editor.js"/>
    <resource type="download" name="page-title-editor.css" location="/css/page-title-editor.css"/>
    <context>macro-browser</context>
</web-resource>
```

---

### 4. `page-title-editor.js`

**핵심 흐름:**

```
AJS.toInit()
  └─ AJS.MacroBrowser.setMacroJsOverride('page-title-macro', { opener })
       └─ opener(macro)
            ├─ AUI Dialog2 생성 (좌우 패널 HTML 삽입)
            ├─ 기존 파라미터 복원 (macro.params가 있으면)
            ├─ 미리보기 텍스트 초기화 (DOM .page-title 읽기)
            ├─ 이벤트 리스너 등록 (슬라이더, 색상, 드롭다운, 정렬 버튼)
            │    └─ 변경마다 updatePreview() 호출
            ├─ Save 클릭 → tinymce.confluence.MacroUtils.insertMacro()
            └─ Close 클릭 → dialog.hide() + DOM 정리
```

---

## 의존성

| 항목 | 버전 | 제공 방식 | 비고 |
|------|------|----------|------|
| Confluence DC | 7.19.8 | Docker 로컬 | 실제 배포 대상 |
| Atlassian Plugin SDK | 9.1.1 | 로컬 설치 | `atlas-package` 빌드 |
| JDK | 11.0.30 | 로컬 설치 | Eclipse Adoptium |
| Maven | 3.9.6 | 로컬 설치 | — |
| Apache Commons Text | — | Confluence `provided` | `StringEscapeUtils` 포함 |
| AJS / AUI Dialog2 | Confluence 내장 | `provided` (런타임) | 별도 설치 불필요 |
| Velocity | 1.7 | Confluence `provided` | — |
| JUnit 4 | 4.13.2 | `test` scope | pom.xml 이미 포함 |

---

## 위험 요소 및 대응

| 리스크 | 가능성 | 대응 |
|--------|--------|------|
| `tinymce.confluence.MacroUtils` API가 7.19.8에서 동작 안 함 | 낮음 (Aura 동작 확인) | 빌드 후 즉시 매크로 삽입 동작 테스트 |
| `confluence-plugins-platform-pom` 7.19.8 BOM이 Maven Central에 없음 | 중간 | Atlassian Maven 저장소 설정 확인 (`~/.m2/settings.xml`) |
| atlassian-plugin.xml 변경 후 핫 디플로이 안 됨 | 높음 | xml 변경 시 Confluence 재시작 필요 — 개발 중 최소화 |
| AUI Dialog2 CSS가 Confluence 7.x 테마와 충돌 | 낮음 | 클래스명 prefix `pt-` 사용으로 격리 |
| `macro-browser` context가 7.19.8에서 JS 미로드 | 낮음 (Aura 동작) | Network 탭에서 JS 로드 확인 후 진행 |

---

## 테스트 전략

| 단계 | 방법 |
|------|------|
| 단위 테스트 | `PageTitleMacroTest.java` — `sanitizeColor()`, 파라미터 기본값 처리 |
| 통합 테스트 | Docker Confluence에 .jar 업로드 → 매크로 삽입 → 렌더링 확인 |
| 편집 UI 테스트 | 슬라이더/컬러 피커/드롭다운 각각 조작 → 미리보기 반영 확인 |
| 에러 케이스 | FontSize에 "abc" 입력 → 기본값 렌더링 확인 |
| 회귀 테스트 | 저장 → 편집 재진입 → 이전 파라미터 복원 확인 |

---

## 구현 순서

1. `atlassian-plugin.xml` 수정 (xhtml-macro + web-resource)
2. `PageTitleMacro.java` 구현
3. `page-title.vm` 작성
4. `page-title-editor.js` + CSS 작성
5. `PageTitleMacroTest.java` 단위 테스트
6. `atlas-package` 빌드 → Docker Confluence 업로드
7. 편집 UI 동작 통합 테스트
