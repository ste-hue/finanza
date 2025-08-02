import React, { useState } from 'react';
import { CollapsibleFinanceDashboard } from '@/components/CollapsibleFinanceDashboard';
import { ConsolidationPage } from '@/pages/ConsolidationPage';
import { AdminPage } from '@/pages/AdminPage';
import { Navigation } from '@/components/Navigation';

const Index = () => {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'consolidation' | 'admin'>('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <CollapsibleFinanceDashboard />;
      case 'consolidation':
        return <ConsolidationPage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <CollapsibleFinanceDashboard />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <Navigation 
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        darkMode={darkMode}
      />
      
      <main>
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default Index;
