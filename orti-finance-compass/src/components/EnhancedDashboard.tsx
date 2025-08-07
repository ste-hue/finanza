import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface MonthData {
  year: number;
  month: number;
  revenues: number;
  expenses: number;
  balance: number;
  cashFlow: number;
  projectedBalance: number;
  isForecast: boolean;
  isConsolidated: boolean;
  categories?: {
    revenues: CategoryDetail[];
    expenses: CategoryDetail[];
    balances: CategoryDetail[];
  };
}

interface CategoryDetail {
  name: string;
  value: number;
  subcategories?: { name: string; value: number }[];
}

const EnhancedDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(2025);
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data with joins
      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          type_id,
          subcategories (
            id,
            name
          )
        `)
        .order('sort_order');
      
      if (catError) throw catError;

      // Load forecasts
      const { data: forecastsData, error: forecastError } = await supabase
        .from('forecasts')
        .select(`
          *,
          subcategories (
            id,
            name,
            categories (
              id,
              name,
              type_id
            )
          )
        `)
        .eq('year', year);
      
      if (forecastError) throw forecastError;

      // Load actuals
      const { data: actualsData, error: actualsError } = await supabase
        .from('actuals')
        .select(`
          *,
          subcategories (
            id,
            name,
            categories (
              id,
              name,
              type_id
            )
          )
        `)
        .eq('year', year);
      
      if (actualsError) throw actualsError;

      // Process monthly data
      const months = Array.from({ length: 12 }, (_, i) => i + 1);
      let runningBalance = 820416.91; // Saldo iniziale luglio
      
      const monthlyResults: MonthData[] = months.map(month => {
        const monthActuals = actualsData?.filter(a => a.month === month) || [];
        const monthForecasts = forecastsData?.filter(f => f.month === month) || [];
        
        const hasActuals = monthActuals.length > 0;
        const dataToUse = hasActuals ? monthActuals : monthForecasts;

        // Group by category type
        const revenueData: any[] = [];
        const expenseData: any[] = [];
        const balanceData: any[] = [];
        
        let revenues = 0;
        let expenses = 0;
        let balance = 0;

        // Process each entry
        dataToUse.forEach(entry => {
          const category = entry.subcategories?.categories;
          if (!category) return;

          const value = Number(entry.value);
          
          if (category.type_id === 'revenue') {
            revenues += value;
            revenueData.push({
              category: category.name,
              subcategory: entry.subcategories.name,
              value
            });
          } else if (category.type_id === 'expense') {
            expenses += value;
            expenseData.push({
              category: category.name,
              subcategory: entry.subcategories.name,
              value
            });
          } else if (category.type_id === 'balance') {
            balance += value;
            balanceData.push({
              category: category.name,
              subcategory: entry.subcategories.name,
              value
            });
          }
        });

        // Calculate projected balance
        const cashFlow = revenues - expenses;
        const projectedBalance = month === 7 ? runningBalance : runningBalance + cashFlow;
        
        // Update running balance for next month
        if (month >= 8) {
          runningBalance = projectedBalance;
        }

        return {
          year,
          month,
          revenues,
          expenses,
          balance: hasActuals ? balance : 0,
          cashFlow,
          projectedBalance: month >= 8 ? projectedBalance : balance,
          isForecast: !hasActuals,
          isConsolidated: hasActuals,
          categories: {
            revenues: groupByCategory(revenueData),
            expenses: groupByCategory(expenseData),
            balances: groupByCategory(balanceData)
          }
        };
      });

      setMonthlyData(monthlyResults);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const groupByCategory = (data: any[]): CategoryDetail[] => {
    const grouped = data.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          name: item.category,
          value: 0,
          subcategories: []
        };
      }
      acc[item.category].value += item.value;
      acc[item.category].subcategories.push({
        name: item.subcategory,
        value: item.value
      });
      return acc;
    }, {});
    
    return Object.values(grouped);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getMonthName = (month: number) => {
    return new Date(2025, month - 1).toLocaleString('it-IT', { month: 'short' }).toUpperCase();
  };

  const getMonthStatus = (month: number): string => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return monthlyData[month - 1]?.isConsolidated ? 'C' : 'A';
    } else if (year === currentYear && month === currentMonth) {
      return 'A';
    }
    return 'P';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dati...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg">
          <h3 className="font-bold mb-2">Errore</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🏨 ORTI Finance Dashboard</h1>
              <p className="text-gray-600 mt-1">Sistema di gestione finanziaria</p>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={year} 
                onChange={(e) => setYear(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
              <button 
                onClick={loadData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                🔄 Aggiorna
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Totale Entrate</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(monthlyData.reduce((sum, m) => sum + m.revenues, 0))}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Totale Uscite</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(monthlyData.reduce((sum, m) => sum + m.expenses, 0))}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Cash Flow Totale</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(monthlyData.reduce((sum, m) => sum + m.cashFlow, 0))}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Saldo Previsto Fine Anno</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(monthlyData[11]?.projectedBalance || 0)}
            </p>
          </div>
        </div>

        {/* Monthly Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Riepilogo Mensile {year}</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mese
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entrate
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uscite
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cash Flow
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo Banche
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyData.map((month) => (
                  <React.Fragment key={month.month}>
                    <tr 
                      className={`${month.isConsolidated ? 'bg-green-50' : ''} hover:bg-gray-50 cursor-pointer`}
                      onClick={() => setExpandedMonth(expandedMonth === month.month ? null : month.month)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getMonthName(month.month)} 
                        <span className="ml-2 text-xs text-gray-500">
                          [{getMonthStatus(month.month)}]
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                        {formatCurrency(month.revenues)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        {formatCurrency(month.expenses)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                        month.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(month.cashFlow)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600">
                        {formatCurrency(month.month <= 7 ? month.balance : month.projectedBalance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {month.isConsolidated ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Consolidato
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Previsione
                          </span>
                        )}
                      </td>
                    </tr>
                    
                    {/* Expanded Details */}
                    {expandedMonth === month.month && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-3 gap-4">
                            {/* Revenues */}
                            <div>
                              <h4 className="font-semibold text-green-600 mb-2">Entrate</h4>
                              {month.categories?.revenues.map((cat, idx) => (
                                <div key={idx} className="mb-2">
                                  <div className="font-medium">{cat.name}: {formatCurrency(cat.value)}</div>
                                  {cat.subcategories?.map((sub, subIdx) => (
                                    <div key={subIdx} className="ml-4 text-sm text-gray-600">
                                      {sub.name}: {formatCurrency(sub.value)}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                            
                            {/* Expenses */}
                            <div>
                              <h4 className="font-semibold text-red-600 mb-2">Uscite</h4>
                              {month.categories?.expenses.map((cat, idx) => (
                                <div key={idx} className="mb-2">
                                  <div className="font-medium">{cat.name}: {formatCurrency(cat.value)}</div>
                                  {cat.subcategories?.map((sub, subIdx) => (
                                    <div key={subIdx} className="ml-4 text-sm text-gray-600">
                                      {sub.name}: {formatCurrency(sub.value)}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                            
                            {/* Balances */}
                            <div>
                              <h4 className="font-semibold text-purple-600 mb-2">Saldi Bancari</h4>
                              {month.categories?.balances.map((cat, idx) => (
                                <div key={idx} className="mb-2">
                                  <div className="font-medium">{cat.name}: {formatCurrency(cat.value)}</div>
                                  {cat.subcategories?.map((sub, subIdx) => (
                                    <div key={subIdx} className="ml-4 text-sm text-gray-600">
                                      {sub.name}: {formatCurrency(sub.value)}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">TOTALE</td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-green-600">
                    {formatCurrency(monthlyData.reduce((sum, m) => sum + m.revenues, 0))}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-red-600">
                    {formatCurrency(monthlyData.reduce((sum, m) => sum + m.expenses, 0))}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-blue-600">
                    {formatCurrency(monthlyData.reduce((sum, m) => sum + m.cashFlow, 0))}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-purple-600">
                    {formatCurrency(monthlyData[11]?.projectedBalance || 0)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Legenda</h3>
          <div className="flex gap-6 text-sm">
            <div><span className="font-medium">[C]</span> = Consolidato (mese chiuso)</div>
            <div><span className="font-medium">[A]</span> = Attuale (mese in corso)</div>
            <div><span className="font-medium">[P]</span> = Previsionale (mese futuro)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;