import React, { useState, useMemo } from 'react';
import { useFinCalSupabase } from '@/hooks/useFinCalSupabase';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';

export const SimplifiedDashboard: React.FC = () => {
  const { 
    activeCompany, 
    loading, 
    hierarchicalCategories,
  } = useFinCalSupabase();
  
  const [selectedYear, setSelectedYear] = useState(2025);
  const [showDetails, setShowDetails] = useState(false);

  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

  // 📊 Calculate Simple Monthly Totals
  const monthlyTotals = useMemo(() => {
    if (!hierarchicalCategories || hierarchicalCategories.length === 0) return {};
    
    const totals: Record<number, { revenues: number; expenses: number; balance: number }> = {};
    
    for (let month = 1; month <= 12; month++) {
      totals[month] = { revenues: 0, expenses: 0, balance: 0 };
    }

    // Calculate totals from hierarchicalCategories
    hierarchicalCategories.forEach(category => {
      for (let month = 1; month <= 12; month++) {
        const monthKey = `${selectedYear}-${month}`;
        const categoryTotal = Math.abs(category.monthlyTotals[monthKey] || 0);
        
        if (category.type_id === 'revenue') {
          totals[month].revenues += categoryTotal;
        } else if (category.type_id === 'expense') {
          totals[month].expenses += categoryTotal;
        } else if (category.type_id === 'balance') {
          totals[month].balance += categoryTotal;
        }
      }
    });

    return totals;
  }, [hierarchicalCategories, selectedYear]);

  // 📈 Calculate Year Totals
  const yearTotals = useMemo(() => {
    const totals = { revenues: 0, expenses: 0, balance: 0, difference: 0, cashFlow: 0 };
    
    Object.values(monthlyTotals).forEach((month: any) => {
      totals.revenues += month.revenues || 0;
      totals.expenses += month.expenses || 0;
      totals.balance += month.balance || 0;
    });
    
    totals.difference = totals.revenues - totals.expenses;
    totals.cashFlow = totals.difference + totals.balance;
    
    return totals;
  }, [monthlyTotals]);

  // 💰 Format Currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // 🔄 Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-6 animate-zen-breathe"></div>
          <h2 className="text-2xl font-zen-jp font-light mb-4">Caricamento...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 🎯 Header con Anno */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-zen-jp font-light text-primary">
            Dashboard Finanziario
          </h1>
          <p className="text-muted-foreground font-light mt-2">
            Panoramica semplificata • {activeCompany?.name || 'ORTI'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedYear(selectedYear - 1)}
            className="zen-button"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xl font-zen-jp font-medium min-w-[80px] text-center">
            {selectedYear}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedYear(selectedYear + 1)}
            className="zen-button"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 📊 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="zen-card p-6 text-center">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Entrate Totali</h3>
          <p className="text-2xl font-zen-jp font-light text-green-600">
            {formatCurrency(yearTotals.revenues)}
          </p>
        </div>
        
        <div className="zen-card p-6 text-center">
          <div className="text-3xl mb-2">💸</div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Uscite Totali</h3>
          <p className="text-2xl font-zen-jp font-light text-red-500">
            {formatCurrency(yearTotals.expenses)}
          </p>
        </div>
        
        <div className="zen-card p-6 text-center">
          <div className="text-3xl mb-2">⚖️</div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Risultato Netto</h3>
          <p className={`text-2xl font-zen-jp font-light ${yearTotals.difference >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatCurrency(yearTotals.difference)}
          </p>
        </div>
        
        <div className="zen-card p-6 text-center">
          <div className="text-3xl mb-2">🏦</div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Cash Flow</h3>
          <p className={`text-2xl font-zen-jp font-light ${yearTotals.cashFlow >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatCurrency(yearTotals.cashFlow)}
          </p>
        </div>
      </div>

      {/* 🎛️ Toggle Details */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setShowDetails(!showDetails)}
          className="zen-button"
        >
          {showDetails ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRightIcon className="h-4 w-4 mr-2" />}
          {showDetails ? 'Nascondi Dettagli' : 'Mostra Dettagli Mensili'}
        </Button>
      </div>

      {/* 📈 Monthly Details Table (Opzionale) */}
      {showDetails && (
        <div className="zen-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="text-left p-4 font-zen-jp font-medium">Categoria</th>
                  {months.map((month, index) => (
                    <th key={index} className="text-center p-4 font-zen-jp font-medium min-w-[100px]">
                      {month}
                    </th>
                  ))}
                  <th className="text-center p-4 font-zen-jp font-medium min-w-[120px]">Totale</th>
                </tr>
              </thead>
              <tbody>
                {/* Entrate Row */}
                <tr className="border-b border-border/30 bg-green-50/30">
                  <td className="p-4 font-zen-jp font-medium text-green-700">
                    💰 Entrate
                  </td>
                  {months.map((_, monthIndex) => {
                    const monthData = monthlyTotals[monthIndex + 1] || { revenues: 0 };
                    return (
                      <td key={monthIndex} className="p-4 text-center font-zen-jp">
                        <span className="text-green-600">
                          {formatCurrency(monthData.revenues)}
                        </span>
                      </td>
                    );
                  })}
                  <td className="p-4 text-center font-zen-jp font-medium">
                    <span className="text-green-600">
                      {formatCurrency(yearTotals.revenues)}
                    </span>
                  </td>
                </tr>

                {/* Uscite Row */}
                <tr className="border-b border-border/30 bg-red-50/30">
                  <td className="p-4 font-zen-jp font-medium text-red-700">
                    💸 Uscite
                  </td>
                  {months.map((_, monthIndex) => {
                    const monthData = monthlyTotals[monthIndex + 1] || { expenses: 0 };
                    return (
                      <td key={monthIndex} className="p-4 text-center font-zen-jp">
                        <span className="text-red-500">
                          {monthData.expenses > 0 ? `-${formatCurrency(monthData.expenses)}` : '−'}
                        </span>
                      </td>
                    );
                  })}
                  <td className="p-4 text-center font-zen-jp font-medium">
                    <span className="text-red-500">
                      -{formatCurrency(yearTotals.expenses)}
                    </span>
                  </td>
                </tr>

                {/* Differenza Row */}
                <tr className="border-b-2 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
                  <td className="p-4 font-zen-jp font-medium text-primary">
                    ⚖️ Differenza
                  </td>
                  {months.map((_, monthIndex) => {
                    const monthData = monthlyTotals[monthIndex + 1] || { revenues: 0, expenses: 0 };
                    const difference = monthData.revenues - monthData.expenses;
                    return (
                      <td key={monthIndex} className="p-4 text-center font-zen-jp font-medium">
                        <div className={`flex items-center justify-center space-x-1 ${difference >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          <span>{formatCurrency(difference)}</span>
                          {Math.abs(difference) > 0 && (difference >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />)}
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-4 text-center font-zen-jp font-bold">
                    <div className={`flex items-center justify-center space-x-1 ${yearTotals.difference >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      <span>{formatCurrency(yearTotals.difference)}</span>
                      {yearTotals.difference >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};