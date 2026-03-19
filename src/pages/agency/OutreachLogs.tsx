import { useOutreachLogs } from '@/hooks/useOutreach';
import { OUTREACH_STATUS_COLORS, OutreachType } from '@/types/agency';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<OutreachType, React.ElementType> = {
  email: Mail,
  sms: MessageSquare,
  call: Phone,
};

const TYPE_COLORS: Record<OutreachType, string> = {
  email: 'bg-blue-500/20 text-blue-400',
  sms: 'bg-green-500/20 text-green-400',
  call: 'bg-purple-500/20 text-purple-400',
};

export default function OutreachLogs() {
  const { data: logs, isLoading } = useOutreachLogs();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Outreach Logs</h1>
        <p className="text-gray-400 mt-1">{logs?.length ?? 0} total outreach activities</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading logs...</div>
      ) : !logs?.length ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-gray-400 text-sm">No outreach activity yet.</p>
          <p className="text-gray-600 text-xs mt-1">Launch a campaign to start reaching out to leads.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Company</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Campaign</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Subject / Message</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden xl:table-cell">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {logs.map((log) => {
                const Icon = TYPE_ICONS[log.type];
                return (
                  <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium', TYPE_COLORS[log.type])}>
                        <Icon className="w-3 h-3" />
                        {log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      {log.leads?.company_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                      {log.campaigns?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-gray-300 text-xs truncate max-w-xs">
                        {log.subject || log.message?.slice(0, 80) || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', OUTREACH_STATUS_COLORS[log.status])}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden xl:table-cell">
                      {new Date(log.sent_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
