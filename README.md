# LabourMitra Frontend

Mobile-first web app for demand users (farmers today) to post labour jobs, find nearby crews, call them and track bookings through to attendance. Backend: `../labour_mitra_backend` (Django REST). Shared context and prompts: `../context`.

**Status:** demand-user flow built end to end: sign-up and login (OTP), job wizard, ranked crews, bridged calls, job requests, bookings, tracking, my requests, profile; English, Hindi and Marathi. Operator screens are not built (Django Admin covers them). API gaps are listed in [docs/backend-requests.md](docs/backend-requests.md).

## Stack
React 19 · TypeScript · Vite · MUI (theme with light/dark) · TanStack Query · axios · React Router · types generated from the backend's OpenAPI.

## Run it

```powershell
# 1. backend (separate terminal)
cd ..\labour_mitra_backend
.venv\Scripts\Activate.ps1
python manage.py seed_demo_data      # once
python manage.py runserver           # http://localhost:8000

# 2. frontend
cd ..\labour_mitra_frontend
npm install
copy .env.example .env               # set VITE_API_BASE_URL to your backend
npm run dev                          # http://localhost:5173 (calls VITE_API_BASE_URL directly)
```

If the crop tiles on the first wizard step show an error, the backend is not running, `VITE_API_BASE_URL` is wrong, or CORS does not allow this origin.

### Sign in without OTP (development)
Real login needs the external OTP service. For local work, mint a token in the backend and store it in the browser console:

```powershell
python manage.py issue_dev_token 9000000001     # demand user (Ramesh, Lasalgaon)
```
```js
localStorage.setItem("lm_access", "<token>");
localStorage.setItem("lm_user", JSON.stringify({ id: "x", mobile: "+919000000001", role: "demand" }));
location.reload();
```

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (API calls go straight to `VITE_API_BASE_URL`) |
| `npm run typecheck` | TypeScript check (also the way to find what an API change broke) |
| `npm run build` | Typecheck + production build into `dist/` |
| `npm run api:types` | Regenerate `src/api/schema.d.ts` from `../context/api/openapi.yaml` |

## Configuration (`.env`)
| Variable | Meaning |
|---|---|
| `VITE_API_BASE_URL` | **Required.** Full backend API URL the browser calls directly, e.g. `http://localhost:8000/api/v1` or `https://api.example.com/api/v1`. Read at build time; there is no dev proxy. The backend must list the app's origin in `CORS_ALLOWED_ORIGINS`. |

Deploy: set `VITE_API_BASE_URL`, run `npm run build`, serve `dist/` as static files (any host; fall back to `index.html` for unknown paths).

## Structure
```
src/
  api/            client.ts (axios, auth header, token refresh), errors.ts (ApiError), types.ts,
                  schema.d.ts (generated), queryClient.ts, queryKeys.ts,
                  endpoints/ (one typed module per backend area), hooks/ (TanStack Query hooks)
  auth/           AuthContext (session in localStorage), RequireAuth route guard
  app/            Providers (theme, query, toast, auth), router (lazy routes)
  components/     layout/ (app bar, bottom nav), common/ (sheets, skeletons, states, steppers), feedback/ (toasts)
  features/       auth/ (OTP, location picker), wizard/ (5 steps + draft), crews/ (cards, call, book, invite),
                  tracking/ (timeline, bookings, replies, dialogs), jobs/ (cards, header, repeat)
  pages/          route screens
  i18n/           react-i18next setup, locales/ (en, hi, mr), catalog.ts (crop and activity names)
  theme/          MUI theme (palette, typography, motion keyframes)
  lib/            pure helpers (format, status, validation, geo, crops)
docs/             architecture, backend-requests
```

## Conventions (short)
- Components never call axios; they use hooks from `src/api/hooks`, which use `src/api/endpoints`.
- Types come from `src/api/types.ts` (generated). Run `npm run typecheck` after regenerating.
- One query-key file; invalidate through it after mutations.
- Errors are `ApiError`; show `.message`, map `.fieldErrors` to inputs.
- Crew phone numbers never exist on the client.
- All user text goes through `t()` (`src/i18n/locales`); English is the typed source, Hindi and Marathi must match its shape. Marathi needs a native-speaker review.

More: [docs/architecture.md](docs/architecture.md).
