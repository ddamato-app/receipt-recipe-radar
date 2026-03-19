import { useState } from 'react';
import { useScrapeCompanies, useScrapeJobs } from '@/hooks/useOutreach';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, CheckCircle, XCircle, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const INDUSTRY_SUGGESTIONS = [
  'Restaurant', 'Dental', 'Law Firm', 'Real Estate', 'Auto Repair',
  'Salon & Spa', 'Plumber', 'Electrician', 'HVAC', 'Gym & Fitness',
  'Hotel', 'Accounting', 'Insurance', 'Veterinary', 'Pharmacy',
];

export default function Scraper() {
  const { data: jobs } = useScrapeJobs();
  const scrape = useScrapeCompanies();

  const [form, setForm] = useState({
    query: '',
    location: '',
    industry: '',
    maxResults: '20',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await scrape.mutateAsync({
      query: form.query || form.industry,
      location: form.location,
      industry: form.industry,
      maxResults: parseInt(form.maxResults) || 20,
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Company Scraper</h1>
        <p className="text-gray-400 mt-1">Find businesses to pitch your AI Voice Assistant to</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Search form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-violet-400" /> Search Parameters
          </h2>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-5 flex gap-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300">
              Requires Google Places API key. Add it in <a href="/agency/settings" className="underline">Settings</a> before scraping.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-gray-400 text-xs mb-1.5 block">Search Query</Label>
              <Input
                value={form.query}
                onChange={(e) => setForm((f) => ({ ...f, query: e.target.value }))}
                placeholder='e.g. "restaurants near downtown"'
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
              />
            </div>

            <div>
              <Label className="text-gray-400 text-xs mb-1.5 block">Industry / Business Type</Label>
              <Input
                value={form.industry}
                onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                placeholder='e.g. "dentist"'
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {INDUSTRY_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, industry: s }))}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs transition-colors',
                      form.industry === s
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-gray-400 text-xs mb-1.5 block">Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder='e.g. "Miami, FL" or "Chicago"'
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
              />
            </div>

            <div>
              <Label className="text-gray-400 text-xs mb-1.5 block">Max Results</Label>
              <select
                value={form.maxResults}
                onChange={(e) => setForm((f) => ({ ...f, maxResults: e.target.value }))}
                className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 h-10 text-sm w-full"
              >
                {['10', '20', '50', '100'].map((n) => (
                  <option key={n} value={n}>{n} results</option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              disabled={scrape.isPending || (!form.query && !form.industry)}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
            >
              {scrape.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Scraping...</>
              ) : (
                <><Search className="w-4 h-4" /> Start Scraping</>
              )}
            </Button>
          </form>
        </div>

        {/* Scrape history */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4">Scrape History</h2>
          {!jobs || jobs.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No scrape jobs yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800">
                  {job.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : job.status === 'failed' ? (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5 animate-spin" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{job.query}</p>
                    <p className="text-xs text-gray-400">{job.location}</p>
                    {job.status === 'completed' && (
                      <p className="text-xs text-green-400 mt-0.5">{job.results_count} leads added</p>
                    )}
                    {job.status === 'failed' && job.error_message && (
                      <p className="text-xs text-red-400 mt-0.5">{job.error_message}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1">{new Date(job.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
