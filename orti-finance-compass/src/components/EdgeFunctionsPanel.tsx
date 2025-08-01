import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEdgeFunctions, SeasonalForecast, ROIAnalysis } from '@/hooks/useEdgeFunctions'
import { Brain, TrendingUp, Upload, FileText, BarChart3 } from 'lucide-react'

// 🧠 EDGE FUNCTIONS PANEL - Advanced Financial Analysis
export const EdgeFunctionsPanel: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<any>(null)
  
  const {
    calculateSeasonalForecast,
    calculateROI,
    bulkImport,
    generateReport,
    compareYears
  } = useEdgeFunctions()

  // 🌊 Seasonal Forecast State
  const [forecastYear, setForecastYear] = useState(2025)
  const [forecastCategory, setForecastCategory] = useState('Entrate Hotel')

  // 💰 ROI Analysis State
  const [investment, setInvestment] = useState(50000)
  const [period, setPeriod] = useState(12)
  const [roiCategory, setRoiCategory] = useState('Entrate Hotel')

  // 📊 Comparison State
  const [compareYearsList, setCompareYearsList] = useState('2023,2024,2025')

  const categories = [
    'Entrate Hotel', 'Entrate Residence', 'Entrate CVM', 'Entrate Supermercato', 'Rientro Sospesi', 'Caparre Intur',
    'Salari e Stipendi', 'Utenze', 'Materie Prime/Consumo', 'Tasse e Imposte', 'Commissioni Portali', 'Mutui e Finanziamenti',
    'Cash Flow', 'Totale Banche', 'Diff. Entrate-Uscite'
  ]

  // 🚀 Handle Seasonal Forecast
  const handleSeasonalForecast = async () => {
    setLoading('forecast')
    try {
      const result = await calculateSeasonalForecast(forecastYear, forecastCategory)
      setResults({ type: 'forecast', data: result })
    } catch (err) {
      console.error('Forecast Error:', err)
    } finally {
      setLoading(null)
    }
  }

  // 💰 Handle ROI Analysis
  const handleROIAnalysis = async () => {
    setLoading('roi')
    try {
      const result = await calculateROI(investment, period, roiCategory)
      setResults({ type: 'roi', data: result })
    } catch (err) {
      console.error('ROI Error:', err)
    } finally {
      setLoading(null)
    }
  }

  // 📄 Handle Report Generation
  const handleGenerateReport = async () => {
    setLoading('report')
    try {
      const result = await generateReport(2025, 'json')
      setResults({ type: 'report', data: result })
    } catch (err) {
      console.error('Report Error:', err)
    } finally {
      setLoading(null)
    }
  }

  // 📊 Handle Years Comparison
  const handleCompareYears = async () => {
    setLoading('compare')
    try {
      const years = compareYearsList.split(',').map(y => parseInt(y.trim()))
      const result = await compareYears(years)
      setResults({ type: 'compare', data: result })
    } catch (err) {
      console.error('Compare Error:', err)
    } finally {
      setLoading(null)
    }
  }

  // 💰 Format currency
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
        <Brain className="w-6 h-6 text-purple-600" />
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Edge Functions</h2>
          <p className="text-sm text-slate-600">Analisi avanzate server-side</p>
        </div>
      </div>

      <Tabs defaultValue="forecast" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forecast">🌊 Previsioni</TabsTrigger>
          <TabsTrigger value="roi">💰 ROI</TabsTrigger>
          <TabsTrigger value="report">📄 Report</TabsTrigger>
          <TabsTrigger value="compare">📊 Confronti</TabsTrigger>
        </TabsList>

        {/* 🌊 Seasonal Forecast */}
        <TabsContent value="forecast">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-medium">Previsioni Stagionali</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Anno</label>
                  <Input
                    type="number"
                    value={forecastYear}
                    onChange={(e) => setForecastYear(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Categoria</label>
                  <Select value={forecastCategory} onValueChange={setForecastCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleSeasonalForecast}
                disabled={loading === 'forecast'}
                className="w-full"
              >
                {loading === 'forecast' ? 'Calcolando...' : 'Calcola Previsioni Stagionali'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* 💰 ROI Analysis */}
        <TabsContent value="roi">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-medium">Analisi ROI</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Investimento (€)</label>
                  <Input
                    type="number"
                    value={investment}
                    onChange={(e) => setInvestment(parseInt(e.target.value))}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Periodo (mesi)</label>
                  <Input
                    type="number"
                    value={period}
                    onChange={(e) => setPeriod(parseInt(e.target.value))}
                    placeholder="12"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Categoria</label>
                  <Select value={roiCategory} onValueChange={setRoiCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleROIAnalysis}
                disabled={loading === 'roi'}
                className="w-full"
              >
                {loading === 'roi' ? 'Calcolando...' : 'Calcola ROI'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* 📄 Report Generation */}
        <TabsContent value="report">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-medium">Generazione Report</h3>
              </div>
              
              <p className="text-sm text-slate-600">
                Genera un report completo per l'anno 2025 con tutti i dati finanziari.
              </p>

              <Button 
                onClick={handleGenerateReport}
                disabled={loading === 'report'}
                className="w-full"
              >
                {loading === 'report' ? 'Generando...' : 'Genera Report 2025'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* 📊 Years Comparison */}
        <TabsContent value="compare">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-medium">Confronto Multi-Anno</h3>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Anni da confrontare (separati da virgola)
                </label>
                <Input
                  value={compareYearsList}
                  onChange={(e) => setCompareYearsList(e.target.value)}
                  placeholder="2023,2024,2025"
                />
              </div>

              <Button 
                onClick={handleCompareYears}
                disabled={loading === 'compare'}
                className="w-full"
              >
                {loading === 'compare' ? 'Confrontando...' : 'Confronta Performance'}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Display */}
      {results && (
        <Card className="p-6 bg-slate-50">
          <h3 className="text-lg font-medium mb-4">📊 Risultati</h3>
          
          {results.type === 'forecast' && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Categoria:</span>
                <span className="font-medium">{results.data.category}</span>
              </div>
              <div className="flex justify-between">
                <span>Anno:</span>
                <span className="font-medium">{results.data.year}</span>
              </div>
              <div className="flex justify-between">
                <span>Confidenza:</span>
                <span className="font-medium">{(results.data.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="mt-4">
                <h4 className="font-medium mb-2">Previsioni Mensili:</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {results.data.forecast.slice(0, 6).map((f: any) => (
                    <div key={f.month} className="flex justify-between">
                      <span>Mese {f.month}:</span>
                      <span>{formatCurrency(f.predictedValue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {results.type === 'roi' && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Investimento:</span>
                <span className="font-medium">{formatCurrency(results.data.investment)}</span>
              </div>
              <div className="flex justify-between">
                <span>Revenue Totale:</span>
                <span className="font-medium">{formatCurrency(results.data.totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>ROI:</span>
                <span className={`font-medium ${results.data.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {results.data.roi}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payback Period:</span>
                <span className="font-medium">{results.data.paybackPeriod} mesi</span>
              </div>
            </div>
          )}

          {results.type === 'compare' && (
            <div className="space-y-3">
              <h4 className="font-medium">Performance per Anno:</h4>
              {results.data.comparison.map((year: any) => (
                <div key={year.year} className="grid grid-cols-4 gap-4 text-sm border-b pb-2">
                  <span className="font-medium">{year.year}</span>
                  <span className="text-green-600">{formatCurrency(year.revenues)}</span>
                  <span className="text-red-600">{formatCurrency(year.expenses)}</span>
                  <span className={year.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}>
                    {formatCurrency(year.profit)}
                  </span>
                </div>
              ))}
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <span className="font-medium text-blue-800">
                  🏆 Miglior Anno: {results.data.bestYear.year} 
                  ({formatCurrency(results.data.bestYear.profit)})
                </span>
              </div>
            </div>
          )}

          <pre className="mt-4 text-xs bg-white p-3 rounded border overflow-auto max-h-40">
            {JSON.stringify(results.data, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  )
}