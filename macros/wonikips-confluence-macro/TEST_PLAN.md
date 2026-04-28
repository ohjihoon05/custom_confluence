# 플러그인 DC 설치 오류 테스트 플랜

## 현상

| JAR | DC 설치 | 매크로 렌더링 |
|-----|---------|-------------|
| `...SNAPSHOT.jar` (구버전, server XML) | ✅ 성공 | ❌ 안 보임 |
| `...SNAPSHOT-dc.jar` (신규, dc XML) | ❌ 설치 오류 | 미확인 |

## 변수 목록 (두 JAR의 차이)

| # | 변수 | 구 JAR | DC JAR |
|---|------|--------|--------|
| A | DC 호환 플래그 | 없음 | `atlassian-data-center-compatible: true` |
| B | `ButtonMacro.class` | 있음 | 없음 |
| C | `MyPluginComponentImpl.class` | 1562 bytes | 1256 bytes |

> 나머지 파일 구조, MANIFEST.MF, OSGi Import-Package, Spring context — 동일

---

## 테스트 케이스

### TEST-1: DC 플래그만 추가 (변수 A 단독 격리)

**목적**: DC 플래그 선언 자체가 설치 실패 원인인지 확인

**방법**:
1. `resources-server/atlassian-plugin.xml`에 DC 플래그 2줄 추가
   ```xml
   <param name="atlassian-data-center-compatible">true</param>
   <param name="atlassian-data-center-status">compatible</param>
   ```
2. `-P server`로 빌드 → `...SNAPSHOT-server.jar` 생성
3. DC에 설치 시도

**예상 결과**:
- 설치 실패 → DC 플래그 자체가 원인 → TEST-2로 원인 좁히기
- 설치 성공 → DC 플래그는 무관 → TEST-3으로 이동

---

### TEST-2: DC 플래그 없이 DC XML 사용 (변수 A 제거)

**목적**: DC XML의 다른 부분(wip-button 제거 등)이 원인인지 확인

**방법**:
1. `resources-dc/atlassian-plugin.xml`에서 DC 플래그 2줄 제거
2. `-P dc`로 빌드
3. DC에 설치 시도

**예상 결과**:
- 설치 성공 → DC 플래그가 확실히 원인
- 설치 실패 → DC 플래그 외 다른 원인 존재 → TEST-3으로 이동

---

### TEST-3: ButtonMacro.class 복원 (변수 B 단독 격리)

**목적**: `ButtonMacro.class` 누락이 원인인지 확인

**방법**:
1. 구 JAR에서 `ButtonMacro.class` 추출
   ```bash
   unzip target/wonikips-confluence-macro-1.0.0-SNAPSHOT.jar com/ohjih/macro/ButtonMacro.class -d /tmp/extract
   ```
2. DC JAR에 `ButtonMacro.class` 주입
   ```bash
   cd /tmp/extract && zip -u .../target/wonikips-confluence-macro-1.0.0-SNAPSHOT-dc.jar com/ohjih/macro/ButtonMacro.class
   ```
3. 수정된 DC JAR로 설치 시도

**예상 결과**:
- 설치 성공 → `ButtonMacro.class` 누락이 원인 (OSGi 클래스로딩 실패)
- 설치 실패 → TEST-4로 이동

---

### TEST-4: MyPluginComponentImpl 단순화 (변수 C 격리)

**목적**: `MyPluginComponentImpl`의 Spring 빈 초기화 실패 여부 확인

**방법**:
1. `MyPluginComponentImpl.java`에서 `ApplicationProperties` 의존성 제거, 단순 구현체로 교체
   ```java
   @ExportAsService({MyPluginComponent.class})
   @Named("myPluginComponent")
   public class MyPluginComponentImpl implements MyPluginComponent {
       public String getName() { return "myComponent"; }
   }
   ```
2. `-P dc`로 빌드
3. DC에 설치 시도

**예상 결과**:
- 설치 성공 → `ApplicationProperties` DI 실패가 원인 (SAL 서비스 타이밍 문제)
- 설치 실패 → TEST-5로 이동

---

### TEST-5: Confluence 로그 직접 확인

**목적**: 위 테스트로 원인이 안 좁혀질 경우 로그에서 직접 확인

**방법**:
1. DC JAR 설치 시도 직전에 로그 모니터링 시작
   ```bash
   ! docker exec confluence-dc sh -c "tail -f /var/atlassian/application-data/confluence/logs/atlassian-confluence.log"
   ```
2. 설치 시도
3. 오류 발생 직후 로그에서 `ERROR` / `Exception` 메시지 복사

---

## 진행 현황

| 테스트 | 상태 | 결과 |
|--------|------|------|
| TEST-1 | 대기 중 | - |
| TEST-2 | 대기 중 | - |
| TEST-3 | 대기 중 | - |
| TEST-4 | 대기 중 | - |
| TEST-5 | 대기 중 | - |

---

## 빌드 명령어 참조

```bash
# Server 프로파일 빌드
C:\Users\ohjih\atlassian-sdk\bin\atlas-package.bat -P server -DskipTests

# DC 프로파일 빌드
C:\Users\ohjih\atlassian-sdk\bin\atlas-package.bat -P dc -DskipTests
```

## 결과물 위치

```
target/
├── wonikips-confluence-macro-1.0.0-SNAPSHOT.jar        ← 구버전 (server, 변경 전)
├── wonikips-confluence-macro-1.0.0-SNAPSHOT-server.jar ← server 빌드
└── wonikips-confluence-macro-1.0.0-SNAPSHOT-dc.jar     ← dc 빌드
```
