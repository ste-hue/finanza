import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { MonthData, CategoryData, Category, Subcategory, Forecast, Actual } from '@/lib/database';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(2025);
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [actuals, setActuals] = useState<Actual[]>([]);

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load categories with subcategories
      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select(`
          *,
          subcategories (
            id,
            name,
            category_id
          )
        `);
      
      if (catError) {
        console.error('Error loading categories:', catError);
        throw catError;
      }

      // Load forecasts for the year
      const { data: forecastsData, error: forecastError } = await supabase
        .from('forecasts')
        .select('*')
        .eq('year', year);
      
      if (forecastError) throw forecastError;

      // Load actuals for the year
      const { data: actualsData, error: actualsError } = await supabase
        .from('actuals')
        .select('*')
        .eq('year', year);
      
      if (actualsError) throw actualsError;

      console.log('Categories:', categoriesData);
      console.log('Forecasts:', forecastsData);
      console.log('Actuals:', actualsData);

      setCategories(categoriesData || []);
      setForecasts(forecastsData || []);
      setActuals(actualsData || []);

      // Calculate monthly data
      const months = Array.from({ length: 12 }, (_, i) => i + 1);
      const monthlyResults: MonthData[] = months.map(month => {
        // Get all actuals for this month
        const monthActuals = actualsData?.filter(a => a.month === month) || [];
        const monthForecasts = forecastsData?.filter(f => f.month === month) || [];
        
        // Use actuals if available, otherwise use forecasts
        const hasActuals = monthActuals.length > 0;
        const dataToUse = hasActuals ? monthActuals : monthForecasts;

        // Calculate totals by category type
        let revenues = 0;
        let expenses = 0;
        let balance = 0;

        dataToUse.forEach(entry => {
          // Find the category for this entry
          const category = categoriesData?.find(cat => 
            cat.subcategories?.some((sub: any) => sub.id === entry.subcategory_id)
          );

          if (category) {
            if (category.type_id === 'revenue') {
              revenues += Number(entry.value);
            } else if (category.type_id === 'expense') {
              expenses += Number(entry.value);
            } else if (category.type_id === 'balance') {
              balance += Number(entry.value);
            }
          }
        });

        return {
          year,
          month,
          revenues,
          expenses,
          balance,
          cashFlow: revenues - expenses,
          isForecast: !hasActuals,
          isConsolidated: hasActuals
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const getMonthName = (month: number) => {
    return new Date(2025, month - 1).toLocaleString('it-IT', { month: 'short' }).toUpperCase();
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
            <h1 className="text-3xl font-bold text-gray-900">ORTI Finance Dashboard</h1>
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
                Aggiorna
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Overview */}
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
                  <tr key={month.month} className={month.isConsolidated ? 'bg-green-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getMonthName(month.month)}
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
                      {formatCurrency(month.balance)}
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
                    {formatCurrency(monthlyData[monthlyData.length - 1]?.balance || 0)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;