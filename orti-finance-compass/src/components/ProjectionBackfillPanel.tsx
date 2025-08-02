import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  Plus, 
  Save, 
  TrendingUp,
  Calendar
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ProjectionBackfillPanelProps {
  year: number
  month: number
  monthName: string
  onProjectionsAdded?: () => void
}

interface CategoryWithoutProjections {
  category_name: string
  category_type: 'revenue' | 'expense' | 'balance'
  actual_value: number
  has_projection: boolean
}

export const ProjectionBackfillPanel: React.FC<ProjectionBackfillPanelProps> = ({
  year,
  month,
  monthName,
  onProjectionsAdded
}) => {
  const [categoriesData, setCategoriesData] = useState<CategoryWithoutProjections[]>([])
  const [projectionValues, setProjectionValues] = useState<{[key: string]: number}>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load categories without projections for this month
  const loadCategoriesWithoutProjections = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get all consolidated entries for this month
      const { data: consolidatedEntries, error: consolidatedError } = await supabase
        .from('entries')
        .select(`
          value,
          subcategories (
            name,
            categories (
              name,
              type_id
            )
          )
        `)
        .eq('year', year)
        .eq('month', month)
        .eq('is_projection', false)

      if (consolidatedError) throw consolidatedError

      // Get existing projections for this month
      const { data: projectionEntries, error: projectionError } = await supabase
        .from('entries')
        .select(`
          subcategories (
            categories (
              name
            )
          )
        `)
        .eq('year', year)
        .eq('month', month)
        .eq('is_projection', true)

      if (projectionError) throw projectionError

      // Process data to find categories without projections
      const consolidatedByCategory: {[key: string]: {value: number, type: string}} = {}
      const projectionCategories = new Set<string>()

      // Group consolidated entries by category
      consolidatedEntries?.forEach(entry => {
        const categoryName = entry.subcategories?.categories?.name
        const categoryType = entry.subcategories?.categories?.type_id
        if (categoryName) {
          if (!consolidatedByCategory[categoryName]) {
            consolidatedByCategory[categoryName] = { value: 0, type: categoryType }
          }
          consolidatedByCategory[categoryName].value += entry.value
        }
      })

      // Track which categories have projections
      projectionEntries?.forEach(entry => {
        const categoryName = entry.subcategories?.categories?.name
        if (categoryName) {
          projectionCategories.add(categoryName)
        }
      })

      // Create list of categories without projections
      const categoriesWithoutProjections: CategoryWithoutProjections[] = Object.entries(consolidatedByCategory)
        .filter(([categoryName]) => !projectionCategories.has(categoryName))
        .map(([categoryName, data]) => ({
          category_name: categoryName,
          category_type: data.type as 'revenue' | 'expense' | 'balance',
          actual_value: data.value,
          has_projection: false
        }))

      setCategoriesData(categoriesWithoutProjections)

      // Initialize projection values with actual values as default
      const initialValues: {[key: string]: number} = {}
      categoriesWithoutProjections.forEach(cat => {
        initialValues[cat.category_name] = cat.actual_value
      })
      setProjectionValues(initialValues)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategoriesWithoutProjections()
  }, [year, month])

  // Save backfilled projections
  const saveProjections = async () => {
    setSaving(true)

    try {
      const promises = Object.entries(projectionValues).map(async ([categoryName, projectedValue]) => {
        // Find the category and subcategory IDs
        const { data: subcategoryData, error: subcategoryError } = await supabase
          .from('subcategories')
          .select('id, categories!inner(name)')
          .eq('categories.name', categoryName)
          .limit(1)

        if (subcategoryError) throw subcategoryError
        
        if (!subcategoryData || subcategoryData.length === 0) {
          throw new Error(`Subcategory not found for category: ${categoryName}`)
        }

        const subcategoryId = subcategoryData[0].id

        // Insert projection entry
        const { error: insertError } = await supabase
          .from('entries')
          .insert({
            subcategory_id: subcategoryId,
            year,
            month,
            value: projectedValue,
            is_projection: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) throw insertError
      })

      await Promise.all(promises)

      toast({
        title: "✅ Previsioni salvate",
        description: `${Object.keys(projectionValues).length} previsioni retroattive create per ${monthName}`
      })

      onProjectionsAdded?.()
      loadCategoriesWithoutProjections() // Refresh data

    } catch (err: any) {
      toast({
        title: "❌ Errore salvataggio",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const getCategoryTypeInfo = (type: string) => {
    switch(type) {
      case 'revenue': return { label: 'Entrata', color: 'bg-green-100 text-green-800' }
      case 'expense': return { label: 'Uscita', color: 'bg-red-100 text-red-800' }
      case 'balance': return { label: 'Saldo', color: 'bg-purple-100 text-purple-800' }
      default: return { label: type, color: 'bg-gray-100 text-gray-800' }
    }
  }

  if (loading) return <div className="p-4">Caricamento...</div>
  if (error) return <div className="p-4 text-red-600">Errore: {error}</div>

  if (categoriesData.length === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700">
            <TrendingUp className="h-5 w-5" />
            <span className="font-medium">Tutto a posto!</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            Tutte le categorie consolidate hanno previsioni corrispondenti per calcolare variance significative.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Previsioni mancanti per {monthName} {year}</strong>
          <br />
          Trovate {categoriesData.length} categorie consolidate senza previsioni originali. 
          La variance analysis sarà "tutto effettivo vs 0 previsto" = non significativa.
          <br />
          <em>Inserisci previsioni retroattive per calcoli variance meaningul.</em>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Aggiungi Previsioni Retroattive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoriesData.map((category) => {
            const typeInfo = getCategoryTypeInfo(category.category_type)
            
            return (
              <div key={category.category_name} className="flex items-center gap-4 p-3 border rounded">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{category.category_name}</span>
                    <Badge className={typeInfo.color}>
                      {typeInfo.label}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    Effettivo: <span className="font-mono">{formatCurrency(category.actual_value)}</span>
                  </div>
                </div>
                
                <div className="w-40">
                  <Input
                    type="number"
                    placeholder="Previsione..."
                    value={projectionValues[category.category_name] || ''}
                    onChange={(e) => setProjectionValues({
                      ...projectionValues,
                      [category.category_name]: parseFloat(e.target.value) || 0
                    })}
                    className="text-right font-mono"
                  />
                </div>
                
                <div className="w-32 text-right">
                  {projectionValues[category.category_name] && (
                    <div className="text-sm">
                      <div className={cn(
                        "font-semibold",
                        (category.actual_value - (projectionValues[category.category_name] || 0)) >= 0 
                          ? "text-green-600" 
                          : "text-red-600"
                      )}>
                        {formatCurrency(category.actual_value - (projectionValues[category.category_name] || 0))}
                      </div>
                      <div className="text-gray-500">variance</div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={saveProjections}
              disabled={saving || Object.keys(projectionValues).length === 0}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salva {Object.keys(projectionValues).length} Previsioni
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}