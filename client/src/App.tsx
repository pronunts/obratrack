// ============================================================
// ObraTrack — App.tsx v2 (Multi-Proyecto + IndexedDB)
// Design: Blueprint Engineering
// ============================================================

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/NotFound';
import { Route, Switch, useLocation } from 'wouter';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LayoutShell } from './components/LayoutShell';
import { PostHogProvider } from './components/PostHogProvider';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ProyectosDashboard from './pages/ProyectosDashboard';
import Presupuesto from './pages/Presupuesto';
import Ejecucion from './pages/Ejecucion';
import Costos from './pages/Costos';
import Dashboard from './pages/Dashboard';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';

function ProtectedRoute({ component: Component }: { component: React.ElementType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route>
        <LayoutShell>
          <Switch>
            <Route path="/app" component={() => <ProtectedRoute component={ProyectosDashboard} />} />
            <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
            <Route path="/presupuesto" component={() => <ProtectedRoute component={Presupuesto} />} />
            <Route path="/ejecucion" component={() => <ProtectedRoute component={Ejecucion} />} />
            <Route path="/costos" component={() => <ProtectedRoute component={Costos} />} />
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </LayoutShell>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <PostHogProvider>
        <ThemeProvider defaultTheme="light" switchable>
          <AuthProvider>
            <AppProvider>
              <TooltipProvider>
                <Toaster richColors position="top-center" />
                <Router />
                <PWAUpdatePrompt />
              </TooltipProvider>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </PostHogProvider>
    </ErrorBoundary>
  );
}

export default App;
