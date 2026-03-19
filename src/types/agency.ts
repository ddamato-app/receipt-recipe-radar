export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'demo_scheduled'
  | 'closed_won'
  | 'closed_lost'
  | 'opted_out';

export type CampaignType = 'email' | 'sms' | 'call' | 'multi';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type OutreachType = 'email' | 'sms' | 'call';
export type OutreachStatus =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'replied'
  | 'failed'
  | 'no_answer';

export interface Lead {
  id: string;
  user_id: string;
  company_name: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  industry: string | null;
  employee_count: string | null;
  source: string;
  status: LeadStatus;
  notes: string | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  subject: string | null;
  message_template: string;
  call_script: string | null;
  schedule_type: 'immediate' | 'scheduled';
  scheduled_at: string | null;
  total_leads: number;
  sent_count: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
}

export interface OutreachLog {
  id: string;
  user_id: string;
  lead_id: string | null;
  campaign_id: string | null;
  type: OutreachType;
  status: OutreachStatus;
  subject: string | null;
  message: string | null;
  response: string | null;
  sent_at: string;
  created_at: string;
  leads?: { company_name: string } | null;
  campaigns?: { name: string } | null;
}

export interface ScrapeJob {
  id: string;
  user_id: string;
  query: string;
  location: string | null;
  industry: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results_count: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface AgencySettings {
  id: string;
  user_id: string;
  agency_name: string | null;
  resend_api_key: string | null;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  twilio_phone_number: string | null;
  vapi_api_key: string | null;
  google_places_api_key: string | null;
  from_email: string | null;
  email_signature: string | null;
  pitch_product_name: string;
  pitch_description: string | null;
  created_at: string;
  updated_at: string;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  demo_scheduled: 'Demo Scheduled',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
  opted_out: 'Opted Out',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-slate-100 text-slate-700',
  contacted: 'bg-blue-100 text-blue-700',
  interested: 'bg-yellow-100 text-yellow-700',
  demo_scheduled: 'bg-purple-100 text-purple-700',
  closed_won: 'bg-green-100 text-green-700',
  closed_lost: 'bg-red-100 text-red-700',
  opted_out: 'bg-gray-100 text-gray-500',
};

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  email: 'Email',
  sms: 'SMS',
  call: 'Voice Call',
  multi: 'Multi-Channel',
};

export const OUTREACH_STATUS_COLORS: Record<OutreachStatus, string> = {
  sent: 'bg-blue-100 text-blue-700',
  delivered: 'bg-blue-200 text-blue-800',
  opened: 'bg-yellow-100 text-yellow-700',
  clicked: 'bg-orange-100 text-orange-700',
  replied: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  no_answer: 'bg-gray-100 text-gray-600',
};
