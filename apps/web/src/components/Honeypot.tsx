/**
 * Spam trap: a field people never see (off-screen, skipped by keyboard and screen readers) but
 * form-filling bots do. If it has a value, the form pretends to send and nothing is saved.
 */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Company
        <input type="text" name="company" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

export const isBot = (data: FormData) => String(data.get('company') ?? '').length > 0;
