import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { getMetadata, ref, uploadBytes } from 'firebase/storage';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { BUCKET, createTestEnv, storedListing } from './helpers';

let env: RulesTestEnvironment;
const jpeg = (bytes: number) => ({ data: new Uint8Array(bytes), meta: { contentType: 'image/jpeg' } });

beforeAll(async () => {
  env = await createTestEnv();
});
afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'properties/p1'), storedListing('owner1'));
    const f = jpeg(1024);
    await uploadBytes(ref(ctx.storage(BUCKET), 'properties/p1/existing.jpg'), f.data, f.meta);
  });
});

const storageAs = (uid: string, role: string) => env.authenticatedContext(uid, { role }).storage(BUCKET);

describe('listing photos', () => {
  it('listing owner uploads a JPEG', () => {
    const f = jpeg(200 * 1024);
    return assertSucceeds(uploadBytes(ref(storageAs('owner1', 'owner'), 'properties/p1/photo1.jpg'), f.data, f.meta));
  });
  it('another owner cannot upload to this listing', () => {
    const f = jpeg(1024);
    return assertFails(uploadBytes(ref(storageAs('owner2', 'owner'), 'properties/p1/photo2.jpg'), f.data, f.meta));
  });
  it('visitor cannot upload', () => {
    const f = jpeg(1024);
    return assertFails(uploadBytes(ref(env.unauthenticatedContext().storage(BUCKET), 'properties/p1/x.jpg'), f.data, f.meta));
  });
  it('only images are accepted', () =>
    assertFails(
      uploadBytes(ref(storageAs('owner1', 'owner'), 'properties/p1/doc.pdf'), new Uint8Array(1024), { contentType: 'application/pdf' }),
    ));
  it('photos over 5 MB are rejected', () => {
    const f = jpeg(6 * 1024 * 1024);
    return assertFails(uploadBytes(ref(storageAs('owner1', 'owner'), 'properties/p1/big.jpg'), f.data, f.meta));
  });
  it('admin can upload to any listing', () => {
    const f = jpeg(1024);
    return assertSucceeds(uploadBytes(ref(storageAs('admin1', 'admin'), 'properties/p1/admin.jpg'), f.data, f.meta));
  });
  it('anyone can view listing photos', () =>
    assertSucceeds(getMetadata(ref(env.unauthenticatedContext().storage(BUCKET), 'properties/p1/existing.jpg'))));
});

describe('profile photos and other paths', () => {
  it('user uploads their own profile photo only', async () => {
    const f = jpeg(1024);
    await assertSucceeds(uploadBytes(ref(storageAs('u1', 'buyer'), 'users/u1/avatar.jpg'), f.data, f.meta));
    await assertFails(uploadBytes(ref(storageAs('u2', 'buyer'), 'users/u1/avatar.jpg'), f.data, f.meta));
  });
  it('unknown paths are closed', () => {
    const f = jpeg(1024);
    return assertFails(uploadBytes(ref(storageAs('admin1', 'admin'), 'random/file.jpg'), f.data, f.meta));
  });
});
