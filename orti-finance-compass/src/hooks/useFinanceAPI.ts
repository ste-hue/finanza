import { useState, useEffect, useCallback } from 'react';

// Types matching the unified API
interface FinanceHierarchy {
  meta: {
    company: string;
    year: number;
    month?: number;
    generated: string;
  };
  totals: {
    revenue: number;
    expense: number;
    net_result: number;
  };
  categories: {
    revenue: Record<string, FinanceCategory>;
    expense: Record<string, FinanceCategory>;
  };
}

interface FinanceCategory {
  id: string;
  name: string;
  sort_order: number;
  is_total?: boolean;
  is_calculated?: boolean;
  subcategories: Record<string, FinanceSubcategory>;
  macro_total: number;
}

interface FinanceSubcategory {
  id: string;
  name: string;
  sort_order: number;
  entries: FinanceEntry[];
  total: number;
}

interface FinanceEntry {
  id: string;
  year: number;
  month: number;
  value: number;
  is_projection: boolean;
  notes?: string;
}

// Single hook for all finance operations
export const useFinanceAPI = (year: number = 2025, month?: number) => {
  const [data, setData] = useState<FinanceHierarchy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'http://localhost:8000';

  // Fetch hierarchy data
  const fetchHierarchy = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        year: year.toString(),
        force_refresh: forceRefresh.toString()
      });
      
      if (month) {
        params.append('month', month.toString());
      }

      const response = await fetch(`${API_BASE}/hierarchy?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching hierarchy:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  // Update single entry
  const updateEntry = useCallback(async (
    subcategoryId: string,
    entryYear: number,
    entryMonth: number,
    value: number,
    isProjection = false,
    notes?: string
  ) => {
    try {
      const response = await fetch(`${API_BASE}/entry`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subcategory_id: subcategoryId,
          year: entryYear,
          month: entryMonth,
          value,
          is_projection: isProjection,
          notes
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update entry: ${response.statusText}`);
      }

      // Refresh data after update
      await fetchHierarchy(true);
      
      return await response.json();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Update failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [fetchHierarchy]);

  // Import JSON data
  const importJsonData = useCallback(async (jsonData: Record<string, any>, merge = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: jsonData,
          merge
        })
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Refresh data after import
      await fetchHierarchy(true);
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Import failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [fetchHierarchy]);

  // Export current data as JSON
  const exportAsJson = useCallback(() => {
    if (!data) return null;
    
    // Convert current hierarchy back to import format
    const exportData = {
      meta: {
        version: "1.0",
        company: data.meta.company,
        year: data.meta.year,
        created: new Date().toISOString().split('T')[0],
        description: "Exported from ORTI Finance Dashboard"
      },
      categories: {}
    };

    // Convert categories back to JSON format
    (['revenue', 'expense'] as const).forEach(type => {
      exportData.categories[type] = {};
      
      Object.entries(data.categories[type]).forEach(([catId, category]) => {
        const catKey = category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        exportData.categories[type][catKey] = {
          name: category.name,
          sort_order: category.sort_order,
          subcategories: {}
        };

        Object.entries(category.subcategories).forEach(([subId, subcategory]) => {
          const subKey = subcategory.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          
          const monthlyData: Record<string, number> = {};
          subcategory.entries.forEach(entry => {
            const monthKey = `${entry.year}-${entry.month.toString().padStart(2, '0')}`;
            monthlyData[monthKey] = entry.value;
          });

          exportData.categories[type][catKey].subcategories[subKey] = {
            name: subcategory.name,
            sort_order: subcategory.sort_order,
            monthly_data: monthlyData
          };
        });
      });
    });

    return exportData;
  }, [data]);

  // Load data on mount or when params change
  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  // Helper functions for easy data access
  const getRevenueCategories = useCallback(() => {
    if (!data) return [];
    return Object.values(data.categories.revenue).sort((a, b) => a.sort_order - b.sort_order);
  }, [data]);

  const getExpenseCategories = useCallback(() => {
    if (!data) return [];
    return Object.values(data.categories.expense).sort((a, b) => a.sort_order - b.sort_order);
  }, [data]);

  const getTotals = useCallback(() => {
    return data?.totals || { revenue: 0, expense: 0, net_result: 0 };
  }, [data]);

  return {
    // Data
    data,
    revenueCategories: getRevenueCategories(),
    expenseCategories: getExpenseCategories(),
    totals: getTotals(),
    
    // State
    loading,
    error,
    
    // Actions
    updateEntry,
    importJsonData,
    exportAsJson,
    refresh: () => fetchHierarchy(true),
    clearError: () => setError(null)
  };
}; 