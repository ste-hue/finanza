import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

interface ConsolidationEvent {
  id: string
  year: number
  month: number
  consolidated_by: string
  consolidation_date: string
  notes: string
  total_entries_consolidated: number
}

interface VarianceData {
  category_name: string
  category_type: 'revenue' | 'expense' | 'balance'
  projected_value: number
  actual_value: number
  variance_amount: number
  variance_percentage: number
}

export const useConsolidation = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Consolida un mese specifico
  const consolidateMonth = useCallback(async (
    year: number,
    month: number,
    notes?: string,
    userId?: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.rpc('consolidate_month', {
        target_year: year,
        target_month: month,
        consolidated_by_user: userId || 'current_user',
        consolidation_notes: notes || null
      })

      if (error) throw error

      toast({
        title: "✅ Consolidamento completato",
        description: `Mese ${month}/${year} consolidato con successo`
      })

      return data
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "❌ Errore consolidamento",
        description: err.message,
        variant: "destructive"
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Aggiorna valore effettivo di una entry
  const updateActualValue = useCallback(async (
    entryId: string,
    actualValue: number
  ) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.rpc('update_actual_value', {
        entry_id: entryId,
        new_actual_value: actualValue
      })

      if (error) throw error

      toast({
        title: "✅ Valore aggiornato",
        description: "Variance calcolata automaticamente"
      })

      return data
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "❌ Errore aggiornamento",
        description: err.message,
        variant: "destructive"
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Carica eventi di consolidamento
  const loadConsolidationEvents = useCallback(async (year?: number) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('consolidation_events')
        .select('*')
        .order('consolidation_date', { ascending: false })

      if (year) {
        query = query.eq('year', year)
      }

      const { data, error } = await query
      if (error) throw error

      return data as ConsolidationEvent[]
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Carica variance analysis per un mese
  const loadVarianceAnalysis = useCallback(async (
    year: number,
    month: number
  ) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('variance_analysis')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .order('variance_percentage', { ascending: false })

      if (error) throw error
      return data as VarianceData[]
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Verifica se un mese è già consolidato
  const isMonthConsolidated = useCallback(async (
    year: number,
    month: number
  ) => {
    try {
      const { data, error } = await supabase
        .from('consolidation_events')
        .select('id')
        .eq('year', year)
        .eq('month', month)
        .limit(1)

      if (error) throw error
      return data && data.length > 0
    } catch (err) {
      return false
    }
  }, [])

  // Reverte un consolidamento
  const revertConsolidation = useCallback(async (
    year: number,
    month: number,
    revertedBy?: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.rpc('revert_consolidation', {
        p_year: year,
        p_month: month,
        p_reverted_by: revertedBy || 'current_user'
      })

      if (error) throw error

      toast({
        title: "🔄 Consolidamento reverted",
        description: `Mese ${month}/${year} ripristinato come previsionale. Affected: ${data?.affected_entries || 0} entries`
      })

      return {
        success: data?.success || false,
        message: data?.message || 'Errore sconosciuto',
        affectedEntries: data?.affected_entries || 0
      }
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "❌ Errore revert",
        description: err.message,
        variant: "destructive"
      })
      return {
        success: false,
        message: err.message,
        affectedEntries: 0
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Calcola totali variance per un mese
  const calculateVarianceTotals = useCallback((varianceData: VarianceData[]) => {
    return varianceData.reduce((acc, item) => {
      if (item.category_type === 'revenue') {
        acc.totalRevenueVariance += item.variance_amount
      } else if (item.category_type === 'expense') {
        acc.totalExpenseVariance += item.variance_amount
      }
      acc.netVariance = acc.totalRevenueVariance - acc.totalExpenseVariance
      return acc
    }, {
      totalRevenueVariance: 0,
      totalExpenseVariance: 0,
      netVariance: 0
    })
  }, [])

  return {
    loading,
    error,
    consolidateMonth,
    revertConsolidation,
    updateActualValue,
    loadConsolidationEvents,
    loadVarianceAnalysis,
    isMonthConsolidated,
    calculateVarianceTotals
  }
}