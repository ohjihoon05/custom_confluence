# Confluence DC 플러그인 빌드 가이드

---

## 개념부터: Server vs Data Center가 뭐가 달라?

Confluence는 두 가지 배포 형태가 있다.

```
Server (단일 노드)           Data Center (클러스터)
┌─────────────┐             ┌──────┐ ┌──────┐ ┌──────┐
│ Confluence  │             │Node 1│ │Node 2│ │Node 3│
│  (1대)      │             └──┬───┘ └──┬───┘ └──┬───┘
└─────────────┘                └────────┴────────┘
                                     │
                               공유 DB + 공유 스토리지
```

- **Server**: 서버 1대. 플러그인 1개 설치하면 끝.
- **Data Center**: 여러 노드가 같은 DB를 바라봄. 사용자 요청이 어떤 노드로 가든 동일하게 동작해야 함.

---

## DC 플러그인이 특별한 이유

DC 환경에 플러그인을 올리면 Confluence가 먼저 확인한다.

> "이 플러그인 클러스터에서 써도 되는 거 맞아?"

이 질문에 대답하는 게 `atlassian-plugin.xml`의 **DC 호환 선언**이다.

```xml
<param name="atlassian-data-center-compatible">true</param>
<param name="atlassian-data-center-status">compatible</param>
```

이 두 줄이 없으면 DC에 설치해도 플러그인이 **비활성화되거나 매크로가 동작하지 않는다.**

---

## 이 프로젝트의 구조

```
src/main/
├── resources/           ← JS, CSS, VM 템플릿 (Server/DC 공통)
├── resources-server/    ← atlassian-plugin.xml (Server용)
└── resources-dc/        ← atlassian-plugin.xml (DC용 — DC 선언 포함)
```

빌드 시 `resources/`와 `resources-server/` 또는 `resources-dc/` 중 하나를 합쳐서 JAR를 만든다.

---

## Maven이란?

### 한 줄 요약

> Java 프로젝트의 **빌드 자동화 도구**. "소스코드를 JAR 파일로 만들어주는 도구"라고 이해하면 된다.

### Maven이 하는 일

개발자가 Java 코드를 작성하면 그걸 바로 Confluence에 올릴 수 없다. 컴파일하고 패키징하는 과정이 필요하다.

```
개발자가 작성한 것          Maven이 해주는 것
─────────────────          ─────────────────────────────
.java 소스코드         →   1. 의존 라이브러리 자동 다운로드
pom.xml (설정파일)     →   2. 소스코드 컴파일 (.java → .class)
JS, CSS, 이미지        →   3. 리소스 파일 복사
                           4. 전부 묶어서 .jar 파일 생성
```

### pom.xml이 뭔가

Maven의 설정 파일. "이 프로젝트를 어떻게 빌드할지" 정의한다.

```xml
<!-- pom.xml 핵심 내용 -->
<groupId>com.ohjih</groupId>               ← 회사/그룹 식별자
<artifactId>wonikips-confluence-macro</artifactId>  ← 프로젝트 이름
<version>1.0.0-SNAPSHOT</version>          ← 버전

<dependencies>
    <!-- 이 프로젝트가 필요로 하는 외부 라이브러리 목록 -->
    <dependency>
        <groupId>com.atlassian.confluence</groupId>
        <artifactId>confluence</artifactId>
        <version>7.19.8</version>
    </dependency>
</dependencies>
```

의존 라이브러리를 직접 다운로드해서 프로젝트에 넣을 필요 없이, `pom.xml`에 적어두면 Maven이 알아서 인터넷에서 받아온다.

### 빌드 결과물

```
mvn package 실행 후
  └── target/
        └── wonikips-confluence-macro-1.0.0-SNAPSHOT.jar  ← 최종 산출물
```

### 디자인 툴에 비유하면

| Maven 개념 | 디자인 비유 |
|---|---|
| `pom.xml` | 프로젝트 설정 파일 (어떤 폰트, 라이브러리 쓸지) |
| 의존성(dependency) | 플러그인, 에셋 라이브러리 |
| `mvn package` | "내보내기" 실행 |
| `.jar` 결과물 | 내보낸 최종 파일 |

---

## atlas-package란?

### 한 줄 요약

> Atlassian 플러그인 전용 빌드 도구. 내부적으로 Maven을 실행하되, Atlassian 전용 저장소와 플러그인 패키징 규칙이 추가된 래퍼(wrapper)다.

### 일반 Maven과 뭐가 다른가

```
mvn package                    atlas-package
───────────────                ───────────────────────────────
Maven 기본 저장소만 참조  →    Atlassian 내부 Maven 저장소 추가
일반 JAR 생성             →    OSGi 번들 규격의 JAR 생성
                               (Confluence가 인식하는 플러그인 형식)
```

Confluence 플러그인은 일반 JAR가 아니라 **OSGi 번들** 형식이어야 한다.  
`atlas-package`는 빌드 후 자동으로 OSGi 메타데이터(`MANIFEST.MF`)를 생성해준다.

### `-DskipTests`는?

Maven 표준 옵션. 테스트를 건너뛰고 바로 패키징한다.

```
atlas-package              → 테스트 실행 + 빌드 (느림)
atlas-package -DskipTests  → 테스트 생략 + 빌드 (빠름)
```

개발 중 빠르게 확인할 때는 `-DskipTests` 사용. CI/CD나 최종 배포 전에는 생략해서 테스트 포함 빌드.

### 실행하면 내부에서 일어나는 일

```
atlas-package -DskipTests 실행
  ↓
1. pom.xml 읽기
     - confluence.version=7.19.8 확인
     - dc 프로파일 activeByDefault → dc 프로파일 활성화
     - finalName = wonikips-confluence-macro-1.0.0-SNAPSHOT-dc
  ↓
2. 소스 컴파일
     - src/main/java → .class 파일 생성
  ↓
3. 리소스 복사
     - src/main/resources/ (공통: JS, CSS, VM)
     - src/main/resources-dc/ (atlassian-plugin.xml with DC 플래그)
  ↓
4. OSGi 번들 생성
     - Import-Package, Export-Package 자동 계산
     - META-INF/MANIFEST.MF 생성
     - atlassian-plugin.xml 포함 여부 검증
  ↓
5. JAR 패키징
     - target/wonikips-confluence-macro-1.0.0-SNAPSHOT-dc.jar 생성
```

### 왜 `mvn package`를 직접 쓰면 안 되나?

```bash
# 이렇게 하면 안 됨
mvn package -DskipTests

# 이유:
# Atlassian 라이브러리(com.atlassian.confluence:confluence 등)가
# Maven 중앙 저장소에 없고 Atlassian 전용 서버에만 있음.
# atlas-package는 이 서버 주소를 자동으로 설정해줌.
# mvn 직접 실행 시 → 의존성 다운로드 실패 → 빌드 오류
```

---

## 빌드 명령어

> **반드시 `atlas-package` 사용.** `mvn package` 직접 실행 불가 (Atlassian 내부 저장소 의존).

### 운영 DC용 (Clustered)

```bash
C:\Users\ohjih\atlassian-sdk\bin\atlas-package.bat -DskipTests
```

결과: `target/wonikips-confluence-macro-1.0.0-SNAPSHOT-dc.jar`

### 테스트 환경용 (Single-Node, localhost:8090)

```bash
C:\Users\ohjih\atlassian-sdk\bin\atlas-package.bat -P server -DskipTests
```

결과: `target/wonikips-confluence-macro-1.0.0-SNAPSHOT-server.jar`

### 왜 `-P dc`를 안 써도 dc.jar가 나오나?

`pom.xml`에 dc 프로파일이 기본값으로 설정되어 있어서다.

```xml
<profile>
    <id>dc</id>
    <activation>
        <activeByDefault>true</activeByDefault>
    </activation>
    ...
</profile>
```

`-P`를 명시하지 않으면 자동으로 dc 프로파일이 활성화된다.

---

## 업로드 전 검증

### DC 플래그 포함 여부 확인

```bash
unzip -p target\wonikips-confluence-macro-1.0.0-SNAPSHOT-dc.jar atlassian-plugin.xml | grep data-center
```

아래 두 줄이 출력되면 정상:

```
<param name="atlassian-data-center-compatible">true</param>
<param name="atlassian-data-center-status">compatible</param>
```

### MANIFEST.MF에 java.* import 없음 확인

```bash
unzip -p target\wonikips-confluence-macro-1.0.0-SNAPSHOT-dc.jar META-INF/MANIFEST.MF | grep Import-Package
```

`java.lang`, `java.util` 등 `java.`으로 시작하는 항목이 없어야 한다.  
있으면 `pom.xml`의 `<Import-Package>`에 `!java.*,` 추가 후 재빌드.

---

## 배포 흐름

```
코드 수정
  ↓
atlas-package -DskipTests
  ↓
*-dc.jar 생성 확인
  ↓
DC 플래그 포함 여부 확인 (unzip | grep data-center)
  ↓
Confluence 관리자 → 앱 관리 → 앱 업로드
  ↓
UPM이 모든 노드에 자동 배포 (수동 설치 불필요)
  ↓
매크로 동작 확인
```

---

## 환경별 요약

| 환경 | 명령어 | 업로드 파일 |
|---|---|---|
| 운영 DC (Clustered) | `atlas-package -DskipTests` | `*-dc.jar` |
| 테스트 Single-Node | `atlas-package -P server -DskipTests` | `*-server.jar` |

> **suffix 없는 `*-SNAPSHOT.jar`는 사용하지 않는다.**  
> 어느 프로파일로 빌드됐는지 불명확하고 DC 플래그 누락 위험이 있다.

---

## 자주 발생하는 문제

| 증상 | 원인 | 해결 |
|---|---|---|
| DC 설치 후 플러그인 비활성 | DC 플래그 누락 | `-dc.jar`로 재빌드 후 재업로드 |
| 매크로가 페이지에 표시 안 됨 | Server JAR를 DC에 업로드 | `-dc.jar`로 교체 |
| OSGi 번들 활성화 실패 | plugin.xml에 없는 클래스 참조 | 선언된 클래스와 실제 클래스 일치 확인 |
| `java.*` import 오류 | MANIFEST.MF에 java.* 포함 | pom.xml `<Import-Package>`에 `!java.*,` 추가 |
| `mvn` 직접 실행 시 빌드 실패 | Atlassian 저장소 미참조 | `atlas-package` 사용 |
