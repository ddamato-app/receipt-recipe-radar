import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OutreachLog, ScrapeJob } from '@/types/agency';
import { toast } from 'sonner';

export function useOutreachLogs() {
  return useQuery({
    queryKey: ['outreach-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outreach_logs')
        .select('*, leads(company_name), campaigns(name)')
        .order('sent_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as OutreachLog[];
    },
  });
}

export function useSendOutreach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      campaignId: string;
      leadIds: string[];
      type: 'email' | 'sms' | 'call';
    }) => {
      const { data, error } = await supabase.functions.invoke('send-outreach', {
        body: payload,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outreach-logs'] });
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Outreach launched successfully');
    },
    onError: (e: Error) => toast.error(`Outreach failed: ${e.message}`),
  });
}

export function useScrapeJobs() {
  return useQuery({
    queryKey: ['scrape-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scrape_jobs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ScrapeJob[];
    },
  });
}

export function useScrapeCompanies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      query: string;
      location: string;
      industry: string;
      maxResults?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('scrape-companies', {
        body: payload,
      });
      if (error) throw error;
      return data as { jobId: string; results: number };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['scrape-jobs'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`Scraped ${result.results} companies`);
    },
    onError: (e: Error) => toast.error(`Scrape failed: ${e.message}`),
  });
}
