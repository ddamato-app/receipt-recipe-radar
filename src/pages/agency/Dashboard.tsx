import { useLeadStats, useLeads } from '@/hooks/useLeads';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useOutreachLogs } from '@/hooks/useOutreach';
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, LeadStatus } from '@/types/agency';
import { Users, Megaphone, MessageSquare, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AgencyDashboard() {
  const { data: stats } = useLeadStats();
  const { data: campaigns } = useCampaigns();
  const { data: logs } = useOutreachLogs();
  const { data: leads } = useLeads();

  const activeCampaigns = campaigns?.filter((c) => c.status === 'active').length ?? 0;
  const totalSent = logs?.length ?? 0;
  const wonLeads = stats?.byStatus?.['closed_won'] ?? 0;

  const recentLeads = leads?.slice(0, 5) ?? [];

  const statusEntries = Object.entries(LEAD_STATUS_LABELS) as [LeadStatus, string][];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Agency Dashboard</h1>
        <p className="text-gray-400 mt-1">AI Voice Assistant sales pipeline overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Leads" value={stats?.total ?? 0} icon={Users} color="bg-violet-600" />
        <StatCard label="Active Campaigns" value={activeCampaigns} icon={Megaphone} color="bg-blue-600" />
        <StatCard label="Messages Sent" value={totalSent} icon={MessageSquare} color="bg-cyan-600" />
        <StatCard label="Closed Won" value={wonLeads} icon={TrendingUp} color="bg-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead pipeline */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Lead Pipeline</h2>
            <Link to="/agency/leads" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {statusEntries.map(([status, label]) => {
              const count = stats?.byStatus?.[status] ?? 0;
              const pct = stats?.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', LEAD_STATUS_COLORS[status])}>{label}</span>
                    <span className="text-gray-400">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent leads */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Leads</h2>
            <Link to="/agency/leads" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No leads yet. Start by scraping or adding leads manually.</p>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <Link key={lead.id} to={`/agency/leads/${lead.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                    {lead.company_name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{lead.company_name}</p>
                    <p className="text-xs text-gray-500 truncate">{lead.industry ?? lead.city ?? 'Unknown'}</p>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', LEAD_STATUS_COLORS[lead.status])}>
                    {LEAD_STATUS_LABELS[lead.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/agency/scraper" className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl p-5 flex items-center gap-3 transition-colors">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold">Scrape Companies</p>
            <p className="text-sm text-violet-200">Find new leads automatically</p>
          </div>
        </Link>
        <Link to="/agency/campaigns/new" className="bg-gray-900 border border-gray-800 hover:border-violet-500 text-white rounded-xl p-5 flex items-center gap-3 transition-colors">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="font-semibold">New Campaign</p>
            <p className="text-sm text-gray-400">Email, SMS, or voice outreach</p>
          </div>
        </Link>
        <Link to="/agency/leads/new" className="bg-gray-900 border border-gray-800 hover:border-violet-500 text-white rounded-xl p-5 flex items-center gap-3 transition-colors">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="font-semibold">Add Lead</p>
            <p className="text-sm text-gray-400">Manually add a company</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
