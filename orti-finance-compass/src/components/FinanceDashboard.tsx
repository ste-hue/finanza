import React, { useState } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AggregateDisplay } from '@/components/AggregateDisplay';
import { MonthConsolidationDialog } from '@/components/MonthConsolidationDialog';
import { 
  Calendar, 
  Building2, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const FinanceDashboard: React.FC = () => {
  const {
    loading,
    error,
    companies,
    activeCompany,
    categories,
    monthlyData,
    aggregatedData,
    viewFilter,
    currentDate,
    monthStatuses,
    setActiveCompany,
    setViewFilter,
    saveEntry,
    consolidateMonth
  } = useFinanceData();

  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [consolidationDialog, setConsolidationDialog] = useState<{
    open: boolean;
    month: number;
    year: number;
  }>({ open: false, month: 1, year: 2025 });

  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Generate year options (current year -2 to +3)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

  // Format currency
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('it-IT', { 
      style: 'currency', 
      currency: 'EUR', 
      minimumFractionDigits: 0 
    }).format(value);

  // Check if month is past, current or future
  const getMonthStatus = (month: number, year: number) => {
    if (year < currentYear) return 'past';
    if (year > currentYear) return 'future';
    if (month < currentMonth) return 'past';
    if (month === currentMonth) return 'current';
    return 'future';
  };

  // Handle cell editing
  const handleCellClick = (categoryId: string, month: number) => {
    const cellId = `${categoryId}-${month}`;
    setEditingCell(cellId);
    const entry = monthlyData.find(m => m.month === month);
    // Get value based on category type
    const category = categories.find(c => c.id === categoryId);
    if (entry && category) {
      const value = category.type === 'revenue' 
        ? entry.consolidated.revenues + entry.projections.revenues
        : entry.consolidated.expenses + entry.projections.expenses;
      setEditValue(value.toString());
    }
  };

  const handleCellSave = async () => {
    if (!editingCell) return;
    
    const [categoryId, monthStr] = editingCell.split('-');
    const month = parseInt(monthStr);
    const value = parseFloat(editValue) || 0;

    await saveEntry({
      categoryId,
      month,
      year: viewFilter.year,
      value
    });

    setEditingCell(null);
    setEditValue('');
  };

  const handleYearChange = (year: string) => {
    setViewFilter(prev => ({ ...prev, year: parseInt(year) }));
  };

  const handleCompanyChange = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setActiveCompany(company);
      setViewFilter(prev => ({ ...prev, company: company.code }));
    }
  };

  const handleViewModeChange = (mode: string) => {
    if (mode === 'all' || mode === 'consolidated' || mode === 'projections') {
      setViewFilter(prev => ({ ...prev, mode }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-center text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-2xl font-bold">Finance Dashboard</CardTitle>
            
            <div className="flex flex-wrap gap-3">
              {/* Company Selector */}
              <Select value={activeCompany?.id} onValueChange={handleCompanyChange}>
                <SelectTrigger className="w-[180px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Seleziona azienda" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Year Selector */}
              <Select value={viewFilter.year.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[120px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Mode Filter */}
              <ToggleGroup 
                type="single" 
                value={viewFilter.mode} 
                onValueChange={handleViewModeChange}
                className="border rounded-md"
              >
                <ToggleGroupItem value="all" aria-label="Mostra tutto">
                  <Eye className="h-4 w-4 mr-2" />
                  Tutto
                </ToggleGroupItem>
                <ToggleGroupItem value="consolidated" aria-label="Solo consolidati">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Consolidati
                </ToggleGroupItem>
                <ToggleGroupItem value="projections" aria-label="Solo previsioni">
                  <Circle className="h-4 w-4 mr-2" />
                  Previsioni
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards with AggregateDisplay */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AggregateDisplay
          title="Ricavi Totali"
          total={aggregatedData.totalRevenues}
          consolidated={aggregatedData.consolidatedRevenues}
          projected={aggregatedData.projectedRevenues}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          type="revenue"
        />

        <AggregateDisplay
          title="Costi Totali"
          total={aggregatedData.totalExpenses}
          consolidated={aggregatedData.consolidatedExpenses}
          projected={aggregatedData.projectedExpenses}
          icon={<TrendingDown className="h-4 w-4 text-muted-foreground" />}
          type="expense"
        />

        <AggregateDisplay
          title="Risultato Netto"
          total={aggregatedData.difference}
          consolidated={aggregatedData.consolidatedRevenues - aggregatedData.consolidatedExpenses}
          projected={aggregatedData.projectedRevenues - aggregatedData.projectedExpenses}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          type="difference"
        />
      </div>

      {/* Monthly Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dettaglio Mensile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Categoria</th>
                  {months.map((month, idx) => {
                    const monthNum = idx + 1;
                    const status = getMonthStatus(monthNum, viewFilter.year);
                    const monthData = monthlyData.find(m => m.month === monthNum);
                    const hasProjections = monthData?.projections.hasData || false;
                    const isManuallyConsolidated = monthStatuses.some(
                      ms => ms.year === viewFilter.year && ms.month === monthNum && ms.manuallyMarked
                    );
                    
                    return (
                      <th key={idx} className="text-center p-2 min-w-[80px] relative">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <span className={cn(
                              "text-sm",
                              status === 'current' && "font-bold text-primary",
                              status === 'future' && hasProjections && !isManuallyConsolidated && "text-muted-foreground italic"
                            )}>
                              {month}
                            </span>
                            {isManuallyConsolidated && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Lock className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Consolidato manualmente</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          {status === 'future' && hasProjections && !isManuallyConsolidated && (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-[10px] px-1">
                                Prev
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0"
                                onClick={() => setConsolidationDialog({
                                  open: true,
                                  month: monthNum,
                                  year: viewFilter.year
                                })}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className="text-center p-2 min-w-[100px]">Totale</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{category.name}</td>
                    {months.map((_, idx) => {
                      const month = idx + 1;
                      const monthData = monthlyData.find(m => m.month === month);
                      const isProjection = getMonthStatus(month, viewFilter.year) === 'future';
                      
                      let value = 0;
                      if (monthData) {
                        if (category.type === 'revenue') {
                          value = viewFilter.mode === 'consolidated' 
                            ? monthData.consolidated.revenues
                            : viewFilter.mode === 'projections'
                            ? monthData.projections.revenues
                            : monthData.consolidated.revenues + monthData.projections.revenues;
                        } else {
                          value = viewFilter.mode === 'consolidated' 
                            ? monthData.consolidated.expenses
                            : viewFilter.mode === 'projections'
                            ? monthData.projections.expenses
                            : monthData.consolidated.expenses + monthData.projections.expenses;
                        }
                      }
                      
                      const cellId = `${category.id}-${month}`;
                      const isEditing = editingCell === cellId;
                      
                      return (
                        <td 
                          key={month} 
                          className={cn(
                            "p-2 text-center cursor-pointer hover:bg-muted",
                            isProjection && "opacity-70 italic"
                          )}
                          onClick={() => handleCellClick(category.id, month)}
                        >
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleCellSave}
                              onKeyPress={(e) => e.key === 'Enter' && handleCellSave()}
                              className="w-full h-8 text-center"
                              autoFocus
                            />
                          ) : (
                            <span className={cn(
                              category.type === 'expense' && value > 0 && "text-red-600"
                            )}>
                              {value === 0 ? '−' : formatCurrency(value)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-2 text-center font-semibold">
                      {/* Calculate row total */}
                      {formatCurrency(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span>Dati consolidati</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-muted-foreground opacity-70" />
              <span className="italic opacity-70">Dati previsionali</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Prev</Badge>
              <span>Mese con previsioni</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span>Consolidato manualmente</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consolidation Dialog */}
      {consolidationDialog.open && (
        <MonthConsolidationDialog
          open={consolidationDialog.open}
          onOpenChange={(open) => setConsolidationDialog(prev => ({ ...prev, open }))}
          year={consolidationDialog.year}
          month={consolidationDialog.month}
          monthName={months[consolidationDialog.month - 1]}
          projectedRevenues={
            monthlyData.find(m => m.month === consolidationDialog.month)?.projections.revenues || 0
          }
          projectedExpenses={
            monthlyData.find(m => m.month === consolidationDialog.month)?.projections.expenses || 0
          }
          onConfirm={() => consolidateMonth(consolidationDialog.year, consolidationDialog.month)}
        />
      )}
    </div>
  );
};