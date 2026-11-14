// Phase 2 setup check: confirms the Auth, Firestore and Storage emulators are running
// and that the security rules block unauthenticated access.
// Run with: npm run emulators:check

const project = 'demo-onlineland';
const checks = [];

async function check(name, fn) {
  try {
    await fn();
    checks.push([name, 'PASS']);
  } catch (err) {
    checks.push([name, `FAIL: ${err.message}`]);
  }
}

await check('Auth emulator responds', async () => {
  const res = await fetch('http://127.0.0.1:9099/');
  if (!res.ok) throw new Error(`status ${res.status}`);
});

await check('Firestore denies public read (deny-all rules)', async () => {
  const res = await fetch(
    `http://127.0.0.1:8080/v1/projects/${project}/databases/(default)/documents/properties/test`,
  );
  if (res.status !== 403) throw new Error(`expected 403, got ${res.status}`);
});

await check('Firestore denies public write (deny-all rules)', async () => {
  const res = await fetch(
    `http://127.0.0.1:8080/v1/projects/${project}/databases/(default)/documents/properties?documentId=test`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { title: { stringValue: 'x' } } }),
    },
  );
  if (res.status !== 403) throw new Error(`expected 403, got ${res.status}`);
});

await check('Storage denies upload without login', async () => {
  const res = await fetch(
    `http://127.0.0.1:9199/v0/b/${project}.appspot.com/o?name=${encodeURIComponent('properties/test.jpg')}`,
    { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array(16) },
  );
  if (res.status !== 403) throw new Error(`expected 403, got ${res.status}`);
});

for (const [name, result] of checks) console.log(`${result.startsWith('PASS') ? '✔' : '✘'} ${name} — ${result}`);
if (checks.some(([, r]) => r !== 'PASS')) process.exit(1);
console.log('\nAll emulator checks passed.');
