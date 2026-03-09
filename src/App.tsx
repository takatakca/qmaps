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
import MerchantAds from "./pages/MerchantAds";
import QmapsHost from "./pages/QmapsHost";
import QmapsConnect from "./pages/QmapsConnect";
import MerchantUpgrade from "./pages/MerchantUpgrade";
import MerchantHighlights from "./pages/MerchantHighlights";
import MerchantCTA from "./pages/MerchantCTA";
import MerchantBusinessInfo from "./pages/MerchantBusinessInfo";
import MerchantGuestManager from "./pages/MerchantGuestManager";
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
import Settings from "./pages/Settings";
import Support from "./pages/Support";
import Preferences from "./pages/Preferences";
import EditProfile from "./pages/EditProfile";
import Talk from "./pages/Talk";
import MyActivity from "./pages/MyActivity";
import MyLocations from "./pages/settings/MyLocations";
import EmailNotifications from "./pages/settings/EmailNotifications";
import LocationServices from "./pages/settings/LocationServices";
import ClearHistory from "./pages/settings/ClearHistory";
import DistanceUnits from "./pages/settings/DistanceUnits";
import PrivacySettings from "./pages/settings/PrivacySettings";
import AppPreferences from "./pages/settings/AppPreferences";
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
            <Route path="/merchant/ads" element={<MerchantAds />} />
            <Route path="/merchant/host" element={<QmapsHost />} />
            <Route path="/merchant/connect" element={<QmapsConnect />} />
            <Route path="/merchant/upgrade" element={<MerchantUpgrade />} />
            <Route path="/merchant/highlights" element={<MerchantHighlights />} />
            <Route path="/merchant/cta" element={<MerchantCTA />} />
            <Route path="/merchant/business-info" element={<MerchantBusinessInfo />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/add-business" element={<AddBusiness />} />
            <Route path="/add-review" element={<AddReview />} />
            <Route path="/add-photo" element={<AddPhoto />} />
            <Route path="/my-reviews" element={<MyReviews />} />
            <Route path="/qr-code" element={<QRCode />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/compliments" element={<Compliments />} />
            <Route path="/events" element={<Events />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/added-businesses" element={<AddedBusinesses />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/support" element={<Support />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/talk" element={<Talk />} />
            <Route path="/my-activity" element={<MyActivity />} />
            <Route path="/settings/my-locations" element={<MyLocations />} />
            <Route path="/settings/email-notifications" element={<EmailNotifications />} />
            <Route path="/settings/location-services" element={<LocationServices />} />
            <Route path="/settings/clear-history" element={<ClearHistory />} />
            <Route path="/settings/distance-units" element={<DistanceUnits />} />
            <Route path="/settings/privacy" element={<PrivacySettings />} />
            <Route path="/settings/app-preferences" element={<AppPreferences />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
