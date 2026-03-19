import { Link } from 'react-router-dom';
import { useCampaigns, useDeleteCampaign, useUpdateCampaign } from '@/hooks/useCampaigns';
import { Campaign, CAMPAIGN_TYPE_LABELS, CampaignStatus } from '@/types/agency';
import { Plus, Trash2, Play, Pause, Mail, MessageSquare, Phone, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TYPE_ICONS = {
  email: Mail,
  sms: MessageSquare,
  call: Phone,
  multi: Layers,
};

const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: 'bg-gray-700 text-gray-300',
  active: 'bg-green-500/20 text-green-400',
  paused: 'bg-yellow-500/20 text-yellow-400',
  completed: 'bg-blue-500/20 text-blue-400',
};

export default function Campaigns() {
  const { data: campaigns, isLoading } = useCampaigns();
  const deleteCampaign = useDeleteCampaign();
  const updateCampaign = useUpdateCampaign();

  const toggleStatus = (c: Campaign) => {
    const next: CampaignStatus = c.status === 'active' ? 'paused' : 'active';
    updateCampaign.mutate({ id: c.id, status: next });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-gray-400 mt-1">Automated outreach campaigns</p>
        </div>
        <Link to="/agency/campaigns/new">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
            <Plus className="w-4 h-4" /> New Campaign
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading campaigns...</div>
      ) : !campaigns?.length ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-gray-400 text-sm mb-3">No campaigns yet.</p>
          <Link to="/agency/campaigns/new">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
              <Plus className="w-4 h-4" /> Create your first campaign
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map((c) => {
            const Icon = TYPE_ICONS[c.type];
            const sentPct = c.total_leads > 0 ? Math.round((c.sent_count / c.total_leads) * 100) : 0;
            return (
              <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{c.name}</p>
                      <p className="text-xs text-gray-500">{CAMPAIGN_TYPE_LABELS[c.type]}</p>
                    </div>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[c.status])}>
                    {c.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-gray-800 rounded-lg">
                    <p className="text-lg font-bold text-white">{c.total_leads}</p>
                    <p className="text-xs text-gray-500">Leads</p>
                  </div>
                  <div className="text-center p-2 bg-gray-800 rounded-lg">
                    <p className="text-lg font-bold text-white">{c.sent_count}</p>
                    <p className="text-xs text-gray-500">Sent</p>
                  </div>
                  <div className="text-center p-2 bg-gray-800 rounded-lg">
                    <p className="text-lg font-bold text-white">{c.reply_count}</p>
                    <p className="text-xs text-gray-500">Replies</p>
                  </div>
                </div>

                {c.total_leads > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{sentPct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${sentPct}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Link to={`/agency/campaigns/${c.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 text-xs">
                      View Details
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleStatus(c)}
                    disabled={c.status === 'completed'}
                    className="text-gray-500 hover:text-white p-2"
                  >
                    {c.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteCampaign.mutate(c.id)}
                    className="text-gray-600 hover:text-red-400 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
