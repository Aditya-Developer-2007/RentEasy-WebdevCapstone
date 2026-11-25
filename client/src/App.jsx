import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ShortlistProvider } from './context/ShortlistContext';
import { ToastProvider } from './context/ToastContext';
import AdminDashboardPage from './pages/AdminDashboardPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import RegisterPage from './pages/RegisterPage';
import TenantDashboardPage from './pages/TenantDashboardPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

export default function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ToastProvider>
        <AuthProvider>
          <ShortlistProvider>
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/properties/:id" element={<PropertyDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              <Route
                path="/dashboard/tenant"
                element={
                  <ProtectedRoute allowedRoles={['tenant']}>
                    <TenantDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/owner"
                element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ShortlistProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
