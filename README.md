# portal-frontend

다올투자증권 통합 포털 프런트엔드 (React + TypeScript + Vite + Tailwind CSS, 흑백 테마).

## 로컬 실행

1. `.env.example`을 복사해 `.env.local`로 저장 (기본값이 로컬 백엔드를 가리키므로 보통 수정 없이 사용 가능).
2. `portal-backend`를 먼저 실행한다 (`localhost:8080`).
3. 의존성 설치 후 dev 서버 실행:

```bash
npm install
npm run dev
```

`http://localhost:5173` 접속 → 초기 관리자 계정(`admin` / `ChangeMe123!`)으로 로그인.

## 구조

- `layouts/` — 전체 레이아웃, 메뉴 API 응답으로 동적으로 그려지는 사이드바
- `pages/admin/` — 메뉴/역할/사용자 관리 화면
- `features/{auth,menu,role,user}/` — 백엔드 도메인과 1:1 대응하는 API 함수
- `store/authStore.ts` — 액세스 토큰은 메모리에만 보관 (localStorage 사용 안 함), 리프레시는 httpOnly 쿠키로 처리
- `styles/tokens.css` — 흑백 테마 CSS 변수 (라이트/다크 모드 자동 대응)

## 빌드

```bash
npm run build
```
