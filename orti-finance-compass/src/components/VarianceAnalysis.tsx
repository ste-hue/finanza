import React, { useState, useEffect } from 'react';
import { useOptimizedFinanceAPI } from '@/hooks/useOptimizedFinanceAPI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VarianceAnalysisProps {
  year?: number;
  companyName?: string;
}

export const VarianceAnalysis: React.FC<VarianceAnalysisProps> = ({ 
  year = 2025, 
  companyName = 'ORTI' 
}) => {
  const { fetchVarianceAnalysis, varianceData, loading, error } = useOptimizedFinanceAPI(companyName, year);
  const { toast } = useToast();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(7); // Default: Luglio (primo mese con dati confrontabili)
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const months = [
    { value: 1, label: 'Gennaio', short: 'Gen' },
    { value: 2, label: 'Febbraio', short: 'Feb' },
    { value: 3, label: 'Marzo', short: 'Mar' },
    { value: 4, label: 'Aprile', short: 'Apr' },
    { value: 5, label: 'Maggio', short: 'Mag' },
    { value: 6, label: 'Giugno', short: 'Giu' },
    { value: 7, label: 'Luglio', short: 'Lug' },
    { value: 8, label: 'Agosto', short: 'Ago' },
    { value: 9, label: 'Settembre', short: 'Set' },
    { value: 10, label: 'Ottobre', short: 'Ott' },
    { value: 11, label: 'Novembre', short: 'Nov' },
    { value: 12, label: 'Dicembre', short: 'Dic' }
  ];

  // 🔍 Load variance analysis for selected month
  const loadVarianceAnalysis = async () => {
    if (!selectedMonth) return;
    
    try {
      setAnalysisLoading(true);
      await fetchVarianceAnalysis(year, selectedMonth);
      
      toast({
        title: "✅ Analisi completata",
        description: `Confronto per ${months.find(m => m.value === selectedMonth)?.label} ${year}`,
        variant: "default"
      });
    } catch (err) {
      toast({
        title: "❌ Errore nell'analisi",
        description: err instanceof Error ? err.message : 'Errore sconosciuto',
        variant: "destructive"
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Auto-load when month changes
  useEffect(() => {
    if (selectedMonth) {
      loadVarianceAnalysis();
    }
  }, [selectedMonth, year]);

  // 💰 Format Currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // 📊 Calculate percentage variance
  const getPercentageVariance = (actual: number, projected: number): number => {
    if (projected === 0) return actual === 0 ? 0 : 100;
    return ((actual - projected) / Math.abs(projected)) * 100;
  };

  // 🎨 Get variance badge style
  const getVarianceBadge = (variance: number, type: 'revenue' | 'expense') => {
    const absVariance = Math.abs(variance);
    const isPositive = variance > 0;
    
    // For revenue: positive variance is good (more revenue than expected)
    // For expense: negative variance is good (less expense than expected)
    const isGood = type === 'revenue' ? isPositive : !isPositive;
    
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
    let icon = <Target className="h-3 w-3" />;
    
    if (absVariance < 5) {
      variant = 'default';
      icon = <CheckCircle className="h-3 w-3" />;
    } else if (absVariance < 15) {
      variant = isGood ? 'default' : 'secondary';
      icon = isGood ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
    } else {
      variant = isGood ? 'default' : 'destructive';
      icon = <AlertTriangle className="h-3 w-3" />;
    }

    return { variant, icon, isGood };
  };

  if (loading || analysisLoading) {
    return (
      <div className="zen-card p-12 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-6 animate-zen-breathe"></div>
        <h3 className="text-xl font-zen-jp font-light mb-4">Caricamento Analisi</h3>
        <p className="text-muted-foreground font-light">Analizzando scostamenti...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="zen-card p-12 text-center border-destructive/20">
        <div className="w-16 h-16 bg-gradient-to-br from-destructive to-warning rounded-full mx-auto mb-6"></div>
        <h3 className="text-xl font-zen-jp font-light mb-4 text-destructive">Errore</h3>
        <p className="text-muted-foreground font-light mb-6">{error}</p>
        <Button onClick={loadVarianceAnalysis} className="zen-button">Riprova</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 🎛️ Month Selector */}
      <Card className="zen-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <span className="text-2xl">📊</span>
            <span>Analisi Scostamenti</span>
          </CardTitle>
          <CardDescription>
            Confronta i valori previsti con quelli reali per identificare variazioni significative
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <label htmlFor="month-select" className="text-sm font-medium">Seleziona Mese:</label>
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-48 zen-button">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label} {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={loadVarianceAnalysis} disabled={analysisLoading} className="zen-button">
              Aggiorna Analisi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 📈 Variance Results */}
      {varianceData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 💰 Revenue Analysis */}
          <Card className="zen-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="text-xl">💰</span>
                  <span>Entrate</span>
                </span>
                {(() => {
                  const variance = getPercentageVariance(varianceData.actual.total_revenue, varianceData.projected.total_revenue);
                  const badgeInfo = getVarianceBadge(variance, 'revenue');
                  return (
                    <Badge variant={badgeInfo.variant} className="flex items-center space-x-1">
                      {badgeInfo.icon}
                      <span>{variance > 0 ? '+' : ''}{variance.toFixed(1)}%</span>
                    </Badge>
                  );
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">🔮 Previsto:</span>
                  <span className="font-mono text-sm">{formatCurrency(varianceData.projected.total_revenue)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <span className="text-sm font-medium">✅ Reale:</span>
                  <span className="font-mono text-sm font-bold">{formatCurrency(varianceData.actual.total_revenue)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="text-sm font-medium">📊 Differenza:</span>
                  <span className={`font-mono text-sm font-bold ${varianceData.variance.revenue_variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {varianceData.variance.revenue_variance > 0 ? '+' : ''}{formatCurrency(varianceData.variance.revenue_variance)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 💸 Expense Analysis */}
          <Card className="zen-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="text-xl">💸</span>
                  <span>Uscite</span>
                </span>
                {(() => {
                  const variance = getPercentageVariance(varianceData.actual.total_expenses, varianceData.projected.total_expenses);
                  const badgeInfo = getVarianceBadge(variance, 'expense');
                  return (
                    <Badge variant={badgeInfo.variant} className="flex items-center space-x-1">
                      {badgeInfo.icon}
                      <span>{variance > 0 ? '+' : ''}{variance.toFixed(1)}%</span>
                    </Badge>
                  );
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">🔮 Previsto:</span>
                  <span className="font-mono text-sm">{formatCurrency(varianceData.projected.total_expenses)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <span className="text-sm font-medium">✅ Reale:</span>
                  <span className="font-mono text-sm font-bold">{formatCurrency(varianceData.actual.total_expenses)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="text-sm font-medium">📊 Differenza:</span>
                  <span className={`font-mono text-sm font-bold ${varianceData.variance.expense_variance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {varianceData.variance.expense_variance > 0 ? '+' : ''}{formatCurrency(varianceData.variance.expense_variance)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 📋 Category-by-Category Analysis */}
          <Card className="zen-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-xl">📋</span>
                <span>Dettaglio per Categoria</span>
              </CardTitle>
              <CardDescription>
                Analisi dettagliata degli scostamenti per ogni categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-3 font-medium">Categoria</th>
                      <th className="text-right p-3 font-medium">Previsto</th>
                      <th className="text-right p-3 font-medium">Reale</th>
                      <th className="text-right p-3 font-medium">Differenza</th>
                      <th className="text-center p-3 font-medium">Variazione %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(varianceData.variance.categories).map(([categoryName, variance]) => {
                      const projected = varianceData.projected.categories[categoryName] || 0;
                      const actual = varianceData.actual.categories[categoryName] || 0;
                      const percentageVariance = getPercentageVariance(actual, projected);
                      
                      // Determine if this is likely a revenue or expense category
                      const isRevenue = categoryName.toLowerCase().includes('entrate') || 
                                       categoryName.toLowerCase().includes('ricavi') ||
                                       categoryName.toLowerCase().includes('rientro') ||
                                       categoryName.toLowerCase().includes('caparre');
                      
                      const badgeInfo = getVarianceBadge(percentageVariance, isRevenue ? 'revenue' : 'expense');
                      
                      return (
                        <tr key={categoryName} className="border-b border-border/20 hover:bg-muted/20">
                          <td className="p-3 font-medium">{categoryName}</td>
                          <td className="p-3 text-right font-mono">{formatCurrency(projected)}</td>
                          <td className="p-3 text-right font-mono font-bold">{formatCurrency(actual)}</td>
                          <td className={`p-3 text-right font-mono font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={badgeInfo.variant} className="flex items-center justify-center space-x-1">
                              {badgeInfo.icon}
                              <span>{percentageVariance > 0 ? '+' : ''}{percentageVariance.toFixed(1)}%</span>
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 💡 Insights Panel */}
      {varianceData && (
        <Card className="zen-card border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-xl">💡</span>
              <span>Insights Automatici</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">
                  {Math.abs(varianceData.variance.revenue_variance) > Math.abs(varianceData.variance.expense_variance) ? '📈' : '📉'}
                </div>
                <div className="text-sm font-medium">Impatto Maggiore</div>
                <div className="text-xs text-muted-foreground">
                  {Math.abs(varianceData.variance.revenue_variance) > Math.abs(varianceData.variance.expense_variance) 
                    ? 'Variazione entrate' 
                    : 'Variazione uscite'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">
                  {(varianceData.actual.total_revenue - varianceData.actual.total_expenses) > 
                   (varianceData.projected.total_revenue - varianceData.projected.total_expenses) ? '😊' : '😟'}
                </div>
                <div className="text-sm font-medium">Risultato Netto</div>
                <div className="text-xs text-muted-foreground">
                  {(varianceData.actual.total_revenue - varianceData.actual.total_expenses) > 
                   (varianceData.projected.total_revenue - varianceData.projected.total_expenses) 
                    ? 'Migliore del previsto' 
                    : 'Peggiore del previsto'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">
                  {Object.values(varianceData.variance.categories).filter(v => Math.abs(v) > 10000).length}
                </div>
                <div className="text-sm font-medium">Scostamenti Significativi</div>
                <div className="text-xs text-muted-foreground">
                  Categorie con variazioni > €10k
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};