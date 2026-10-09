# StudentNest Phase 3 — Unified Chat & Appointment Scheduling

This phase continues from the supplied Phase 2 build.

## Included
- Unified in-app chat for students, providers, inspectors and admin.
- Property-linked conversations from the accommodation details page.
- StudentNest Messages section in Student Space and Provider Space.
- Agent Messages panel and working Agent Log out button.
- Private Admin Messages section.
- Appointment proposals inside chats.
- Appointment accept / decline / propose-another-time flow.
- Appointment reminder strip and notification records.
- Provider notification shortcut removed from the main navbar.
- Red unread count on Provider Space → Messages.
- Agent inspection cards now have View property and provider contact actions.
- Admin complaint agent assignment now has an explicit Go button.
- Legacy inquiry backend remains available for existing records, but the new UI is centered on chat.

## Database
Run this migration after Stage 16:

`backend/database/stage17_chat_and_appointments_migration.sql`

It creates:
- `chat_conversations`
- `chat_messages`
- `chat_appointments`

It also copies existing student/provider conversations from the legacy `conversations` / `messages` tables into the new chat tables without deleting the old data.

## Demo flow
1. Log in as a student.
2. Open a verified property.
3. Click **Message provider**.
4. Student Space opens to **Messages** with the property/provider conversation.
5. Send a message.
6. Log in as the provider and open **Messages**.
7. Reply.
8. Propose an appointment from the chat.
9. Student accepts or proposes another time.
10. Check the appointment reminder strip.
11. Log in as an agent and confirm **Messages**, **Log out**, **View property**, and provider contact are present.
12. Log in as admin and confirm **Messages** is available in the private console.
