import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Replace template variables in message */
function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') ?? ''
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { campaignId, leadIds, type } = await req.json() as {
      campaignId: string;
      leadIds: string[];
      type: 'email' | 'sms' | 'call';
    };

    // Fetch campaign
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    if (campErr || !campaign) throw new Error('Campaign not found');

    // Fetch agency settings
    const { data: settings } = await supabase
      .from('agency_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Fetch leads
    const { data: leads, error: leadsErr } = await supabase
      .from('leads')
      .select('*')
      .in('id', leadIds);
    if (leadsErr) throw leadsErr;

    const results: { leadId: string; success: boolean; error?: string }[] = [];

    for (const lead of leads || []) {
      const vars: Record<string, string> = {
        company_name: lead.company_name,
        first_name: lead.company_name.split(' ')[0],
        industry: lead.industry || 'business',
        sender_name: settings?.agency_name || 'AI Agency',
        agency_name: settings?.agency_name || 'AI Agency',
        pitch_product_name: settings?.pitch_product_name || 'AI Voice Assistant',
      };

      const message = interpolate(campaign.message_template, vars);

      try {
        if (type === 'email') {
          await sendEmail({
            to: lead.email,
            from: settings?.from_email || 'noreply@example.com',
            subject: campaign.subject ? interpolate(campaign.subject, vars) : `AI Voice Assistant for ${lead.company_name}`,
            body: message,
            signature: settings?.email_signature || '',
            apiKey: settings?.resend_api_key || '',
          });
        } else if (type === 'sms') {
          await sendSMS({
            to: lead.phone,
            from: settings?.twilio_phone_number || '',
            body: message,
            accountSid: settings?.twilio_account_sid || '',
            authToken: settings?.twilio_auth_token || '',
          });
        } else if (type === 'call') {
          await makeCall({
            to: lead.phone,
            from: settings?.twilio_phone_number || '',
            script: campaign.call_script ? interpolate(campaign.call_script, vars) : message,
            accountSid: settings?.twilio_account_sid || '',
            authToken: settings?.twilio_auth_token || '',
            vapiApiKey: settings?.vapi_api_key || '',
          });
        }

        // Log success
        await supabase.from('outreach_logs').insert({
          user_id: user.id,
          lead_id: lead.id,
          campaign_id: campaignId,
          type,
          status: 'sent',
          subject: campaign.subject ? interpolate(campaign.subject, vars) : null,
          message,
          sent_at: new Date().toISOString(),
        });

        // Update campaign_lead status
        await supabase
          .from('campaign_leads')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('campaign_id', campaignId)
          .eq('lead_id', lead.id);

        // Update lead status to 'contacted' if still 'new'
        if (lead.status === 'new') {
          await supabase
            .from('leads')
            .update({ status: 'contacted', updated_at: new Date().toISOString() })
            .eq('id', lead.id);
        }

        results.push({ leadId: lead.id, success: true });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Send failed';

        await supabase.from('outreach_logs').insert({
          user_id: user.id,
          lead_id: lead.id,
          campaign_id: campaignId,
          type,
          status: 'failed',
          message,
          response: errMsg,
          sent_at: new Date().toISOString(),
        });

        await supabase
          .from('campaign_leads')
          .update({ status: 'failed' })
          .eq('campaign_id', campaignId)
          .eq('lead_id', lead.id);

        results.push({ leadId: lead.id, success: false, error: errMsg });
      }
    }

    // Update campaign sent count
    const successCount = results.filter((r) => r.success).length;
    await supabase
      .from('campaigns')
      .update({
        sent_count: (campaign.sent_count || 0) + successCount,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    return new Response(JSON.stringify({ results, sent: successCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ── Email via Resend ──────────────────────────────────────────────────────────
async function sendEmail({
  to, from, subject, body, signature, apiKey,
}: {
  to: string | null;
  from: string;
  subject: string;
  body: string;
  signature: string;
  apiKey: string;
}) {
  if (!to) throw new Error('Lead has no email address');
  if (!apiKey) throw new Error('Resend API key not configured');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: signature ? `${body}\n\n${signature}` : body,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
}

// ── SMS via Twilio ────────────────────────────────────────────────────────────
async function sendSMS({
  to, from, body, accountSid, authToken,
}: {
  to: string | null;
  from: string;
  body: string;
  accountSid: string;
  authToken: string;
}) {
  if (!to) throw new Error('Lead has no phone number');
  if (!accountSid || !authToken) throw new Error('Twilio credentials not configured');

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams({ To: to, From: from, Body: body });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio SMS error: ${err}`);
  }
}

// ── Voice Call via VAPI (or Twilio TwiML fallback) ───────────────────────────
async function makeCall({
  to, from, script, accountSid, authToken, vapiApiKey,
}: {
  to: string | null;
  from: string;
  script: string;
  accountSid: string;
  authToken: string;
  vapiApiKey: string;
}) {
  if (!to) throw new Error('Lead has no phone number');

  // Use VAPI if configured (preferred — AI voice)
  if (vapiApiKey) {
    const res = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumberId: from,
        customer: { number: to },
        assistantOverrides: {
          firstMessage: script,
        },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`VAPI error: ${err}`);
    }
    return;
  }

  // Fallback: Twilio TwiML call with text-to-speech
  if (!accountSid || !authToken) throw new Error('Twilio or VAPI credentials not configured');

  const twimlUrl = `https://handler.twilio.com/twiml/EH000?Message=${encodeURIComponent(script)}`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
  const params = new URLSearchParams({ To: to, From: from, Url: twimlUrl });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio Call error: ${err}`);
  }
}
