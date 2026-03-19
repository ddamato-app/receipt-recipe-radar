import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AgencySettings } from '@/types/agency';
import { toast } from 'sonner';

export function useAgencySettings() {
  return useQuery({
    queryKey: ['agency-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('agency_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as AgencySettings | null;
    },
  });
}

export function useUpsertAgencySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<AgencySettings>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('agency_settings')
        .upsert({ ...settings, user_id: user.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return data as AgencySettings;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agency-settings'] });
      toast.success('Settings saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
