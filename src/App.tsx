import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedMerchantRoute from "@/components/ProtectedMerchantRoute";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import OfflineBanner from "@/components/OfflineBanner";

// Eager: critical public pages
import Index from "./pages/Index";
import BusinessDetail from "./pages/BusinessDetail";
import Search from "./pages/Search";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy: admin
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminBusinesses = lazy(() => import("./pages/admin/AdminBusinesses"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminPhotos = lazy(() => import("./pages/admin/AdminPhotos"));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects"));
const AdminSponsored = lazy(() => import("./pages/admin/AdminSponsored"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminReviewModeration = lazy(() => import("./pages/admin/AdminReviewModeration"));

// Lazy: merchant
const MerchantSponsored = lazy(() => import("./pages/MerchantSponsored"));
const MerchantLeads = lazy(() => import("./pages/MerchantLeads"));
const MerchantServiceSetup = lazy(() => import("./pages/MerchantServiceSetup"));
const MerchantAnalytics = lazy(() => import("./pages/MerchantAnalytics"));
const MerchantAuth = lazy(() => import("./pages/MerchantAuth"));
const MerchantOnboarding = lazy(() => import("./pages/MerchantOnboarding"));
const MerchantDashboard = lazy(() => import("./pages/MerchantDashboard"));
const MerchantAds = lazy(() => import("./pages/MerchantAds"));
const QmapsHost = lazy(() => import("./pages/QmapsHost"));
const QmapsConnect = lazy(() => import("./pages/QmapsConnect"));
const MerchantUpgrade = lazy(() => import("./pages/MerchantUpgrade"));
const MerchantHighlights = lazy(() => import("./pages/MerchantHighlights"));
const MerchantCTA = lazy(() => import("./pages/MerchantCTA"));
const MerchantBusinessInfo = lazy(() => import("./pages/MerchantBusinessInfo"));
const MerchantGuestManager = lazy(() => import("./pages/MerchantGuestManager"));
const MerchantPhotos = lazy(() => import("./pages/MerchantPhotos"));
const MerchantInbox = lazy(() => import("./pages/MerchantInbox"));
const MerchantBilling = lazy(() => import("./pages/MerchantBilling"));
const MerchantBillingPlans = lazy(() => import("./pages/MerchantBillingPlans"));
const MerchantHome = lazy(() => import("./pages/MerchantHome"));
const MerchantOptimization = lazy(() => import("./pages/MerchantOptimization"));
const MerchantMarketplace = lazy(() => import("./pages/MerchantMarketplace"));
const MerchantMessages = lazy(() => import("./pages/MerchantMessages"));
const MerchantNotifications = lazy(() => import("./pages/MerchantNotifications"));
const MerchantMore = lazy(() => import("./pages/MerchantMore"));

// Lazy: authenticated user pages
const Profile = lazy(() => import("./pages/Profile"));
const Collections = lazy(() => import("./pages/Collections"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Notifications = lazy(() => import("./pages/Notifications"));
const AddBusiness = lazy(() => import("./pages/AddBusiness"));
const AddReview = lazy(() => import("./pages/AddReview"));
const AddPhoto = lazy(() => import("./pages/AddPhoto"));
const MyReviews = lazy(() => import("./pages/MyReviews"));
const QRCode = lazy(() => import("./pages/QRCode"));
const Messages = lazy(() => import("./pages/Messages"));
const NewMessage = lazy(() => import("./pages/NewMessage"));
const Conversation = lazy(() => import("./pages/Conversation"));
const Compliments = lazy(() => import("./pages/Compliments"));
const Events = lazy(() => import("./pages/Events"));
const Activity = lazy(() => import("./pages/Activity"));
const AddedBusinesses = lazy(() => import("./pages/AddedBusinesses"));
const Settings = lazy(() => import("./pages/Settings"));
const Support = lazy(() => import("./pages/Support"));
const Preferences = lazy(() => import("./pages/Preferences"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Talk = lazy(() => import("./pages/Talk"));
const MyActivity = lazy(() => import("./pages/MyActivity"));
const More = lazy(() => import("./pages/More"));
const MyLocations = lazy(() => import("./pages/settings/MyLocations"));
const EmailNotifications = lazy(() => import("./pages/settings/EmailNotifications"));
const LocationServices = lazy(() => import("./pages/settings/LocationServices"));
const ClearHistory = lazy(() => import("./pages/settings/ClearHistory"));
const DistanceUnits = lazy(() => import("./pages/settings/DistanceUnits"));
const PrivacySettings = lazy(() => import("./pages/settings/PrivacySettings"));
const AppPreferences = lazy(() => import("./pages/settings/AppPreferences"));
const CityPage = lazy(() => import("./pages/CityPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const Sitemap = lazy(() => import("./pages/Sitemap"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen bg-background pb-safe pt-safe max-w-lg mx-auto px-4 py-6 space-y-3" role="status" aria-label="Chargement de la page">
    <div className="h-8 w-2/3 rounded-md bg-muted animate-pulse" />
    <div className="h-44 w-full rounded-xl bg-muted animate-pulse" />
    <div className="h-24 w-full rounded-xl bg-muted animate-pulse" />
    <div className="h-24 w-full rounded-xl bg-muted animate-pulse" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/search" element={<Search />} />
              <Route path="/business/:id" element={<BusinessDetail />} />
              <Route path="/c/:categorySlug" element={<CategoryPage />} />
              <Route path="/city/:citySlug" element={<CityPage />} />
              <Route path="/city/:citySlug/:categorySlug" element={<CategoryPage />} />
              <Route path="/sitemap.xml" element={<Sitemap />} />
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
              <Route path="/merchant/billing/plans" element={<ProtectedMerchantRoute><MerchantBillingPlans /></ProtectedMerchantRoute>} />
              <Route path="/merchant/leads" element={<ProtectedMerchantRoute><MerchantLeads /></ProtectedMerchantRoute>} />
              <Route path="/merchant/services" element={<ProtectedMerchantRoute><MerchantServiceSetup /></ProtectedMerchantRoute>} />
              <Route path="/merchant/analytics" element={<ProtectedMerchantRoute><MerchantAnalytics /></ProtectedMerchantRoute>} />
              <Route path="/merchant/sponsored" element={<ProtectedMerchantRoute><MerchantSponsored /></ProtectedMerchantRoute>} />

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
              <Route path="/admin/reports" element={<ProtectedAdminRoute><AdminReports /></ProtectedAdminRoute>} />
              <Route path="/admin/businesses" element={<ProtectedAdminRoute><AdminBusinesses /></ProtectedAdminRoute>} />
              <Route path="/admin/reviews" element={<ProtectedAdminRoute><AdminReviews /></ProtectedAdminRoute>} />
              <Route path="/admin/photos" element={<ProtectedAdminRoute><AdminPhotos /></ProtectedAdminRoute>} />
              <Route path="/admin/projects" element={<ProtectedAdminRoute><AdminProjects /></ProtectedAdminRoute>} />
              <Route path="/admin/sponsored" element={<ProtectedAdminRoute><AdminSponsored /></ProtectedAdminRoute>} />
              <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUsers /></ProtectedAdminRoute>} />
              <Route path="/admin/review-moderation" element={<ProtectedAdminRoute><AdminReviewModeration /></ProtectedAdminRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
