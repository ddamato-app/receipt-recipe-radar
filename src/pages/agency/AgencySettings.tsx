import { useState, useEffect } from 'react';
import { useAgencySettings, useUpsertAgencySettings } from '@/hooks/useAgencySettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Save, CheckCircle } from 'lucide-react';

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600 pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
      <h2 className="font-semibold text-white border-b border-gray-800 pb-3">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-gray-400 text-xs mb-1.5 block">{label}</Label>
      {children}
      {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
    </div>
  );
}

export default function AgencySettings() {
  const { data: settings } = useAgencySettings();
  const save = useUpsertAgencySettings();

  const [form, setForm] = useState({
    agency_name: '',
    pitch_product_name: 'AI Voice Assistant',
    pitch_description: '',
    from_email: '',
    email_signature: '',
    resend_api_key: '',
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
    vapi_api_key: '',
    google_places_api_key: '',
  });

  useEffect(() => {
    if (settings) {
      setForm({
        agency_name: settings.agency_name ?? '',
        pitch_product_name: settings.pitch_product_name ?? 'AI Voice Assistant',
        pitch_description: settings.pitch_description ?? '',
        from_email: settings.from_email ?? '',
        email_signature: settings.email_signature ?? '',
        resend_api_key: settings.resend_api_key ?? '',
        twilio_account_sid: settings.twilio_account_sid ?? '',
        twilio_auth_token: settings.twilio_auth_token ?? '',
        twilio_phone_number: settings.twilio_phone_number ?? '',
        vapi_api_key: settings.vapi_api_key ?? '',
        google_places_api_key: settings.google_places_api_key ?? '',
      });
    }
  }, [settings]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await save.mutateAsync(form);
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Agency Settings</h1>
        <p className="text-gray-400 mt-1">Configure API keys and agency profile</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Agency Profile">
          <Field label="Agency Name">
            <Input value={form.agency_name} onChange={(e) => set('agency_name', e.target.value)} placeholder="My AI Agency" className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600" />
          </Field>
          <Field label="Product Name" hint="Used in outreach templates ({{pitch_product_name}})">
            <Input value={form.pitch_product_name} onChange={(e) => set('pitch_product_name', e.target.value)} placeholder="AI Voice Assistant" className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600" />
          </Field>
          <Field label="Pitch Description">
            <textarea
              value={form.pitch_description}
              onChange={(e) => set('pitch_description', e.target.value)}
              rows={3}
              placeholder="One-liner about what your AI Voice Assistant does..."
              className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-md p-3 resize-none focus:border-violet-500 outline-none placeholder:text-gray-600"
            />
          </Field>
        </Section>

        <Section title="Email (Resend)">
          <div className="text-xs text-gray-500 mb-2">
            Get your API key at <span className="text-violet-400">resend.com</span>
          </div>
          <Field label="Resend API Key">
            <SecretInput value={form.resend_api_key} onChange={(v) => set('resend_api_key', v)} placeholder="re_..." />
          </Field>
          <Field label="From Email">
            <Input type="email" value={form.from_email} onChange={(e) => set('from_email', e.target.value)} placeholder="outreach@youragency.com" className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600" />
          </Field>
          <Field label="Email Signature">
            <textarea
              value={form.email_signature}
              onChange={(e) => set('email_signature', e.target.value)}
              rows={3}
              placeholder="Best,&#10;John Doe&#10;My AI Agency | (555) 123-4567"
              className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-md p-3 resize-none focus:border-violet-500 outline-none placeholder:text-gray-600"
            />
          </Field>
        </Section>

        <Section title="SMS & Voice (Twilio)">
          <div className="text-xs text-gray-500 mb-2">
            Get credentials at <span className="text-violet-400">twilio.com</span>
          </div>
          <Field label="Account SID">
            <SecretInput value={form.twilio_account_sid} onChange={(v) => set('twilio_account_sid', v)} placeholder="ACxxxxxx" />
          </Field>
          <Field label="Auth Token">
            <SecretInput value={form.twilio_auth_token} onChange={(v) => set('twilio_auth_token', v)} placeholder="Twilio Auth Token" />
          </Field>
          <Field label="Phone Number" hint="Your Twilio phone number in E.164 format">
            <Input value={form.twilio_phone_number} onChange={(e) => set('twilio_phone_number', e.target.value)} placeholder="+15550001234" className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600" />
          </Field>
        </Section>

        <Section title="AI Voice Calls (VAPI)">
          <div className="text-xs text-gray-500 mb-2">
            Get your API key at <span className="text-violet-400">vapi.ai</span> — enables AI-powered voice calls
          </div>
          <Field label="VAPI API Key">
            <SecretInput value={form.vapi_api_key} onChange={(v) => set('vapi_api_key', v)} placeholder="vapi_..." />
          </Field>
        </Section>

        <Section title="Company Scraper (Google Places)">
          <div className="text-xs text-gray-500 mb-2">
            Enable the Scraper tab to find businesses. Get key at <span className="text-violet-400">console.cloud.google.com</span>
          </div>
          <Field label="Google Places API Key">
            <SecretInput value={form.google_places_api_key} onChange={(v) => set('google_places_api_key', v)} placeholder="AIza..." />
          </Field>
        </Section>

        <Button type="submit" disabled={save.isPending} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
          {save.isPending ? (
            'Saving...'
          ) : save.isSuccess ? (
            <><CheckCircle className="w-4 h-4" /> Saved</>
          ) : (
            <><Save className="w-4 h-4" /> Save Settings</>
          )}
        </Button>
      </form>
    </div>
  );
}
