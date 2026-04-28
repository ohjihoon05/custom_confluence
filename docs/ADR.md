# Architecture Decision Records

## 철학
검증 우선. User Macro로 빠르게 기능을 확인하고, 필요한 경우에만 P2 플러그인으로 전환한다. 오버엔지니어링 금지. 작동하는 최소 구현을 선택한다.

---

### ADR-001: Confluence 버전 7.19.8 LTS 선택

**결정**: 최신 버전(8.x, 9.x) 대신 7.19.8 LTS 사용  
**이유**: 원익IPS 사내 도입 검토 대상 버전. LTS라 패치 지원 기간이 길고 안정성 확보됨.  
**트레이드오프**: Forge(8.x+) 사용 불가. 최신 UI/기능 미지원.  
**에러 케이스**:
- PostgreSQL 15+ 사용 시 기동 불가 → PostgreSQL 14로 고정
- `ATL_CLUSTER_TYPE=local` 환경변수 → 7.19에서 `ClusterJoinType` enum 오류 → 제거
- `CONFLUENCE_SHARED_HOME` 단독 설정 시에도 동일 오류 → 단일 노드에서는 제거

---

### ADR-002: User Macro를 1단계로 시작

**결정**: P2 플러그인 바로 개발하지 않고 User Macro(Velocity)로 먼저 구현  
**이유**: Java/SDK 환경 없이 빠르게 기능 검증 가능. 매크로 파라미터 구조 설계에 유리. 관리자 콘솔에서 즉시 수정 가능.  
**트레이드오프**: 커스텀 편집 UI(슬라이더, 컬러 피커, 미리보기) 불가. 기능 검증 후 P2로 재구현 필요.  
**에러 케이스**:
- `$page`가 null인 컨텍스트(템플릿 미리보기 등) → `#if($page)` 가드로 처리
- 파라미터 미입력 시 `$paramXxx`가 빈 문자열 → `#if($paramColor != "")` 체크 후 기본값 적용
- Velocity 템플릿 문법 오류 → Confluence가 매크로 위치에 오류 메시지 표시 (페이지 전체 영향 없음)

---

### ADR-003: P2 플러그인으로 편집 UI 구현

**결정**: Connect App 대신 P2 플러그인(OSGi 번들 .jar) 사용  
**이유**: DC/Server 환경에서 Connect App은 외부 접근 가능한 서버 필요. P2는 .jar 파일 하나로 자급 가능. ngrok 등 불필요.  
**트레이드오프**: Java 개발 환경(JDK, Maven, SDK) 필요. Cloud 버전 이전 시 Forge로 전면 재작성 필요.  
**에러 케이스**:
- `atlassian-plugin.xml` 문법 오류 → 플러그인 로드 실패, Confluence 로그에 `OsgiContainerException` 기록
- Macro 클래스 `execute()` 에서 unchecked 예외 → `MacroExecutionException`으로 래핑하지 않으면 페이지 렌더링 전체 중단 가능 → 반드시 try-catch 후 `MacroExecutionException` throw
- iframe 편집 UI와 Confluence 간 `postMessage` origin 불일치 → AP.js 사용으로 우회 (직접 postMessage 금지)
- 플러그인 버전 충돌 → `pom.xml`의 `confluence.version`을 `7.19.8`로 고정
- 핫 디플로이 후 이전 버전 캐시 → Confluence 재시작으로 해결

---

### ADR-007: 커스텀 편집 다이얼로그 — AJS.MacroBrowser.setMacroJsOverride() 방식 선택

**결정**: iframe + AP.js 방식 대신 `AJS.MacroBrowser.setMacroJsOverride()` + AUI Dialog2 방식 사용  
**이유**: Aura가 Confluence DC 7.19.8에서 동작 → 동일 API 사용 가능 확인됨. iframe 방식은 AP.js가 DC 7.19 지원 여부 불확실. 동일 DOM에서 직접 조작하므로 postMessage 불필요하고 구현이 단순.  
**트레이드오프**: Confluence 내부 JS API에 의존 → 버전 업그레이드 시 API 변경 위험 있음.  
**에러 케이스**:
- `AJS.MacroBrowser` 미존재 (구버전 또는 API 변경) → `typeof` 체크 후 콘솔 경고, 기본 폼으로 fallback
- `tinymce.confluence.MacroUtils.insertMacro()` 는 `setMacroJsOverride` opener 컨텍스트에서 동작하지 않음 → **`tinymce.confluence.macrobrowser.macroBrowserComplete()`** 사용 (두 번째 인자 불필요)
- `web-resource` context를 `macro-browser`로 설정 시 JS 미로드 → **반드시 `editor`로 설정** (`macro-browser`는 유효하지 않은 context명)
- atlas-compile 시 `confluence-plugins-platform-pom` BOM 미해결 → `atlas-compile` 사용 (SDK 내장 Atlassian 저장소 활용), 일반 `mvn` 사용 불가
- `setMacroJsOverride()` 인자로 `name` 대신 `key` 사용 시 override 무시됨 → `atlassian-plugin.xml`의 `name` 속성값 사용 (예: `page-title`)
- 커스텀 텍스트는 `cloudText` 파라미터로 전달 — `execute()`에서 우선순위: `cloudText` → `body` → `context.getEntity().getTitle()` → "(제목 없음)"

---

### ADR-009: web-resource context — `editor` 사용

**결정**: 편집 UI JS web-resource의 context를 `macro-browser` 대신 `editor`로 설정  
**이유**: `macro-browser`는 Confluence에서 인식하지 않는 context명 → JS가 로드되지 않아 `setMacroJsOverride()` 등록 자체가 안 됨. `editor` context가 Confluence 편집기 진입 시 JS를 로드하는 올바른 context.  
**트레이드오프**: `editor` context는 편집기가 열릴 때 항상 로드됨 (매크로 브라우저 외에도). 성능 영향은 미미.  
**검증 출처**: Requirement Yogi 등 실제 작동하는 P2 플러그인 구현 패턴 확인

---

### ADR-008: pom.xml confluence.version 7.19.8 고정

**결정**: 스켈레톤 기본값(8.5.4)에서 7.19.8로 수정  
**이유**: `atlas-create-confluence-plugin` 기본값이 최신 버전으로 생성됨. 실제 Docker 인스턴스 버전(7.19.8)과 불일치 시 API 호환성 문제 발생.  
**트레이드오프**: 없음. 무조건 실제 배포 대상 버전과 일치시켜야 함.  
**에러 케이스**:
- `jakarta.inject-api` 버전이 7.19.8 BOM에서 관리되지 않음 → `pom.xml`에 `1.0.5` 명시 필요
- `commons-text` 미포함 → `StringEscapeUtils` 사용 불가 → `escapeHtml()` 메서드를 클래스 내부에 직접 구현
- OSGi `Import-Package`에 `java.*` 계열 포함 시 설치 실패 → `!java.*` 로 명시 제외 필요 (JVM이 자동 제공하므로 OSGi import 금지)
  - `java.lang` 제외만으로 부족 — `java.util`, `java.util.regex` 등도 같은 규칙 적용
  - 해결: `pom.xml` `<Import-Package>`에 `!java.*,` 한 줄 추가 후 재빌드
  - MANIFEST.MF의 `Import-Package`에 `java.` 접두사 항목이 없는지 반드시 확인 (`unzip -p *.jar META-INF/MANIFEST.MF`)

---

### ADR-010: Spring 빈 등록 — `<component>` 태그 사용 불가

**결정**: `atlassian-plugin.xml`에 `<component>` 태그 추가 대신 `xhtml-macro`의 `class` 속성으로만 등록  
**이유**: `Atlassian-Plugin-Key` 속성이 설정된 플러그인에서는 `<component>` 태그 사용 시 `validate-manifest` 단계에서 빌드 실패. `xhtml-macro`의 `class` 속성 자체가 Spring 빈 등록 역할을 겸함.  
**트레이드오프**: 없음. 매크로 클래스는 별도 `<component>` 등록 불필요.  
**에러 케이스**:
- `<component>` + `Atlassian-Plugin-Key` 공존 시 빌드 오류: `atlassian-plugin.xml contains a definition of component. This is not allowed when Atlassian-Plugin-Key is set.` → `<component>` 태그 완전 제거
- `@Named` (jakarta.inject) 어노테이션 추가 시 `package jakarta.inject does not exist` 컴파일 오류 → 어노테이션 불필요, 제거
- `@Component` (Spring) 어노테이션 추가 시 Spring scanner 처리 오류 가능 → 어노테이션 없이 순수 구현 클래스로 유지

---

### ADR-011: DC 빌드 프로파일 — 환경별 JAR 분리 (검증 완료)

**결정**: 테스트 환경(Single-Node)에는 `-P server` 빌드, 운영 DC(Clustered)에는 `-P dc` 빌드(activeByDefault) 사용  
**이유**: resources-dc와 resources-server의 `atlassian-plugin.xml`이 현재 동일한 클래스를 선언하므로 둘 다 안전하게 사용 가능. DC 환경에는 DC 플래그가 포함된 `-dc.jar`를 명확히 구분하여 사용.  
**검증**: Clustered DC(node1:3737c48)에서 `-dc.jar` 업로드 후 매크로 삽입 및 렌더링 정상 동작 확인.  
**빌드 명령어**:
```bash
# 운영 DC용
atlas-package -DskipTests
# → wonikips-confluence-macro-1.0.0-SNAPSHOT-dc.jar

# 테스트 Single-Node용
atlas-package -P server -DskipTests
# → wonikips-confluence-macro-1.0.0-SNAPSHOT-server.jar
```
**에러 케이스**:
- `atlassian-plugin.xml`에 선언된 매크로 클래스(예: `ButtonMacro`)가 JAR에 없으면 → Confluence UPM이 "설치 도중 오류" 반환, OSGi 번들 활성화 실패
- DC 호환 플래그 없이 DC에 설치 → 설치는 되지만 매크로 렌더링 시 Confluence가 출력을 무시/차단 → 페이지에 매크로 미표시
- suffix 없는 `*-SNAPSHOT.jar` 사용 시 → 어느 프로파일로 빌드됐는지 불명확, DC 플래그 누락 위험 → 반드시 `-dc.jar` 또는 `-server.jar` 사용
- 검증 방법: `unzip -p *.jar atlassian-plugin.xml | grep atlassian-data-center-compatible` 로 플래그 포함 여부 확인 후 업로드

---

### ADR-012: batch.js 500 오류 — JS 번들 캐시 깨짐

**결정**: Confluence JS 번들 캐시 깨짐 시 재시작으로 해결  
**이유**: Confluence는 `batch.js` 요청 시 플러그인 JS 리소스를 동적으로 번들링함. 플러그인 설치/제거/재시작 직후 캐시와 실제 리소스 상태가 불일치하면 500 반환.  
**트레이드오프**: 재시작마다 2~3분 대기.  
**에러 케이스**:
- 증상: top navigation만 표시되고 본문 콘텐츠가 렌더링되지 않음
- 브라우저 콘솔: `GET .../contextbatch/js/.../batch.js?locale=ko-KR net::ERR_ABORTED 500 (Internal Server Error)`
- 원인 1: 플러그인 JAR 업로드/제거 직후 캐시 불일치 → `docker-compose restart confluence`
- 원인 2: 라이선스 만료 (Timebomb 3시간) → 재시작 후 라이선스 재발급
- 원인 3: Confluence 기동 중 (컨테이너 `Up 3 minutes` 등) → 1~2분 대기 후 새로고침
- 해결 순서: ① `Ctrl+Shift+R` 하드 리프레시 → ② `docker-compose restart confluence` → ③ `work` 디렉토리 청소 후 재시작
  ```bash
  # 3단계 — work 디렉토리 청소
  docker exec confluence-dc bash -c "rm -rf /opt/atlassian/confluence/work/Standalone/localhost/ROOT/*"
  docker-compose restart confluence
  ```

---

### ADR-014: main.js UI 라벨은 1회-등장 검증 후 안전 패치 가능

**결정**: minified `main.js` React 번들에 대한 패치는 원칙적으로 금지하되, **사용자 노출 UI 라벨**(예: `"Aura Cards"`, `"Aura Card"`)에 한해 1회 등장 검증 + Python 바이트-레벨 치환은 허용한다.

**이유**: i18n(`uiux-macro.properties`)으로 매크로 브라우저 라벨은 변경할 수 있지만, **편집 패널 내부의 React UI 텍스트**(예: 카드 default title `"Aura Card"`)는 main.js 번들에 박혀있어 i18n으로 못 바꾼다. 1.0.13(`"Aura Cards"` → `"WonikIPS Cards"`), 1.0.14(`"Aura Card"` → `"WonikIPS Card"`) 빌드에서 1회-등장 패치가 안전함을 실증. 길이 차이(4바이트 증가)도 minified JS는 영향 없음.

**트레이드오프**: 원본 JAR 변경 시 패치 재적용 필요. 식별자/URL/CSS 클래스를 잘못 건드리면 정합성 깨짐 → 절대 금지 항목 명시 필요.

**절대 금지 (정합성 깨짐)**:
- 매크로 식별자 `"aura-cards"`, `"aura-button"` 등 (atlassian-plugin.xml `name`/`key` 매칭)
- 서블릿 URL `/aura/config`, `/aura/macro-preview`
- CSS 클래스 `"aura-card"`, `"aura-panel-wrapper"`, `"aura-tab-item"` 등 (Velocity 템플릿 + tabs.css 매칭)
- Cards theme 값 `theme: "aura"`, `"aura-accent"` (CardCollection.vm 분기 매칭)
- Minified 변수명 `AuraC...` (번들 내부 참조)

**식별 규칙**: 공백 포함된 큰따옴표 문자열(`"Aura X"`)만 라벨로 간주. 식별자/URL/CSS는 공백 없으니 자연 분리.

**절차**: `docs/AURA_3.8.0_ANALYSIS.md` §17 참조. 1회 등장 검증 → Python `replace(target, replacement, 1)` → `assert count==1` → 빌드 → JAR 디핑 → 시각 검증 → 회귀 테스트(매크로 삽입/저장/렌더링).

**에러 케이스**:
- 2회 이상 등장 → 컨텍스트 분리 필요(앞뒤 문자로 더 긴 패턴 만들기)
- 패치 후 main.js 안 바뀐 것처럼 보임 → 브라우저 캐시(`Ctrl+Shift+R`) 또는 Confluence 재시작
- 의도치 않은 곳 치환 → `main.js.bak` 으로 롤백 후 재시도

---

### ADR-013: 미러링 plugin은 원본 JAR과 파일 단위로 정합성을 맞춰야 한다

**결정**: Aura 미러링 plugin(`wonikips-confluence-macro`)은 `aura-3.8.0.jar`의 모든 리소스를 누락 없이 포함해야 한다. `atlassian-plugin.xml`의 `name`/`key`/서블릿 URL 정합성만으론 불충분.

**이유**: 1.0.11 빌드까지 매크로 편집 패널은 떴지만 Insert 시 본문 삽입 실패. 원인 추적 결과 `previews/Cards.vm`(Button.vm, Divider.vm 포함) 누락이 결정타였음. `Cards.java.getImagePlaceholder()` → Confluence가 placeholder iframe src로 호출 → `MacroPreviewRenderer.renderCards()`가 `previews/Cards.vm`을 못 찾아 빈/에러 응답 → V4 매크로 브라우저가 placeholder를 못 받아 `macroBrowserComplete` 후속 처리 차단. `previews/`, `webfonts/`, `composition/` 디렉토리를 원본에서 그대로 복사하고 `aura-resources` web-resource에 `webfonts.css`/`fa-solid-900.woff`를 추가하니 1.0.12에서 즉시 동작.

**트레이드오프**: 원본 JAR 변경 시(예: Aura 3.9 출시) 디핑 작업을 다시 해야 함. minified main.js는 패치 금지(원본 그대로 복사 필수).

**검증 절차** (`docs/AURA_3.8.0_ANALYSIS.md` §14):
```bash
# 1. 양쪽 JAR 추출
unzip -d /tmp/aura aura-3.8.0.jar
unzip -d /tmp/ours target/wonikips-confluence-macro-X-server.jar
# 2. 파일 목록 디핑
diff <(cd /tmp/aura && find . -type f | sort) <(cd /tmp/ours && find . -type f | sort)
# 3. main.js 바이트 동일성 (패치되어선 안 됨)
cmp /tmp/aura/client/static/js/main.js /tmp/ours/client/static/js/main.js
# 4. 핵심 디렉토리(previews/, webfonts/, composition/)가 우리 JAR에 모두 있는지
ls /tmp/ours/previews /tmp/ours/webfonts /tmp/ours/composition
```

**에러 케이스**:
- `previews/*.vm` 누락 → `EditorImagePlaceholder` 매크로(Cards/Button/Divider) 삽입 실패
- `webfonts/` 누락 → 아이콘 깨짐 (매크로 삽입엔 직접 영향 없음)
- `main.js` 패치(예: `aura-cards` → `wonui-cards`) → main.js와 atlassian-plugin.xml의 macro key 매칭 실패. main.js는 절대 수정하지 않고 macro `name`/`key`를 `aura-*`로 유지하면서 i18n 라벨로만 브랜딩 변경한다.

---

### ADR-004: 로컬 Docker 환경으로 테스트

**결정**: 별도 서버 없이 Docker Compose로 로컬 테스트  
**이유**: 비용 없음. 빠른 환경 초기화(`docker-compose down -v`). 개인 PC에서 독립적으로 검증 가능.  
**트레이드오프**: Timebomb 라이선스(3시간) 만료마다 재입력 필요. 컨테이너 재시작 시 약 2~3분 대기.  
**에러 케이스**:
- DB 볼륨 잔존 상태에서 재설치 시 "Database Contains Existing Data" 경고 → `docker-compose down -v` 로 볼륨 초기화
- Setup Wizard 500 오류 (DB 초기화 타임아웃) → 브라우저 새로고침으로 해결 (DB 초기화는 백그라운드 완료)
- PostgreSQL `healthcheck` 미설정 시 Confluence가 DB 준비 전 기동 시도 → `depends_on.condition: service_healthy` 로 순서 보장
- JVM 메모리 부족 (`OutOfMemoryError`) → `JVM_MAXIMUM_MEMORY: 2048m` 설정 (최소 권장)

---

### ADR-005: PostgreSQL 14 선택

**결정**: PostgreSQL 12, 13, 14 중 14 선택  
**이유**: DC 7.19 공식 지원 범위 내 최신 버전. 성능 및 보안 패치 최다.  
**트레이드오프**: PostgreSQL 15+ 사용 불가 (DC 7.19 미지원).  
**에러 케이스**:
- `postgres:15` 이미지 사용 시 Confluence DB 연결 오류 → `postgres:14`로 고정
- DB 인코딩 미설정 시 한글 데이터 깨짐 → `POSTGRES_INITDB_ARGS: "--encoding=UTF8"` 추가 권장

---

### ADR-006: Maven 수동 설치 (winget 미지원)

**결정**: winget 대신 직접 zip 다운로드 후 `C:\Users\ohjih\maven`에 설치  
**이유**: winget에 Apache Maven 패키지 없음. 사용자 디렉토리 설치로 관리자 권한 불필요.  
**트레이드오프**: 자동 업데이트 불가. 환경변수 PATH 수동 관리 필요.  
**에러 케이스**:
- `JAVA_HOME` 미설정 시 `mvn` 실행 불가 → User 환경변수에 `JAVA_HOME` 등록 필요
- 시스템 환경변수 변경 시 관리자 권한 오류 → User 환경변수(`SetEnvironmentVariable(..., "User")`)로 우회
- 새 터미널 세션에서 PATH 미반영 → 환경변수 설정 후 터미널 재시작 필요
