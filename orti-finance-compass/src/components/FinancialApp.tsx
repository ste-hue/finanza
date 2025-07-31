import React, { useState } from 'react';
import { useFinCalSupabase } from '@/hooks/useFinCalSupabase';
import { ZenFinancialDashboard } from './ZenFinancialDashboard';
import RealtimeEntryDemo from './RealtimeEntryDemo';

export const FinancialApp: React.FC = () => {
  const { activeCompany, loading } = useFinCalSupabase();
  const [showRealtimeDemo, setShowRealtimeDemo] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10 flex items-center justify-center">
        <div className="zen-card p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-6 animate-zen-breathe"></div>
          <h2 className="text-2xl font-zen-jp font-light mb-4">Caricamento</h2>
          <p className="text-muted-foreground font-light">Connessione in corso...</p>
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-20 zen-fade-in">
            <div className="mb-8">
              <h1 className="text-5xl font-zen-jp font-light mb-4 text-foreground">
                ORTI Finance
              </h1>
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6"></div>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                Sistema di pianificazione finanziaria<br />
                <span className="text-base">Dashboard Previsto vs Reale</span>
              </p>
            </div>
            
            <div className="zen-card p-8 max-w-md mx-auto">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-4 animate-zen-breathe"></div>
                <h3 className="text-xl font-zen-jp font-medium mb-2">Sistema Inizializzato</h3>
                <p className="text-sm text-muted-foreground font-light">
                  ORTI Company configurata automaticamente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5">
      {/* Zen Header */}
      <div className="border-b border-border/50 backdrop-blur-sm bg-card/80">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="zen-fade-in">
                <h1 className="text-3xl font-zen-jp font-light text-primary">
                  ORTI Finance
                </h1>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="zen-slide-up">
                <div className="px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="text-sm font-medium text-primary">{activeCompany.name}</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground font-light zen-fade-in">
              {new Date().toLocaleDateString('it-IT', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'short'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* 🚀 Real-time Demo Toggle */}
        <div className="mb-6 flex items-center justify-center">
          <button
            onClick={() => setShowRealtimeDemo(!showRealtimeDemo)}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              showRealtimeDemo 
                ? 'bg-blue-600 text-white shadow-lg scale-105' 
                : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
            }`}
          >
            {showRealtimeDemo ? '🔍 Dashboard Standard' : '⚡ Real-time CRUD Demo'}
          </button>
        </div>

        {/* Conditional Content */}
        {showRealtimeDemo ? (
          <RealtimeEntryDemo />
        ) : (
          <ZenFinancialDashboard />
        )}
      </div>
    </div>
  );
}; 