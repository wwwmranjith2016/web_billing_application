import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Dashboard from './components/dashboard/Dashboard';
import BillingScreen from './components/billing/BillingScreen';
import ReturnScreen from './components/returns/ReturnScreen';
import ProductList from './components/products/ProductList';
import BillsHistory from './components/bills/BillsHistory';
import Reports from './components/reports/Reports';
import PrinterSettings from './components/settings/PrinterSettings';
import SetupMenu from './components/settings/SetupMenu';
import LoginScreen from './components/auth/LoginScreen';
import UserProfile from './components/auth/UserProfile';
import UserManagement from './components/auth/UserManagement';
import LandingPage from './components/auth/LandingPage';
import { ToastProvider } from './components/common/ToastContext';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      
      // If no user or token, definitely not authenticated
      if (!user || !token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      // Try to validate the token with the backend
      try {
        const response = await (window as any).electron.auth.getCurrentUser();
        if (response.success) {
          setIsAuthenticated(true);
        } else {
          // Token is invalid or expired
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      } catch (error) {
        // If validation fails, clear the invalid tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check authentication status on app load
    checkAuthStatus();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'billing':
        return <BillingScreen />;
      case 'returns':
        return <ReturnScreen />;
      case 'products':
        return <ProductList />;
      case 'bills':
        return <BillsHistory />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <PrinterSettings />;
      case 'setup':
        return <SetupMenu />;
      case 'users':
        return <UserManagement />;
      case 'profile':
        return <UserProfile onLogout={handleLogout} />;
      default:
        return <Dashboard />;
    }
  };

  if (isLoading) {
    return (
      <ToastProvider>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading application...</p>
          </div>
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginScreen onLoginSuccess={handleLoginSuccess} />} />
          <Route
            path="/app/*"
            element={
              isAuthenticated ? (
                <div className="min-h-screen bg-gray-100 flex flex-col">
                  <Navbar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} />
                  <main className="flex-1 overflow-auto">
                    <div className="p-4 md:p-6 lg:p-8">
                      <div className="max-w-7xl mx-auto h-full">
                        {renderPage()}
                      </div>
                    </div>
                  </main>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;