import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedMerchantRoute from "@/components/ProtectedMerchantRoute";
import Index from "./pages/Index";
import BusinessDetail from "./pages/BusinessDetail";
import Profile from "./pages/Profile";
import Collections from "./pages/Collections";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import MerchantLeads from "./pages/MerchantLeads";
import MerchantServiceSetup from "./pages/MerchantServiceSetup";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import MerchantAuth from "./pages/MerchantAuth";
import MerchantOnboarding from "./pages/MerchantOnboarding";
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
import MerchantPhotos from "./pages/MerchantPhotos";
import MerchantInbox from "./pages/MerchantInbox";
import MerchantBilling from "./pages/MerchantBilling";
import MerchantHome from "./pages/MerchantHome";
import MerchantOptimization from "./pages/MerchantOptimization";
import MerchantMarketplace from "./pages/MerchantMarketplace";
import MerchantMessages from "./pages/MerchantMessages";
import MerchantNotifications from "./pages/MerchantNotifications";
import MerchantMore from "./pages/MerchantMore";
import Notifications from "./pages/Notifications";
import AddBusiness from "./pages/AddBusiness";
import AddReview from "./pages/AddReview";
import AddPhoto from "./pages/AddPhoto";
import MyReviews from "./pages/MyReviews";
import QRCode from "./pages/QRCode";
import Messages from "./pages/Messages";
import NewMessage from "./pages/NewMessage";
import Conversation from "./pages/Conversation";
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
import More from "./pages/More";
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
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/search" element={<Search />} />
            <Route path="/business/:id" element={<BusinessDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/more" element={<More />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/add-business" element={<AddBusiness />} />
            <Route path="/add-review" element={<AddReview />} />
            <Route path="/add-photo" element={<AddPhoto />} />
            <Route path="/my-reviews" element={<MyReviews />} />
            <Route path="/qr-code" element={<QRCode />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/new" element={<NewMessage />} />
            <Route path="/messages/:id" element={<Conversation />} />
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

            {/* Merchant auth (public) */}
            <Route path="/merchant/login" element={<MerchantAuth />} />
            <Route path="/merchant/register" element={<MerchantAuth />} />
            <Route path="/merchant/onboarding" element={<MerchantOnboarding />} />

            {/* Protected merchant routes */}
            <Route path="/merchant" element={<ProtectedMerchantRoute><MerchantDashboard /></ProtectedMerchantRoute>} />
            <Route path="/merchant/home" element={<ProtectedMerchantRoute><MerchantHome /></ProtectedMerchantRoute>} />
            <Route path="/merchant/optimization" element={<ProtectedMerchantRoute><MerchantOptimization /></ProtectedMerchantRoute>} />
            <Route path="/merchant/marketplace" element={<ProtectedMerchantRoute><MerchantMarketplace /></ProtectedMerchantRoute>} />
            <Route path="/merchant/messages" element={<ProtectedMerchantRoute><MerchantMessages /></ProtectedMerchantRoute>} />
            <Route path="/merchant/notifications" element={<ProtectedMerchantRoute><MerchantNotifications /></ProtectedMerchantRoute>} />
            <Route path="/merchant/more" element={<ProtectedMerchantRoute><MerchantMore /></ProtectedMerchantRoute>} />
            <Route path="/merchant/ads" element={<ProtectedMerchantRoute><MerchantAds /></ProtectedMerchantRoute>} />
            <Route path="/merchant/host" element={<ProtectedMerchantRoute><QmapsHost /></ProtectedMerchantRoute>} />
            <Route path="/merchant/connect" element={<ProtectedMerchantRoute><QmapsConnect /></ProtectedMerchantRoute>} />
            <Route path="/merchant/upgrade" element={<ProtectedMerchantRoute><MerchantUpgrade /></ProtectedMerchantRoute>} />
            <Route path="/merchant/highlights" element={<ProtectedMerchantRoute><MerchantHighlights /></ProtectedMerchantRoute>} />
            <Route path="/merchant/cta" element={<ProtectedMerchantRoute><MerchantCTA /></ProtectedMerchantRoute>} />
            <Route path="/merchant/business-info" element={<ProtectedMerchantRoute><MerchantBusinessInfo /></ProtectedMerchantRoute>} />
            <Route path="/merchant/guest-manager" element={<ProtectedMerchantRoute><MerchantGuestManager /></ProtectedMerchantRoute>} />
            <Route path="/merchant/photos" element={<ProtectedMerchantRoute><MerchantPhotos /></ProtectedMerchantRoute>} />
            <Route path="/merchant/inbox" element={<ProtectedMerchantRoute><MerchantInbox /></ProtectedMerchantRoute>} />
            <Route path="/merchant/billing" element={<ProtectedMerchantRoute><MerchantBilling /></ProtectedMerchantRoute>} />
            <Route path="/merchant/leads" element={<ProtectedMerchantRoute><MerchantLeads /></ProtectedMerchantRoute>} />
            <Route path="/merchant/services" element={<ProtectedMerchantRoute><MerchantServiceSetup /></ProtectedMerchantRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
