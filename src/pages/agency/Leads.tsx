import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLeads, useDeleteLead } from '@/hooks/useLeads';
import { Lead, LeadStatus, LEAD_STATUS_COLORS, LEAD_STATUS_LABELS } from '@/types/agency';
import { Plus, Search, Trash2, ExternalLink, Phone, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: (LeadStatus | 'all')[] = ['all', 'new', 'contacted', 'interested', 'demo_scheduled', 'closed_won', 'closed_lost'];

export default function Leads() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const { data: leads, isLoading } = useLeads();
  const deleteLead = useDeleteLead();

  const filtered = (leads ?? []).filter((l) => {
    const matchesSearch =
      !search ||
      l.company_name.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.city?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-gray-400 mt-1">{leads?.length ?? 0} total companies</p>
        </div>
        <Link to="/agency/leads/new">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Add Lead
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                statusFilter === s
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              )}
            >
              {s === 'all' ? 'All' : LEAD_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading leads...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-gray-400 text-sm">No leads found.</p>
          <Link to="/agency/leads/new" className="text-violet-400 text-sm mt-2 inline-block hover:underline">
            Add your first lead
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Company</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Industry</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden xl:table-cell">Source</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((lead) => (
                <LeadRow key={lead.id} lead={lead} onDelete={() => deleteLead.mutate(lead.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeadRow({ lead, onDelete }: { lead: Lead; onDelete: () => void }) {
  return (
    <tr className="hover:bg-gray-800/50 transition-colors">
      <td className="px-4 py-3">
        <Link to={`/agency/leads/${lead.id}`} className="hover:text-violet-400 transition-colors">
          <p className="font-medium text-white">{lead.company_name}</p>
          {lead.city && <p className="text-xs text-gray-500">{lead.city}{lead.state ? `, ${lead.state}` : ''}</p>}
        </Link>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="space-y-1">
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-gray-400 hover:text-white text-xs">
              <Mail className="w-3 h-3" /> {lead.email}
            </a>
          )}
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-gray-400 hover:text-white text-xs">
              <Phone className="w-3 h-3" /> {lead.phone}
            </a>
          )}
        </div>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell text-gray-400">{lead.industry ?? '-'}</td>
      <td className="px-4 py-3">
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', LEAD_STATUS_COLORS[lead.status])}>
          {LEAD_STATUS_LABELS[lead.status]}
        </span>
      </td>
      <td className="px-4 py-3 hidden xl:table-cell text-gray-500 capitalize text-xs">{lead.source}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={onDelete}
            className="text-gray-600 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
