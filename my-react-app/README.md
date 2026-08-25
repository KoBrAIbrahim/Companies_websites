# Companies admin panel

Role-based admin panel (Vite + React + Firebase) for managing companies, orders, and
sales commission. Two roles: **admin** and **sales**.

## Setup

```bash
npm install
npm run dev
```

Firebase config lives in `.env` (Vite env vars, already present). Firestore security
rules live in `firestore.rules` — deploy them with the Firebase CLI:

```bash
firebase login
firebase use companies-3c6d1
firebase deploy --only firestore:rules
```

## First admin account (one-time manual bootstrap)

New accounts are normally created by an admin from inside the app (Users → Add user),
but the very first admin can't be created that way — there's no admin yet to do it, and
the security rules require an existing admin profile to create a user document. Do this
once, manually, in the Firebase Console for the `companies-3c6d1` project:

1. **Authentication** → Add user → enter an email + password for yourself.
2. Copy the new user's UID.
3. **Firestore Database** → start collection `users` → document ID = that UID → add fields:
   - `email` (string) — same email as above
   - `name` (string)
   - `phone` (string)
   - `city` (string)
   - `role` (string) = `admin`
   - `active` (boolean) = `true`
4. Sign in at `/login` with that email/password. You're now the first admin, and can
   create every other account (admin or sales) from the Users page.

## Data model

- `users/{uid}` — profile + role (`admin`/`sales`) + `active` flag. Sales users also
  carry `percentage` (commission rate) and `share` (free-text label).
- `companies/{id}` — company/owner contact info plus `startDate`/`endDate` (defaults to
  start + 1 year, admin can override), reused across orders.
- `orders/{id}` — one transaction against a company: `companyId`, `userId` (who created
  it), `status`, yearly `price`, `date`.
- `payouts/{userId}_{month}` — monthly commission record; owed amount is always
  recomputed live from accepted orders, `amountPaid` is the admin-entered value.

## Notes / known limitations

- Firebase Auth has no server-side Admin SDK here (pure client app), so:
  - Creating a user uses a temporary secondary Firebase app instance so the admin's own
    session isn't replaced by the new account.
  - "Disabling" an account sets a Firestore `active: false` flag checked at login/at all
    times, rather than actually disabling the Auth login server-side.
  - Admins can't set another user's password directly — they can send a password reset
    email instead.
