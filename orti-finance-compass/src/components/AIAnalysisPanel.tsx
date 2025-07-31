import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb, 
  BarChart3,
  Calendar,
  DollarSign,
  Target,
  Loader2,
  Play,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface AIInsight {
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  action: string;
  category: string;
}

interface AnalysisStep {
  step: number;
  thought: string;
  findings?: string[];
  baseline?: any;
  context?: any;
  hypotheses?: string[];
  recommendations?: string[];
  top_impact?: any;
  seasonal_insights?: any;
  growth_factors?: any;
  risks?: string[];
}

interface AIAnalysisResult {
  analysis_type: string;
  period?: string;
  target_year?: number;
  analysis_steps: AnalysisStep[];
  executive_summary: any;
  generated_at: string;
  significant_variances_count?: number;
}

interface AIAnalysisPanelProps {
  companyName: string;
  selectedYear: number;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ 
  companyName, 
  selectedYear 
}) => {
  const [quickInsights, setQuickInsights] = useState<AIInsight[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<string>('');
  const { toast } = useToast();

  const API_BASE = 'http://localhost:8000';

  // Load quick insights on component mount
  useEffect(() => {
    loadQuickInsights();
  }, [companyName, selectedYear]);

  const loadQuickInsights = async () => {
    setInsightsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/companies/${companyName}/ai-analysis/quick-insights/${selectedYear}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.insights) {
        setQuickInsights(data.insights);
      }
    } catch (error) {
      console.error('Error loading quick insights:', error);
      toast({
        title: "Errore Quick Insights",
        description: "Impossibile caricare gli insights rapidi",
        variant: "destructive"
      });
    } finally {
      setInsightsLoading(false);
    }
  };

  const runAnalysis = async (analysisType: string, month?: number) => {
    setLoading(true);
    setActiveAnalysis(analysisType);
    setAnalysisResult(null);

    try {
      const requestBody = {
        company_name: companyName,
        analysis_type: analysisType,
        year: selectedYear,
        ...(month && { month }),
        variance_threshold: 0.15
      };

      const response = await fetch(
        `${API_BASE}/api/companies/${companyName}/ai-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.analysis_result) {
        setAnalysisResult(data.analysis_result);
        toast({
          title: "✅ Analisi Completata",
          description: `Analisi ${analysisType} completata con successo`,
        });
      }
    } catch (error) {
      console.error('Error running analysis:', error);
      toast({
        title: "❌ Errore Analisi",
        description: "Impossibile completare l'analisi AI",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setActiveAnalysis('');
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'MEDIUM': 
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      default: return 'secondary';
    }
  };

  const renderAnalysisSteps = (steps: AnalysisStep[]) => {
    return (
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                  {step.step}
                </div>
                <CardTitle className="text-base">{step.thought}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {step.findings && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-2">🔍 Findings:</p>
                  <ul className="text-sm space-y-1">
                    {step.findings.map((finding, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {step.baseline && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-2">📊 Baseline:</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {Object.entries(step.baseline).map(([key, value]) => (
                      <div key={key} className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-medium">{key.replace('_', ' ').toUpperCase()}</div>
                        <div className="text-blue-600">{value as string}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step.top_impact && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-2">🎯 Top Impact:</p>
                  <div className="p-3 bg-red-50 rounded border border-red-200">
                    <div className="font-medium text-red-800">{step.top_impact.category}</div>
                    <div className="text-sm text-red-600">
                      Impact: {step.top_impact.impact} ({step.top_impact.variance_pct})
                    </div>
                  </div>
                </div>
              )}

              {step.hypotheses && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-2">💡 Hypotheses:</p>
                  <ul className="text-sm space-y-1">
                    {step.hypotheses.slice(0, 3).map((hypothesis, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="h-2 w-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                        {hypothesis}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {step.recommendations && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-2">🚀 Recommendations:</p>
                  <ul className="text-sm space-y-1">
                    {step.recommendations.slice(0, 3).map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Target className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {step.risks && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-2">⚠️ Risks:</p>
                  <ul className="text-sm space-y-1">
                    {step.risks.slice(0, 3).map((risk, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <XCircle className="h-3 w-3 text-red-500 mt-1 flex-shrink-0" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <div>
              <CardTitle>🧠 AI Financial Analysis</CardTitle>
              <CardDescription>
                Analisi finanziaria avanzata powered by Sequential Thinking
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">Quick Insights</TabsTrigger>
          <TabsTrigger value="analysis">Deep Analysis</TabsTrigger>
          <TabsTrigger value="results">Analysis Results</TabsTrigger>
        </TabsList>

        {/* Quick Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Quick Insights - {selectedYear}
              </CardTitle>
              <CardDescription>
                Insights automatici basati sui tuoi dati finanziari
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Caricamento insights...</span>
                </div>
              ) : quickInsights.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Nessun insight disponibile. Assicurati che ci siano dati finanziari per {selectedYear}.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {quickInsights.map((insight, index) => (
                    <Alert key={index} className="border-l-4 border-l-blue-500">
                      <div className="flex items-start gap-3">
                        {getPriorityIcon(insight.priority)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getPriorityColor(insight.priority)}>
                              {insight.priority}
                            </Badge>
                            <span className="text-sm font-medium text-gray-600">
                              {insight.category}
                            </span>
                          </div>
                          <AlertDescription className="text-base">
                            {insight.message}
                          </AlertDescription>
                          <div className="mt-2">
                            <span className="text-sm text-blue-600 font-medium">
                              💡 Suggested Action: {insight.action}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deep Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Variance Investigation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-red-500" />
                  Variance Investigation
                </CardTitle>
                <CardDescription>
                  Analisi approfondita degli scostamenti budget vs actual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Analizza le varianze significative per identificare cause e soluzioni
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[6, 7, 8, 9].map(month => (
                      <Button
                        key={month}
                        variant="outline"
                        size="sm"
                        onClick={() => runAnalysis('variance_investigation', month)}
                        disabled={loading}
                        className="text-xs"
                      >
                        {loading && activeAnalysis === 'variance_investigation' ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        {new Date(2024, month - 1).toLocaleString('it-IT', { month: 'short' }).toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Planning */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  Budget Planning
                </CardTitle>
                <CardDescription>
                  Pianificazione strategica del budget con proiezioni di crescita
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Pianifica il budget del prossimo anno basandoti sulle performance storiche
                  </p>
                  <Button
                    onClick={() => runAnalysis('budget_planning')}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading && activeAnalysis === 'budget_planning' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Analizza Budget {selectedYear + 1}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coming Soon */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-500" />
                Seasonal Optimization & Cash Flow Analysis
                <Badge variant="secondary">Coming Soon</Badge>
              </CardTitle>
              <CardDescription>
                Ottimizzazione stagionale e analisi predittiva del cash flow
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        {/* Analysis Results Tab */}
        <TabsContent value="results" className="space-y-4">
          {!analysisResult ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessuna analisi completata ancora.</p>
                  <p className="text-sm">Vai al tab "Deep Analysis" per iniziare un'analisi.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Executive Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Executive Summary
                  </CardTitle>
                  <CardDescription>
                    {analysisResult.analysis_type.replace('_', ' ').toUpperCase()} - {analysisResult.period || analysisResult.target_year}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(analysisResult.executive_summary).map(([key, value]) => (
                      <div key={key} className="p-3 bg-gray-50 rounded">
                        <div className="text-sm font-medium text-gray-600 mb-1">
                          {key.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="font-medium">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Sequential Thinking Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Sequential Thinking Process
                  </CardTitle>
                  <CardDescription>
                    Processo di ragionamento step-by-step dell'AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderAnalysisSteps(analysisResult.analysis_steps)}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};