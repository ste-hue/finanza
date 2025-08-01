import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { toast } from '@/hooks/use-toast'

// 🎯 UNIFIED SUPABASE FINANCE HOOK - Zero complexity, maximum efficiency
const supabase = createClient(
  'https://udeavsfewakatewsphfw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZWF2c2Zld2FrYXRld3NwaGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTU2MzIsImV4cCI6MjA2OTI3MTYzMn0.7JuPSYEG-UoxvmYecVUgjWIAJ0PQYHeN2wiTnYp2NjY'
)

interface FinanceData {
  consolidated: { revenues: number; expenses: number }
  projections: { revenues: number; expenses: number }
  combined: { revenues: number; expenses: number }
  entries: any[]
  categories: { [key: string]: { consolidated: number; projections: number; type: string } }
  monthlyData: { [month: number]: { revenues: number; expenses: number } }
  categoryMonthlyData: { [categoryName: string]: { [month: number]: { consolidated: number; projections: number } } }
}

export const useSupabaseFinance = (year: number = 2025) => {
  const [data, setData] = useState<FinanceData>({
    consolidated: { revenues: 0, expenses: 0 },
    projections: { revenues: 0, expenses: 0 },
    combined: { revenues: 0, expenses: 0 },
    entries: [],
    categories: {},
    monthlyData: {},
    categoryMonthlyData: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'combined' | 'consolidated' | 'projections'>('combined')

  // 📊 Load financial data with single optimized query
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 🔧 Simplified query - first get entries for ORTI categories
      const { data: entries, error: queryError } = await supabase
        .from('entries')
        .select(`
          id, value, year, month, is_projection, notes,
          subcategories (
            name,
            categories (
              name, type_id
            )
          )
        `)
        .eq('year', year)
        .order('month', { ascending: true })

      if (queryError) {
        console.error('Query Error:', queryError)
        throw queryError
      }

      console.log('Loaded entries:', entries?.length || 0)
      if (entries?.length > 0) {
        console.log('Sample entry:', entries[0])
      }

      // 🧮 Process data client-side (faster than SQL aggregations)
      const processed = processEntries(entries || [])
      setData(processed)
      
      toast({
        title: "✅ Data loaded",
        description: `${entries?.length || 0} entries for ${year}`
      })
      
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "❌ Load failed", 
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [year])

  // 🔄 Process entries into organized structure
  const processEntries = (entries: any[]): FinanceData => {
    const consolidated = { revenues: 0, expenses: 0 }
    const projections = { revenues: 0, expenses: 0 }
    const categories: { [key: string]: { consolidated: number; projections: number; type: string } } = {}
    const monthlyData: { [month: number]: { revenues: number; expenses: number } } = {}
    const categoryMonthlyData: { [categoryName: string]: { [month: number]: { consolidated: number; projections: number } } } = {}

    // Initialize months
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = { revenues: 0, expenses: 0 }
    }

    entries.forEach(entry => {
      // 🔒 Skip entries without proper structure
      if (!entry.subcategories?.categories) {
        console.warn('Skipping entry without categories:', entry)
        return
      }

      const value = Number(entry.value) || 0
      const categoryName = entry.subcategories.categories.name
      const categoryType = entry.subcategories.categories.type_id
      const isProjection = entry.is_projection
      const month = entry.month

      // Initialize category if not exists
      if (!categories[categoryName]) {
        categories[categoryName] = { consolidated: 0, projections: 0, type: categoryType }
      }

      // Initialize category monthly data if not exists
      if (!categoryMonthlyData[categoryName]) {
        categoryMonthlyData[categoryName] = {}
      }
      if (!categoryMonthlyData[categoryName][month]) {
        categoryMonthlyData[categoryName][month] = { consolidated: 0, projections: 0 }
      }

      // Add to appropriate buckets
      if (isProjection) {
        categories[categoryName].projections += value
        categoryMonthlyData[categoryName][month].projections += value
        if (categoryType === 'revenue') {
          projections.revenues += value
        } else if (categoryType === 'expense') {
          projections.expenses += value
        }
      } else {
        categories[categoryName].consolidated += value
        categoryMonthlyData[categoryName][month].consolidated += value
        if (categoryType === 'revenue') {
          consolidated.revenues += value
          monthlyData[month].revenues += value
        } else if (categoryType === 'expense') {
          consolidated.expenses += value
          monthlyData[month].expenses += value
        }
      }
    })

    return {
      consolidated,
      projections,
      combined: {
        revenues: consolidated.revenues + projections.revenues,
        expenses: consolidated.expenses + projections.expenses
      },
      entries,
      categories,
      monthlyData,
      categoryMonthlyData
    }
  }

  // 💾 Save entry with real-time update
  const saveEntry = useCallback(async (entryData: {
    categoryName: string
    month: number
    value: number
    isProjection: boolean
    notes?: string
  }) => {
    try {
      console.log('💾 Saving entry:', entryData)
      
      // 🔧 Simplified: First find category, then subcategory
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', entryData.categoryName)
        .single()

      if (categoryError) {
        console.error('Category query error:', categoryError)
        throw categoryError
      }
      if (!category) throw new Error(`Category '${entryData.categoryName}' not found`)

      const { data: subcategory, error: subcategoryError } = await supabase
        .from('subcategories')
        .select('id')
        .eq('category_id', category.id)
        .eq('name', 'Main')
        .single()

      if (subcategoryError) {
        console.error('Subcategory query error:', subcategoryError)
        throw subcategoryError
      }
      if (!subcategory) throw new Error('Subcategory not found')

      // 🔍 First check if entry exists (with better error handling)
      const { data: existingEntry, error: searchError } = await supabase
        .from('entries')
        .select('id')
        .eq('subcategory_id', subcategory.id)
        .eq('year', year)
        .eq('month', entryData.month)
        .eq('is_projection', entryData.isProjection)
        .maybeSingle() // Use maybeSingle instead of single to handle not found

      // Ignore "not found" errors, only throw on real errors
      if (searchError && searchError.code !== 'PGRST116') {
        console.error('Search error:', searchError)
        throw new Error(`Errore ricerca entry: ${searchError.message}`)
      }

      const entryPayload = {
        subcategory_id: subcategory.id,
        year,
        month: entryData.month,
        value: entryData.value,
        is_projection: entryData.isProjection,
        notes: entryData.notes || ''
      }

      if (existingEntry) {
        // Update existing
        const { error: updateError } = await supabase
          .from('entries')
          .update(entryPayload)
          .eq('id', existingEntry.id)
          
        if (updateError) {
          console.error('Update error:', updateError)
          throw new Error(`Errore aggiornamento: ${updateError.message}`)
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('entries')
          .insert(entryPayload)
          
        if (insertError) {
          console.error('Insert error:', insertError)
          throw new Error(`Errore inserimento: ${insertError.message}`)
        }
      }

      // Immediate reload (with small delay to prevent conflicts)
      setTimeout(() => loadData(), 100)
      
      toast({
        title: "✅ Entry saved",
        description: `${entryData.categoryName}: €${entryData.value.toLocaleString('it-IT')}`
      })
      
    } catch (err: any) {
      toast({
        title: "❌ Save failed",
        description: err.message,
        variant: "destructive"
      })
    }
  }, [year, loadData])

  // ➕ Create new category
  const createCategory = useCallback(async (categoryData: {
    name: string
    type_id: 'revenue' | 'expense' | 'balance'
    sort_order?: number
  }) => {
    try {
      console.log('➕ Creating category:', categoryData)
      
      // First, get the ORTI company ID from database
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('name', 'ORTI')
        .single()

      if (companyError || !company) {
        throw new Error('Impossibile trovare la società ORTI nel database')
      }
      
      // Insert new category
      const { data: newCategory, error: categoryError } = await supabase
        .from('categories')
        .insert({
          name: categoryData.name,
          type_id: categoryData.type_id,
          company_id: company.id,
          sort_order: categoryData.sort_order || 1
        })
        .select()
        .single()

      if (categoryError) {
        console.error('Category creation error:', categoryError)
        throw new Error(`Errore creazione categoria: ${categoryError.message}`)
      }

      // Create default 'Main' subcategory
      const { error: subcategoryError } = await supabase
        .from('subcategories')
        .insert({
          name: 'Main',
          category_id: newCategory.id,
          sort_order: 1
        })

      if (subcategoryError) throw subcategoryError

      // Reload data
      await loadData()
      
      toast({
        title: "✅ Categoria creata",
        description: `${categoryData.name} aggiunta con successo`
      })
      
      return newCategory
    } catch (err: any) {
      toast({
        title: "❌ Errore creazione",
        description: err.message,
        variant: "destructive"
      })
      throw err
    }
  }, [loadData])

  // 🗑️ Delete category
  const deleteCategory = useCallback(async (categoryName: string) => {
    try {
      console.log('🗑️ Deleting category:', categoryName)
      
      // First get category ID
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .single()

      if (categoryError) throw categoryError
      if (!category) throw new Error(`Categoria '${categoryName}' non trovata`)

      // Delete all entries for this category's subcategories
      const { data: subcategories } = await supabase
        .from('subcategories')
        .select('id')
        .eq('category_id', category.id)

      if (subcategories && subcategories.length > 0) {
        const subcategoryIds = subcategories.map(sub => sub.id)
        await supabase
          .from('entries')
          .delete()
          .in('subcategory_id', subcategoryIds)
      }

      // Delete subcategories
      await supabase
        .from('subcategories')
        .delete()
        .eq('category_id', category.id)

      // Delete category
      await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)

      // Reload data
      await loadData()
      
      toast({
        title: "✅ Categoria eliminata",
        description: `${categoryName} rimossa con successo`
      })
      
    } catch (err: any) {
      toast({
        title: "❌ Errore eliminazione",
        description: err.message,
        variant: "destructive"
      })
      throw err
    }
  }, [loadData])

  // 📈 Calculate variance
  const variance = {
    revenues: data.consolidated.revenues - data.projections.revenues,
    expenses: data.consolidated.expenses - data.projections.expenses,
    net: (data.consolidated.revenues - data.consolidated.expenses) - 
         (data.projections.revenues - data.projections.expenses)
  }

  // 🎨 Get display data based on view mode
  const getDisplayData = () => {
    switch (viewMode) {
      case 'consolidated':
        return {
          data: data.consolidated,
          title: 'Consolidati (Reali)',
          colors: { revenue: 'text-blue-600', expense: 'text-red-700' }
        }
      case 'projections':
        return {
          data: data.projections,
          title: 'Proiezioni (Previsti)', 
          colors: { revenue: 'text-purple-600', expense: 'text-orange-600' }
        }
      default:
        return {
          data: data.combined,
          title: 'Combinati',
          colors: { revenue: 'text-green-600', expense: 'text-red-600' }
        }
    }
  }

  // 🚀 Real-time subscription with debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const subscription = supabase
      .channel('entries-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'entries' 
      }, () => {
        // Debounce to prevent infinite loops
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          loadData()
        }, 500) // Wait 500ms before reloading
      })
      .subscribe()

    return () => { 
      clearTimeout(timeoutId)
      subscription.unsubscribe() 
    }
  }, [loadData])

  // Load data on mount/year change
  useEffect(() => {
    loadData()
  }, [loadData])

  const displayData = getDisplayData()

  return {
    // State
    ...data,
    loading,
    error,
    variance,
    viewMode,
    
    // Computed
    yearTotals: {
      revenues: displayData.data.revenues,
      expenses: displayData.data.expenses,
      difference: displayData.data.revenues - displayData.data.expenses,
      displayTitle: displayData.title,
      displayColors: displayData.colors,
      consolidated: data.consolidated,
      projections: data.projections,
      variance
    },
    
    // Actions
    loadData,
    saveEntry,
    setViewMode,
    createCategory,
    deleteCategory
  }
}