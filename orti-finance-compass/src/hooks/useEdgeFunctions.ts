import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase' // 🌍 Global shared client

export const useEdgeFunctions = () => {
  
  // 🌊 Calcola previsioni stagionali
  const calculateSeasonalForecast = async (year: number, category: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('calfin-analysis', {
        body: { 
          action: 'seasonal_forecast',
          data: { year, category }
        }
      })

      if (error) throw error

      toast({
        title: "🌊 Previsioni Stagionali Calcolate",
        description: `${category} ${year} - Confidenza: ${(data.confidence * 100).toFixed(0)}%`
      })

      return data
    } catch (err: any) {
      toast({
        title: "❌ Errore Calcolo Previsioni",
        description: err.message,
        variant: "destructive"
      })
      throw err
    }
  }

  // 💰 Calcola ROI investimenti
  const calculateROI = async (investment: number, period: number, category: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('calfin-analysis', {
        body: { 
          action: 'roi_analysis',
          data: { investment, period, category }
        }
      })

      if (error) throw error

      toast({
        title: `💰 ROI Calcolato: ${data.roi}%`,
        description: `Payback: ${data.paybackPeriod} mesi`,
        variant: data.isPositive ? "default" : "destructive"
      })

      return data
    } catch (err: any) {
      toast({
        title: "❌ Errore Calcolo ROI",
        description: err.message,
        variant: "destructive"
      })
      throw err
    }
  }

  // 📋 Import massivo di dati
  const bulkImport = async (entries: any[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('calfin-analysis', {
        body: { 
          action: 'bulk_import',
          data: { entries }
        }
      })

      if (error) throw error

      toast({
        title: `📋 Import Completato`,
        description: `${data.successful}/${data.total} voci importate con successo`
      })

      return data
    } catch (err: any) {
      toast({
        title: "❌ Errore Import",
        description: err.message,
        variant: "destructive"
      })
      throw err
    }
  }

  // 📄 Genera report finanziario
  const generateReport = async (year: number, format: 'json' | 'pdf' = 'json') => {
    try {
      const { data, error } = await supabase.functions.invoke('calfin-analysis', {
        body: { 
          action: 'generate_report',
          data: { year, format }
        }
      })

      if (error) throw error

      toast({
        title: "📄 Report Generato",
        description: `Anno ${year} - ${data.totalEntries} voci elaborate`
      })

      return data
    } catch (err: any) {
      toast({
        title: "❌ Errore Generazione Report",
        description: err.message,
        variant: "destructive"
      })
      throw err
    }
  }

  // 📊 Confronta performance multi-anno
  const compareYears = async (years: number[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('calfin-analysis', {
        body: { 
          action: 'performance_comparison',
          data: { years }
        }
      })

      if (error) throw error

      toast({
        title: "📊 Confronto Completato",
        description: `Miglior anno: ${data.bestYear.year} (€${data.bestYear.profit.toLocaleString('it-IT')})`
      })

      return data
    } catch (err: any) {
      toast({
        title: "❌ Errore Confronto",
        description: err.message,
        variant: "destructive"
      })
      throw err
    }
  }

  return {
    calculateSeasonalForecast,
    calculateROI,
    bulkImport,
    generateReport,
    compareYears
  }
}

// 📋 Tipi TypeScript
export interface SeasonalForecast {
  category: string
  year: number
  seasonalPattern: { [month: number]: number }
  forecast: Array<{
    year: number
    month: number
    predictedValue: number
    confidence: number
  }>
  confidence: number
}

export interface ROIAnalysis {
  investment: number
  totalRevenue: number
  roi: string
  paybackPeriod: string
  isPositive: boolean
}

export interface BulkImportResult {
  total: number
  successful: number
  failed: number
  results: Array<{
    categoryName: string
    year: number
    month: number
    value: number
    status: 'success' | 'error'
    reason?: string
  }>
}