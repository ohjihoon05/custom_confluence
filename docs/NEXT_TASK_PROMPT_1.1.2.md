# 다음 세션 프롬프트 (1.1.2 — PrettyTitle EditorImagePlaceholder)

> 새 Claude 세션을 열고 아래 블록 통째로 복사해서 입력.

---

## 작업 요약

PrettyTitle 매크로에 `EditorImagePlaceholder` 추가해서 편집 모드에서 다른 매크로처럼 작은 서버 렌더 미리보기로 표시되게 한다.

---

## 프롬프트 본문 (복붙)

```
PrettyTitle 매크로에 EditorImagePlaceholder 추가 작업 (1.1.2)

# 배경
이 프로젝트는 Aura 플러그인의 Confluence 매크로들을 자체 React 패널로 대체하는 미러링 플러그인이다. 현재 Cards/Button/Divider/Title(aura-pretty-title) 4개 매크로가 자체 패널로 동작 (1.1.1).

문제: V4 에디터 편집 모드에서 다른 매크로(Cards/Button/Divider)는 서버가 렌더한 미니 이미지 placeholder로 깔끔하게 표시되지만, **Title만 실제 body HTML이 그대로 inline 렌더링되어 "Aura Title" chrome 라벨 + 거대한 본문 H1이 그대로 노출**된다.

원인: `Button.java`, `Cards.java`, `Divider.java`는 `EditorImagePlaceholder` 인터페이스를 구현하지만 `PrettyTitle.java`는 구현하지 않아서, Confluence가 inline 렌더링으로 fallback한다.

# 작업 목표
`PrettyTitle.java`에 `EditorImagePlaceholder` 인터페이스 + `getImagePlaceholder()` 메서드를 추가해서, 편집 모드에서 다른 매크로처럼 작은 서버 렌더 미리보기 이미지로 표시되게 만든다.

# 참고 파일 (전부 디컴파일된 상태로 src에 박혀있음)
- `macros/wonikips-confluence-macro/src/main/java/com/uiux/macro/macros/Button.java` — `getImagePlaceholder` 패턴 표본
- `macros/wonikips-confluence-macro/src/main/java/com/uiux/macro/macros/Divider.java` — 또 다른 패턴 (params를 JSON으로 직렬화 → base64 → URL)
- `macros/wonikips-confluence-macro/src/main/java/com/uiux/macro/macros/PrettyTitle.java` — 수정 대상
- `macros/wonikips-confluence-macro/src/main/resources/templates/PrettyTitle.vm` — Aura 원본에 .vm이 있는지 확인 (없으면 만들어야 할 수도)
- `macros/wonikips-confluence-macro/src/main/resources/previews/` — 다른 매크로의 preview .vm 위치
- `aura-3.8.0.jar` (프로젝트 루트, gitignore) — Aura 원본 JAR. 우선 여기서 PrettyTitle 관련 클래스/리소스 추출해보고 패턴 따라가기 (`unzip -l aura-3.8.0.jar | grep -i title`)
- `docs/AURA_3.8.0_ANALYSIS.md` — 원본 JAR 정밀 분석 (가장 먼저 참고)
- `CLAUDE.md` — 빌드 규칙 + 매크로 식별자 보존 규칙

# 절차
1. **원본 패턴 확인 먼저**: `unzip -p aura-3.8.0.jar com/appanvil/aura/macros/PrettyTitle.class` 또는 동등한 클래스에 EditorImagePlaceholder가 정말 없는지 확인. 만약 원본에도 없으면 우리가 새로 추가하는 형태고, 원본에는 있는데 디컴파일 누락된 거면 원본을 그대로 복원.
2. `PrettyTitle.java` 수정:
   - `import com.atlassian.confluence.macro.EditorImagePlaceholder` 등 필요한 import 추가
   - `class PrettyTitle implements Macro, EditorImagePlaceholder` (Macro만 → 둘 다)
   - `@Autowired SettingsManager` 주입 (현재 없음 — Button/Divider는 ContainerManager로 가져옴)
   - `getImagePlaceholder(Map<String,String> map, ConversionContext ctx)` 메서드 추가:
     - servlet URL 패턴은 다른 매크로와 동일: `%s/plugins/servlet/aura/macro-preview?params=<base64>&templateName=PrettyTitle`
     - Title은 body가 PLAIN_TEXT라 body 텍스트도 base64 payload에 포함시켜야 미리보기에 제목이 나옴 — Button은 params만 인코딩하지만 Title은 body가 콘텐츠라 다름. Aura 원본 동작 먼저 확인.
3. preview 템플릿(`previews/PrettyTitle.vm` 또는 비슷한 이름) 필요한지 확인. 없으면 `aura-3.8.0.jar`에서 추출 또는 `Button.vm`/`Divider.vm` preview 패턴 보고 작성.
4. `pom.xml` 버전 `1.1.1-SNAPSHOT` → `1.1.2-SNAPSHOT`.
5. 빌드: `C:/Users/ohjih/atlassian-sdk/bin/atlas-package.bat -P server -Dmaven.test.skip=true` (3분).
6. JAR 검증:
   ```bash
   JAR=target/wonikips-confluence-macro-1.1.2-SNAPSHOT-server.jar
   unzip -l "$JAR" | grep -i prettytitle  # 클래스 + preview .vm 둘 다
   ```

# 검증 (사용자 액션)
1. UPM에서 1.1.1 제거 → 1.1.2 업로드 → Ctrl+Shift+R
2. Title 매크로 새로 삽입:
   - 편집 모드에서 거대한 H1이 inline 렌더되지 않고, Cards/Button처럼 작은 미리보기 박스로 보여야 함
3. 게시 후(View 모드)에서 정상 H1로 렌더링 (회귀 0)
4. 기존 1.1.1로 삽입한 Title 매크로도 1.1.2 업그레이드 후 정상 동작 (편집 모드만 작은 박스로 바뀜)

# 절대 금지
- `aura-pretty-title` 매크로 식별자 변경 금지 — name/key 모두 `aura-pretty-title` 그대로
- Java 클래스명 `PrettyTitle` 그대로 (atlassian-plugin.xml + main.js 매칭)
- 서블릿 URL `/plugins/servlet/aura/macro-preview` 그대로
- main.js, atlassian-plugin.xml의 매크로 식별자/CSS 클래스 손대지 말 것 (`docs/AURA_3.8.0_ANALYSIS.md` §17 규칙)

# 빌드 후 처리
- 동작 확인되면 commit (`fix(1.1.2): PrettyTitle EditorImagePlaceholder 추가 — 편집 모드 inline 렌더 회피`)
- 사용자 승인 후 push
- `docs/ADR.md` ADR-019로 결정 기록 (옵션)

# 시작 첫 단계
1. `docs/AURA_3.8.0_ANALYSIS.md` 읽기 (원본 JAR 분석 — Title 관련 섹션)
2. `unzip -l aura-3.8.0.jar | grep -i 'title\|pretty'` 로 원본 JAR 안의 PrettyTitle 자산 인벤토리
3. 위 결과 기반으로 implementation plan 사용자에게 제시 후 진행
```

---

## 컨텍스트 메모 (이 세션에서 결정한 것들)

- Title 매크로명은 `aura-pretty-title` (NOT `aura-title`) — 1.1.1에서 수정됨
- 1.0.x → 1.1.0(stub) → 1.1.1 점프 (사용자 요청)
- 다음 빌드 1.1.2부터 매크로별 EditorImagePlaceholder 보강 작업
- Title body는 PLAIN_TEXT라 미리보기에 텍스트 포함하려면 base64 payload에 body도 같이 인코딩 필요할 수 있음 — Aura 원본 디핑 먼저
