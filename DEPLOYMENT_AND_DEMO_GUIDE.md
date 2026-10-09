# StudentNest — final demo, testing and deployment guide

## 1. What is fixed in this version

- Student and provider spaces are now role-separated.
- Students can browse accommodation, open a property, request an inspection/viewing, save favourites, find roommates, view takeovers, manage bookings/payments and submit reviews after an eligible booking.
- A student can open a provider profile from a property and see the provider's other approved properties.
- Providers have their own dashboard with My Properties, Requests and Payout Details.
- Provider viewing requests are shown separately from booking requests. A provider can approve/contact the student and the reply is stored in the StudentNest conversation system.
- New properties are saved as drafts. When the provider submits one, it enters the inspection queue; after inspection passes, an admin can approve and publish it.
- Provider property media now uses a modern multi-file image/video picker with previews. The old image-URL field is removed.
- Amenities are selectable chips rather than comma-separated text.
- Provider signup asks for NIN number plus front/back NIN image previews.
- The profile control is now a round avatar with initials and opens an editable profile drawer.
- Student reviews have a 1–5 star selector, title and written review box. Reviews are moderated before publication.
- Successful payment marks the property occupied, so it no longer appears in public available accommodation results.
- Payment transactions are linked to their booking request, allowing the review flow to work after payment.
- The backend can serve the built React app, so the project can be deployed as one web service.

## 2. Local setup

1. Start XAMPP **MySQL**. Apache is not required for the Node/Express backend.
2. In phpMyAdmin, make sure the `studentnest` database exists.
3. Run the original migrations in order: `schema.sql`, Stage 2, Stage 3, Stage 4, Stage 5, Stage 6, Stage 7, Stage 8, Stage 9, Stage 10, then `stage11_profile_media_migration.sql`.
4. In `backend/.env`, use the values from `.env.example`. Keep `PAYMENT_MODE=mock` for your supervisor demo.
5. From the project root run `npm install`.
6. From `backend` run `npm install`.
7. Start the backend with `npm run dev` from `backend`.
8. Start the frontend with `npm run dev` from the project root.
9. Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## 3. Create the admin account

From the `backend` folder:

    npm run create-admin

Enter an admin name, email and password when prompted. If that email already belongs to an account, the script promotes that account to admin.

The admin area is intentionally private. There is no public Admin button. After logging in with the admin account, open `#admin-dashboard` if the automatic redirect does not happen.

## 4. Create a provider and student demo account

Use the normal Sign Up page.

### Student
- Choose Student.
- Enter a name/nickname, email, phone, school and password.

### Provider
- Choose Provider.
- Enter a name/nickname, email, phone and password.
- Enter an 11-digit NIN.
- Select the front and back NIN images. They are previewed before account creation finishes.

For a clean demonstration, use separate email addresses for the student and provider accounts.

## 5. Recommended supervisor demonstration

Prepare four accounts:

1. Student
2. Provider
3. Agent
4. Admin

### Part A — Student browsing and inspection request

1. Log in as Student.
2. Show the Student Space.
3. Click **Find Accommodation**.
4. Browse Yelwa/Gubi listings.
5. Open one property.
6. Show the provider name and click **View provider profile**.
7. Return to the property.
8. Click **Request inspection / viewing**.
9. Submit the request.
10. Open Student Space → Inquiries to show the request has been recorded.

### Part B — Provider response

1. Log out.
2. Log in as Provider.
3. Open Provider Space → Requests.
4. Show the student's viewing request.
5. Enter a reply or use the prepared reply.
6. Click **Approve & contact**.
7. Explain that the request status changes and the student is notified through the conversation/notification system.

### Part C — Provider creates a property

1. Stay logged in as Provider.
2. Go to My Properties.
3. Click **Add property**.
4. Fill in the property details.
5. Select amenities from the chips.
6. Click **Upload images & videos**.
7. Select multiple photos/videos from the device.
8. Show the previews.
9. Click **Upload property**.
10. Show that it is a **Draft** and is not public.
11. Click **Submit for inspection**.

### Part D — Inspection and admin approval

The verification workflow is intentionally:

    Provider draft → Provider submits → Agent inspection → Admin approval → Public listing

This is stronger than allowing an uninspected property to become public.

1. Log in as the Agent account.
2. Open the inspection queue.
3. Claim the property.
4. Complete all checklist items for a passing demo inspection.
5. Submit the inspection.
6. Log out and log in as Admin.
7. Open Admin → Properties.
8. Show the pending property and approve it.
9. Return to Find Accommodation and show that the property is now publicly available.

## 6. Review demonstration

A review is not an unrestricted public comment box. A student can review a property only after an eligible booking/payment exists.

For the demo:

1. Student requests a property.
2. Provider approves the booking.
3. Student opens Bookings & Payments.
4. Complete the local mock payment.
5. The property is immediately marked occupied and disappears from public available listings.
6. Student Space → Reviews now shows the eligible booking.
7. Select 1–5 stars, enter a title/comment and submit.
8. The review enters moderation.
9. Admin → Reviews can publish it.
10. Return to the property to show the published review.

## 7. Payment availability rule

Once the payment is successfully recorded, the backend changes the property's `availability_status` to `occupied`. Public browsing only returns approved + verified + available properties. This prevents a paid property from continuing to look available.

For local demonstrations, `PAYMENT_MODE=mock` is deliberate: the button simulates a successful payment and does not charge real money.

For a real deployment with real payments, use the configured Flutterwave integration and complete the provider/merchant settlement setup before accepting real funds.

## 8. Deployment

The repository is prepared so the Express backend can serve the built React frontend. That means you can deploy the project as one Node web service.

### Recommended simple deployment: Render + cloud MySQL

1. Push this project to GitHub.
2. Create a MySQL database in a cloud provider. Railway provides a MySQL template; Aiven also provides managed MySQL.
3. Import StudentNest's SQL migrations into that cloud database.
4. Create a Render Web Service from the GitHub repository.
5. Use:
   - Build command: `npm install && npm run build && npm install --prefix backend`
   - Start command: `npm start --prefix backend`
   - Health check: `/api/health`
6. Set environment variables for the database and `JWT_SECRET`.
7. Set `VITE_API_URL=/api` so the React app talks to the same deployed server.
8. Keep `PAYMENT_MODE=mock` while preparing your supervisor demonstration.
9. Deploy.
10. Visit the Render URL and test login, browsing, provider dashboard and admin flow.

### Important: uploaded files

The new property/NIN uploads are stored on the server filesystem. On a hosted service, use persistent storage or object storage for long-term media. For example, Render supports persistent disks. Do not treat the temporary filesystem of a free/ephemeral deployment as permanent storage.

## 9. Before showing your supervisor

Run this checklist:

- [ ] Student signup works.
- [ ] Student login works.
- [ ] Student Space opens.
- [ ] Find Accommodation shows approved listings.
- [ ] Property details open.
- [ ] Provider profile opens.
- [ ] Student viewing request reaches provider.
- [ ] Provider can approve/contact the student.
- [ ] Provider can add a property.
- [ ] Multiple images/videos can be selected and previewed.
- [ ] Amenities can be selected.
- [ ] New property stays draft until submitted.
- [ ] Agent can inspect and pass the property.
- [ ] Admin can approve it.
- [ ] Approved property becomes public.
- [ ] Provider booking approval works.
- [ ] Mock payment works.
- [ ] Paid property becomes occupied/unavailable.
- [ ] Student review form appears after an eligible paid booking.
- [ ] Admin can publish the review.
- [ ] Profile avatar changes to the account initials.
- [ ] Profile drawer opens and edits the display name.
- [ ] Provider signup accepts NIN and previews both NIN images.

Keep VS Code, XAMPP and the terminal out of the normal presentation. Only open them if your supervisor asks to see implementation details.


### Stage 17
Run `backend/database/stage17_chat_and_appointments_migration.sql` after Stage 16. It creates the unified chat, message and appointment tables and copies legacy student/provider conversations into the new chat system.

### Stage 18 — Student Shop / Marketplace
Run `backend/database/stage18_marketplace_migration.sql
11. `stage19_inspector_role_cleanup.sql`` after Stage 17. It creates student payout accounts, marketplace listings, orders, protected marketplace transactions, complaints and marketplace payouts.

For a supervisor demo:
- Log in as Student A and post a shop item with clear pictures.
- Log in as Student B and open **Student Shop**.
- Buy the item and enter a test payment method/account in the protected checkout.
- Confirm that the item changes from **Available** to **Reserved**.
- Mark it **satisfactory** and confirm the transaction becomes **Confirmed**.
- Log in as Admin → **Student Shop** and verify the 5% commission calculation before clicking **Approve & release**.
- Enter a payout account for the seller and release the funds.
- Confirm the seller sees the exact net amount sent and the item is **Sold**.
- For the alternative flow, make another purchase, open a complaint, assign an agent, submit an investigation report, then refund the buyer. Confirm the item returns to **Available**.

The current local/demo payment mode is still `PAYMENT_MODE=mock`. It records the method and test payer details but does not move real money. Before a real launch, the marketplace checkout and payout actions must be connected to the licensed PSP's collection, verification, escrow/protected-funds and transfer APIs.
