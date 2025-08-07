import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

interface BankBalance {
  bank_name: string
  balance: number
  is_projection: boolean
  last_updated: string
}

interface BankBalancesState {
  balances: BankBalance[]
  totalBalance: number
  loading: boolean
  error: string | null
}

export const useBankBalances = (year: number, month: number) => {
  const [state, setState] = useState<BankBalancesState>({
    balances: [],
    totalBalance: 0,
    loading: true,
    error: null
  })

  const fetchBankBalances = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      // Get detailed bank balances
      const { data: balancesData, error: balancesError } = await supabase
        .rpc('get_bank_balances_detail', { p_year: year, p_month: month })

      if (balancesError) {
        throw balancesError
      }

      // Get total balance
      const { data: totalData, error: totalError } = await supabase
        .rpc('get_total_bank_balance', { p_year: year, p_month: month })

      if (totalError) {
        throw totalError
      }

      setState({
        balances: balancesData || [],
        totalBalance: totalData || 0,
        loading: false,
        error: null
      })

    } catch (error) {
      console.error('Error fetching bank balances:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [supabase, year, month])

  const updateBankBalance = useCallback(async (bankName: string, newBalance: number) => {
    try {
      // Find the entry for this bank
      const { data: entries, error: findError } = await supabase
        .from('entries')
        .select(`
          id,
          subcategories!inner(
            categories!inner(name)
          )
        `)
        .eq('year', year)
        .eq('month', month)
        .eq('subcategories.categories.name', bankName)

      if (findError) throw findError

      if (entries && entries.length > 0) {
        const { error: updateError } = await supabase
          .from('entries')
          .update({ 
            value: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', entries[0].id)

        if (updateError) throw updateError

        toast({
          title: "Saldo Aggiornato",
          description: `${bankName}: €${newBalance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`
        })

        // Refresh data
        await fetchBankBalances()
      }

    } catch (error) {
      console.error('Error updating bank balance:', error)
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il saldo bancario",
        variant: "destructive"
      })
    }
  }, [supabase, year, month, fetchBankBalances])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  useEffect(() => {
    fetchBankBalances()
  }, [fetchBankBalances])

  // Real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('bank-balances-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'entries',
        filter: `year=eq.${year},month=eq.${month}`
      }, () => {
        fetchBankBalances()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, year, month, fetchBankBalances])

  return {
    ...state,
    updateBankBalance,
    formatCurrency,
    refresh: fetchBankBalances
  }
}