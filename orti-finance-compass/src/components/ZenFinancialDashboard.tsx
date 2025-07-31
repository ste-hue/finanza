import React, { useState, useMemo, useEffect } from 'react';
import { useFinCalSupabase } from '@/hooks/useFinCalSupabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ChevronDown, ChevronRight as ChevronRightIcon, RotateCcw, Expand, Minimize2, Brain } from 'lucide-react';
import { FinanceAPI } from '@/lib/financeApi';
import { EntryEditDialog } from './EntryEditDialog';
import { AIAnalysisPanel } from './AIAnalysisPanel';
import { HierarchicalCategory, HierarchicalSubcategory, ProcessedEntry } from '@/lib/hierarchyMiddleware';


export const ZenFinancialDashboard: React.FC = () => {
  // 🏢 Company & Loading States - USING NEW 3-LEVEL HIERARCHY
  const { 
    activeCompany, 
    loading, 
    error, 
    clearError, 
    hierarchicalCategories,
    getMonthlyTotals,
    updateEntry
  } = useFinCalSupabase();
  
  // 🍞 Toast notifications
  const { toast } = useToast();
  
  // 📊 Dashboard States
  const [selectedYear, setSelectedYear] = useState(2025);
  const [financialData, setFinancialData] = useState<any>(null);
  const [hierarchicalData, setHierarchicalData] = useState<{
    revenue: HierarchicalCategory[];
    expense: HierarchicalCategory[];
    balance: HierarchicalCategory[];
  }>({ revenue: [], expense: [], balance: [] });
  // 💾 Initialize COMPLETELY COLLAPSED - No expanded categories by default
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('finanza-expanded-categories');
      return saved ? new Set(JSON.parse(saved)) : new Set(); // TUTTO COLLASSATO
    } catch {
      return new Set();
    }
  });
  const [apiLoading, setApiLoading] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  
  // 📝 Entry Edit Dialog State
  const [editDialog, setEditDialog] = useState({
    isOpen: false,
    categoryName: '',
    monthIndex: 1,
    year: 2025
  });
  
  // 💾 Save loading state
  const [isSaving, setIsSaving] = useState(false);

  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

  // 💾 Save expanded state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('finanza-expanded-categories', JSON.stringify([...expandedCategories]));
    } catch (error) {
      console.warn('Failed to save expanded categories to localStorage:', error);
    }
  }, [expandedCategories]);

  // 🔄 Process Hierarchical Data from Hook
  useEffect(() => {
    if (!hierarchicalCategories || hierarchicalCategories.length === 0) return;

    console.log('🔄 Processing hierarchical data:', hierarchicalCategories.length, 'categories');
    setApiLoading(true);
    
    try {
      // Group categories by type using the new 3-level hierarchy
      const hierarchicalRevenue = hierarchicalCategories.filter(cat => cat.type_id === 'revenue');
      const hierarchicalExpense = hierarchicalCategories.filter(cat => cat.type_id === 'expense');
      const hierarchicalBalance = hierarchicalCategories.filter(cat => cat.type_id === 'balance');
      
      setHierarchicalData({
        revenue: hierarchicalRevenue,
        expense: hierarchicalExpense,
        balance: hierarchicalBalance
      });
      
      // Create a mock financialData for compatibility with existing UI
      const allEntries = hierarchicalCategories.flatMap(cat => cat.entries);
      setFinancialData({
        entries: allEntries,
        allCategories: hierarchicalCategories
      });
      
      // 🚀 Auto-espandi solo se è la prima volta (localStorage vuoto)
      if (expandedCategories.size === 0) {
        const defaultExpanded = new Set<string>();
        
        // Solo le super-categorie di default, NON le categorie individuali
        defaultExpanded.add('super_revenue');
        defaultExpanded.add('super_expense');
        defaultExpanded.add('super_bank_total');
        
        setExpandedCategories(defaultExpanded);
      }
      
      console.log('✅ NEW Hierarchical data processed successfully');
      
    } catch (error) {
      console.error('❌ Error processing hierarchical data:', error);
    } finally {
      setApiLoading(false);
    }
  }, [hierarchicalCategories, selectedYear]);

  // 📊 Calculate Monthly Totals - FIXED to use hierarchicalCategories
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

  // 🎛️ Category Controls
  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const expandAllCategories = () => {
    const allCategories = new Set<string>();
    
    // Aggiungi super-categorie
    allCategories.add('super_revenue');
    allCategories.add('super_expense');
    allCategories.add('super_bank_total');
    
    // Aggiungi tutte le categorie normali
    [...hierarchicalData.revenue, ...hierarchicalData.expense, ...hierarchicalData.balance].forEach(cat => {
      allCategories.add(cat.name);
      cat.subcategories?.forEach(child => allCategories.add(child.name));
    });
    setExpandedCategories(allCategories);
  };

  const collapseAllCategories = () => setExpandedCategories(new Set());

  // 📝 Dialog Functions
  const openEditDialog = (categoryName: string, monthIndex: number) => {
    setEditDialog({ isOpen: true, categoryName, monthIndex, year: selectedYear });
  };

  const closeEditDialog = () => {
    setEditDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleSaveEntry = async (value: number, isProjection: boolean, notes: string) => {
    if (isSaving) return; // Prevent double-click
    
    try {
      setIsSaving(true);
      
      console.log('💾 Saving entry:', {
        category: editDialog.categoryName,
        month: editDialog.monthIndex,
        year: editDialog.year,
        value,
        isProjection,
        notes
      });

      // Remove unused variables since we're using direct subcategory approach
      
      // 🚀 SIMPLIFIED: Find subcategory ID directly from hierarchical data
      console.log('🔍 SIMPLIFIED - Looking for category:', editDialog.categoryName);
      
      // 🔍 DEBUG: Log hierarchicalCategories structure
      console.log('🔍 DEBUG hierarchicalCategories:', {
        total: hierarchicalCategories.length,
        categories: hierarchicalCategories.map(cat => ({
          name: cat.name,
          id: cat.id,
          subcategories: cat.subcategories?.map(sub => ({ name: sub.name, id: sub.id })) || []
        })),
        searching: editDialog.categoryName
      });
      
      let subcategoryId: string | null = null;
      
      for (const category of hierarchicalCategories) {
        if (category.name === editDialog.categoryName) {
          // Found the main category, get its "Main" subcategory
          const mainSubcategory = category.subcategories?.find(sub => sub.name === 'Main');
          if (mainSubcategory) {
            subcategoryId = mainSubcategory.id;
            console.log('✅ Found Main subcategory for', category.name, 'ID:', subcategoryId);
            break;
          }
        }
        
        // Also check if it's a subcategory name
        if (category.subcategories) {
          for (const subcategory of category.subcategories) {
            if (subcategory.name === editDialog.categoryName) {
              subcategoryId = subcategory.id;
              console.log('✅ Found specific subcategory:', subcategory.name, 'ID:', subcategoryId);
              break;
            }
          }
        }
        
        if (subcategoryId) break;
      }

      if (!subcategoryId) {
        console.error('❌ Subcategory non trovata per:', editDialog.categoryName);
        throw new Error(`Subcategory per "${editDialog.categoryName}" non trovata`);
      }

      // 🚀 SIMPLIFIED: Direct API call to /entry endpoint
      console.log('🔄 Direct API call with subcategoryId:', subcategoryId);
      
      const response = await fetch('http://localhost:8000/entry', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subcategory_id: subcategoryId,
          year: editDialog.year,
          month: editDialog.monthIndex,
          value: value,
          is_projection: isProjection,
          notes: notes || `Updated via dashboard - ${new Date().toLocaleString()}`
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Entry saved successfully:', result);
      
      // Refresh data immediately
      console.log('🔄 Refreshing data after save...');
      await loadData();
      
      // Show success toast
      toast({
        title: "✅ Valore salvato",
        description: `${editDialog.categoryName} - ${months[editDialog.monthIndex - 1]} ${editDialog.year}: €${value.toLocaleString('it-IT')}`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('❌ Error saving entry:', error);
      
      // Show error toast  
      toast({
        title: "❌ Errore nel salvataggio",
        description: error instanceof Error ? error.message : 'Errore sconosciuto durante il salvataggio',
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 🎨 Render Super Category (ENTRATE/USCITE)
  const renderSuperCategory = (title: string, emoji: string, categories: HierarchicalCategory[], typeId: 'revenue' | 'expense'): React.ReactElement[] => {
    const superCategoryKey = `super_${typeId}`;
    const isExpanded = expandedCategories.has(superCategoryKey);
    const colorClass = typeId === 'revenue' ? 'revenue' : 'expense';
    
    // Calcola totali mensili per questa super-categoria
    const superTotals: Record<number, number> = {};
    for (let month = 1; month <= 12; month++) {
      superTotals[month] = 0;
      categories.forEach(category => {
        const monthKey = `${selectedYear}-${month}`;
        superTotals[month] += category.monthlyTotals[monthKey] || 0;
      });
    }

    const rows: React.ReactElement[] = [];

    // Super Category Header Row
    rows.push(
      <tr key={superCategoryKey} className={`border-b border-border/30 hover:bg-${colorClass}/5 zen-button`}>
        <td className="p-3 font-zen font-medium">
          <div className="flex items-center">
            <button
              onClick={() => toggleCategory(superCategoryKey)}
              className="mr-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRightIcon size={16} />}
            </button>
            <span className={`font-bold text-base text-${colorClass}`}>
              {emoji} {title}
            </span>
          </div>
        </td>
        {months.map((_, monthIndex) => {
          const value = superTotals[monthIndex + 1] || 0;
          return (
            <td key={monthIndex} className="p-3 text-center">
              <span className={`font-bold text-${colorClass}`}>
                {value !== 0 ? formatCurrency(Math.abs(value)) : '−'}
              </span>
            </td>
          );
        })}
      </tr>
    );

    // Children Categories if Expanded
    if (isExpanded) {
      categories.forEach(category => {
        rows.push(...renderCategory(category, 1));
      });
    }

    return rows;
  };

  // 🌿 Render Subcategory
  const renderSubcategory = (subcategory: HierarchicalSubcategory, parentCategory: HierarchicalCategory, depth = 1): React.ReactElement[] => {
    const colorClass = parentCategory.type_id === 'revenue' ? 'revenue' : 
                     parentCategory.type_id === 'expense' ? 'expense' : 'primary';

    // Create monthly values from entries
    const monthlyValues: Record<number, number> = {};
    for (let month = 1; month <= 12; month++) {
      monthlyValues[month] = 0;
    }
    
    subcategory.entries.forEach(entry => {
      monthlyValues[entry.month] = entry.value;
    });

    const rows: React.ReactElement[] = [];

    // Subcategory Row
    rows.push(
      <tr key={subcategory.id} className={`border-b border-border/20 hover:bg-${colorClass}/3 bg-muted/10`}>
        <td className="p-3 font-zen text-sm">
          <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
            <span className={`text-${colorClass}/80`}>
              {subcategory.name}
            </span>
          </div>
        </td>
        {months.map((_, monthIndex) => {
          const value = monthlyValues[monthIndex + 1] || 0;
          return (
            <td key={monthIndex} className="p-3 text-center">
              <Button
                variant="ghost"
                size="sm"
                className={`h-auto p-2 text-xs zen-button rounded-lg hover:bg-${colorClass}/20 hover:text-${colorClass} border-0`}
                onClick={() => openEditDialog(subcategory.name, monthIndex + 1)}
              >
                {value !== 0 ? formatCurrency(Math.abs(value)) : '−'}
              </Button>
            </td>
          );
        })}
      </tr>
    );

    return rows;
  };

  // 🎨 Render Hierarchical Category
  const renderCategory = (category: HierarchicalCategory, depth = 0): React.ReactElement[] => {
    const hasChildren = category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.name);
    const colorClass = category.type_id === 'revenue' ? 'revenue' : 
                     category.type_id === 'expense' ? 'expense' : 'primary';
    
    // 🎯 ANTI-DUPLICATE: Skip subcategory rendering if only ONE subcategory named "Totale" or "Saldo"
    const hasSingleMainSubcat = hasChildren && 
                               category.subcategories?.length === 1 && 
                               (category.subcategories[0].name === 'Totale' || category.subcategories[0].name === 'Saldo');

    const rows: React.ReactElement[] = [];

    // 🏗️ Main Category Row
    rows.push(
      <tr key={category.id} className={`border-b border-border/30 hover:bg-${colorClass}/5 zen-button ${depth > 0 ? 'bg-muted/5' : ''}`}>
        <td className="p-3 font-zen font-medium">
          <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
            {hasChildren && !hasSingleMainSubcat && (
              <button
                onClick={() => toggleCategory(category.name)}
                className="mr-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRightIcon size={16} />}
              </button>
            )}
            {(!hasChildren || hasSingleMainSubcat) && depth > 0 && <span className="w-6 inline-block" />}
            <span className={`${category.is_calculated ? 'font-bold' : ''} ${depth === 0 ? 'text-base' : 'text-sm'}`}>
              {category.name}
            </span>
          </div>
        </td>
        {months.map((_, monthIndex) => {
          const monthKey = `${selectedYear}-${monthIndex + 1}`;
          const value = category.monthlyTotals?.[monthKey] || 0;
          return (
            <td key={monthIndex} className="p-3 text-center">
              {!category.is_calculated ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-auto p-2 text-xs zen-button rounded-lg hover:bg-${colorClass}/20 hover:text-${colorClass} border-0`}
                  onClick={() => openEditDialog(category.name, monthIndex + 1)}
                >
                  {value !== 0 ? formatCurrency(Math.abs(value)) : '−'}
                </Button>
              ) : (
                <span className={`font-bold text-${colorClass}`}>
                  {value !== 0 ? formatCurrency(Math.abs(value)) : '−'}
                </span>
              )}
            </td>
          );
        })}
      </tr>
    );

    // 🌳 Subcategories Rows if Expanded - SKIP for single main subcategories
    if (hasChildren && isExpanded && !hasSingleMainSubcat) {
      category.subcategories?.forEach(subcategory => {
        rows.push(...renderSubcategory(subcategory, category, depth + 1));
      });
    }

    return rows;
  };

  // 🏦 Render Balance Section with improved structure
  const renderBalanceSection = (): React.ReactElement[] => {
    const rows: React.ReactElement[] = [];
    
    // Filtra i saldi bancari (escludi CASSA CONTANTI e CASH FLOW CON AFFID.)
    const bankBalances = hierarchicalData.balance.filter(category => 
      ['Saldo Banca Sella', 'Saldo MPS', 'Saldo Intesa'].includes(category.name)
    );
    
    // Super-categoria TOTALE BANCHE
    const bankTotalKey = 'super_bank_total';
    const isBankTotalExpanded = expandedCategories.has(bankTotalKey);
    
    // Calcola totali bancari mensili
    const bankTotals: Record<number, number> = {};
    for (let month = 1; month <= 12; month++) {
      bankTotals[month] = 0;
      bankBalances.forEach(bank => {
        const monthKey = `${selectedYear}-${month}`;
        bankTotals[month] += bank.monthlyTotals[monthKey] || 0;
      });
    }

    // Super Category TOTALE BANCHE
    rows.push(
      <tr key={bankTotalKey} className="border-b border-border/30 hover:bg-primary/5 zen-button">
        <td className="p-3 font-zen font-medium">
          <div className="flex items-center">
            <button
              onClick={() => toggleCategory(bankTotalKey)}
              className="mr-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isBankTotalExpanded ? <ChevronDown size={16} /> : <ChevronRightIcon size={16} />}
            </button>
            <span className="font-bold text-base text-primary">
              🏦 TOTALE BANCHE
            </span>
          </div>
        </td>
        {months.map((_, monthIndex) => {
          const value = bankTotals[monthIndex + 1] || 0;
          return (
            <td key={monthIndex} className="p-3 text-center">
              <span className="font-bold text-primary">
                {value !== 0 ? formatCurrency(Math.abs(value)) : '−'}
              </span>
            </td>
          );
        })}
      </tr>
    );

    // Singoli saldi bancari (se espanso)
    if (isBankTotalExpanded) {
      bankBalances.forEach(bank => {
        rows.push(...renderCategory(bank, 1));
      });
    }

    // CASH FLOW = Totale Banche + Differenza (Entrate - Uscite)
    rows.push(
      <tr key="cash_flow" className="border-y-2 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
        <td className="p-4 font-zen-jp font-medium text-primary">
          💰 CASH FLOW (Banche + Differenza)
        </td>
        {months.map((_, monthIndex) => {
          const monthData = monthlyTotals[monthIndex + 1] || { revenues: 0, expenses: 0 };
          const difference = monthData.revenues - monthData.expenses;
          const bankTotal = bankTotals[monthIndex + 1] || 0;
          const cashFlow = bankTotal + difference;
          
          return (
            <td key={monthIndex} className="p-4 text-center font-zen-jp font-medium">
              <div className={`flex items-center justify-center space-x-1 ${cashFlow >= 0 ? 'text-diff-positive' : 'text-diff-negative'}`}>
                <span>{formatCurrency(cashFlow)}</span>
                {cashFlow >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              </div>
            </td>
          );
        })}
      </tr>
    );

    return rows;
  };

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
  if (loading || apiLoading) {
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

  // ❌ Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10 flex items-center justify-center">
        <div className="zen-card p-12 text-center border-destructive/20">
          <div className="w-16 h-16 bg-gradient-to-br from-destructive to-warning rounded-full mx-auto mb-6"></div>
          <h2 className="text-2xl font-zen-jp font-light mb-4 text-destructive">Errore</h2>
          <p className="text-muted-foreground font-light mb-6">{error}</p>
          <Button onClick={clearError} className="zen-button">Riprova</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5">
      {/* 🎨 Zen Header */}
      <div className="border-b border-border/50 backdrop-blur-sm bg-card/80">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-3xl font-zen-jp font-light text-primary zen-fade-in">FinCal</h1>
              <div className="h-8 w-px bg-border"></div>
              <span className="font-zen-jp font-light zen-slide-up">{activeCompany?.name || 'Dashboard'}</span>
            </div>
            <div className="text-sm text-muted-foreground font-light zen-fade-in">
              {new Date().toLocaleDateString('it-IT', { 
                year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8 zen-fade-in">
        
        {/* 📅 Year Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Button variant="outline" size="sm" onClick={() => setSelectedYear(selectedYear - 1)} 
                    className="zen-button rounded-xl border-border/50 hover:bg-muted/50">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-3xl font-zen-jp font-light text-foreground">{selectedYear}</h2>
            <Button variant="outline" size="sm" onClick={() => setSelectedYear(selectedYear + 1)}
                    className="zen-button rounded-xl border-border/50 hover:bg-muted/50">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* 🎛️ Expand/Collapse Controls */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAllCategories} className="zen-button text-xs">
              Espandi Tutto
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAllCategories} className="zen-button text-xs">
              Collassa Tutto
            </Button>

          </div>
        </div>



        {/* 📊 Year Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 zen-slide-up">
          <div className="zen-card p-6 hover:shadow-zen zen-button group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-zen font-medium text-muted-foreground">Entrate Totali</h3>
              <div className="w-3 h-3 bg-revenue rounded-full animate-zen-breathe"></div>
            </div>
            <div className="text-3xl font-zen-jp font-light text-revenue">
              {formatCurrency(yearTotals.revenues)}
            </div>
          </div>
          
          <div className="zen-card p-6 hover:shadow-zen zen-button group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-zen font-medium text-muted-foreground">Uscite Totali</h3>
              <div className="w-3 h-3 bg-expense rounded-full animate-zen-breathe"></div>
            </div>
            <div className="text-3xl font-zen-jp font-light text-expense">
              {formatCurrency(yearTotals.expenses)}
            </div>
          </div>
          
          <div className="zen-card p-6 hover:shadow-zen zen-button group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-zen font-medium text-muted-foreground">Risultato Netto</h3>
              <div className={`w-3 h-3 rounded-full animate-zen-breathe ${yearTotals.difference >= 0 ? 'bg-diff-positive' : 'bg-diff-negative'}`}></div>
            </div>
            <div className={`text-3xl font-zen-jp font-light ${yearTotals.difference >= 0 ? 'text-diff-positive' : 'text-diff-negative'}`}>
              {formatCurrency(yearTotals.difference)}
            </div>
          </div>
          
          <div className="zen-card p-6 hover:shadow-zen zen-button group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-zen font-medium text-muted-foreground">Cash Flow Medio</h3>
              <div className="w-3 h-3 bg-primary rounded-full animate-zen-float"></div>
            </div>
            <div className="text-3xl font-zen-jp font-light text-primary">
              {formatCurrency(yearTotals.cashFlow / 12)}
            </div>
          </div>
        </div>

        {/* 🌳 Hierarchical Financial Table */}
        <div className="zen-card backdrop-blur-sm">
          <div className="p-6 border-b border-border/50">
            <h3 className="text-xl font-zen-jp font-light flex items-center space-x-3">
              <span>Dashboard Gerarchico</span>
              <div className="w-px h-6 bg-border"></div>
              <span className="text-muted-foreground">{selectedYear}</span>
            </h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-3 font-zen font-medium text-muted-foreground min-w-[250px]">Categoria</th>
                    {months.map((month) => (
                      <th key={month} className="text-center p-3 min-w-28 font-zen font-medium text-muted-foreground">{month}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* 💰 ENTRATE - Super Category Collassabile */}
                  {renderSuperCategory('ENTRATE', '💰', hierarchicalData.revenue, 'revenue')}
                  
                  {/* 💸 USCITE - Super Category Collassabile */}
                  {renderSuperCategory('USCITE', '💸', hierarchicalData.expense, 'expense')}

                  {/* ⚖️ DIFFERENZA */}
                  <tr className="border-y-2 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
                    <td className="p-4 font-zen-jp font-medium text-primary">⚖️ DIFFERENZA (Entrate - Uscite)</td>
                    {months.map((_, monthIndex) => {
                      const monthData = monthlyTotals[monthIndex + 1] || { revenues: 0, expenses: 0 };
                      const difference = monthData.revenues - monthData.expenses;
                      
                      return (
                        <td key={monthIndex} className="p-4 text-center font-zen-jp font-medium">
                          <div className={`flex items-center justify-center space-x-1 ${difference >= 0 ? 'text-diff-positive' : 'text-diff-negative'}`}>
                            <span>{formatCurrency(difference)}</span>
                            {difference >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* 🏦 SALDI E CASH FLOW - Struttura Migliorata */}
                  {renderBalanceSection()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 🧠 AI Analysis Panel */}
      {showAIAnalysis && (
        <div className="mt-6">
          <AIAnalysisPanel 
            companyName={activeCompany || "ORTI"} 
            selectedYear={selectedYear}
          />
        </div>
      )}
      
      {/* 📝 Entry Edit Dialog */}
      <EntryEditDialog
        isOpen={editDialog.isOpen}
        onClose={closeEditDialog}
        categoryName={editDialog.categoryName}
        monthIndex={editDialog.monthIndex}
        year={editDialog.year}
        currentProjectedValue={0}
        currentActualValue={0}
        onSave={handleSaveEntry}
        isLoading={isSaving}
      />
    </div>
  );
}; 