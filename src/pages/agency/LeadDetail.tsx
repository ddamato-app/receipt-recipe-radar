import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLead, useUpdateLead } from '@/hooks/useLeads';
import { LEAD_STATUS_COLORS, LEAD_STATUS_LABELS, LeadStatus } from '@/types/agency';
import { ArrowLeft, Mail, Phone, Globe, Edit, MapPin, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lead, isLoading } = useLead(id ?? '');
  const updateLead = useUpdateLead();

  if (isLoading) return <div className="p-8 text-gray-400">Loading...</div>;
  if (!lead) return <div className="p-8 text-gray-400">Lead not found.</div>;

  const handleStatusChange = (status: LeadStatus) => {
    updateLead.mutate({ id: lead.id, status });
  };

  return (
    <div className="p-8 max-w-3xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Leads
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{lead.company_name}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={cn('px-3 py-1 rounded-full text-xs font-medium', LEAD_STATUS_COLORS[lead.status])}>
              {LEAD_STATUS_LABELS[lead.status]}
            </span>
            {lead.industry && <span className="text-gray-400 text-sm">{lead.industry}</span>}
            <span className="text-gray-500 text-xs capitalize">Source: {lead.source}</span>
          </div>
        </div>
        <Link to={`/agency/leads/${lead.id}/edit`}>
          <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 gap-2">
            <Edit className="w-3.5 h-3.5" /> Edit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-violet-500 transition-colors">
            <Mail className="w-5 h-5 text-violet-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-white">{lead.email}</p>
            </div>
          </a>
        )}
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-violet-500 transition-colors">
            <Phone className="w-5 h-5 text-violet-400" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm text-white">{lead.phone}</p>
            </div>
          </a>
        )}
        {lead.website && (
          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-violet-500 transition-colors">
            <Globe className="w-5 h-5 text-violet-400" />
            <div>
              <p className="text-xs text-gray-500">Website</p>
              <p className="text-sm text-white truncate">{lead.website}</p>
            </div>
          </a>
        )}
        {(lead.city || lead.address) && (
          <div className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl">
            <MapPin className="w-5 h-5 text-violet-400" />
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="text-sm text-white">{[lead.address, lead.city, lead.state].filter(Boolean).join(', ')}</p>
            </div>
          </div>
        )}
        {lead.employee_count && (
          <div className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl">
            <Building className="w-5 h-5 text-violet-400" />
            <div>
              <p className="text-xs text-gray-500">Employees</p>
              <p className="text-sm text-white">{lead.employee_count}</p>
            </div>
          </div>
        )}
      </div>

      {/* Status update */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-white mb-3">Update Status</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(LEAD_STATUS_LABELS) as [LeadStatus, string][]).map(([s, label]) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={lead.status === s}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                lead.status === s
                  ? 'bg-violet-600 text-white cursor-default'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {lead.notes && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-2">Notes</h2>
          <p className="text-sm text-gray-400 whitespace-pre-wrap">{lead.notes}</p>
        </div>
      )}
    </div>
  );
}
