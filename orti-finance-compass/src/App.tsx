import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthComponent from "./components/AuthComponent";
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

// Protected App Component
const ProtectedApp = () => {
  const { user, loading } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  // Check system theme preference
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Show loading spinner during auth check
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-32 w-32 border-b-2 ${
            darkMode ? 'border-blue-400' : 'border-blue-600'
          } mx-auto mb-4`}></div>
          <h2 className={`text-xl font-semibold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Caricamento ORTI Finance...
          </h2>
          <p className={`text-sm mt-2 ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Verifica dell'autenticazione in corso
          </p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <AuthComponent darkMode={darkMode} />;
  }

  // Show main app if authenticated
  return (
    <BrowserRouter basename={import.meta.env.VITE_GITHUB_PAGES ? '/finanza' : ''}>
      <Routes>
        <Route path="/" element={<Index />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ProtectedApp />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
