'use client';

/** Signed-in staff member and their role (from the custom claim set by Cloud Functions). */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onIdTokenChanged, signOut, type User } from 'firebase/auth';
import { fb } from './firebase';

export type StaffRole = 'admin' | 'agent';

interface AuthState {
  ready: boolean;
  user: User | null;
  role: string | null;
}

const Ctx = createContext<AuthState>({ ready: false, user: null, role: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ ready: false, user: null, role: null });
  useEffect(
    () =>
      onIdTokenChanged(fb().auth, async (user) => {
        if (!user) return setState({ ready: true, user: null, role: null });
        const token = await user.getIdTokenResult();
        setState({ ready: true, user, role: typeof token.claims.role === 'string' ? token.claims.role : null });
      }),
    [],
  );
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

export const isStaffRole = (r: string | null): r is StaffRole => r === 'admin' || r === 'agent';

export function logout() {
  return signOut(fb().auth);
}
