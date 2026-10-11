# StudentNest frontend and backend integration

The React app uses the shared API helper in `src/lib_api.js`. It reads
`VITE_API_URL` when configured and otherwise calls the same-origin `/api`
routes, which allows the frontend and backend to share a deployment origin.

## Local development

- Run the Express backend on port `5000` from `backend`.
- Run the Vite frontend as usual. Vite proxies `/api` and `/uploads` requests to
  the backend on port `5000`.
- Configure the backend database and authentication environment variables
  before using endpoints that require them.

## Deployment

- For a same-origin deployment, leave `VITE_API_URL` unset or set it to `/api`.
- Vercel routes `/api/*` and `/uploads/*` to the `backend` service; all other
  paths go to the Vite frontend service.
- For a separately hosted backend, set `VITE_API_URL` to its API base URL and
  configure its CORS `CLIENT_ORIGIN` to allow the frontend origin.
- The backend requires its production database and auth environment variables
  to be configured in the hosting provider.

Public accommodation browsing and the landing-page preview load approved,
verified properties from `/api/properties`. Sample listings remain visible
when no live listings are available; the landing page reports API errors
alongside that fallback. Authentication, profiles, student and provider
workflows, inspections, reviews, messaging, payments, marketplace, and admin
screens use the shared API helper for their corresponding backend routes.
