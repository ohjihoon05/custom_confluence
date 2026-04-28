# Confluence DC 로컬 설치 가이드

원익IPS 사내 도입 검토용 Confluence Data Center 7.19.8 로컬 테스트 환경 구축 절차.

---

## 사전 요구사항

| 도구 | 버전 | 설치 위치 |
|------|------|-----------|
| Docker Desktop | 최신 | — |
| JDK | 11.0.30 (Eclipse Adoptium) | `C:\Program Files\Eclipse Adoptium\jdk-11.0.30.7-hotspot` |
| Maven | 3.9.6 | `C:\Users\ohjih\maven` |
| Atlassian Plugin SDK | 9.1.1 | `C:\Users\ohjih\atlassian-sdk` |

> **JDK 버전 주의**: Confluence 7.19.8은 JDK 11 필수. JDK 17+ 사용 시 플러그인 빌드 호환성 문제 발생 가능.

---

## 1. 디렉토리 구조 준비

```
confluence/
├── docker-compose.yml
├── macros/
│   └── user-macros/
└── docs/
```

---

## 2. docker-compose.yml 작성

```yaml
services:
  postgres:
    image: postgres:14
    container_name: confluence-postgres
    environment:
      POSTGRES_DB: confluencedb
      POSTGRES_USER: confluenceuser
      POSTGRES_PASSWORD: confluencepass
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - confluence-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U confluenceuser -d confluencedb"]
      interval: 10s
      timeout: 5s
      retries: 5

  confluence:
    image: atlassian/confluence:7.19.8
    container_name: confluence-dc
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      JVM_MINIMUM_MEMORY: 1024m
      JVM_MAXIMUM_MEMORY: 2048m
    ports:
      - "8090:8090"
      - "8091:8091"
    volumes:
      - confluence-data:/var/atlassian/application-data/confluence
      - confluence-shared:/var/atlassian/application-data/confluence/shared
    networks:
      - confluence-net

volumes:
  postgres-data:
  confluence-data:
  confluence-shared:

networks:
  confluence-net:
    driver: bridge
```

**주의사항 (빠진 것들의 이유)**:
- `ATL_CLUSTER_TYPE` 환경변수 → **제거**. 단일 노드에서 `ClusterJoinType` enum 오류 발생 (ADR-001)
- `CONFLUENCE_SHARED_HOME` 환경변수 → **제거**. 동일 이유로 단일 노드에서 제거
- PostgreSQL → **14 고정**. 15+ 버전은 Confluence 7.19 미지원

---

## 3. 컨테이너 기동

```bash
# 프로젝트 루트에서 실행
docker-compose up -d

# 로그 확인 (초기 기동 2~5분 소요)
docker-compose logs -f confluence
```

로그에서 `Confluence is ready to serve` 메시지 확인 후 다음 단계 진행.

---

## 4. 초기 설정 (브라우저)

1. `http://localhost:8090` 접속
2. **Trial installation** 선택
3. **라이선스 입력**:
   - Timebomb 라이선스 (유효기간 3시간) 사용
   - 발급: https://developer.atlassian.com/platform/marketplace/timebomb-licenses-for-testing-server-apps/
   - 만료 시 `docker-compose restart confluence` 후 재발급
4. **Database 설정**:
   - Database type: `PostgreSQL`
   - Hostname: `postgres` (Docker 내부 서비스명)
   - Port: `5432`
   - Database name: `confluencedb`
   - Username: `confluenceuser`
   - Password: `confluencepass`
5. 관리자 계정 생성 후 완료

---

## 5. 주요 운영 명령어

```bash
# 시작
docker-compose up -d

# 중지 (데이터 유지)
docker-compose down

# 재시작 (라이선스 만료 등)
docker-compose restart confluence

# 로그 확인
docker-compose logs -f confluence

# 전체 초기화 (데이터 삭제)
docker-compose down -v
```

---

## 6. 매크로 개발 환경 (플러그인 빌드)

### 환경변수 설정 (Windows)

```powershell
# JAVA_HOME
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-11.0.30.7-hotspot", "User")

# PATH 추가
$path = [System.Environment]::GetEnvironmentVariable("PATH", "User")
[System.Environment]::SetEnvironmentVariable("PATH", "$path;C:\Users\ohjih\maven\bin;C:\Users\ohjih\atlassian-sdk\bin", "User")
```

### 플러그인 스켈레톤 생성

```bash
atlas-create-confluence-plugin
# groupId: com.wonikips
# artifactId: wonikips-confluence-macro
# version: 1.0.0-SNAPSHOT
```

### 빌드

```bash
# 테스트 서버용 (localhost:8090)
C:\Users\ohjih\atlassian-sdk\bin\atlas-package.bat -P server -DskipTests

# 운영 DC 서버용
C:\Users\ohjih\atlassian-sdk\bin\atlas-package.bat -P dc -DskipTests
```

> `mvn` 직접 사용 불가. Atlassian 내부 저장소 접근이 필요하므로 반드시 `atlas-package` 사용.

### 플러그인 설치

1. `target/*.jar` 파일 확인
2. Confluence 관리자 콘솔 → **앱 관리** → **앱 업로드**
3. JAR 파일 업로드 후 활성화 확인

---

## 7. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 컨테이너 기동 시 `ClusterJoinType` 오류 | `ATL_CLUSTER_TYPE` 또는 `CONFLUENCE_SHARED_HOME` 환경변수 설정됨 | `docker-compose.yml`에서 해당 환경변수 제거 |
| DB 연결 실패 | PostgreSQL 15+ 사용 | `postgres:14` 이미지로 변경 |
| 라이선스 만료 후 접근 불가 | Timebomb 라이선스 3시간 제한 | `docker-compose restart confluence` 후 재발급 |
| 플러그인 빌드 실패 (`BOM 미해결`) | `mvn` 직접 실행 | `atlas-package.bat` 사용으로 변경 |
| 플러그인 업로드 후 비활성화 | Server JAR를 DC 환경에 업로드 | DC 프로파일로 빌드 (`-P dc`) |
| `jakarta.inject-api` 버전 오류 | 7.19.8 BOM에 포함 안 됨 | `pom.xml`에 `1.0.5` 명시 |
| OSGi 설치 실패 (`java.*` import) | `java.*` 패키지는 JVM 자동 제공이므로 OSGi import 금지 | `pom.xml` Import-Package에 `!java.*,` 추가 |

---

## 접속 정보 요약

| 항목 | 값 |
|------|-----|
| Confluence URL | http://localhost:8090 |
| DB 호스트 (내부) | postgres:5432 |
| DB 이름 | confluencedb |
| DB 사용자 | confluenceuser |
| DB 비밀번호 | confluencepass |
