# DC(Data Center) 호환 플러그인 개발 가이드

Confluence Data Center 7.19.x 환경에서 P2 플러그인이 클러스터 전체에서 정상 동작하려면 일반 Server 플러그인과 다른 요구사항이 있다.

---

## 1. DC 호환 선언 — atlassian-plugin.xml

`plugin-info` 섹션에 아래 두 줄이 **반드시** 있어야 한다.

```xml
<plugin-info>
  <description>...</description>
  <version>${project.version}</version>
  <vendor name="..." url="..." />
  <param name="atlassian-data-center-status">compatible</param>
  <param name="atlassian-data-center-compatible">true</param>
</plugin-info>
```

| 파라미터 | 값 | 역할 |
|---|---|---|
| `atlassian-data-center-status` | `compatible` | Marketplace/UPM에 기술 검증 완료 신호 |
| `atlassian-data-center-compatible` | `true` | 구버전 UPM 하위 호환 플래그 |

둘 중 하나라도 없으면 DC에 설치 시 **플러그인 비활성화 또는 경고 상태**로 표시된다.

---

## 2. 빌드 방법

### 이 프로젝트의 빌드 명령어

```bash
# DC용 (운영 Confluence DC — node1:3737c48 대상)
C:\Users\ohjih\atlassian-sdk\bin\atlas-package.bat -DskipTests
# → target/wonikips-confluence-macro-1.0.0-SNAPSHOT-dc.jar

# Server용 (테스트 환경 localhost:8090 대상)
C:\Users\ohjih\atlassian-sdk\bin\atlas-package.bat -P server -DskipTests
# → target/wonikips-confluence-macro-1.0.0-SNAPSHOT-server.jar
```

> **주의**: `mvn package` 직접 사용 불가. 반드시 `atlas-package` 사용 (Atlassian 내부 저장소 의존).

### pom.xml 프로파일 구조

```
src/main/
├── resources/           # 공통 리소스 (JS, CSS, VM 템플릿, 이미지)
├── resources-server/    # atlassian-plugin.xml — DC 플래그 없음
└── resources-dc/        # atlassian-plugin.xml — DC 플래그 포함
```

`dc` 프로파일이 `activeByDefault: true`이므로 `-P` 생략 시 자동으로 dc 빌드.

### JAR 업로드 전 DC 플래그 확인

```bash
unzip -p target\wonikips-confluence-macro-1.0.0-SNAPSHOT-dc.jar atlassian-plugin.xml | grep data-center
```

아래 두 줄이 출력되면 정상:
```
<param name="atlassian-data-center-compatible">true</param>
<param name="atlassian-data-center-status">compatible</param>
```

---

## 3. 클러스터에서 플러그인 설치 동작 방식

1. UPM에서 JAR 업로드 → 공유 DB(`PLUGINDATA` 테이블)에 저장
2. 모든 노드가 DB 변경을 감지 → 각자 로컬 클래스패스에 JAR 로드
3. 별도로 다른 노드에 수동 설치할 필요 없음

**주의**: UPM 자체를 업데이트했다면 노드를 순서대로 Rolling Restart해야 함.

---

## 4. 클러스터 안전 캐싱

### HashMap 사용 금지

```java
// ❌ WRONG — 각 노드가 독립된 메모리를 가짐
private Map<String, String> cache = new ConcurrentHashMap<>();
// Node A에서 put → Node B에서 get → null (stale)
```

### Atlassian Cache API 사용

```java
// ✅ CORRECT — 클러스터 전체에 복제
@Inject private CacheFactory cacheFactory;

Cache<String, String> clusterCache = cacheFactory.getCache(
    "com.ohjih.wonikips-confluence-macro.cache",
    null,
    new CacheSettings.Builder()
        .replicateAsynchronously()
        .maxEntries(1000)
        .build()
);
```

캐시 키/값은 반드시 `java.io.Serializable` 구현 필요.

---

## 5. 파일 I/O — Shared Home 사용

```java
// ❌ WRONG — 로컬 노드에만 저장됨
Files.write(Paths.get("C:\\local\\file.txt"), data);

// ✅ CORRECT — 모든 노드가 접근 가능한 공유 홈에 저장
String sharedHome = confluenceGlobalSettings.getSharedHome();
Path pluginDir = Paths.get(sharedHome, "shared-plugin-data", "wonikips-macro");
Files.createDirectories(pluginDir);
Files.write(pluginDir.resolve("config.json"), data);
```

| 디렉토리 | 위치 | 내용 |
|---|---|---|
| **Local Home** | 각 노드 로컬 | 로그, 캐시, Lucene 인덱스 |
| **Shared Home** | NFS/SMB 공유 | 첨부파일, 플러그인 데이터, 백업 |

---

## 6. 매크로 편집 UI (setMacroJsOverride) DC 주의사항

### 클러스터에서의 동작 흐름

```
사용자가 편집기에서 매크로 삽입
  → 브라우저에서 setMacroJsOverride의 opener() 호출 (클라이언트 사이드)
  → 커스텀 다이얼로그 표시
  → Save 클릭 → macroBrowserComplete() 호출
  → TinyMCE가 매크로를 편집기에 삽입
  → 페이지 저장 시 DB에 기록 (모든 노드에서 조회 가능)
```

JS 실행은 **브라우저(클라이언트 사이드)**에서 일어나므로 서버 노드 라우팅과 무관하다.
단, web-resource가 제대로 로드되지 않으면 `tinymce.confluence.macrobrowser`가 undefined가 되어 조용히 실패한다.

### macroBrowserComplete 방어 코드 패턴

```javascript
// tinymce 경로 존재 여부 확인 후 호출
if (typeof tinymce === 'undefined' ||
    !tinymce.confluence ||
    !tinymce.confluence.macrobrowser ||
    typeof tinymce.confluence.macrobrowser.macroBrowserComplete !== 'function') {
    console.error('[Macro] macroBrowserComplete 없음');
    return;
}

tinymce.confluence.macrobrowser.macroBrowserComplete({
    name:   'page-title',   // atlassian-plugin.xml의 name 속성값 (key 아님)
    params: params,
    defaultParameterValue: '',
    body:   ''
});
```

### web-resource context 설정

```xml
<!-- ❌ WRONG — macro-browser는 유효하지 않은 context명 -->
<context>macro-browser</context>

<!-- ✅ CORRECT — 편집기 진입 시 JS 로드 -->
<context>editor</context>
```

---

## 7. DC 호환성 검증 절차

### 업로드 전 체크리스트

```
□ atlassian-plugin.xml에 DC 플래그 2개 포함 확인
  → unzip -p *.jar atlassian-plugin.xml | grep data-center

□ MANIFEST.MF에 java.* import 없음 확인
  → unzip -p *.jar META-INF/MANIFEST.MF | grep "Import-Package"
  → java.lang, java.util 등 java.* 접두사 항목 없어야 함

□ atlassian-plugin.xml에 선언된 모든 클래스가 JAR에 존재 확인
  → DC에 설치 시 없는 클래스 참조 → OSGi 번들 활성화 실패

□ HashMap/ConcurrentHashMap 대신 CacheFactory 사용 여부 확인
  → 현재 프로젝트는 캐싱 없으므로 해당 없음

□ 로컬 파일 시스템 직접 쓰기 없음 확인
  → 현재 프로젝트는 파일 I/O 없으므로 해당 없음
```

### Confluence DC Plugin Validator (심화)

Atlassian 제공 검증 도구. 이미 설치된 플러그인의 클러스터 호환성 이슈(직렬화 문제, 스레드 안전성 등)를 자동 분석한다.

```bash
java -jar cdc-plugin-validator.jar \
  -installation "<confluence-home>" \
  -dburl "jdbc:postgresql://localhost:5432/confluence" \
  -dbuser confluence_user \
  -dbpassword confluence_password \
  -dbdriver "org.postgresql.Driver" \
  -dbfile "postgresql-driver.jar"
```

---

## 8. 로컬에서 DC 환경 테스트

### 현재 구성 (Single-Node DC)

`docker-compose.yml`의 `atlassian/confluence:7.19.8`은 Data Center 에디션이다. 단일 노드로 구동 중이어도 DC 코드 경로를 통해 실행되므로 기본적인 DC 호환성 검증이 가능하다.

### 한계

- 노드 간 캐시 복제 테스트 불가
- 로드 밸런서 라우팅 테스트 불가
- 플러그인 배포 전파 타이밍 테스트 불가

### 2-노드 로컬 클러스터 구성 (심화)

실제 멀티노드 동작 검증이 필요할 경우 docker-compose를 확장해서 2노드 클러스터를 구성할 수 있다. Shared Home을 NFS 또는 바인드 마운트로 공유하고 Hazelcast 클러스터링을 활성화해야 한다. (별도 구성 가이드 필요)

---

## 참고 — 에러 케이스 요약

| 증상 | 원인 | 해결 |
|---|---|---|
| DC 설치 후 플러그인 비활성 | DC 플래그 누락 | resources-dc/atlassian-plugin.xml에 플래그 추가 후 재빌드 |
| 매크로 렌더링 안 됨 (DC) | DC 플래그 없는 JAR 업로드 | `-dc.jar`로 재업로드 |
| 매크로 삽입 안 됨 (Save 후) | web-resource 로드 실패 또는 `macroBrowserComplete` 경로 오류 | 브라우저 콘솔 확인, context=editor 설정 확인 |
| OSGi 번들 활성화 실패 | plugin.xml에 선언된 클래스가 JAR에 없음 | 선언과 실제 클래스 일치 여부 확인 |
| 노드 간 데이터 불일치 | HashMap 사용 | Atlassian Cache API로 교체 |
