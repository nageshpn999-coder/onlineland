'use client';

/** Live Firestore data for the dashboard (updates on its own when something changes). */
import { useEffect, useState } from 'react';
import { onSnapshot, type DocumentData, type DocumentReference, type Query } from 'firebase/firestore';
import { errorText } from './firebase';

export interface Row<T = DocumentData> {
  id: string;
  data: T;
}

export interface Live<T> {
  rows: Row<T>[];
  loading: boolean;
  error: string | null;
}

/** `make` builds the query; pass null to wait (e.g. until the user is known). `key` re-subscribes when it changes. */
export function useLiveQuery<T = DocumentData>(make: (() => Query) | null, key: string): Live<T> {
  const [state, setState] = useState<Live<T>>({ rows: [], loading: true, error: null });
  useEffect(() => {
    if (!make) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset while the new query loads
    setState((s) => ({ ...s, loading: true, error: null }));
    return onSnapshot(
      make(),
      (snap) => setState({ rows: snap.docs.map((d) => ({ id: d.id, data: d.data() as T })), loading: false, error: null }),
      (err) => setState({ rows: [], loading: false, error: errorText(err) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` describes the query
  }, [key]);
  return state;
}

export function useLiveDoc<T = DocumentData>(make: (() => DocumentReference) | null, key: string) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({ data: null, loading: true, error: null });
  useEffect(() => {
    if (!make) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset while the new doc loads
    setState({ data: null, loading: true, error: null });
    return onSnapshot(
      make(),
      (snap) => setState({ data: snap.exists() ? (snap.data() as T) : null, loading: false, error: null }),
      (err) => setState({ data: null, loading: false, error: errorText(err) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` describes the doc
  }, [key]);
  return state;
}
