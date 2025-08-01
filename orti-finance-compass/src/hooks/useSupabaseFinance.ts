import { useState, useEffect, useCallback } from 'react'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase' // 🌍 Global shared client

interface FinanceData {
  consolidated: { revenues: number; expenses: number }
  projections: { revenues: number; expenses: number }
  combined: { revenues: number; expenses: number }
  entries: any[]
  categories: { [key: string]: { consolidated: number; projections: number; type: string; sort_order: number } }
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

  // 📊 Load financial data with separate queries for categories and entries
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 🏢 First get ORTI company ID
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('name', 'ORTI')
        .single()

      if (companyError || !company) {
        throw new Error('Impossibile trovare la società ORTI nel database')
      }

      // 📂 Load ALL categories for ORTI (regardless of entries)
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          id, name, type_id, sort_order,
          subcategories (
            id, name
          )
        `)
        .eq('company_id', company.id)
        .order('sort_order', { ascending: true })

      if (categoriesError) {
        console.error('Categories Query Error:', categoriesError)
        throw categoriesError
      }

      // 📋 Load ALL entries for the year (with subcategory relationship)
      const { data: entriesData, error: entriesError } = await supabase
        .from('entries')
        .select(`
          id, value, year, month, is_projection, notes,
          subcategories (
            id, name, category_id
          )
        `)
        .eq('year', year)
        .order('month', { ascending: true })

      if (entriesError) {
        console.error('Entries Query Error:', entriesError)
        throw entriesError
      }

      console.log('Loaded categories:', categoriesData?.length || 0)
      console.log('Loaded entries:', entriesData?.length || 0)
      if (entriesData?.length > 0) {
        console.log('Sample entry:', entriesData[0])
      }

      // 🧮 Process data with separate categories and entries
      const processed = processDataSeparately(categoriesData || [], entriesData || [])
      setData(processed)
      
      toast({
        title: "✅ Data loaded",
        description: `${categoriesData?.length || 0} categories, ${entriesData?.length || 0} entries for ${year}`
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

  // 🔄 Process categories and entries separately into organized structure
  const processDataSeparately = (categoriesData: any[], entriesData: any[]): FinanceData => {
    const consolidated = { revenues: 0, expenses: 0 }
    const projections = { revenues: 0, expenses: 0 }
    const categories: { [key: string]: { consolidated: number; projections: number; type: string; sort_order: number } } = {}
    const monthlyData: { [month: number]: { revenues: number; expenses: number } } = {}
    const categoryMonthlyData: { [categoryName: string]: { [month: number]: { consolidated: number; projections: number } } } = {}

    // Initialize months
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = { revenues: 0, expenses: 0 }
    }

    // 📂 First, initialize ALL categories (even without entries)
    categoriesData.forEach(category => {
      categories[category.name] = {
        consolidated: 0,
        projections: 0,
        type: category.type_id,
        sort_order: category.sort_order || 999
      }
      
      // Initialize monthly data for all categories
      categoryMonthlyData[category.name] = {}
      for (let month = 1; month <= 12; month++) {
        categoryMonthlyData[category.name][month] = { consolidated: 0, projections: 0 }
      }
    })

    // Create a lookup map from subcategory_id to category for faster processing
    const subcategoryToCategoryMap: { [subcategoryId: string]: any } = {}
    categoriesData.forEach(category => {
      category.subcategories?.forEach((subcategory: any) => {
        subcategoryToCategoryMap[subcategory.id] = {
          name: category.name,
          type_id: category.type_id,
          sort_order: category.sort_order
        }
      })
    })

    // 📋 Now process entries and add them to the initialized categories
    entriesData.forEach(entry => {
      const subcategoryId = entry.subcategories?.id
      if (!subcategoryId || !subcategoryToCategoryMap[subcategoryId]) {
        console.warn('Skipping entry without valid subcategory:', entry)
        return
      }

      const categoryInfo = subcategoryToCategoryMap[subcategoryId]
      const categoryName = categoryInfo.name
      const categoryType = categoryInfo.type_id
      const value = Number(entry.value) || 0
      const isProjection = entry.is_projection
      const month = entry.month

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
      entries: entriesData,
      categories,
      monthlyData,
      categoryMonthlyData
    }
  }

  // 🔄 Process entries into organized structure (legacy function - keep for compatibility)
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
        categories[categoryName] = { 
          consolidated: 0, 
          projections: 0, 
          type: categoryType,
          sort_order: entry.subcategories.categories.sort_order || 999
        }
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
      
      // Check if category with same name already exists
      const { data: existingCategory, error: checkError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryData.name)
        .eq('company_id', company.id)
        .maybeSingle()
      
      if (checkError) throw checkError
      if (existingCategory) {
        throw new Error(`Categoria '${categoryData.name}' esiste già`)
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
      
      // First get category ID (handle duplicates gracefully)
      const { data: categories, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .limit(1)

      if (categoryError) throw categoryError
      if (!categories || categories.length === 0) {
        throw new Error(`Categoria '${categoryName}' non trovata`)
      }
      
      const category = categories[0]

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

  // ↕️ Update category order
  const updateCategoryOrder = useCallback(async (categoryName: string, direction: 'up' | 'down') => {
    try {
      console.log('↕️ Updating category order:', categoryName, direction)
      
      // Get current category data
      const currentCategory = data.categories[categoryName]
      if (!currentCategory) {
        throw new Error(`Categoria '${categoryName}' non trovata`)
      }
      
      // Get all categories of the same type, sorted by sort_order
      const sameTypeCategories = Object.entries(data.categories)
        .filter(([_, categoryData]) => categoryData.type === currentCategory.type)
        .sort((a, b) => a[1].sort_order - b[1].sort_order)
      
      // Find current position
      const currentIndex = sameTypeCategories.findIndex(([name, _]) => name === categoryName)
      if (currentIndex === -1) {
        throw new Error('Categoria non trovata nella lista')
      }
      
      // Calculate target position
      let targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      
      // Check bounds
      if (targetIndex < 0 || targetIndex >= sameTypeCategories.length) {
        console.log('Cannot move beyond bounds')
        return // Already at the top/bottom
      }
      
      const currentCategoryData = sameTypeCategories[currentIndex]
      const targetCategoryData = sameTypeCategories[targetIndex]
      
      // Swap sort_order values
      const currentSortOrder = currentCategoryData[1].sort_order
      const targetSortOrder = targetCategoryData[1].sort_order
      
      // Update both categories in database
      const { error: error1 } = await supabase
        .from('categories')
        .update({ sort_order: targetSortOrder })
        .eq('name', currentCategoryData[0])
      
      const { error: error2 } = await supabase
        .from('categories')
        .update({ sort_order: currentSortOrder })
        .eq('name', targetCategoryData[0])
      
      if (error1 || error2) {
        throw new Error(`Errore aggiornamento ordine: ${error1?.message || error2?.message}`)
      }
      
      // Update local state immediately for better UX
      data.categories[currentCategoryData[0]].sort_order = targetSortOrder
      data.categories[targetCategoryData[0]].sort_order = currentSortOrder
      
      // Reload data to ensure consistency
      await loadData()
      
      toast({
        title: "✅ Ordine aggiornato",
        description: `${categoryName} spostata ${direction === 'up' ? 'su' : 'giù'}`
      })
      
    } catch (err: any) {
      console.error('🚨 UPDATE ORDER ERROR:', err)
      toast({
        title: "❌ Errore riordinamento",
        description: err.message || "Impossibile cambiare l'ordine",
        variant: "destructive"
      })
    }
  }, [data.categories, loadData])

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

  // 📤 Export data
  const exportData = useCallback(async () => {
    try {
      // Get all entries for the current year
      const { data: allEntries, error } = await supabase
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

      if (error) throw error

      // Get categories structure
      // First get ORTI company ID
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('name', 'ORTI')
        .single()

      if (companyError || !company) {
        throw new Error('Impossibile trovare la società ORTI nel database')
      }

      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select(`
          id, name, type_id,
          subcategories (
            id, name
          )
        `)
        .eq('company_id', company.id)

      if (catError) throw catError

      return {
        year,
        entries: allEntries || [],
        categories: categoriesData || [],
        exportDate: new Date().toISOString(),
        companyName: 'ORTI'
      }
    } catch (error) {
      console.error('Export error:', error)
      throw error
    }
  }, [year])

  // 📥 Import data
  const importData = useCallback(async (importedData: any) => {
    try {
      // Validate data structure
      if (!importedData.entries || !Array.isArray(importedData.entries)) {
        throw new Error('Invalid data format')
      }

      // Delete existing entries for the year
      const { error: deleteError } = await supabase
        .from('entries')
        .delete()
        .eq('year', importedData.year || year)

      if (deleteError) throw deleteError

      // Import new entries
      for (const entry of importedData.entries) {
        // Find or create subcategory
        const subcategoryName = entry.subcategories?.name
        const categoryName = entry.subcategories?.categories?.name

        if (subcategoryName && categoryName) {
          // Get subcategory ID
          const { data: subcategory } = await supabase
            .from('subcategories')
            .select('id')
            .eq('name', subcategoryName)
            .single()

          if (subcategory) {
            // Insert entry
            await supabase
              .from('entries')
              .insert({
                value: entry.value,
                year: entry.year,
                month: entry.month,
                is_projection: entry.is_projection,
                notes: entry.notes,
                subcategory_id: subcategory.id
              })
          }
        }
      }

      // Reload data
      await loadData()
    } catch (error) {
      console.error('Import error:', error)
      throw error
    }
  }, [year, loadData])

  // 🎯 Optimistic update for drag & drop (local state only)
  const updateCategoriesOrderOptimistic = useCallback((newOrderedCategories: string[], categoryType: string) => {
    const newCategoriesState = { ...data.categories }
    
    // Update sort_order for the reordered categories
    newOrderedCategories.forEach((categoryName, index) => {
      if (newCategoriesState[categoryName] && newCategoriesState[categoryName].type === categoryType) {
        newCategoriesState[categoryName] = {
          ...newCategoriesState[categoryName],
          sort_order: index + 1
        }
      }
    })
    
    // Update local state immediately (no DB call)
    setData(prevData => ({
      ...prevData,
      categories: newCategoriesState
    }))
  }, [data.categories])

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
    deleteCategory,
    exportData,
    importData,
    updateCategoryOrder,
    updateCategoriesOrderOptimistic
  }
}