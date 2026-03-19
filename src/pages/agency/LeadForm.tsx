import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateLead, useUpdateLead, useLead } from '@/hooks/useLeads';
import { LeadStatus, LEAD_STATUS_LABELS } from '@/types/agency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

const INDUSTRIES = [
  'Restaurant', 'Retail', 'Real Estate', 'Healthcare', 'Legal', 'Automotive',
  'Home Services', 'Salon & Beauty', 'Fitness & Wellness', 'Hospitality',
  'Education', 'Finance', 'Technology', 'Construction', 'Other',
];

export default function LeadForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: existing } = useLead(id ?? '');
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  const [form, setForm] = useState({
    company_name: existing?.company_name ?? '',
    email: existing?.email ?? '',
    phone: existing?.phone ?? '',
    website: existing?.website ?? '',
    address: existing?.address ?? '',
    city: existing?.city ?? '',
    state: existing?.state ?? '',
    industry: existing?.industry ?? '',
    employee_count: existing?.employee_count ?? '',
    linkedin_url: existing?.linkedin_url ?? '',
    notes: existing?.notes ?? '',
    status: (existing?.status ?? 'new') as LeadStatus,
    source: existing?.source ?? 'manual',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && id) {
      await updateLead.mutateAsync({ id, ...form });
    } else {
      await createLead.mutateAsync(form);
    }
    navigate('/agency/leads');
  };

  return (
    <div className="p-8 max-w-2xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-white mb-6">{isEdit ? 'Edit Lead' : 'New Lead'}</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company Name *" required>
            <Input required value={form.company_name} onChange={(e) => set('company_name', e.target.value)} placeholder="Acme Corp" className={inputClass} />
          </Field>
          <Field label="Industry">
            <select value={form.industry} onChange={(e) => set('industry', e.target.value)} className={`${inputClass} h-10 rounded-md border px-3 text-sm w-full`}>
              <option value="">Select industry</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="owner@company.com" className={inputClass} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 (555) 000-0000" className={inputClass} />
          </Field>
          <Field label="Website">
            <Input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://company.com" className={inputClass} />
          </Field>
          <Field label="LinkedIn URL">
            <Input value={form.linkedin_url} onChange={(e) => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/company/..." className={inputClass} />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Miami" className={inputClass} />
          </Field>
          <Field label="State">
            <Input value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="FL" className={inputClass} />
          </Field>
          <Field label="Employee Count">
            <Input value={form.employee_count} onChange={(e) => set('employee_count', e.target.value)} placeholder="1-10" className={inputClass} />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={`${inputClass} h-10 rounded-md border px-3 text-sm w-full`}>
              {(Object.entries(LEAD_STATUS_LABELS) as [LeadStatus, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Address">
          <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="123 Main St" className={inputClass} />
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            placeholder="Internal notes about this lead..."
            className={`${inputClass} rounded-md border p-3 text-sm w-full resize-none`}
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={createLead.isPending || updateLead.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
            {isEdit ? 'Save Changes' : 'Create Lead'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="text-gray-400">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

const inputClass = 'bg-gray-900 border-gray-700 text-white placeholder:text-gray-600 focus:border-violet-500';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-gray-400 text-xs mb-1.5 block">{label}{required && ' *'}</Label>
      {children}
    </div>
  );
}
