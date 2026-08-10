# portal-frontend 구조 설명

이 문서는 `portal-frontend`의 소스 구조, 메뉴 기반 네비게이션 로직, 상태·데이터 흐름을 설명한다. `portal-backend/ARCHITECTURE.md`와 짝을 이루며, 백엔드 도메인(auth/menu/role/user)과 프런트 `features/` 폴더가 1:1 대응하도록 의도적으로 맞춰놨다.

## 1. 기술 스택

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (`@theme` 기반 디자인 토큰, 흑백 테마)
- React Router v7 (클라이언트 라우팅)
- TanStack Query(React Query) — 서버 상태(API 데이터) 캐싱
- Zustand — 클라이언트 상태(로그인 세션)는 아주 작아서 Redux 없이 이걸로 충분
- axios — HTTP 클라이언트 (인터셉터로 인증 처리)
- lucide-react — 아이콘

## 2. 폴더 구조

```
src/
├── main.tsx / App.tsx        # 진입점, 라우트 정의, 인증 부트스트랩
├── layouts/                  # 페이지 뼈대 (전체 앱 공통 레이아웃)
│   ├── AppLayout.tsx          # Topbar + TopNav + Sidebar + <Outlet/> 조립, "현재 활성 대메뉴" 계산
│   ├── Topbar.tsx              # 최상단: 브랜드, 로그인 사용자, 로그아웃
│   ├── TopNav.tsx               # 대메뉴(최상위 메뉴) 가로 탭
│   └── Sidebar.tsx               # 중메뉴/소메뉴 세로 목록 (재귀 렌더링)
├── pages/                    # 라우트에 매핑되는 화면
│   ├── LoginPage.tsx, HomePage.tsx, EmbedPage.tsx
│   └── admin/{MenuManagerPage, RoleManagerPage, UserManagerPage}.tsx
├── features/                 # 백엔드 도메인과 1:1 대응하는 API 함수 + 도메인 전용 로직
│   ├── auth/api.ts            # login/logout/me
│   ├── menu/{api, adminApi, menuTree, adminTree}.ts
│   ├── role/api.ts
│   └── user/api.ts
├── components/                # 여러 페이지에서 재사용하는 순수 UI 조각
│   ├── Button.tsx, Modal.tsx, ConfirmDialog.tsx, MenuIcon.tsx
├── lib/
│   ├── httpClient.ts           # axios 인스턴스 + 인증 인터셉터 (액세스토큰 주입, 401 자동 재시도)
│   └── queryClient.ts           # React Query 기본 옵션
├── store/authStore.ts          # 로그인 세션 (액세스토큰 + 사용자 정보), 메모리에만 존재
├── styles/tokens.css            # 흑백 테마 CSS 변수 (@theme)
└── types/{menu, role, user}.ts  # 백엔드 DTO와 대응하는 TS 타입
```

새 화면을 만들 때 "이건 어디에 두나?"의 기본 규칙: **API 호출 함수는 `features/<도메인>/api.ts`, 화면은 `pages/`, 여러 화면이 같이 쓰는 순수 UI는 `components/`.**

## 3. 메뉴 기반 네비게이션 — 가장 중요한 부분

### 3.1 데이터가 화면을 만든다

메뉴는 하드코딩된 라우트 목록이 아니라 `GET /api/menus/my` 응답(계층형 `MenuNode[]`, `types/menu.ts`)으로 온다. 로그인한 사용자가 볼 수 있는 메뉴만 이미 필터링되어 온다 — 프런트는 권한 판단을 하지 않는다.

### 3.2 상단(대메뉴) + 좌측(중/소메뉴) 2단 구조

- **`TopNav`**: 트리의 depth-0(최상위) 노드들을 가로로 나열한다. 클릭하면:
  - `LINK` → 새 탭으로 열고 끝 (화면 전환 없음)
  - `GROUP` → 그 안에서 DFS로 찾은 첫 `INTERNAL`/`EMBED` 자손으로 이동 (`findFirstNavigableDescendant`, `features/menu/menuTree.ts`)
  - `INTERNAL`/`EMBED` → 자기 라우트로 바로 이동
- **`Sidebar`**: "현재 활성 대메뉴"의 `children`만 받아서 재귀적으로 그린다(중메뉴 아래에 또 `GROUP`이 있으면 소메뉴로 펼쳐짐). 대메뉴 자체가 자식이 없으면(리프) `AppLayout`이 `Sidebar`를 렌더링하지 않는다.

### 3.3 "지금 어느 대메뉴에 있는지"는 URL이 결정한다

별도의 "선택된 대메뉴" 상태를 만들지 않았다. 대신 `AppLayout`이 매 렌더마다:

1. `findMenuForPathname(tree, location.pathname)` — 현재 경로에 해당하는 메뉴 노드를 찾는다(`INTERNAL`은 `targetUrl` 일치, `EMBED`는 `/embed/:menuId` 패턴에서 ID 추출).
2. `findPathToMenu(tree, ...)` — 트리 루트부터 그 노드까지의 조상 경로를 구한다. `path[0]`이 항상 대메뉴다.
3. `path[0].children`을 `Sidebar`에 넘긴다. `TopNav`에는 `path[0].menuId`를 활성 표시용으로 넘긴다.

이렇게 라우트에서 상태를 파생시키면 "뒤로가기/새로고침해도 상단·좌측 메뉴가 항상 현재 위치와 맞다"가 자동으로 보장된다. 새로고침 시 별도 상태 복원 로직이 필요 없다. 이 계산 함수들은 모두 `features/menu/menuTree.ts`에 있다.

### 3.4 admin 화면의 메뉴 트리 편집 — `features/menu/adminTree.ts`

`MenuManagerPage`는 `/api/admin/menus`가 주는 **평면 배열**(`MenuAdmin[]`, `parentMenuId`+`sortOrder`만 있음)을 받아 `buildAdminTree()`로 화면에 필요한 트리를 만든다. 위/아래/들여쓰기/내어쓰기 버튼은 각각 `moveUp`/`moveDown`/`indent`/`outdent` 함수가 "바뀔 항목들의 새 `{menuId, parentMenuId, sortOrder}`"를 계산하고, 그 결과를 `PATCH /api/admin/menus/reorder`로 한 번에 보낸다. 들여쓰기/내어쓰기는 항상 새 형제 그룹의 **맨 끝**에 배치한다(정확한 위치 보존보다 구현 단순성을 택함 — 필요하면 `nextSortOrder`를 손보면 됨).

## 4. 인증 상태

### 4.1 액세스 토큰은 메모리에만 있다

`store/authStore.ts` (Zustand)는 액세스 토큰과 로그인 사용자 정보를 들고 있다. **localStorage/sessionStorage에 절대 저장하지 않는다** — XSS로 스크립트가 실행돼도 토큰을 훔쳐갈 저장소가 없게 하려는 의도적 선택이다. 대신 새로고침하면 토큰이 사라지므로, `App.tsx`가 마운트 시 `refreshAccessToken()`을 한 번 호출해 httpOnly 리프레시 쿠키로 액세스 토큰을 재발급받는다(이게 끝나기 전엔 `isBootstrapping=true`라서 라우트가 잠깐 아무것도 안 그림).

### 4.2 `lib/httpClient.ts`의 인터셉터

- 요청 인터셉터: `authStore`의 액세스 토큰을 매 요청 `Authorization: Bearer` 헤더에 넣는다.
- 응답 인터셉터: 401이 오고, 그 요청이 `/api/auth/refresh` 자신이 아니고, 아직 재시도 안 했다면 → `refreshAccessToken()`으로 새 토큰을 받고 원래 요청을 딱 한 번 재시도한다. 동시에 여러 요청이 401을 맞아도 리프레시 호출은 하나만 나간다(`refreshPromise`로 중복 제거).

`refreshClient`라는 별도의 axios 인스턴스를 쓰는 이유: 리프레시 요청 자체가 이 인터셉터를 다시 타면 리프레시 실패 시 무한 루프에 빠진다.

## 5. 서버 상태 (React Query) 사용 규칙

쿼리 키는 `[스코프, 리소스, ...식별자]` 형태로 통일했다:

- `['menus', 'my']` — 로그인 사용자가 보는 메뉴 트리 (사이드바, 임베드 페이지가 공유)
- `['admin', 'menus']`, `['admin', 'roles']`, `['admin', 'users', query, page]` — 관리자 화면 데이터
- `['admin', 'menus', menuId, 'permissions']` — 메뉴별 권한

**메뉴를 바꾸는 mutation은 항상 `['admin', 'menus']`와 `['menus', 'my']`를 같이 invalidate한다** — 그래야 관리자가 메뉴를 수정한 즉시 사이드바에도 반영된다(실제로 `MenuManagerPage`의 모든 mutation `onSuccess`가 이렇게 되어 있다). 새 admin 화면을 추가할 때 이 패턴을 잊으면 "저장은 됐는데 화면에 안 보인다"는 버그가 생긴다.

역할 배정처럼 "모달을 열어둔 채 여러 번 토글"하는 UI는 선택 대상을 객체 스냅샷(`useState`)으로 들고 있지 말고 **ID만 상태로 갖고, 매 렌더마다 최신 쿼리 데이터에서 찾아 파생**시킨다(`UserManagerPage`의 `rolesTargetId` 참고). 객체 스냅샷을 들고 있으면 mutation 후 refetch된 최신 데이터와 화면이 어긋난다.

## 6. 테마

`styles/tokens.css`가 `--color-canvas/surface/line/ink/ink-muted/accent/accent-ink/danger` 같은 의미 기반 변수를 `@theme`으로 선언하고, Tailwind가 이를 `bg-canvas`, `text-ink`, `border-line` 같은 유틸리티 클래스로 만들어준다. 컴포넌트는 `bg-gray-100`처럼 색을 직접 쓰지 않고 항상 이 의미 기반 클래스를 쓴다 — 나중에 팔레트를 바꿔도 `tokens.css` 한 곳만 고치면 된다.

기본은 **항상 밝은 테마**다(`prefers-color-scheme: dark` 자동 전환 없음). `:root[data-theme='dark']` 규칙은 이미 있으니, 다크모드 토글 버튼을 추가하고 싶으면 그 버튼이 `document.documentElement.dataset.theme`을 `'dark'`/`'light'`로 바꾸게만 하면 된다.

> **주의**: 같은 엘리먼트에 색이 다른 유틸리티 클래스 두 개(예: `text-ink`와 `text-accent-ink`)를 동시에 넣지 않는다. Tailwind가 생성한 스타일시트 순서에 따라 둘 중 하나가 이기는데, 이 순서는 className에 쓴 순서와 무관해서 "검은 글씨 위에 검은 배경" 같은 사고가 난다(`Sidebar.tsx`에서 실제로 겪은 버그). 활성/비활성 상태별로 클래스 문자열 전체를 분기해서 쓴다(`inactiveRowClasses` / `activeRowClasses`처럼).

## 7. 새 관리자 화면을 추가할 때

예를 들어 "부서 관리" 화면을 추가한다면:

1. 백엔드에 `/api/admin/depts` 같은 CRUD API가 있다고 가정하고 `features/dept/api.ts`에 fetch 함수들을 추가한다 (`features/role/api.ts`를 그대로 템플릿으로 복사해서 쓰면 됨 — 가장 단순한 CRUD 예시).
2. `types/dept.ts`에 백엔드 DTO와 맞춘 타입을 추가한다.
3. `pages/admin/DeptManagerPage.tsx`를 만든다. `RoleManagerPage.tsx`를 복사해서 시작하면 목록/생성/수정/삭제 + 모달 패턴을 그대로 재사용할 수 있다.
4. `App.tsx`의 `<Route path="admin/depts" element={<DeptManagerPage/>}/>`를 추가한다.
5. 어드민 화면에서 새 페이지로 가는 길은 코드가 아니라 **메뉴 관리 화면에서 `menuType=INTERNAL`, `targetUrl=/admin/depts`인 메뉴를 만들고 ADMIN 역할에 권한을 부여**하는 것으로 연결한다 — 이게 이 포털의 핵심 설계 의도다.
