import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Campaign } from '@/types/agency';
import { toast } from 'sonner';

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Campaign;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: Partial<Campaign>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('campaigns')
        .insert({ ...campaign, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['campaign', c.id] });
      toast.success('Campaign updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddLeadsToCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, leadIds }: { campaignId: string; leadIds: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const rows = leadIds.map((lid) => ({
        campaign_id: campaignId,
        lead_id: lid,
        user_id: user.id,
      }));
      const { error } = await supabase.from('campaign_leads').upsert(rows, { onConflict: 'campaign_id,lead_id' });
      if (error) throw error;
      await supabase.from('campaigns').update({ total_leads: leadIds.length }).eq('id', campaignId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['campaign-leads'] });
      toast.success('Leads added to campaign');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCampaignLeads(campaignId: string) {
  return useQuery({
    queryKey: ['campaign-leads', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_leads')
        .select('*, leads(*)')
        .eq('campaign_id', campaignId);
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });
}
