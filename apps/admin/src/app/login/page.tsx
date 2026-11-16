'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber, signOut, type ConfirmationResult } from 'firebase/auth';
const MOBILE_RE = /^[6-9]\d{9}$/;
import { Button, ErrorText, Field, Input } from '@/components/ui';
import { isStaffRole, useAuth } from '@/lib/auth';
import { errorText, fb } from '@/lib/firebase';
import { useI18n } from '@/lib/i18n';

export default function LoginPage() {
  const { t, toggle } = useI18n();
  const { ready, user, role } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState<ConfirmationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const verifier = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (ready && user && isStaffRole(role)) router.replace(role === 'admin' ? '/' : '/leads/');
  }, [ready, user, role, router]);

  useEffect(() => () => verifier.current?.clear(), []);

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    setError('');
    const n = phone.replace(/\D/g, '').slice(-10);
    if (!MOBILE_RE.test(n)) return setError(t('mobile') + ' ✗');
    setBusy(true);
    try {
      verifier.current ??= new RecaptchaVerifier(fb().auth, 'recaptcha', { size: 'invisible' });
      setConfirm(await signInWithPhoneNumber(fb().auth, `+91${n}`, verifier.current));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (!confirm) return;
    setError('');
    setBusy(true);
    try {
      const cred = await confirm.confirm(code.trim());
      const token = await cred.user.getIdTokenResult(true);
      if (!isStaffRole(typeof token.claims.role === 'string' ? token.claims.role : null)) {
        await signOut(fb().auth);
        setConfirm(null);
        setCode('');
        setError(t('notAdmin'));
      }
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-mist p-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t('loginTitle')}</h1>
            <p className="text-sm text-ink-soft">{t('loginHint')}</p>
          </div>
          <Button tone="quiet" onClick={toggle}>{t('language')}</Button>
        </div>

        {!confirm ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <Field label={t('mobile')}>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-line bg-mist px-3 py-2">+91</span>
                <Input inputMode="numeric" autoComplete="tel-national" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </Field>
            <ErrorText>{error}</ErrorText>
            <Button type="submit" className="w-full" disabled={busy}>{t('sendOtp')}</Button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-4">
            <Field label={t('otp')}>
              <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required autoFocus />
            </Field>
            <ErrorText>{error}</ErrorText>
            <Button type="submit" className="w-full" disabled={busy}>{t('verify')}</Button>
            <Button type="button" tone="quiet" className="w-full" onClick={() => setConfirm(null)}>{t('changeNumber')}</Button>
          </form>
        )}
        <div id="recaptcha" />
      </div>
    </main>
  );
}
