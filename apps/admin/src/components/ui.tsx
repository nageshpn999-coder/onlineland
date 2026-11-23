'use client';

/** Small building blocks used by every admin page. */
import { useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { useI18n } from '@/lib/i18n';

type Tone = 'primary' | 'quiet' | 'danger' | 'field';

export function Button({ tone = 'primary', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  const tones: Record<Tone, string> = {
    primary: 'bg-brand text-white hover:bg-brand-deep',
    field: 'bg-field text-white hover:brightness-110',
    danger: 'bg-white text-red-700 border border-red-300 hover:bg-red-50',
    quiet: 'bg-white text-ink border border-line hover:bg-mist',
  };
  return (
    <button
      {...p}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]} ${className}`}
    />
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

const inputCls = 'w-full rounded-md border border-line bg-white px-3 py-2 text-ink placeholder:text-ink-soft/70';

export const Input = ({ className = '', ...p }: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`${inputCls} ${className}`} />;

export const Select = ({ className = '', ...p }: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={`${inputCls} ${className}`} />;

export function TextArea({ className = '', ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={`${inputCls} min-h-24 ${className}`} />;
}

const BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900',
  requested: 'bg-amber-100 text-amber-900',
  new: 'bg-amber-100 text-amber-900',
  approved: 'bg-field-soft text-field',
  active: 'bg-field-soft text-field',
  won: 'bg-field-soft text-field',
  confirmed: 'bg-field-soft text-field',
  completed: 'bg-field-soft text-field',
  paid: 'bg-field-soft text-field',
  done: 'bg-field-soft text-field',
  received: 'bg-field-soft text-field',
  quoted: 'bg-sky-100 text-sky-900',
  'in-progress': 'bg-sky-100 text-sky-900',
  assisted: 'bg-violet-100 text-violet-900',
  rejected: 'bg-red-100 text-red-800',
  lost: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  'no-show': 'bg-red-100 text-red-800',
  expired: 'bg-slate-200 text-slate-700',
  sold: 'bg-slate-200 text-slate-700',
  rented: 'bg-slate-200 text-slate-700',
};

export function Badge({ value, children }: { value?: string; children?: ReactNode }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${BADGE[value ?? ''] ?? 'bg-mist text-ink'}`}>
      {children ?? value}
    </span>
  );
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-2xl font-bold">{title}</h1>
      {children}
    </div>
  );
}

export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="mb-4 flex flex-wrap gap-1 border-b border-line">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${value === o.id ? 'border-brand text-brand' : 'border-transparent text-ink-soft hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StateBox({ loading, error, empty }: { loading?: boolean; error?: string | null; empty?: boolean }) {
  const { t } = useI18n();
  if (loading) return <p className="py-10 text-center text-ink-soft">{t('loading')}</p>;
  if (error) return <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>;
  if (empty) return <p className="rounded-md border border-dashed border-line py-10 text-center text-ink-soft">{t('empty')}</p>;
  return null;
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p role="alert" className="text-sm font-semibold text-red-700">{children}</p>;
}

/** Side panel for one item; full screen on phones. Closes with Esc. */
export function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink/40" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl outline-none"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <Button tone="quiet" onClick={onClose} aria-label={t('close')}>
            ✕
          </Button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function KV({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-mist py-1.5 text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

/** A list row: a card on phones, a grid row on wide screens. */
export function RowButton({ onClick, children, label }: { onClick: () => void; children: ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid w-full gap-x-4 gap-y-1 rounded-md border border-line bg-white p-3 text-left hover:border-brand md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center"
    >
      {children}
    </button>
  );
}
