import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import type { 
  FinanceEntry, 
  MonthStatus, 
  Company, 
  Category, 
  ViewFilter,
  MonthlyData,
  AggregatedData 
} from '@/types/finance';

const supabase = createClient(
  'https://udeavsfewakatewsphfw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZWF2c2Zld2FrYXRld3NwaGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTU2MzIsImV4cCI6MjA2OTI3MTYzMn0.7JuPSYEG-UoxvmYecVUgjWIAJ0PQYHeN2wiTnYp2NjY'
);

export const useFinanceData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthStatuses, setMonthStatuses] = useState<MonthStatus[]>([]);
  const [viewFilter, setViewFilter] = useState<ViewFilter>({
    mode: 'all',
    company: 'ORTI',
    year: new Date().getFullYear()
  });

  // Current date for determining consolidated vs projected
  const currentDate = useMemo(() => new Date(), []);
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Determine if a month is consolidated based on date and manual status
  const isMonthConsolidated = useCallback((year: number, month: number): boolean => {
    // Check manual status first
    const manualStatus = monthStatuses.find(ms => ms.year === year && ms.month === month);
    if (manualStatus?.isConsolidated) return true;

    // Otherwise, use date logic: past months are consolidated
    if (year < currentYear) return true;
    if (year === currentYear && month < currentMonth) return true;
    return false;
  }, [currentYear, currentMonth, monthStatuses]);

  // Load companies
  const loadCompanies = useCallback(async () => {
    try {
      // For now, create mock companies as we set up the structure
      const mockCompanies: Company[] = [
        { id: '1', name: 'ORTI', code: 'ORTI', description: 'ORTI Company', createdAt: new Date().toISOString() },
        { id: '2', name: 'INTUR', code: 'INTUR', description: 'INTUR Company', createdAt: new Date().toISOString() }
      ];
      setCompanies(mockCompanies);
      
      // Set default active company
      if (!activeCompany && mockCompanies.length > 0) {
        setActiveCompany(mockCompanies[0]);
        setViewFilter(prev => ({ ...prev, company: mockCompanies[0].code }));
      }
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  }, [activeCompany]);

  // Load financial data
  const loadFinanceData = useCallback(async () => {
    if (!activeCompany) return;

    setLoading(true);
    setError(null);

    try {
      // Load entries from Supabase
      const { data: supabaseEntries, error: queryError } = await supabase
        .from('entries')
        .select(`
          id, value, year, month, is_projection, notes,
          subcategories (
            id, name,
            categories (
              id, name, type_id
            )
          )
        `)
        .eq('year', viewFilter.year)
        .order('month', { ascending: true });

      if (queryError) throw queryError;

      // Transform Supabase data to our format
      const transformedEntries: FinanceEntry[] = (supabaseEntries || []).map(entry => ({
        id: entry.id,
        companyId: activeCompany.id,
        categoryId: entry.subcategories?.categories?.id || '',
        subcategoryId: entry.subcategories?.id,
        year: entry.year,
        month: entry.month,
        value: entry.value,
        isProjection: entry.is_projection || !isMonthConsolidated(entry.year, entry.month),
        notes: entry.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      setEntries(transformedEntries);

      // Load categories
      const categoriesData: Category[] = [];
      const categoryMap = new Map();

      supabaseEntries?.forEach(entry => {
        if (entry.subcategories?.categories) {
          const cat = entry.subcategories.categories;
          if (!categoryMap.has(cat.id)) {
            categoryMap.set(cat.id, {
              id: cat.id,
              name: cat.name,
              type: cat.type_id === 1 ? 'revenue' : 'expense',
              companyId: activeCompany.id
            });
          }
        }
      });

      setCategories(Array.from(categoryMap.values()));

    } catch (err: any) {
      setError(err.message);
      toast({
        title: "❌ Errore caricamento dati",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [activeCompany, viewFilter.year, isMonthConsolidated]);

  // Save or update entry
  const saveEntry = useCallback(async (entry: Partial<FinanceEntry>) => {
    if (!activeCompany) return;

    try {
      const isConsolidated = isMonthConsolidated(entry.year!, entry.month!);
      
      // If saving to a future month that's being manually consolidated
      if (!isConsolidated && entry.isManuallyConsolidated) {
        // Save month status
        const newStatus: MonthStatus = {
          year: entry.year!,
          month: entry.month!,
          isConsolidated: true,
          consolidatedAt: new Date().toISOString(),
          manuallyMarked: true
        };
        setMonthStatuses(prev => [...prev.filter(ms => 
          !(ms.year === entry.year && ms.month === entry.month)
        ), newStatus]);
      }

      // Update entries
      setEntries(prev => {
        const existing = prev.find(e => 
          e.categoryId === entry.categoryId && 
          e.month === entry.month && 
          e.year === entry.year
        );

        if (existing) {
          return prev.map(e => e.id === existing.id ? { ...e, ...entry } : e);
        } else {
          const newEntry: FinanceEntry = {
            id: Date.now().toString(),
            companyId: activeCompany.id,
            value: 0,
            isProjection: !isConsolidated,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...entry as FinanceEntry
          };
          return [...prev, newEntry];
        }
      });

      toast({
        title: "✅ Dati salvati",
        description: `Valore aggiornato per ${entry.month}/${entry.year}`
      });
    } catch (err: any) {
      toast({
        title: "❌ Errore salvataggio",
        description: err.message,
        variant: "destructive"
      });
    }
  }, [activeCompany, isMonthConsolidated]);

  // Mark month as consolidated
  const consolidateMonth = useCallback(async (year: number, month: number) => {
    const monthEntries = entries.filter(e => e.year === year && e.month === month);
    
    // Calculate deltas for entries that were projections
    const updatedEntries = monthEntries.map(entry => {
      if (entry.isProjection) {
        return {
          ...entry,
          isProjection: false,
          isManuallyConsolidated: true,
          previousProjectedValue: entry.value,
          consolidatedAt: new Date().toISOString()
        };
      }
      return entry;
    });

    // Update month status
    const newStatus: MonthStatus = {
      year,
      month,
      isConsolidated: true,
      consolidatedAt: new Date().toISOString(),
      manuallyMarked: true
    };

    setMonthStatuses(prev => [...prev.filter(ms => 
      !(ms.year === year && ms.month === month)
    ), newStatus]);

    setEntries(prev => {
      const otherEntries = prev.filter(e => !(e.year === year && e.month === month));
      return [...otherEntries, ...updatedEntries];
    });

    toast({
      title: "✅ Mese consolidato",
      description: `${month}/${year} è stato marcato come consolidato`
    });
  }, [entries]);

  // Calculate monthly data
  const monthlyData = useMemo((): MonthlyData[] => {
    const data: MonthlyData[] = [];
    
    for (let month = 1; month <= 12; month++) {
      const monthEntries = entries.filter(e => 
        e.year === viewFilter.year && 
        e.month === month
      );

      const consolidated = monthEntries.filter(e => !e.isProjection);
      const projections = monthEntries.filter(e => e.isProjection);

      const monthData: MonthlyData = {
        month,
        year: viewFilter.year,
        consolidated: {
          revenues: consolidated
            .filter(e => categories.find(c => c.id === e.categoryId)?.type === 'revenue')
            .reduce((sum, e) => sum + e.value, 0),
          expenses: consolidated
            .filter(e => categories.find(c => c.id === e.categoryId)?.type === 'expense')
            .reduce((sum, e) => sum + e.value, 0),
          hasData: consolidated.length > 0
        },
        projections: {
          revenues: projections
            .filter(e => categories.find(c => c.id === e.categoryId)?.type === 'revenue')
            .reduce((sum, e) => sum + e.value, 0),
          expenses: projections
            .filter(e => categories.find(c => c.id === e.categoryId)?.type === 'expense')
            .reduce((sum, e) => sum + e.value, 0),
          hasData: projections.length > 0
        }
      };

      // Calculate delta if we have both consolidated and previous projections
      const entriesWithDelta = monthEntries.filter(e => e.previousProjectedValue !== undefined);
      if (entriesWithDelta.length > 0) {
        monthData.delta = {
          revenues: entriesWithDelta
            .filter(e => categories.find(c => c.id === e.categoryId)?.type === 'revenue')
            .reduce((sum, e) => sum + (e.value - (e.previousProjectedValue || 0)), 0),
          expenses: entriesWithDelta
            .filter(e => categories.find(c => c.id === e.categoryId)?.type === 'expense')
            .reduce((sum, e) => sum + (e.value - (e.previousProjectedValue || 0)), 0)
        };
      }

      data.push(monthData);
    }

    return data;
  }, [entries, categories, viewFilter.year]);

  // Calculate aggregated data
  const aggregatedData = useMemo((): AggregatedData => {
    const result = entries.reduce((acc, entry) => {
      const category = categories.find(c => c.id === entry.categoryId);
      if (!category) return acc;

      const amount = entry.value;
      const isRevenue = category.type === 'revenue';

      if (isRevenue) {
        acc.totalRevenues += amount;
        if (entry.isProjection) {
          acc.projectedRevenues += amount;
        } else {
          acc.consolidatedRevenues += amount;
        }
      } else {
        acc.totalExpenses += amount;
        if (entry.isProjection) {
          acc.projectedExpenses += amount;
        } else {
          acc.consolidatedExpenses += amount;
        }
      }

      return acc;
    }, {
      totalRevenues: 0,
      totalExpenses: 0,
      consolidatedRevenues: 0,
      consolidatedExpenses: 0,
      projectedRevenues: 0,
      projectedExpenses: 0,
      difference: 0
    });

    result.difference = result.totalRevenues - result.totalExpenses;
    return result;
  }, [entries, categories]);

  // Filter entries based on view mode
  const filteredEntries = useMemo(() => {
    switch (viewFilter.mode) {
      case 'consolidated':
        return entries.filter(e => !e.isProjection);
      case 'projections':
        return entries.filter(e => e.isProjection);
      default:
        return entries;
    }
  }, [entries, viewFilter.mode]);

  // Initialize
  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    if (activeCompany) {
      loadFinanceData();
    }
  }, [activeCompany, loadFinanceData]);

  return {
    // State
    loading,
    error,
    companies,
    activeCompany,
    categories,
    entries: filteredEntries,
    monthlyData,
    aggregatedData,
    viewFilter,
    currentDate,
    monthStatuses,

    // Actions
    setActiveCompany,
    setViewFilter,
    saveEntry,
    consolidateMonth,
    refreshData: loadFinanceData
  };
};