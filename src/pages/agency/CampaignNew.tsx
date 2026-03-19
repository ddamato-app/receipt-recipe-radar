import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCampaign } from '@/hooks/useCampaigns';
import { CampaignType } from '@/types/agency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, MessageSquare, Phone, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const CAMPAIGN_TYPES: { type: CampaignType; label: string; icon: React.ElementType; desc: string }[] = [
  { type: 'email', label: 'Email', icon: Mail, desc: 'Send personalized cold emails via Resend' },
  { type: 'sms', label: 'SMS', icon: MessageSquare, desc: 'Send text messages via Twilio' },
  { type: 'call', label: 'Voice Call', icon: Phone, desc: 'AI-powered voice calls via VAPI' },
  { type: 'multi', label: 'Multi-Channel', icon: Layers, desc: 'Email + SMS + call sequence' },
];

const DEFAULT_EMAIL = `Hi {{first_name}},

I noticed {{company_name}} and wanted to reach out about our AI Voice Assistant — it handles inbound calls 24/7, books appointments, and answers customer questions automatically.

Many {{industry}} businesses are using it to never miss a lead again.

Would you be open to a quick 10-minute demo this week?

Best,
{{sender_name}}`;

const DEFAULT_SMS = `Hi, this is {{sender_name}} from {{agency_name}}. We help {{industry}} businesses like {{company_name}} automate customer calls with AI. Interested in a free demo? Reply YES or call us back.`;

const DEFAULT_CALL_SCRIPT = `Hello, may I speak with the owner or manager of {{company_name}}?

[Pause for response]

Hi {{first_name}}, my name is [Agent Name] calling on behalf of {{agency_name}}. I'm reaching out because we've been helping {{industry}} businesses in your area automate their customer calls using our AI Voice Assistant.

It handles inbound calls 24/7, can book appointments, answer FAQs, and never lets a call go to voicemail again.

I'd love to set up a quick 10-minute demo to show you how it works. Would sometime this week work for you?`;

export default function CampaignNew() {
  const navigate = useNavigate();
  const createCampaign = useCreateCampaign();

  const [type, setType] = useState<CampaignType>('email');
  const [form, setForm] = useState({
    name: '',
    subject: '',
    message_template: DEFAULT_EMAIL,
    call_script: DEFAULT_CALL_SCRIPT,
    schedule_type: 'immediate' as const,
    scheduled_at: '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleTypeChange = (t: CampaignType) => {
    setType(t);
    if (t === 'email') set('message_template', DEFAULT_EMAIL);
    else if (t === 'sms') set('message_template', DEFAULT_SMS);
    else if (t === 'call') set('message_template', DEFAULT_CALL_SCRIPT);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCampaign.mutateAsync({
      type,
      name: form.name,
      subject: form.subject || undefined,
      message_template: form.message_template,
      call_script: type === 'call' || type === 'multi' ? form.call_script : undefined,
      schedule_type: form.schedule_type,
      scheduled_at: form.scheduled_at || undefined,
    });
    navigate('/agency/campaigns');
  };

  return (
    <div className="p-8 max-w-3xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-white mb-6">New Campaign</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign type */}
        <div>
          <Label className="text-gray-400 text-xs mb-3 block">Campaign Type</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CAMPAIGN_TYPES.map(({ type: t, label, icon: Icon, desc }) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all',
                  type === t
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                )}
              >
                <Icon className={cn('w-5 h-5 mb-2', type === t ? 'text-violet-400' : 'text-gray-500')} />
                <p className={cn('text-sm font-medium', type === t ? 'text-white' : 'text-gray-300')}>{label}</p>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <Label className="text-gray-400 text-xs mb-1.5 block">Campaign Name *</Label>
          <Input
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Miami Restaurants Outreach"
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600"
          />
        </div>

        {/* Subject (email only) */}
        {(type === 'email' || type === 'multi') && (
          <div>
            <Label className="text-gray-400 text-xs mb-1.5 block">Email Subject</Label>
            <Input
              value={form.subject}
              onChange={(e) => set('subject', e.target.value)}
              placeholder="AI Voice Assistant for {{company_name}}"
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600"
            />
          </div>
        )}

        {/* Message template */}
        <div>
          <Label className="text-gray-400 text-xs mb-1.5 block">
            {type === 'call' ? 'Call Script' : 'Message Template'}
          </Label>
          <p className="text-xs text-gray-500 mb-2">
            Variables: {'{{company_name}}'}, {'{{first_name}}'}, {'{{industry}}'}, {'{{sender_name}}'}, {'{{agency_name}}'}
          </p>
          <textarea
            value={form.message_template}
            onChange={(e) => set('message_template', e.target.value)}
            rows={10}
            className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-md p-3 font-mono resize-none focus:border-violet-500 outline-none"
          />
        </div>

        {/* Voice call script (extra) */}
        {type === 'multi' && (
          <div>
            <Label className="text-gray-400 text-xs mb-1.5 block">Voice Call Script</Label>
            <textarea
              value={form.call_script}
              onChange={(e) => set('call_script', e.target.value)}
              rows={6}
              className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-md p-3 font-mono resize-none focus:border-violet-500 outline-none"
            />
          </div>
        )}

        {/* Schedule */}
        <div>
          <Label className="text-gray-400 text-xs mb-3 block">Schedule</Label>
          <div className="flex gap-3">
            {(['immediate', 'scheduled'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set('schedule_type', s)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm transition-colors',
                  form.schedule_type === s
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                )}
              >
                {s === 'immediate' ? 'Send Immediately' : 'Schedule for Later'}
              </button>
            ))}
          </div>
          {form.schedule_type === 'scheduled' && (
            <Input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => set('scheduled_at', e.target.value)}
              className="mt-3 bg-gray-900 border-gray-700 text-white"
            />
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={createCampaign.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
            Create Campaign
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="text-gray-400">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
