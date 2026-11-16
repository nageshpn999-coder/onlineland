'use client';

import { collection, limit, orderBy, query } from 'firebase/firestore';
import type { AuditLog } from '@onlineland/shared';
import { Shell } from '@/components/Shell';
import { PageHeader, StateBox } from '@/components/ui';
import { fb } from '@/lib/firebase';
import { date } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { useLiveQuery } from '@/lib/live';

export default function AuditPage() {
  return (
    <Shell>
      <Audit />
    </Shell>
  );
}

function Audit() {
  const { t } = useI18n();
  const list = useLiveQuery<AuditLog>(() => query(collection(fb().db, 'auditLogs'), orderBy('at', 'desc'), limit(200)), 'audit');
  return (
    <>
      <PageHeader title={t('audit')} />
      <StateBox loading={list.loading} error={list.error} empty={!list.loading && list.rows.length === 0} />
      {list.rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-mist">
              <tr>
                <th className="px-3 py-2">{t('when')}</th>
                <th className="px-3 py-2">{t('action')}</th>
                <th className="px-3 py-2">{t('target')}</th>
                <th className="px-3 py-2">{t('actor')}</th>
                <th className="px-3 py-2">Change</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map(({ id, data: a }) => (
                <tr key={id} className="border-t border-mist align-top">
                  <td className="px-3 py-2 whitespace-nowrap">{date(a.at, true)}</td>
                  <td className="px-3 py-2 font-semibold">{a.action}</td>
                  <td className="px-3 py-2 font-mono text-xs">{a.target}</td>
                  <td className="px-3 py-2 font-mono text-xs">{a.actorId}</td>
                  <td className="max-w-xs px-3 py-2 font-mono text-xs break-all">{JSON.stringify(a.after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
