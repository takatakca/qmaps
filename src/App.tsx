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
import ErrorBoundary from "@/components/ErrorBoundary";
import { Seo, SiteJsonLd } from "@/seo/Seo";
import { CookieBanner } from "@/consent/CookieBanner";

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
const AdminAccountDeletions = lazy(() => import("./pages/admin/AdminAccountDeletions"));
const AdminLaunchStatus = lazy(() => import("./pages/admin/AdminLaunchStatus"));
const AdminClaims = lazy(() => import("./pages/admin/AdminClaims"));
const AdminOwnerTransfers = lazy(() => import("./pages/admin/AdminOwnerTransfers"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));

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
const MerchantMenu = lazy(() => import("./pages/MerchantMenu"));
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
const DeleteAccount = lazy(() => import("./pages/settings/DeleteAccount"));
const CityPage = lazy(() => import("./pages/CityPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const Services = lazy(() => import("./pages/Services"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const AccountDeletionPolicy = lazy(() => import("./pages/legal/AccountDeletionPolicy"));
const SupportPolicy = lazy(() => import("./pages/legal/SupportPolicy"));
const Cookies = lazy(() => import("./pages/legal/Cookies"));
const ReleaseNotes = lazy(() => import("./pages/ReleaseNotes"));

const queryClient = new QueryClient();

/** Private, account, merchant and admin pages without their own <Seo>: kept out of search results (SEO kit). */
const NoIndex = ({ children }: { children: React.ReactNode }) => (
  <>
    <Seo noindex />
    {children}
  </>
);

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
        <OfflineBanner />
        <BrowserRouter>
          <SiteJsonLd />
          <CookieBanner />
          <Suspense fallback={<RouteFallback />}>
            <ErrorBoundary>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<NoIndex><Auth /></NoIndex>} />
              <Route path="/reset-password" element={<NoIndex><ResetPassword /></NoIndex>} />
              <Route path="/search" element={<Search />} />
              <Route path="/business/:id" element={<BusinessDetail />} />
              <Route path="/c/:categorySlug" element={<CategoryPage />} />
              <Route path="/city/:citySlug" element={<CityPage />} />
              <Route path="/city/:citySlug/:categorySlug" element={<CategoryPage />} />
              <Route path="/sitemap.xml" element={<NoIndex><Sitemap /></NoIndex>} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/account-deletion-policy" element={<AccountDeletionPolicy />} />
              <Route path="/support-policy" element={<SupportPolicy />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/release-notes" element={<ReleaseNotes />} />
              <Route path="/profile" element={<NoIndex><Profile /></NoIndex>} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/services" element={<Services />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<NoIndex><ProjectDetail /></NoIndex>} />
              <Route path="/more" element={<NoIndex><More /></NoIndex>} />
              <Route path="/notifications" element={<NoIndex><Notifications /></NoIndex>} />
              <Route path="/add-business" element={<NoIndex><AddBusiness /></NoIndex>} />
              <Route path="/add-review" element={<NoIndex><AddReview /></NoIndex>} />
              <Route path="/add-photo" element={<NoIndex><AddPhoto /></NoIndex>} />
              <Route path="/my-reviews" element={<NoIndex><MyReviews /></NoIndex>} />
              <Route path="/qr-code" element={<NoIndex><QRCode /></NoIndex>} />
              <Route path="/messages" element={<NoIndex><Messages /></NoIndex>} />
              <Route path="/messages/new" element={<NoIndex><NewMessage /></NoIndex>} />
              <Route path="/messages/:id" element={<NoIndex><Conversation /></NoIndex>} />
              <Route path="/compliments" element={<NoIndex><Compliments /></NoIndex>} />
              <Route path="/events" element={<Events />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/added-businesses" element={<NoIndex><AddedBusinesses /></NoIndex>} />
              <Route path="/settings" element={<NoIndex><Settings /></NoIndex>} />
              <Route path="/support" element={<Support />} />
              <Route path="/preferences" element={<NoIndex><Preferences /></NoIndex>} />
              <Route path="/edit-profile" element={<NoIndex><EditProfile /></NoIndex>} />
              <Route path="/talk" element={<Talk />} />
              <Route path="/my-activity" element={<NoIndex><MyActivity /></NoIndex>} />
              <Route path="/settings/my-locations" element={<NoIndex><MyLocations /></NoIndex>} />
              <Route path="/settings/email-notifications" element={<NoIndex><EmailNotifications /></NoIndex>} />
              <Route path="/settings/location-services" element={<NoIndex><LocationServices /></NoIndex>} />
              <Route path="/settings/clear-history" element={<NoIndex><ClearHistory /></NoIndex>} />
              <Route path="/settings/distance-units" element={<NoIndex><DistanceUnits /></NoIndex>} />
              <Route path="/settings/privacy" element={<NoIndex><PrivacySettings /></NoIndex>} />
              <Route path="/settings/app-preferences" element={<NoIndex><AppPreferences /></NoIndex>} />
              <Route path="/settings/delete-account" element={<NoIndex><DeleteAccount /></NoIndex>} />

              {/* Merchant auth (public) */}
              <Route path="/merchant/login" element={<NoIndex><MerchantAuth /></NoIndex>} />
              <Route path="/merchant/register" element={<NoIndex><MerchantAuth /></NoIndex>} />
              <Route path="/merchant/onboarding" element={<NoIndex><MerchantOnboarding /></NoIndex>} />

              {/* Protected merchant routes */}
              <Route path="/merchant" element={<ProtectedMerchantRoute><NoIndex><MerchantDashboard /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/home" element={<ProtectedMerchantRoute><NoIndex><MerchantHome /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/optimization" element={<ProtectedMerchantRoute><NoIndex><MerchantOptimization /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/marketplace" element={<ProtectedMerchantRoute><NoIndex><MerchantMarketplace /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/messages" element={<ProtectedMerchantRoute><NoIndex><MerchantMessages /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/notifications" element={<ProtectedMerchantRoute><NoIndex><MerchantNotifications /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/more" element={<ProtectedMerchantRoute><NoIndex><MerchantMore /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/ads" element={<ProtectedMerchantRoute><NoIndex><MerchantAds /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/host" element={<ProtectedMerchantRoute><NoIndex><QmapsHost /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/connect" element={<ProtectedMerchantRoute><NoIndex><QmapsConnect /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/upgrade" element={<ProtectedMerchantRoute><NoIndex><MerchantUpgrade /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/highlights" element={<ProtectedMerchantRoute><NoIndex><MerchantHighlights /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/cta" element={<ProtectedMerchantRoute><NoIndex><MerchantCTA /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/business-info" element={<ProtectedMerchantRoute><NoIndex><MerchantBusinessInfo /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/guest-manager" element={<ProtectedMerchantRoute><NoIndex><MerchantGuestManager /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/photos" element={<ProtectedMerchantRoute><NoIndex><MerchantPhotos /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/menu" element={<ProtectedMerchantRoute><NoIndex><MerchantMenu /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/inbox" element={<ProtectedMerchantRoute><NoIndex><MerchantInbox /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/billing" element={<ProtectedMerchantRoute><NoIndex><MerchantBilling /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/billing/plans" element={<ProtectedMerchantRoute><MerchantBillingPlans /></ProtectedMerchantRoute>} />
              <Route path="/merchant/leads" element={<ProtectedMerchantRoute><NoIndex><MerchantLeads /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/services" element={<ProtectedMerchantRoute><NoIndex><MerchantServiceSetup /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/analytics" element={<ProtectedMerchantRoute><NoIndex><MerchantAnalytics /></NoIndex></ProtectedMerchantRoute>} />
              <Route path="/merchant/sponsored" element={<ProtectedMerchantRoute><NoIndex><MerchantSponsored /></NoIndex></ProtectedMerchantRoute>} />

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedAdminRoute><NoIndex><AdminDashboard /></NoIndex></ProtectedAdminRoute>} />
              <Route path="/admin/reports" element={<ProtectedAdminRoute><NoIndex><AdminReports /></NoIndex></ProtectedAdminRoute>} />
              <Route path="/admin/businesses" element={<ProtectedAdminRoute><NoIndex><AdminBusinesses /></NoIndex></ProtectedAdminRoute>} />
              <Route path="/admin/reviews" element={<ProtectedAdminRoute><NoIndex><AdminReviews /></NoIndex></ProtectedAdminRoute>} />
              <Route path="/admin/photos" element={<ProtectedAdminRoute><NoIndex><AdminPhotos /></NoIndex></ProtectedAdminRoute>} />
              <Route path="/admin/projects" element={<ProtectedAdminRoute><NoIndex><AdminProjects /></NoIndex></ProtectedAdminRoute>} />
              <Route path="/admin/sponsored" element={<ProtectedAdminRoute><NoIndex><AdminSponsored /></NoIndex></ProtectedAdminRoute>} />
              <Route path="/admin/users" element={<ProtectedAdminRoute><NoIndex><AdminUsers /></NoIndex></ProtectedAdminRoute>} />
              <Route path="/admin/review-moderation" element={<ProtectedAdminRoute><NoIndex><AdminReviewModeration /></NoIndex></ProtectedAdminRoute>} />
              <Route path="/admin/account-deletions" element={<ProtectedAdminRoute><NoIndex><AdminAccountDeletions /></NoIndex></ProtectedAdminRoute>} />
              <Route path="/admin/launch-status" element={<ProtectedAdminRoute><AdminLaunchStatus /></ProtectedAdminRoute>} />
              <Route path="/admin/claims" element={<ProtectedAdminRoute><NoIndex><AdminClaims /></NoIndex></ProtectedAdminRoute>} />
              <Route path="/admin/owner-transfers" element={<ProtectedAdminRoute><NoIndex><AdminOwnerTransfers /></NoIndex></ProtectedAdminRoute>} />
              <Route path="/admin/audit-logs" element={<ProtectedAdminRoute><NoIndex><AdminAuditLogs /></NoIndex></ProtectedAdminRoute>} />
              <Route path="/admin/categories" element={<ProtectedAdminRoute><NoIndex><AdminCategories /></NoIndex></ProtectedAdminRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
            </ErrorBoundary>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
