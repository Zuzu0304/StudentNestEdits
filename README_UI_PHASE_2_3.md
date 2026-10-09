# StudentNest UI Integration — Phases 2 & 3

This version continues from UI Integration Phase 1 / Backend Stage 10.

## Phase 2 — Authentication integration
- Login and registration use the real `/api/auth` endpoints.
- JWT token and current user are stored locally for the development session.
- Student and provider roles are separated; public signup cannot create admins.
- Student/provider dashboard routes require the matching role.
- Logout calls the backend and clears the local session.
- Forgot-password UI now calls the backend recovery endpoint.

## Phase 3 — Student features integration
- Favourites use the real `favourites` MySQL table through `/api/student/favourites`.
- Student inquiries use the real `inquiries` table through `/api/student/inquiries`.
- Property details use the live property endpoint and can save/favourite or send an inquiry.
- Existing roommate/takeover demo data remains in the UI until their dedicated backend workflow is implemented.

## Setup
1. Keep XAMPP MySQL running.
2. Run the backend from `backend`: `npm install` then `npm run dev`.
3. Run the frontend from the project root: `npm install` then `npm run dev`.
4. The frontend expects the backend at `http://localhost:5000/api` unless `VITE_API_URL` is set.

Do not delete previous stage folders; keep them as backups.


### Stage 17
Run `backend/database/stage17_chat_and_appointments_migration.sql` after Stage 16. It creates the unified chat, message and appointment tables and copies legacy student/provider conversations into the new chat system.


## Phase 3 — Unified chat & appointments

The latest build adds a single in-app communication layer for students, providers, field agents and admin. Legacy student/provider conversations are copied into the new chat tables by `stage17_chat_and_appointments_migration.sql`.

### What to test
1. Student opens a property and chooses **Message provider**.
2. The student is taken to Student Space → **Messages** with that provider/property conversation.
3. Send messages in both directions.
4. Either participant proposes an appointment.
5. The other participant can **Accept** or **Propose another time**.
6. Accepted/proposed appointments appear in the conversation and in the reminder strip.
7. Provider no longer has the separate notification shortcut; unread notification count appears on **Messages**.
8. Field agents have **Messages** and **Log out** on the inspection page.
9. Admin has a private **Messages** section for communicating with users.
10. Agent inspection cards now include **View property** plus direct provider contact.

The legacy inquiry endpoints remain in the backend for compatibility with existing records, but the new UI is designed around chat + appointments.
