import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Feed from '@/pages/Feed';
import ItemDetail from '@/pages/ItemDetail';
import RestaurantProfile from '@/pages/RestaurantProfile';
import Search from '@/pages/Search';
import Cart from '@/pages/Cart';
import Orders from '@/pages/Orders';
import OrderTracking from '@/pages/OrderTracking';
import Profile from '@/pages/Profile';
import DriverDashboard from '@/pages/DriverDashboard';
import Settings from '@/pages/Settings';
import About from '@/pages/About';
import AdminDashboard from '@/pages/AdminDashboard';
import RestaurantDashboard from '@/pages/RestaurantDashboard';
import DiscoveryMap from '@/pages/DiscoveryMap';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Feed />} />
      <Route path="/item/:id" element={<ItemDetail />} />
      <Route path="/restaurant/:id" element={<RestaurantProfile />} />
      <Route path="/search" element={<Search />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/order/:id/tracking" element={<OrderTracking />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/driver" element={<DriverDashboard />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/about" element={<About />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />
      <Route path="/discovery-map" element={<DiscoveryMap />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App