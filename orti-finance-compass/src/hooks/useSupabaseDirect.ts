import { useState, useEffect, useCallback } from 'react'
import { toast } from '@/hooks/use-toast'

// 🎯 UNIFIED SUPABASE DIRECT HOOK - No FastAPI, no complexity
export const useSupabaseDirect = () => {
  const [data, setData] = useState({
    consolidated: { total_revenue: 0, total_expenses: 0 },
    projections: { total_revenue: 0, total_expenses: 0 },
    combined: { total_revenue: 0, total_expenses: 0 },
    entries: [],
    categories: [],
    loading: true,
    error: null
  })

  const [viewMode, setViewMode] = useState<'combined' | 'consolidated' | 'projections'>('combined')

  // 📊 Load financial data directly from Supabase via MCP
  const loadData = useCallback(async (year: number = 2025) => {
    setData(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Since we can't directly call MCP tools from React, we'll use a simple approach
      // with the existing Supabase client but simplified
      const response = await fetch('/api/financial-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, action: 'load_all' })
      })
      
      if (!response.ok) throw new Error('Failed to load data')
      
      const result = await response.json()
      
      setData(prev => ({
        ...prev,
        ...result,
        loading: false
      }))
      
      toast({
        title: "✅ Data loaded",
        description: `Financial data for ${year} loaded successfully`
      })
      
    } catch (error: any) {
      setData(prev => ({ ...prev, error: error.message, loading: false }))
      toast({
        title: "❌ Error loading data",
        description: error.message,
        variant: "destructive"
      })
    }
  }, [])

  // 💾 Save entry directly to Supabase
  const saveEntry = useCallback(async (entryData: {
    category: string
    month: number
    year: number
    value: number
    isProjection: boolean
    notes?: string
  }) => {
    try {
      const response = await fetch('/api/financial-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entryData, action: 'save_entry' })
      })
      
      if (!response.ok) throw new Error('Failed to save entry')
      
      // Reload data after save
      await loadData(entryData.year)
      
      toast({
        title: "✅ Entry saved",
        description: `${entryData.category} updated for ${entryData.month}/${entryData.year}`
      })
      
    } catch (error: any) {
      toast({
        title: "❌ Error saving entry",
        description: error.message,
        variant: "destructive"
      })
    }
  }, [loadData])

  // 📈 Calculate variance between consolidated and projections
  const calculateVariance = useCallback(() => {
    const { consolidated, projections } = data
    return {
      revenue: consolidated.total_revenue - projections.total_revenue,
      expenses: consolidated.total_expenses - projections.total_expenses,
      net: (consolidated.total_revenue - consolidated.total_expenses) - 
           (projections.total_revenue - projections.total_expenses)
    }
  }, [data])

  // 🎨 Get display data based on view mode
  const getDisplayData = useCallback(() => {
    const { consolidated, projections, combined } = data
    
    switch (viewMode) {
      case 'consolidated':
        return {
          data: consolidated,
          title: 'Consolidati (Reali)',
          colors: { revenue: 'text-blue-600', expense: 'text-red-700' },
          borderColor: 'border-blue-500'
        }
      case 'projections':
        return {
          data: projections,
          title: 'Proiezioni (Previsti)',
          colors: { revenue: 'text-purple-600', expense: 'text-orange-600' },
          borderColor: 'border-purple-500'
        }
      default:
        return {
          data: combined,
          title: 'Combinati',
          colors: { revenue: 'text-green-600', expense: 'text-red-600' },
          borderColor: 'border-green-500'
        }
    }
  }, [data, viewMode])

  // Initialize data on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  const variance = calculateVariance()
  const displayData = getDisplayData()

  return {
    // Data
    ...data,
    variance,
    displayData,
    viewMode,
    
    // Actions
    loadData,
    saveEntry,
    setViewMode,
    
    // Computed
    yearTotals: {
      revenues: displayData.data.total_revenue,
      expenses: displayData.data.total_expenses,
      difference: displayData.data.total_revenue - displayData.data.total_expenses,
      cashFlow: displayData.data.total_revenue - displayData.data.total_expenses,
      consolidated: data.consolidated,
      projections: data.projections,
      variance,
      displayTitle: displayData.title,
      displayColors: displayData.colors,
      viewMode
    }
  }
}