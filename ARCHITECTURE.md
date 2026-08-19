# portal-frontend 구조 설명

이 문서는 `portal-frontend`의 소스 구조, 메뉴 기반 네비게이션 로직, 상태·데이터 흐름을 설명한다. `portal-backend/ARCHITECTURE.md`와 짝을 이루며, 백엔드 도메인(auth/menu/role/user)과 프런트 `features/` 폴더가 1:1 대응하도록 의도적으로 맞춰놨다.

## 1. 기술 스택

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (`@theme` 기반 디자인 토큰, 중립 팔레트 + 인디고 포인트 컬러)
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
│   ├── LoginPage.tsx, HomePage.tsx, MyPage.tsx, EmbedPage.tsx
│   ├── BoardPage.tsx, BoardPostFormPage.tsx, BoardPostDetailPage.tsx   # 게시판: 목록/작성·수정/상세+댓글
│   └── admin/{MenuManagerPage, RoleManagerPage, UserManagerPage, DeptManagerPage, ErrorLogManagerPage, BoardManagerPage}.tsx
├── features/                 # 백엔드 도메인과 1:1 대응하는 API 함수 + 도메인 전용 로직
│   ├── auth/api.ts            # login/logout/me
│   ├── menu/{api, adminApi, menuTree, adminTree}.ts
│   ├── role/api.ts
│   ├── dept/api.ts             # 부서 마스터 CRUD — 권한 모달·사용자 폼의 부서 선택도 여기서 가져온다
│   ├── errorLog/api.ts         # 읽기 전용: 페이징 목록 + 상세(스택 트레이스)
│   ├── board/{api, adminApi}.ts # api.ts: 게시글/댓글/첨부(사용자용, multipart). adminApi.ts: 게시판 정의 CRUD
│   └── user/api.ts            # 관리자용 CRUD + 본인 프로필(self-service: fetchMyProfile 등)
├── components/                # 여러 페이지에서 재사용하는 순수 UI 조각
│   ├── Button.tsx, Modal.tsx, ConfirmDialog.tsx, MenuIcon.tsx
├── lib/
│   ├── httpClient.ts           # axios 인스턴스 + 인증 인터셉터 (액세스토큰 주입, 401 자동 재시도)
│   └── queryClient.ts           # React Query 기본 옵션
├── store/authStore.ts          # 로그인 세션 (액세스토큰 + 사용자 정보), 메모리에만 존재
├── styles/tokens.css            # 테마 CSS 변수 (@theme) — 중립 팔레트 + 인디고 포인트
└── types/{menu, role, user, dept, errorLog, board}.ts  # 백엔드 DTO와 대응하는 TS 타입
```

새 화면을 만들 때 "이건 어디에 두나?"의 기본 규칙: **API 호출 함수는 `features/<도메인>/api.ts`, 화면은 `pages/`, 여러 화면이 같이 쓰는 순수 UI는 `components/`.**

## 3. 메뉴 기반 네비게이션 — 가장 중요한 부분

### 3.1 데이터가 화면을 만든다

메뉴는 하드코딩된 라우트 목록이 아니라 `GET /api/menus/my` 응답(계층형 `MenuNode[]`, `types/menu.ts`)으로 온다. 로그인한 사용자가 볼 수 있는 메뉴만 이미 필터링되어 온다 — 프런트는 권한 판단을 하지 않는다.

### 3.2 상단(대메뉴) + 좌측(중/소메뉴) 2단 구조

- **`TopNav`**: 트리의 depth-0(최상위) 노드들을 가로로 나열한다. 클릭하면:
  - `LINK` → `openMode`에 따라 분기한다: `NEW_TAB`은 `window.open(...,'_blank',...)`, `SELF`는 `window.location.href`로 현재 탭 자체를 그 URL로 보내버림(SPA를 완전히 떠남), `IFRAME`은 `EMBED`와 동일하게 `/embed/:menuId` 라우트로 in-app 네비게이션한다.
    - **주의**: `openMode`는 DB/폼에는 있지만 예전엔 `Sidebar`/`TopNav` 어디서도 실제로 읽지 않고 LINK는 항상 새 탭으로 하드코딩되어 있었다(2026-08-12에 고침) — `openMode`를 다루는 코드를 건드릴 때는 세 값 전부(`SELF`/`NEW_TAB`/`IFRAME`) 실제 브라우저 동작까지 확인할 것, 폼에 값이 저장되는 것만 확인하고 끝내면 이 버그가 재발한다.
  - `GROUP` → 그 안에서 DFS로 찾은 첫 `INTERNAL`/`EMBED`(또는 `openMode=IFRAME`인 `LINK`) 자손으로 이동 (`findFirstNavigableDescendant`, `features/menu/menuTree.ts`)
  - `INTERNAL`/`EMBED` → 자기 라우트로 바로 이동
  - `routeForMenu()`(`features/menu/menuTree.ts`)가 "이 메뉴가 in-app 라우트를 갖는가"의 단일 판단 지점이다 — `EMBED`이거나 `LINK`+`openMode=IFRAME`이면 `/embed/:menuId`, `INTERNAL`이면 자기 `targetUrl`, 나머지는 `null`. `Sidebar`/`TopNav`가 각자 따로 이 판단을 반복하지 않도록 여기서만 정의한다.
- **`Sidebar`**: "현재 활성 대메뉴"의 `children`만 받아서 재귀적으로 그린다(중메뉴 아래에 또 자식이 있으면 소메뉴로 펼쳐짐). 대메뉴 자체가 자식이 없으면(리프) `AppLayout`이 `Sidebar`를 렌더링하지 않는다.
  - 자식 유무(`hasChildren`)와 메뉴 타입은 서로 독립이다 — `GROUP`뿐 아니라 `LINK`/`INTERNAL`/`EMBED`도 자식을 가질 수 있다(예: 그 자체로 이동 가능한 메뉴 밑에 소메뉴가 달린 경우). 그래서 접기/펼치기 화살표(`ChevronDown`/`ChevronRight`)는 `content`(GROUP 버튼 / LINK `<a>` / `NavLink`)와 **형제 엘리먼트**로 렌더링하고, `hasChildren`이면 무조건 보여준다 — 특정 `menuType`일 때만 그리는 게 아니다. 화살표를 눌러도 이동은 하지 않고 그 메뉴의 `expanded` 로컬 state만 토글한다(각 메뉴 노드가 자기 펼침 상태를 갖는 재귀 컴포넌트 구조).
  - `LINK`의 `content`도 `TopNav`와 동일하게 `openMode`로 분기한다 — `openMode !== 'IFRAME'`이면 `<a>`(`SELF`는 `target` 없이 현재 탭에서, 그 외엔 `target="_blank"`), `IFRAME`이면 `EMBED`와 같은 취급으로 `/embed/:menuId`를 향한 `NavLink`가 된다.
  - 화살표를 내비게이션 엘리먼트(`<a>`/`<button>`/`NavLink`) **안에 중첩시키면 안 된다** — `<button>` 안에 `<button>`을 넣는 잘못된 HTML이 되고 클릭 이벤트도 뒤섞인다. 항상 `<div className="flex items-center">화살표 + content</div>` 형태로 나란히 둔다.
  - 이건 메뉴 항목 하나씩 접는 기능이고, `Sidebar` 패널 전체를 접는 것과는 별개다 — 전체 접기는 바로 아래 항목 참고.

`Sidebar` 전체를 접었다 펼 수도 있다(화면을 더 넓게 쓰고 싶을 때). `AppLayout`이 `showSidebar`일 때 항상 렌더링하는 폭 32px짜리 레일(`w-8` div)에 토글 버튼이 있고, `sidebarCollapsed` state에 따라 `Sidebar` 자체를 마운트/언마운트한다. 이 토글 버튼을 `Sidebar` 안이 아니라 레일에 둔 이유: `Sidebar`가 사라져도(접힌 상태) 다시 펼 수단이 남아있어야 하기 때문이다. 처음엔 접힌 상태에서 본문 위에 떠 있는 절대위치(`absolute`) 버튼으로 만들었다가, 본문 텍스트와 겹치는 문제가 있어서 항상 자리를 차지하는 레일 방식으로 바꿨다 — 겹침 없이 하려면 절대위치보다 항상 flex 흐름에 있는 고정 폭 레일이 더 안전하다.

### 3.3 "지금 어느 대메뉴에 있는지"는 URL이 결정한다

별도의 "선택된 대메뉴" 상태를 만들지 않았다. 대신 `AppLayout`이 매 렌더마다:

1. `findMenuForPathname(tree, location.pathname)` — 현재 경로에 해당하는 메뉴 노드를 찾는다(`INTERNAL`은 `targetUrl` 일치, `EMBED`는 `/embed/:menuId` 패턴에서 ID 추출, 게시판은 `/boards/:boardId` **접두사**로 매치 — 아래 설명).
2. `findPathToMenu(tree, ...)` — 트리 루트부터 그 노드까지의 조상 경로를 구한다. `path[0]`이 항상 대메뉴다.
3. `path[0].children`을 `Sidebar`에 넘긴다. `TopNav`에는 `path[0].menuId`를 활성 표시용으로 넘긴다.

게시판 메뉴의 `targetUrl`은 항상 `/boards/{boardId}`(하위 경로 없음)인데, 실제 라우트는 `/boards/:boardId`(목록), `/boards/:boardId/posts/new`, `/boards/:boardId/posts/:postId`, `/boards/:boardId/posts/:postId/edit` 네 개다. `targetUrl === pathname` 정확히 일치 비교로는 목록 화면 말고는 전부 매치가 안 돼서, `findMenuForPathname`은 `/^\/boards\/(\d+)/`로 boardId만 뽑아 `targetUrl === '/boards/' + boardId`인 노드를 찾는다 — 게시글 상세/작성/수정 어느 화면에 있어도 항상 같은 대메뉴가 활성 표시된다.

이렇게 라우트에서 상태를 파생시키면 "뒤로가기/새로고침해도 상단·좌측 메뉴가 항상 현재 위치와 맞다"가 자동으로 보장된다. 새로고침 시 별도 상태 복원 로직이 필요 없다. 이 계산 함수들은 모두 `features/menu/menuTree.ts`에 있다.

`/me`(마이페이지)는 이 메뉴 트리에 속하지 않는 고정 라우트다 — 메뉴 권한 시스템 밖에서 항상 모든 로그인 사용자가 접근 가능해야 하므로(자기 계정 정보는 권한과 무관), 백엔드 메뉴 데이터로 등록하지 않고 `Topbar`에 고정 링크로 박아뒀다. 어떤 메뉴와도 매칭되지 않으므로 이 페이지에 있을 때는 `topAncestor`가 `null`이 되어 대메뉴/좌측메뉴가 강조 없이 표시된다(홈 화면과 동일한 동작).

### 3.4 admin 화면의 메뉴 트리 편집 — `features/menu/adminTree.ts`

`MenuManagerPage`는 `/api/admin/menus`가 주는 **평면 배열**(`MenuAdmin[]`, `parentMenuId`+`sortOrder`만 있음)을 받아 `buildAdminTree()`로 화면에 필요한 트리를 만든다. 위/아래/들여쓰기/내어쓰기 버튼은 각각 `moveUp`/`moveDown`/`indent`/`outdent` 함수가 "바뀔 항목들의 새 `{menuId, parentMenuId, sortOrder}`"를 계산하고, 그 결과를 `PATCH /api/admin/menus/reorder`로 한 번에 보낸다. 들여쓰기/내어쓰기는 항상 새 형제 그룹의 **맨 끝**에 배치한다(정확한 위치 보존보다 구현 단순성을 택함 — 필요하면 `nextSortOrder`를 손보면 됨).

### 3.5 조상 자동 노출은 없다 — 모든 레벨에 각각 권한을 줘야 보인다

`GET /api/menus/my`는 대메뉴든 중메뉴든 소메뉴든 예외 없이 **해당 메뉴에 직접 권한이 있는 것만** 필터링해서 내려준다(백엔드 쪽 규칙은 `portal-backend/ARCHITECTURE.md` 3.4 참고). 프런트는 이 트리를 그대로 그리기만 하므로 별도 처리는 필요 없지만, admin이 "중메뉴에 권한을 줬는데 화면에 안 보인다"고 할 때 원인은 거의 항상 그 중메뉴의 **부모 대메뉴에도 같은 principal의 권한이 빠져 있는 경우**다 — `MenuManagerPage`에서 권한을 부여할 때는 보여주고 싶은 메뉴부터 그 조상 전부에 똑같이 권한을 넣어야 한다는 걸 기억할 것.

### 3.6 권한 부여 모달 — 역할·부서·개인 복수 선택 (`PermissionModal`, `MenuManagerPage.tsx`)

메뉴 하나의 권한은 역할/부서/개인 세 축을 동시에 가질 수 있고(`OR` 조건 — 셋 중 하나라도 맞으면 보임), 각 축 안에서도 복수 선택이 된다. 모달 안에서 세 섹션으로 나눠 관리한다:

- **역할**: 체크박스 목록(기존 역할 관리 화면과 같은 목록을 재사용).
- **부서**: 별도 부서 마스터 테이블이 없으므로 `GET /api/admin/users/dept-codes`(기존 사용자들이 실제로 쓰는 부서코드 중복제거 목록)로 체크박스를 채운다.
- **개인**: 사용자 검색(`searchUsers`) → 결과에서 추가 → 선택된 사용자 목록에서 제거, 형태의 태그 UI. 모달을 열 때 이미 저장된 `userIds`만 갖고 있으므로, 이름/로그인ID를 보여주려면 `fetchUsersByIds`로 상세를 한 번에 조회해서 `selectedUsers` state에 채워 넣는다(`useEffect(() => { if (permissions?.userIds.length) fetchUsersByIds(...).then(setSelectedUsers) }, [permissions])`).

저장은 `PUT /api/admin/menus/{id}/permissions`에 `{roleIds, deptCodes, userIds}` 세 배열을 **항상 전체로** 보낸다 — 부분 갱신 API가 없으므로 체크박스를 하나만 토글해도 세 배열 전체를 다시 조립해서 보낸다. 저장 mutation이 진행 중(`mutation.isPending`)인 동안은 모든 체크박스/버튼을 `disabled`로 막아 중복 요청으로 겹친 토글이 서버에서 경쟁하는 것을 방지한다.

## 4. 인증 상태

### 4.1 액세스 토큰은 메모리에만 있다

`store/authStore.ts` (Zustand)는 액세스 토큰과 로그인 사용자 정보를 들고 있다. **localStorage/sessionStorage에 절대 저장하지 않는다** — XSS로 스크립트가 실행돼도 토큰을 훔쳐갈 저장소가 없게 하려는 의도적 선택이다. 대신 새로고침하면 토큰이 사라지므로, `App.tsx`가 마운트 시 `refreshAccessToken()`을 한 번 호출해 httpOnly 리프레시 쿠키로 액세스 토큰을 재발급받는다(이게 끝나기 전엔 `isBootstrapping=true`라서 라우트가 잠깐 아무것도 안 그림).

### 4.2 `lib/httpClient.ts`의 인터셉터

- 요청 인터셉터: `authStore`의 액세스 토큰을 매 요청 `Authorization: Bearer` 헤더에 넣는다.
- 응답 인터셉터: 401이 오고, 그 요청이 `/api/auth/refresh` 자신이 아니고, 아직 재시도 안 했다면 → `refreshAccessToken()`으로 새 토큰을 받고 원래 요청을 딱 한 번 재시도한다. 동시에 여러 요청이 401을 맞아도 리프레시 호출은 하나만 나간다(`refreshPromise`로 중복 제거).

`refreshClient`라는 별도의 axios 인스턴스를 쓰는 이유: 리프레시 요청 자체가 이 인터셉터를 다시 타면 리프레시 실패 시 무한 루프에 빠진다.

### 4.3 로그인/로그아웃 시 React Query 캐시를 반드시 비운다

`['menus','my']`를 비롯해 이 앱의 거의 모든 캐시된 쿼리는 "지금 로그인한 사람" 기준으로 필터링된 데이터다. React Query의 `QueryClient`는 앱 전역에 하나뿐인 싱글턴이고 쿼리 키에 사용자 식별자가 들어있지 않기 때문에, 로그인/로그아웃을 해도 캐시는 자동으로 비워지지 않는다 — 그대로 두면 같은 탭에서 admin으로 있다가 로그아웃 후 다른(권한이 적은) 계정으로 다시 로그인했을 때, 새로 데이터를 받아오기 전까지 **이전 계정의 메뉴 트리가 그대로 화면에 남아있을 수 있다**(실제로 이 증상 때문에 "권한을 ADMIN으로만 줬는데 일반 사용자에게도 메뉴가 보인다"는 버그 리포트가 있었다 — 정작 백엔드 권한 로직은 정상이었고, 프런트가 이전 세션의 캐시를 안 지운 게 원인이었다).

그래서 `LoginPage.tsx`의 로그인 성공 직후와 `Topbar.tsx`의 로그아웃 처리 안에서 둘 다 `queryClient.clear()`를 호출한다. 사용자 스코프의 쿼리를 새로 추가하더라도(예: 나중에 사용자별 알림 등) 이 두 지점을 건드릴 필요는 없다 — `clear()`가 전체를 비우기 때문. 대신 로그인/로그아웃 흐름을 바꿀 때는 이 호출이 계속 남아있는지 확인할 것.

## 5. 서버 상태 (React Query) 사용 규칙

쿼리 키는 `[스코프, 리소스, ...식별자]` 형태로 통일했다:

- `['menus', 'my']` — 로그인 사용자가 보는 메뉴 트리 (사이드바, 임베드 페이지가 공유)
- `['admin', 'menus']`, `['admin', 'roles']`, `['admin', 'users', query, page]` — 관리자 화면 데이터
- `['admin', 'menus', menuId, 'permissions']` — 메뉴별 권한

**메뉴를 바꾸는 mutation은 항상 `['admin', 'menus']`와 `['menus', 'my']`를 같이 invalidate한다** — 그래야 관리자가 메뉴를 수정한 즉시 사이드바에도 반영된다(실제로 `MenuManagerPage`의 모든 mutation `onSuccess`가 이렇게 되어 있다). 새 admin 화면을 추가할 때 이 패턴을 잊으면 "저장은 됐는데 화면에 안 보인다"는 버그가 생긴다.

역할 배정처럼 "모달을 열어둔 채 여러 번 토글"하는 UI는 선택 대상을 객체 스냅샷(`useState`)으로 들고 있지 말고 **ID만 상태로 갖고, 매 렌더마다 최신 쿼리 데이터에서 찾아 파생**시킨다(`UserManagerPage`의 `rolesTargetId` 참고). 객체 스냅샷을 들고 있으면 mutation 후 refetch된 최신 데이터와 화면이 어긋난다.

## 6. 테마 — "Quiet Structure"

거의 무채색에 가까운 중립 팔레트를 유지하면서, 인디고 포인트 컬러 하나와 옅은 그림자·테두리로 입체감을 준 톤이다("Quiet Structure" 방향, 다른 3가지 대안은 디자인 검토 시 함께 논의됨). `styles/tokens.css`가 다음 의미 기반 변수를 `@theme`으로 선언하고, Tailwind가 이를 `bg-canvas`, `text-ink`, `border-line` 같은 유틸리티 클래스로 만들어준다:

| 토큰 | 역할 | 쓰이는 곳 |
|---|---|---|
| `--color-canvas` | 은은한 오프화이트 배경 | 페이지 바탕, 본문 콘텐츠 영역, 표 헤더 행 |
| `--color-surface` | 순백색 | 상단바·대메뉴바·좌측메뉴·카드·모달·표 본문 (캔버스 위에 "떠 있는" 느낌) |
| `--color-line` | 테두리 | 모든 구분선 |
| `--color-ink` / `--color-ink-muted` | 본문 텍스트 / 보조 텍스트 | |
| `--color-accent` | 인디고, 강한 강조 | 기본 버튼, 대메뉴 활성 탭(선명한 필) |
| `--color-accent-soft` | 인디고의 옅은 틴트 | 좌측 중/소메뉴 활성 항목(연한 배경 + 좌측 강조선, 대메뉴보다 한 단계 약한 강조) |
| `--color-accent-ink` | 강조색 위에 올라가는 텍스트 | |
| `--color-danger` | 위험 동작 | 삭제/비활성화 확인 버튼 |

컴포넌트는 `bg-gray-100`처럼 색을 직접 쓰지 않고 항상 이 의미 기반 클래스를 쓴다 — 나중에 팔레트를 바꿔도 `tokens.css` 한 곳만 고치면 된다. 대메뉴(TopNav)는 `bg-accent`(선명한 필)로, 중/소메뉴(Sidebar)는 `bg-accent-soft`(연한 틴트 + 좌측 강조선)로 활성 상태를 표현해 두 내비게이션 단계가 시각적으로 구분된다.

기본은 **항상 밝은 테마**다(`prefers-color-scheme: dark` 자동 전환 없음). `:root[data-theme='dark']` 규칙은 이미 있으니, 다크모드 토글 버튼을 추가하고 싶으면 그 버튼이 `document.documentElement.dataset.theme`을 `'dark'`/`'light'`로 바꾸게만 하면 된다.

> **주의**: 같은 엘리먼트에 색이 다른 유틸리티 클래스 두 개(예: `text-ink`와 `text-accent-ink`)를 동시에 넣지 않는다. Tailwind가 생성한 스타일시트 순서에 따라 둘 중 하나가 이기는데, 이 순서는 className에 쓴 순서와 무관해서 "검은 글씨 위에 검은 배경" 같은 사고가 난다(`Sidebar.tsx`에서 실제로 겪은 버그). 활성/비활성 상태별로 클래스 문자열 전체를 분기해서 쓴다(`inactiveRowClasses` / `activeRowClasses`처럼).

## 7. 새 관리자 화면을 추가할 때

예를 들어 "부서 관리" 화면을 추가한다면 (이 문서에 예시로만 적혀 있던 걸 실제로 만들었다 — 아래는 실제 구현 기준):

1. 백엔드에 `/api/admin/depts` 같은 CRUD API가 있다고 가정하고 `features/dept/api.ts`에 fetch 함수들을 추가한다 (`features/role/api.ts`를 그대로 템플릿으로 복사해서 쓰면 됨 — 가장 단순한 CRUD 예시).
2. `types/dept.ts`에 백엔드 DTO와 맞춘 타입을 추가한다.
3. `pages/admin/DeptManagerPage.tsx`를 만든다. `RoleManagerPage.tsx`를 복사해서 시작하면 목록/생성/수정/삭제 + 모달 패턴을 그대로 재사용할 수 있다.
4. `App.tsx`의 `<Route path="admin/depts" element={<DeptManagerPage/>}/>`를 추가한다.
5. 어드민 화면에서 새 페이지로 가는 길은 코드가 아니라 **메뉴 관리 화면에서 `menuType=INTERNAL`, `targetUrl=/admin/depts`인 메뉴를 만들고 ADMIN 역할에 권한을 부여**하는 것으로 연결한다 — 이게 이 포털의 핵심 설계 의도다(실제로는 매번 수동으로 만들 필요 없이, 백엔드 시드 마이그레이션에서 메뉴 행 + ADMIN 권한 부여까지 한 번에 넣었다).

부서 관리가 생기면서 "부서 코드 목록"의 소스가 바뀌었다 — 이전엔 `MenuManagerPage`의 권한 모달과 `UserManagerPage`의 사용자 생성 폼 둘 다 `fetchDeptCodes()`(기존 사용자들이 실제로 쓰는 코드 중복제거 목록, 별도 마스터 없음)를 썼는데, 지금은 둘 다 `features/dept/api.ts`의 `fetchDepts()`로 바뀌어 있다. `UserManagerPage`의 부서 입력도 자유 텍스트 `<input>`에서 `fetchDepts()`로 채운 `<select>`로 바뀌었다 — 오타로 없는 부서 코드를 사용자에게 붙이는 걸 막기 위함.

### 7.1 "에러 내역" 화면 — 읽기 전용 페이징 목록 + 상세 모달 패턴

`ErrorLogManagerPage.tsx`는 CRUD가 아니라 **조회만** 하는 관리자 화면의 템플릿이다. 목록(`GET /api/admin/error-logs`)은 발생시각/메소드/경로/사용자/예외타입/메시지만 보여주고 스택 트레이스는 빼서 가볍게 유지하고, 행을 클릭하면 `detailId` state가 세팅되어 상세 쿼리(`GET /api/admin/error-logs/{id}`)가 `enabled: detailId != null`로 발동하며 스택 트레이스 전체를 담은 모달이 뜬다 — 목록 API 응답에 모든 행의 긴 스택 트레이스를 다 실어 보내지 않기 위한 지연 로딩 패턴이다.

스택 트레이스는 폭이 넓고 줄바꿈이 없는 텍스트라 기존 `Modal`의 기본 폭(`max-w-md`)으로는 답답해서, `Modal`에 `wide` prop을 추가했다(`max-w-3xl`로 확장) — 폭이 좁아도 되는 기존 폼 모달들은 그대로 두고, 이 화면만 `<Modal ... wide>`로 옵트인한다.

## 8. 게시판 (`board`)

게시판은 관리자 CRUD(`BoardManagerPage`, `admin/boards`) + 사용자용 화면(`BoardPage`/`BoardPostFormPage`/`BoardPostDetailPage`, `/boards/:boardId/...`) 두 켜로 나뉜다. 백엔드 쪽 설계(게시판=메뉴 1:1 결합, 접근권한=메뉴권한 재사용)는 `portal-backend/ARCHITECTURE.md` 8절 참고 — 여기는 프런트 쪽에서만 특별한 패턴 세 가지.

### 8.1 게시판 CRUD는 메뉴 캐시도 같이 무효화해야 한다

`BoardManagerPage`에서 게시판을 만들거나 이름을 바꾸거나 지우면, 백엔드가 그 즉시 연결된 메뉴도 같이 만들고/이름 바꾸고/지운다(8.1 참고). 그래서 이 화면의 mutation은 `['admin', 'boards']` 하나만 무효화하면 안 되고, `['admin', 'menus']`와 `['menus', 'my']`도 같이 무효화한다 — 안 그러면 게시판을 새로 만들어도 사이드바/메뉴 관리 화면에 새 메뉴가 바로 안 보인다(새로고침해야 보임). `MenuManagerPage`의 모든 mutation이 이미 이 두 키를 같이 무효화하고 있으니, "메뉴 트리에 영향 주는 화면은 이 두 키를 항상 같이 무효화한다"가 이 시점부터 3곳(`MenuManagerPage`, 이제 `BoardManagerPage`)의 공통 규칙이 됐다.

### 8.2 파일 첨부: JSON과 파일을 하나의 `multipart/form-data`로 묶어 보낸다

게시글 생성/수정은 `application/json`이 아니라 `FormData`로 보낸다 — `features/board/api.ts`의 `postFormData()` 헬퍼가 `data` 파트(제목/내용을 JSON 문자열로 감싼 `Blob`, `type: 'application/json'`으로 지정해야 백엔드의 `@RequestPart("data") PostCreateRequest`가 제대로 역직렬화한다)와 `files` 파트(선택된 `File[]`, 0개 이상)를 합쳐 넣는다. `httpClient`에 `Content-Type` 기본값이 없기 때문에(`lib/httpClient.ts` 참고) `FormData`를 바디로 넘기면 axios가 알아서 `multipart/form-data; boundary=...`를 세팅한다 — 별도 헤더 설정 코드가 필요 없다.

수정 화면(`BoardPostFormPage`, edit 모드)에서 기존 첨부파일은 삭제 대상으로 체크만 하고(`removeAttachmentIds`), 새로 고른 파일은 `files`에 추가한다 — 저장 시 이 둘을 한 번에 같은 요청으로 보낸다(부분 삭제 + 부분 추가를 한 PUT으로).

### 8.3 첨부파일 다운로드는 `<a href>`가 아니라 axios + Blob이다

일반 링크(`<a href="/api/boards/.../attachments/1">`)로는 안 된다 — 다운로드 API도 다른 API와 똑같이 `Authorization: Bearer` 헤더가 필요한데, 브라우저가 만드는 순수 네비게이션 요청에는 그 헤더를 실어 보낼 방법이 없다. 그래서 `features/board/api.ts`의 `downloadAttachment()`는:

1. `httpClient.get(..., { responseType: 'blob' })`로 axios를 통해 파일을 받는다(인증 헤더가 인터셉터로 자동으로 붙는다).
2. 받은 `Blob`을 `URL.createObjectURL()`로 임시 blob URL로 바꾼다.
3. 화면에 보이지 않는 `<a>`를 하나 만들어 그 URL과 원본 파일명을 넣고 코드로 클릭시킨 뒤 바로 치운다.

`BoardPostDetailPage`의 첨부파일 목록은 그래서 `<a>`가 아니라 `<button onClick={() => downloadAttachment(...)}>`다.
