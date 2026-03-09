import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import OwnerRoute from './components/dashboard/OwnerRoute';

const MainPage = React.lazy(() => import('./pages/MainPage'));
const LoginPage = React.lazy(() => import('./pages/Auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/Auth/RegisterPage'));
const VerifyEmailPage = React.lazy(() => import('./pages/Auth/VerifyEmailPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/Auth/ResetPasswordPage'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const RestaurantDetailPage = React.lazy(() => import('./pages/RestaurantDetailPage'));
const BookingPage = React.lazy(() => import('./pages/BookingPage'));
const MyReservationsPage = React.lazy(() => import('./pages/MyReservationsPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const DashboardOverviewPage = React.lazy(() => import('./pages/Dashboard/DashboardOverviewPage'));
const DashboardRestaurantsPage = React.lazy(() => import('./pages/Dashboard/DashboardRestaurantsPage'));
const DashboardRestaurantFormPage = React.lazy(() => import('./pages/Dashboard/DashboardRestaurantFormPage'));

const PageLoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ot-charade"></div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoadingSpinner />;
  if (isAuthenticated) return <Navigate to="/" />;

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoadingSpinner />}>
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <MainPage />
          </ProtectedRoute>
        } />
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/search" element={
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        } />
        <Route path="/restaurant/:slug" element={
          <ProtectedRoute>
            <RestaurantDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/restaurant/:slug/book" element={
          <ProtectedRoute>
            <BookingPage />
          </ProtectedRoute>
        } />
        <Route path="/my-reservations" element={
          <ProtectedRoute>
            <MyReservationsPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <OwnerRoute>
            <DashboardOverviewPage />
          </OwnerRoute>
        } />
        <Route path="/dashboard/restaurants" element={
          <OwnerRoute>
            <DashboardRestaurantsPage />
          </OwnerRoute>
        } />
        <Route path="/dashboard/restaurants/new" element={
          <OwnerRoute>
            <DashboardRestaurantFormPage />
          </OwnerRoute>
        } />
        <Route path="/dashboard/restaurants/:id/edit" element={
          <OwnerRoute>
            <DashboardRestaurantFormPage />
          </OwnerRoute>
        } />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;
