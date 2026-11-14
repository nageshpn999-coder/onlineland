#!/usr/bin/env node
// Give a user a role (e.g. make yourself the first admin). Run from Google Cloud Shell or any machine
// logged in with `gcloud auth application-default login`. Works against emulators when
// FIREBASE_AUTH_EMULATOR_HOST / FIRESTORE_EMULATOR_HOST are set.
//
//   node scripts/set-role.mjs --project onlineland-dev --phone +919959731120 --role admin
//   node scripts/set-role.mjs --project onlineland-dev --email someone@gmail.com --role agent
//
// The person must have signed in once (website or app) so their account exists,
// then sign out and in again to pick up the new role.

import { parseArgs } from 'node:util';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const ROLES = ['buyer', 'owner', 'dealer', 'agent', 'admin'];

const { values } = parseArgs({
  options: {
    project: { type: 'string' },
    uid: { type: 'string' },
    phone: { type: 'string' },
    email: { type: 'string' },
    role: { type: 'string' },
  },
});

function fail(message) {
  console.error(`✘ ${message}`);
  process.exit(1);
}

if (!values.project) fail('--project is required (e.g. onlineland-dev).');

// Safety: this platform must never touch other Firebase projects (onlineland-28234, Vahan, Ridekart, ScrapLake…).
// Only the new platform projects and offline emulator projects are allowed.
const ALLOWED_PROJECTS = ['onlineland-dev', 'onlineland-prod'];
if (!ALLOWED_PROJECTS.includes(values.project) && !values.project.startsWith('demo-')) {
  fail(`Refusing to run on "${values.project}". Allowed: ${ALLOWED_PROJECTS.join(', ')} (edit ALLOWED_PROJECTS only if the new projects got different IDs).`);
}
if (!ROLES.includes(values.role ?? '')) fail(`--role must be one of: ${ROLES.join(', ')}.`);
if (!values.uid && !values.phone && !values.email) fail('Give --uid, --phone (+91…) or --email.');

const app = initializeApp({ projectId: values.project });
const auth = getAuth(app);
const db = getFirestore(app);

let user;
try {
  user = values.uid
    ? await auth.getUser(values.uid)
    : values.phone
      ? await auth.getUserByPhoneNumber(values.phone)
      : await auth.getUserByEmail(values.email);
} catch {
  fail('User not found. They must sign in once on the website or app first.');
}

const before = user.customClaims?.role ?? null;
await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role: values.role });
await db.doc(`users/${user.uid}`).set({ role: values.role, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
await db.collection('auditLogs').add({
  actorId: 'cli:set-role',
  action: 'user.setRole',
  target: `users/${user.uid}`,
  before: { role: before },
  after: { role: values.role },
  at: FieldValue.serverTimestamp(),
});

console.log(`✔ ${user.phoneNumber ?? user.email ?? user.uid}: ${before ?? 'none'} → ${values.role} (project ${values.project})`);
console.log('  They must sign out and sign in again to get the new role.');
