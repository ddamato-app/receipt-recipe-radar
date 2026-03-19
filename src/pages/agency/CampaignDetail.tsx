import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCampaign, useCampaignLeads, useAddLeadsToCampaign } from '@/hooks/useCampaigns';
import { useLeads } from '@/hooks/useLeads';
import { useSendOutreach } from '@/hooks/useOutreach';
import { CAMPAIGN_TYPE_LABELS, LEAD_STATUS_COLORS, LEAD_STATUS_LABELS } from '@/types/agency';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, UserPlus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: campaign } = useCampaign(id ?? '');
  const { data: campaignLeads } = useCampaignLeads(id ?? '');
  const { data: allLeads } = useLeads();
  const addLeads = useAddLeadsToCampaign();
  const sendOutreach = useSendOutreach();

  const [showAddLeads, setShowAddLeads] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  if (!campaign) return <div className="p-8 text-gray-400">Loading...</div>;

  const existingLeadIds = new Set(campaignLeads?.map((cl) => cl.lead_id));
  const availableLeads = (allLeads ?? []).filter((l) => !existingLeadIds.has(l.id));

  const toggleLead = (id: string) =>
    setSelectedLeads((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleAddLeads = async () => {
    if (!selectedLeads.length) return;
    await addLeads.mutateAsync({ campaignId: campaign.id, leadIds: selectedLeads });
    setSelectedLeads([]);
    setShowAddLeads(false);
  };

  const handleLaunch = async () => {
    const leadIds = campaignLeads?.filter((cl) => cl.status === 'pending').map((cl) => cl.lead_id) ?? [];
    if (!leadIds.length) return;
    const type = campaign.type === 'multi' ? 'email' : campaign.type as 'email' | 'sms' | 'call';
    await sendOutreach.mutateAsync({ campaignId: campaign.id, leadIds, type });
  };

  return (
    <div className="p-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
          <p className="text-gray-400 mt-1">{CAMPAIGN_TYPE_LABELS[campaign.type]} campaign · {campaign.status}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowAddLeads(true)}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800 gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add Leads
          </Button>
          <Button
            onClick={handleLaunch}
            disabled={sendOutreach.isPending || !campaignLeads?.some((cl) => cl.status === 'pending')}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
          >
            {sendOutreach.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Launch Outreach
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatBox label="Total Leads" value={campaign.total_leads} />
        <StatBox label="Sent" value={campaign.sent_count} />
        <StatBox label="Replies" value={campaign.reply_count} />
      </div>

      {/* Message preview */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-2">Message Template</h2>
        {campaign.subject && <p className="text-xs text-gray-400 mb-2">Subject: {campaign.subject}</p>}
        <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans">{campaign.message_template}</pre>
      </div>

      {/* Leads list */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">Campaign Leads ({campaignLeads?.length ?? 0})</h2>
        </div>
        {!campaignLeads?.length ? (
          <p className="text-center text-gray-500 text-sm py-8">No leads added yet. Click "Add Leads" to get started.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Company</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Lead Status</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Outreach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {campaignLeads.map((cl) => {
                const lead = cl.leads as { company_name: string; status: string } | null;
                return (
                  <tr key={cl.id} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-white">{lead?.company_name ?? 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                        LEAD_STATUS_COLORS[lead?.status as keyof typeof LEAD_STATUS_COLORS] ?? 'bg-gray-700 text-gray-300')}>
                        {LEAD_STATUS_LABELS[lead?.status as keyof typeof LEAD_STATUS_LABELS] ?? lead?.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                        cl.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                        cl.status === 'replied' ? 'bg-green-500/20 text-green-400' :
                        cl.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-700 text-gray-400')}>
                        {cl.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add leads modal */}
      {showAddLeads && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-gray-800">
              <h3 className="font-semibold text-white">Add Leads to Campaign</h3>
              <p className="text-xs text-gray-400 mt-1">{selectedLeads.length} selected</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {availableLeads.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-4">All leads already added.</p>
              ) : (
                availableLeads.map((lead) => (
                  <label key={lead.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => toggleLead(lead.id)}
                      className="accent-violet-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{lead.company_name}</p>
                      <p className="text-xs text-gray-500">{lead.industry ?? lead.city ?? ''}</p>
                    </div>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', LEAD_STATUS_COLORS[lead.status])}>
                      {LEAD_STATUS_LABELS[lead.status]}
                    </span>
                  </label>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-800 flex gap-3">
              <Button onClick={handleAddLeads} disabled={!selectedLeads.length || addLeads.isPending} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
                Add {selectedLeads.length} Lead{selectedLeads.length !== 1 ? 's' : ''}
              </Button>
              <Button variant="ghost" onClick={() => setShowAddLeads(false)} className="text-gray-400">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
