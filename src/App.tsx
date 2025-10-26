import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Inventory from "./pages/Inventory";
import AddItem from "./pages/AddItem";
import Recipes from "./pages/Recipes";
import Spending from "./pages/Spending";
import Profile from "./pages/Profile";
import ReceiptInbox from "./pages/ReceiptInbox";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/add" element={<AddItem />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/spending" element={<Spending />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/receipt-inbox" element={<ReceiptInbox />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
