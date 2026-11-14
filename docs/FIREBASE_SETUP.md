# Firebase setup — what to do once the new projects exist

Phase 4 was built and tested entirely on the Firebase emulators (`demo-onlineland`). Nothing has been deployed yet.
Do these steps once Google raises the project quota and `onlineland-dev` / `onlineland-prod` are created.
Do **dev first**, check everything, then repeat for prod.

> **Only `onlineland-dev` and `onlineland-prod` are used by this platform.** The existing projects
> (onlineland-28234, vahan-3e329, ridekart-70332, scraplake) must never be selected, deployed to or modified.
> `firebase/.firebaserc` lists only the new projects, and `scripts/set-role.mjs` refuses any other project ID.

> Never paste service-account keys, passwords or billing IDs into chat or commit them to Git.

## 1. Create the project

1. Firebase console → **Create a new Firebase project** → name `onlineland-dev` (prod: `onlineland-prod`).
2. Google Analytics: **off** for dev, **on** for prod.
3. Note the **Project ID** shown under the name. If it differs from `onlineland-dev` / `onlineland-prod`, update `firebase/.firebaserc`.

## 2. Billing (Blaze) and budget alert

1. Project → **Spark plan → Upgrade** → choose the existing billing account.
2. Set a budget alert (e.g. ₹500/month). It only emails you; it does not stop spending.

## 3. Firestore and Storage — location is permanent

1. **Firestore Database → Create database** → Standard edition, **location `asia-south1` (Mumbai)**, start in production mode.
2. **Storage → Get started** → location **`asia-south1`**.
3. The deployed rules (step 6) replace the default ones.

## 4. Authentication

1. **Authentication → Get started → Sign-in method**:
   - **Phone** → enable. Add a few **test phone numbers** with fixed codes for testing (no SMS charge).
   - **Google** → enable, choose the support email.
2. **Settings → SMS region policy** → *Allow* only **India (+91)**. This blocks SMS fraud from other countries.
3. **Settings → Authorized domains** → add `onlineland.in`, `www.onlineland.in` and the Vercel preview domain.

## 5. Web app config

1. **Project settings → General → Your apps → Add app → Web** → name "OnlineLand Website".
2. Copy the `firebaseConfig` values into Vercel → Settings → Environment Variables as `NEXT_PUBLIC_FIREBASE_*` (see `apps/web/.env.example`). These values are public by design.
3. Later (Phase 5): **App Check** → register the web app with reCAPTCHA Enterprise; enforce after testing.

## 6. Deploy rules, indexes and functions

From a computer with Node 22 (or Google Cloud Shell):

```bash
git clone https://github.com/nageshpn999-coder/onlineland && cd onlineland && git checkout develop
npm install
npx firebase login
npm run deploy:rules:dev
npx firebase deploy --config firebase/firebase.json --project dev --only functions
```

Phase 8 adds a GitHub Actions deploy so this can run from the phone.

## 7. First admin

1. Sign in once on the website or app with your phone number (login screens arrive in Phases 5–7).
2. Open **Google Cloud Shell** (console.cloud.google.com → `>_` icon), then:

```bash
git clone https://github.com/nageshpn999-coder/onlineland && cd onlineland && git checkout develop
npm install --no-save firebase-admin
node scripts/set-role.mjs --project onlineland-dev --phone +919959731120 --role admin
```

3. Sign out and sign in again. After that, roles for agents and dealers are given from the admin dashboard (`setUserRole`).

## What runs where

| Piece | Where | Who can change it |
| --- | --- | --- |
| `firestore.rules`, `storage.rules`, indexes | Firebase project | Deployed from Git only |
| Cloud Functions (`onUserCreated`, `becomeOwner`, `setUserRole`, `reviewProperty`) | asia-south1 | Deployed from Git only |
| Roles | Auth custom claims | Cloud Functions / `set-role.mjs` only |
| Web config (`NEXT_PUBLIC_*`) | Vercel env | Public |
| Admin credentials (`FIREBASE_ADMIN_*`) | Vercel env (server only) | Secret |
