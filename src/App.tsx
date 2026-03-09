import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import BusinessDetail from "./pages/BusinessDetail";
import Profile from "./pages/Profile";
import Collections from "./pages/Collections";
import Projects from "./pages/Projects";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import MerchantDashboard from "./pages/MerchantDashboard";
import Notifications from "./pages/Notifications";
import AddBusiness from "./pages/AddBusiness";
import AddReview from "./pages/AddReview";
import AddPhoto from "./pages/AddPhoto";
import MyReviews from "./pages/MyReviews";
import QRCode from "./pages/QRCode";
import Messages from "./pages/Messages";
import Compliments from "./pages/Compliments";
import Events from "./pages/Events";
import Activity from "./pages/Activity";
import AddedBusinesses from "./pages/AddedBusinesses";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/search" element={<Search />} />
            <Route path="/business/:id" element={<BusinessDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/merchant" element={<MerchantDashboard />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/add-business" element={<AddBusiness />} />
            <Route path="/add-review" element={<AddReview />} />
            <Route path="/add-photo" element={<AddPhoto />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
