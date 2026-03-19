import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import { AdminRoute } from "./components/AdminRoute";
import { AdminLayout } from "./components/AdminLayout";
import { AgencyRoute } from "./components/AgencyRoute";
import { AgencyLayout } from "./components/AgencyLayout";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Inventory from "./pages/Inventory";
import AddItem from "./pages/AddItem";
import Recipes from "./pages/Recipes";
import Spending from "./pages/Spending";
import Profile from "./pages/Profile";
import ReceiptInbox from "./pages/ReceiptInbox";
import Health from "./pages/Health";
import ShoppingAssistantSetup from "./pages/ShoppingAssistantSetup";
import ShoppingMode from "./pages/ShoppingMode";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminRecipes from "./pages/admin/Recipes";
import AdminFeedback from "./pages/admin/Feedback";
import AdminSettings from "./pages/admin/Settings";
import AdminAnalytics from "./pages/admin/Analytics";
import TestReceipt from "./pages/TestReceipt";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import AgencyDashboard from "./pages/agency/Dashboard";
import AgencyLeads from "./pages/agency/Leads";
import AgencyLeadDetail from "./pages/agency/LeadDetail";
import AgencyLeadForm from "./pages/agency/LeadForm";
import AgencyScraper from "./pages/agency/Scraper";
import AgencyCampaigns from "./pages/agency/Campaigns";
import AgencyCampaignNew from "./pages/agency/CampaignNew";
import AgencyCampaignDetail from "./pages/agency/CampaignDetail";
import AgencyOutreachLogs from "./pages/agency/OutreachLogs";
import AgencySettings from "./pages/agency/AgencySettings";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AdminProvider>
              <Routes>
                {/* Agency Routes */}
                <Route path="/agency" element={<AgencyRoute><AgencyLayout /></AgencyRoute>}>
                  <Route index element={<AgencyDashboard />} />
                  <Route path="leads" element={<AgencyLeads />} />
                  <Route path="leads/new" element={<AgencyLeadForm />} />
                  <Route path="leads/:id" element={<AgencyLeadDetail />} />
                  <Route path="leads/:id/edit" element={<AgencyLeadForm />} />
                  <Route path="scraper" element={<AgencyScraper />} />
                  <Route path="campaigns" element={<AgencyCampaigns />} />
                  <Route path="campaigns/new" element={<AgencyCampaignNew />} />
                  <Route path="campaigns/:id" element={<AgencyCampaignDetail />} />
                  <Route path="outreach" element={<AgencyOutreachLogs />} />
                  <Route path="settings" element={<AgencySettings />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="recipes" element={<AdminRecipes />} />
                  <Route path="feedback" element={<AdminFeedback />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* Regular Routes */}
                <Route path="*" element={
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/landing" element={<Landing />} />
                      <Route path="/inventory" element={<Inventory />} />
                      <Route path="/add" element={<AddItem />} />
                      <Route path="/recipes" element={<Recipes />} />
                      <Route path="/spending" element={<Spending />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/receipt-inbox" element={<ReceiptInbox />} />
                      <Route path="/health" element={<Health />} />
                      <Route path="/shopping-assistant-setup" element={<ShoppingAssistantSetup />} />
                      <Route path="/shopping-mode" element={<ShoppingMode />} />
                      <Route path="/test-receipt" element={<TestReceipt />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                } />
              </Routes>
            </AdminProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
