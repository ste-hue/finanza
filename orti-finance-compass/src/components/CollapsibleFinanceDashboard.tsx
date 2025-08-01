import React, { useState } from 'react'
import { useSupabaseFinance } from '@/hooks/useSupabaseFinance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Edit3, 
  Trash2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Banknote,
  Calculator
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

// 🎯 COLLAPSIBLE FINANCE DASHBOARD - Structured sections with CRUD
export const CollapsibleFinanceDashboard: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(2025)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    'entrate': true,
    'uscite': true,
    'differenza': true,
    'banche': true,
    'affidamenti': true
  })
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({})

  const { 
    loading, 
    error, 
    yearTotals, 
    categoryMonthlyData,
    categories,
    viewMode,
    saveEntry,
    createCategory,
    deleteCategory
  } = useSupabaseFinance(selectedYear)

  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
  
  // 💰 Format currency
  const formatCurrency = (value: number) => 
    value === 0 ? '−' : new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value)

  // 🔄 Toggle section expansion
  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  // 🔄 Toggle category subcategories expansion
  const toggleCategoryDetails = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }))
  }

  // ✏️ Handle cell editing
  const handleCellClick = (categoryName: string, month: number) => {
    const cellId = `${categoryName}-${month}`
    setEditingCell(cellId)
    const currentValue = getCellValue(categoryName, month)
    setEditValue(currentValue.toString())
  }

  const handleCellSave = async () => {
    if (!editingCell) return
    
    const [categoryName, monthStr] = editingCell.split('-')
    const month = parseInt(monthStr)
    const value = parseFloat(editValue) || 0

    try {
      await saveEntry({
        categoryName: categoryName,
        month,
        value,
        isProjection: false
      })
      
      toast({
        title: "✅ Valore salvato",
        description: `${categoryName} - ${months[month-1]}: ${formatCurrency(value)}`
      })
    } catch (err) {
      toast({
        title: "❌ Errore",
        description: "Impossibile salvare il valore",
        variant: "destructive"
      })
    }
    
    setEditingCell(null)
    setEditValue('')
  }

  const getCellValue = (categoryName: string, month: number): number => {
    const categoryMonthData = categoryMonthlyData?.[categoryName]?.[month]
    if (!categoryMonthData) return 0
    
    switch (viewMode) {
      case 'consolidated':
        return categoryMonthData.consolidated
      case 'projections':
        return categoryMonthData.projections
      case 'combined':
      default:
        return categoryMonthData.consolidated + categoryMonthData.projections
    }
  }

  // ➕ Add new category
  const handleAddCategory = async (type: 'revenue' | 'expense') => {
    if (!newCategoryName.trim()) {
      toast({
        title: "❌ Nome richiesto",
        description: "Inserisci il nome della categoria",
        variant: "destructive"
      })
      return
    }

    try {
      await createCategory({
        name: newCategoryName,
        type_id: type,
        sort_order: Object.keys(categories).length + 1
      })
      setNewCategoryName('')
    } catch (err) {
      console.error('Add category error:', err)
      toast({
        title: "❌ Errore",
        description: "Impossibile creare la categoria. Verifica la connessione al database.",
        variant: "destructive"
      })
    }
  }

  // 🗑️ Delete category
  const handleDeleteCategory = async (categoryName: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare "${categoryName}"?`)) {
      try {
        await deleteCategory(categoryName)
      } catch (err) {
        // Error already handled in deleteCategory
      }
    }
  }

  // 📊 Get category data by type
  const getCategoriesByType = (type: string) => {
    console.log('Looking for categories with type:', type)
    console.log('Available categories:', categories)
    
    return Object.entries(categories)
      .filter(([name, data]) => {
        console.log(`Category ${name} has type:`, data.type)
        // Handle both 'expense' and 'expenses' variations
        const categoryType = data.type
        const matches = categoryType === type || 
                       (type === 'expense' && categoryType === 'expenses') ||
                       (type === 'revenue' && categoryType === 'revenues')
        return matches
      })
      .map(([name, _]) => name)
  }

  // 🧮 Calculate totals
  const calculateTotals = () => {
    const entrate = getCategoriesByType('revenue')
    const uscite = getCategoriesByType('expense')
    
    const totaleEntrate = entrate.reduce((sum, cat) => {
      const categoryData = categories[cat]
      return sum + (categoryData?.consolidated || 0) + (categoryData?.projections || 0)
    }, 0)
    
    const totaleUscite = uscite.reduce((sum, cat) => {
      const categoryData = categories[cat]
      return sum + (categoryData?.consolidated || 0) + (categoryData?.projections || 0)
    }, 0)
    
    return {
      entrate: totaleEntrate,
      uscite: totaleUscite,
      differenza: totaleEntrate - totaleUscite
    }
  }

  const totals = calculateTotals()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-slate-600">Caricamento dati {selectedYear}...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg border border-red-200">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Ricarica</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 📊 HEADER */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-light text-slate-800">Dashboard Finanziaria</h1>
              <div className="text-lg text-slate-600">ORTI {selectedYear}</div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                onClick={() => setSelectedYear(selectedYear - 1)}
              >
                {selectedYear - 1}
              </Button>
              <div className="text-xl font-semibold px-4 py-2 bg-blue-50 rounded">
                {selectedYear}
              </div>
              <Button 
                variant="outline"
                onClick={() => setSelectedYear(selectedYear + 1)}
              >
                {selectedYear + 1}
              </Button>
            </div>
          </div>

          {/* Quick Totals */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-sm text-green-600 mb-1">Totale Entrate</div>
              <div className="text-2xl font-semibold text-green-700">
                {formatCurrency(totals.entrate)}
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded">
              <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-sm text-red-600 mb-1">Totale Uscite</div>
              <div className="text-2xl font-semibold text-red-700">
                {formatCurrency(totals.uscite)}
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded">
              <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-sm text-blue-600 mb-1">Differenza</div>
              <div className={`text-2xl font-semibold ${totals.differenza >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(totals.differenza)}
              </div>
            </div>
          </div>
        </div>

        {/* 💰 SEZIONE ENTRATE */}
        <Card className="mb-6">
          <CardHeader 
            className="cursor-pointer bg-green-50 hover:bg-green-100 transition-colors"
            onClick={() => toggleSection('entrate')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {expandedSections.entrate ? 
                  <ChevronDown className="w-5 h-5" /> : 
                  <ChevronRight className="w-5 h-5" />
                }
                <TrendingUp className="w-6 h-6 text-green-600" />
                <div>
                  <h2 className="text-xl font-semibold text-green-700">TOTALE ENTRATE</h2>
                  <div className="text-green-600">{formatCurrency(totals.entrate)}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Nome nuova entrata..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-48"
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddCategory('revenue')
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi Entrata
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {expandedSections.entrate && (
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="text-left p-4 font-medium text-slate-700 w-64">Categoria</th>
                      {months.map((month) => (
                        <th key={month} className="text-center p-2 font-medium text-slate-700 min-w-[80px]">
                          {month}
                        </th>
                      ))}
                      <th className="w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCategoriesByType('revenue').map((categoryName) => (
                      <tr key={categoryName} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="p-3 font-medium text-slate-700">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleCategoryDetails(categoryName)}
                              className="p-1 hover:bg-slate-200 rounded transition-colors"
                            >
                              {expandedCategories[categoryName] ? 
                                <ChevronDown className="w-4 h-4" /> : 
                                <ChevronRight className="w-4 h-4" />
                              }
                            </button>
                            <span>{categoryName}</span>
                          </div>
                        </td>
                        {months.map((_, monthIndex) => {
                          const month = monthIndex + 1
                          const cellId = `${categoryName}-${month}`
                          const value = getCellValue(categoryName, month)
                          const isEditing = editingCell === cellId
                          
                          return (
                            <td key={month} className="p-2 text-center">
                              {isEditing ? (
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCellSave()
                                    if (e.key === 'Escape') setEditingCell(null)
                                  }}
                                  onBlur={handleCellSave}
                                  className="h-8 text-sm w-full"
                                  autoFocus
                                />
                              ) : (
                                <button
                                  onClick={() => handleCellClick(categoryName, month)}
                                  className="w-full h-8 text-sm hover:bg-slate-100 rounded px-2 transition-colors group"
                                >
                                  {value === 0 ? (
                                    <span className="text-slate-400">−</span>
                                  ) : (
                                    <span className="text-green-700 font-medium">{formatCurrency(value)}</span>
                                  )}
                                  <Edit3 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-50 transition-opacity inline" />
                                </button>
                              )}
                            </td>
                          )
                        })}
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(categoryName)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>

        {/* 💸 SEZIONE USCITE */}
        <Card className="mb-6">
          <CardHeader 
            className="cursor-pointer bg-red-50 hover:bg-red-100 transition-colors"
            onClick={() => toggleSection('uscite')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {expandedSections.uscite ? 
                  <ChevronDown className="w-5 h-5" /> : 
                  <ChevronRight className="w-5 h-5" />
                }
                <TrendingDown className="w-6 h-6 text-red-600" />
                <div>
                  <h2 className="text-xl font-semibold text-red-700">TOTALE USCITE</h2>
                  <div className="text-red-600">{formatCurrency(totals.uscite)}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Nome nuova uscita..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-48"
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddCategory('expense')
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi Uscita
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {expandedSections.uscite && (
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="text-left p-4 font-medium text-slate-700 w-64">Categoria</th>
                      {months.map((month) => (
                        <th key={month} className="text-center p-2 font-medium text-slate-700 min-w-[80px]">
                          {month}
                        </th>
                      ))}
                      <th className="w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCategoriesByType('expense').map((categoryName) => (
                      <tr key={categoryName} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="p-3 font-medium text-slate-700">{categoryName}</td>
                        {months.map((_, monthIndex) => {
                          const month = monthIndex + 1
                          const cellId = `${categoryName}-${month}`
                          const value = getCellValue(categoryName, month)
                          const isEditing = editingCell === cellId
                          
                          return (
                            <td key={month} className="p-2 text-center">
                              {isEditing ? (
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCellSave()
                                    if (e.key === 'Escape') setEditingCell(null)
                                  }}
                                  onBlur={handleCellSave}
                                  className="h-8 text-sm w-full"
                                  autoFocus
                                />
                              ) : (
                                <button
                                  onClick={() => handleCellClick(categoryName, month)}
                                  className="w-full h-8 text-sm hover:bg-slate-100 rounded px-2 transition-colors group"
                                >
                                  {value === 0 ? (
                                    <span className="text-slate-400">−</span>
                                  ) : (
                                    <span className="text-red-700 font-medium">{formatCurrency(value)}</span>
                                  )}
                                  <Edit3 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-50 transition-opacity inline" />
                                </button>
                              )}
                            </td>
                          )
                        })}
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(categoryName)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ⚖️ DIFFERENZA */}
        <Card className="mb-6">
          <CardHeader 
            className="cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors"
            onClick={() => toggleSection('differenza')}
          >
            <div className="flex items-center space-x-3">
              {expandedSections.differenza ? 
                <ChevronDown className="w-5 h-5" /> : 
                <ChevronRight className="w-5 h-5" />
              }
              <Calculator className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-blue-700">DIFF. ENTRATE - USCITE</h2>
                <div className={`${totals.differenza >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.differenza)}
                </div>
              </div>
            </div>
          </CardHeader>
          
          {expandedSections.differenza && (
            <CardContent>
              <div className="grid grid-cols-12 gap-4 text-center">
                {months.map((month, index) => {
                  const entrateMonth = getCategoriesByType('revenue').reduce((sum, cat) => {
                    return sum + getCellValue(cat, index + 1)
                  }, 0)
                  const usciteMonth = getCategoriesByType('expense').reduce((sum, cat) => {
                    return sum + getCellValue(cat, index + 1)
                  }, 0)
                  const diffMonth = entrateMonth - usciteMonth
                  
                  return (
                    <div key={month} className="p-3 bg-slate-50 rounded">
                      <div className="text-sm text-slate-600 mb-1">{month}</div>
                      <div className={`font-semibold ${diffMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(diffMonth)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          )}
        </Card>

        {/* 🏦 TOTALE BANCHE & CASH FLOW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader className="cursor-pointer bg-purple-50 hover:bg-purple-100 transition-colors">
              <div className="flex items-center space-x-3">
                <Banknote className="w-6 h-6 text-purple-600" />
                <div>
                  <h3 className="text-lg font-semibold text-purple-700">TOTALE BANCHE</h3>
                  <div className="text-purple-600">Saldi bancari consolidati</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Saldo MPS:</span>
                  <span className="font-medium">€0</span>
                </div>
                <div className="flex justify-between">
                  <span>Saldo Intesa:</span>
                  <span className="font-medium">€0</span>
                </div>
                <div className="flex justify-between">
                  <span>Saldo Banca Sella:</span>
                  <span className="font-medium">€0</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Totale:</span>
                  <span>€0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
                <div>
                  <h3 className="text-lg font-semibold text-indigo-700">CASH FLOW</h3>
                  <div className="text-indigo-600">Flusso di cassa</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Cassa Contanti:</span>
                  <span className="font-medium">€0</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Flow:</span>
                  <span className="font-medium text-green-600">{formatCurrency(totals.differenza)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Totale Affidamenti:</span>
                  <span className="font-medium">€0</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Cash Flow con Affid.:</span>
                  <span className="text-green-600">{formatCurrency(totals.differenza)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}