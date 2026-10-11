# StudentNest frontend and backend integration

The React app uses the shared API helper in `src/lib_api.js`. It reads
`VITE_API_URL` when configured and otherwise calls the StudentNest Render API
at `https://studentnesteditsbackend.onrender.com/api`.

## Local development

- The frontend calls the deployed Render API by default.
- To use a local backend instead, set `VITE_API_URL=http://localhost:5000/api`
  before starting Vite. The Vite proxy is also available when `VITE_API_URL=/api`.
- Run the Express backend on port `5000` from `backend` when using local mode.
- Configure the backend database and authentication environment variables
  before using endpoints that require them.

## Deployment

- For the separate Render backend, leave `VITE_API_URL` unset to use the
  Render API default, or set it to
  `https://studentnesteditsbackend.onrender.com/api`.
- Set the Render backend's `CLIENT_ORIGIN` to the deployed frontend origin so
  the browser is allowed to make cross-origin API requests.
- To deploy frontend and backend on the same origin instead, set
  `VITE_API_URL=/api`.
- If deploying the frontend separately (for example, on Vercel), configure
  `VITE_API_URL=https://studentnesteditsbackend.onrender.com/api` in its build
  environment and redeploy so the frontend bundle uses the Render API.
- The backend requires its production database and auth environment variables
  to be configured in the hosting provider.

Public accommodation browsing and the landing-page preview load approved,
verified properties from `/api/properties`. Sample listings remain visible
when no live listings are available; the landing page reports API errors
alongside that fallback. Authentication, profiles, student and provider
workflows, inspections, reviews, messaging, payments, marketplace, and admin
screens use the shared API helper for their corresponding backend routes.
