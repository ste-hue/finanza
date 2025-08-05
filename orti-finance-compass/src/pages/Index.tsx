import React, { useState } from 'react';
import { CollapsibleFinanceDashboard } from '@/components/CollapsibleFinanceDashboard';
import { ConsolidationPage } from '@/pages/ConsolidationPage';
import { AdminPage } from '@/pages/AdminPage';
import { Navigation } from '@/components/Navigation';

const Index = () => {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'consolidation' | 'admin'>('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('ORTI');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <CollapsibleFinanceDashboard selectedCompany={selectedCompany} onCompanyChange={setSelectedCompany} />;
      case 'consolidation':
        return <ConsolidationPage selectedCompany={selectedCompany} onCompanyChange={setSelectedCompany} />;
      case 'admin':
        return <AdminPage selectedCompany={selectedCompany} onCompanyChange={setSelectedCompany} />;
      default:
        return <CollapsibleFinanceDashboard selectedCompany={selectedCompany} onCompanyChange={setSelectedCompany} />;
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
        selectedCompany={selectedCompany}
        onCompanyChange={setSelectedCompany}
      />
      
      <main>
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default Index;
