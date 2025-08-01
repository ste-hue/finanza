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
  Calculator,
  GripVertical,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  BarChart3,
  Menu,
  X,
  FileJson
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { DataExportImportModal } from '@/components/DataExportImportModal'
import { cn } from '@/lib/utils'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@supabase/supabase-js'

// 🎯 DRAGGABLE CATEGORY ROW COMPONENT
const DraggableCategoryRow: React.FC<{
  categoryName: string
  index: number
  categoryType: 'revenue' | 'expense'
  months: string[]
  editingCell: string | null
  editValue: string
  expandedCategories: { [key: string]: boolean }
  darkMode: boolean
  zenMode: boolean
  onCellClick: (categoryName: string, month: number) => void
  onCellSave: () => void
  onToggleDetails: (categoryName: string) => void
  onDeleteCategory: (categoryName: string) => void
  getCellValue: (categoryName: string, month: number) => number
  formatCurrency: (value: number) => string
  setEditValue: (value: string) => void
  setEditingCell: (cellId: string | null) => void
}> = ({
  categoryName,
  index,
  categoryType,
  months,
  editingCell,
  editValue,
  expandedCategories,
  darkMode,
  zenMode,
  onCellClick,
  onCellSave,
  onToggleDetails,
  onDeleteCategory,
  getCellValue,
  formatCurrency,
  setEditValue,
  setEditingCell
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: categoryName })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const colorClass = categoryType === 'revenue' 
    ? (darkMode ? 'text-green-400' : 'text-green-700')
    : (darkMode ? 'text-red-400' : 'text-red-700')
  const bgColorClass = categoryType === 'revenue' 
    ? (darkMode ? 'hover:bg-green-900/30' : 'hover:bg-green-50')
    : (darkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50')

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b transition-all duration-200",
        darkMode 
          ? "hover:bg-gray-700/30 border-gray-700" 
          : "hover:bg-slate-50 border-slate-100",
        index % 2 === 0 && (darkMode ? "bg-gray-800/30" : "bg-slate-50/30"),
        isDragging && (darkMode ? 'bg-gray-700' : 'bg-slate-100')
      )}
    >
      <td className={cn(
        "p-3 font-medium sticky left-0 z-10",
        darkMode ? "text-gray-200 bg-gray-800" : "text-slate-700 bg-white"
      )}>
        <div className="flex items-center space-x-2">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className={cn(
              "cursor-grab active:cursor-grabbing p-1 rounded transition-colors",
              bgColorClass
            )}
          >
            <GripVertical className={cn("w-4 h-4", colorClass)} />
          </div>
          
          {categoryType === 'revenue' && (
            <button
              onClick={() => onToggleDetails(categoryName)}
              className={cn(
                "p-1 rounded transition-colors",
                darkMode ? "hover:bg-gray-600" : "hover:bg-slate-200"
              )}
            >
              {expandedCategories[categoryName] ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
              }
            </button>
          )}
          
          <span className="flex-1">{categoryName}</span>
        </div>
      </td>

      {/* Month cells */}
      {months.map((_, monthIndex) => {
        const month = monthIndex + 1
        const cellId = `${categoryName}-${month}`
        const value = getCellValue(categoryName, month)
        const isEditing = editingCell === cellId
        
        return (
          <td key={month} className="p-1 md:p-2 text-center">
            {isEditing ? (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onCellSave()
                  if (e.key === 'Escape') setEditingCell(null)
                }}
                onBlur={onCellSave}
                className={cn(
                  "h-7 md:h-8 text-xs md:text-sm w-full",
                  darkMode && "bg-gray-700 border-gray-600"
                )}
                autoFocus
              />
            ) : (
              <button
                onClick={() => onCellClick(categoryName, month)}
                className={cn(
                  "w-full h-7 md:h-8 text-xs md:text-sm rounded px-1 md:px-2 transition-all group",
                  darkMode ? "hover:bg-gray-700" : "hover:bg-slate-100",
                  value > 0 && "font-medium"
                )}
              >
                {value === 0 ? (
                  <span className={darkMode ? "text-gray-500" : "text-slate-400"}>−</span>
                ) : (
                  <span className={cn("font-medium", colorClass)}>{formatCurrency(value)}</span>
                )}
                {!zenMode && (
                  <Edit3 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-50 transition-opacity inline" />
                )}
              </button>
            )}
          </td>
        )
      })}

      {/* Delete button */}
      {!zenMode && (
        <td className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteCategory(categoryName)}
            className={cn(
              "transition-colors",
              darkMode 
                ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" 
                : "text-red-600 hover:text-red-700 hover:bg-red-50"
            )}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </td>
      )}
    </tr>
  )
}

// 🎯 COLLAPSIBLE FINANCE DASHBOARD - Structured sections with CRUD
export const CollapsibleFinanceDashboard: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(2025)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [originalValue, setOriginalValue] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    'entrate': true,
    'uscite': true,
    'differenza': true,
    'banche': true,
    'affidamenti': true
  })
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({})
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [zenMode, setZenMode] = useState(false)
  const [showCharts, setShowCharts] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { 
    loading, 
    error, 
    yearTotals, 
    categoryMonthlyData,
    categories,
    viewMode,
    saveEntry,
    createCategory,
    deleteCategory,
    exportData,
    importData,
    updateCategoryOrder,
    loadData
  } = useSupabaseFinance(selectedYear)

  // Supabase client per drag & drop
  const supabase = createClient(
    'https://udeavsfewakatewsphfw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZWF2c2Zld2FrYXRld3NwaGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTU2MzIsImV4cCI6MjA2OTI3MTYzMn0.7JuPSYEG-UoxvmYecVUgjWIAJ0PQYHeN2wiTnYp2NjY'
  )

  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
  
  // 🎯 Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )
  
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

  // Toggle all sections
  const toggleAllSections = (expand: boolean) => {
    const newState: { [key: string]: boolean } = {}
    Object.keys(expandedSections).forEach(key => {
      newState[key] = expand
    })
    setExpandedSections(newState)
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
    const valueString = currentValue.toString()
    setEditValue(valueString)
    setOriginalValue(valueString) // 🔧 Track original value for comparison
  }

  const handleCellSave = async () => {
    if (!editingCell) return
    
    const [categoryName, monthStr] = editingCell.split('-')
    const month = parseInt(monthStr)
    const value = parseFloat(editValue) || 0
    const originalValueNum = parseFloat(originalValue) || 0

    // 🔧 Only save if value actually changed
    if (value === originalValueNum) {
      // Value unchanged - just close editing mode without saving
      setEditingCell(null)
      setEditValue('')
      setOriginalValue('')
      return
    }

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
    setOriginalValue('')
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

  // 📊 Get category data by type (SORTED by sort_order)
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
      .sort((a, b) => a[1].sort_order - b[1].sort_order) // Sort by sort_order!
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

  // 🎯 Drag & Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      setActiveDragId(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    // Get the category type to ensure we're only reordering within the same type
    const activeCategory = categories[activeId]
    const overCategory = categories[overId]
    
    if (!activeCategory || !overCategory || activeCategory.type !== overCategory.type) {
      setActiveDragId(null)
      return
    }

    // Get all categories of the same type, sorted by sort_order
    const sameTypeCategories = getCategoriesByType(activeCategory.type)
    const activeIndex = sameTypeCategories.indexOf(activeId)
    const overIndex = sameTypeCategories.indexOf(overId)

    if (activeIndex === overIndex) {
      setActiveDragId(null)
      return
    }

    try {
      // Calculate new sort orders
      const activeSortOrder = categories[activeId].sort_order
      const overSortOrder = categories[overId].sort_order

      // Update both categories in database
      const { error: error1 } = await supabase
        .from('categories')
        .update({ sort_order: overSortOrder })
        .eq('name', activeId)

      const { error: error2 } = await supabase
        .from('categories')
        .update({ sort_order: activeSortOrder })
        .eq('name', overId)

      if (error1 || error2) {
        throw new Error(`Errore riordinamento: ${error1?.message || error2?.message}`)
      }

      toast({
        title: "✅ Ordine aggiornato",
        description: `${activeId} spostata con drag & drop`
      })

      // Reload data
      await loadData()

    } catch (err: unknown) {
      console.error('🚨 DRAG & DROP ERROR:', err)
      toast({
        title: "❌ Errore drag & drop",
        description: (err as Error)?.message || "Impossibile riordinare",
        variant: "destructive"
      })
    }

    setActiveDragId(null)
  }

  const totals = calculateTotals()

  if (loading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center transition-colors duration-300",
        darkMode ? "bg-gray-900" : "bg-slate-50"
      )}>
        <div className="text-center">
          <div className={cn(
            "w-12 h-12 rounded-full mx-auto mb-4 animate-pulse",
            darkMode ? "bg-blue-600" : "bg-blue-500"
          )}></div>
          <p className={cn("text-slate-600", darkMode ? "text-gray-300" : "")}>
            Caricamento dati {selectedYear}...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center transition-colors duration-300",
        darkMode ? "bg-gray-900" : "bg-slate-50"
      )}>
        <div className={cn(
          "text-center p-6 rounded-lg border",
          darkMode ? "bg-gray-800 border-red-800" : "bg-white border-red-200"
        )}>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Ricarica</Button>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn(
        "min-h-screen transition-all duration-300",
        darkMode ? "bg-gray-900" : "bg-slate-50",
        zenMode && "p-2 md:p-4"
      )}>
        <div className={cn(
          "mx-auto transition-all duration-300",
          zenMode ? "max-w-full" : "max-w-7xl p-4 md:p-6"
        )}>
          {/* 📊 HEADER - Responsive & Enhanced */}
          {!zenMode && (
          <div className={cn(
            "rounded-lg border p-4 md:p-6 mb-4 md:mb-6 transition-all duration-300",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"
          )}>
            {/* Top Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                {/* Mobile Menu Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
                
                <h1 className={cn(
                  "text-xl md:text-3xl font-light transition-all",
                  darkMode ? "text-gray-100" : "text-slate-800",
                  zenMode && "text-lg md:text-2xl"
                )}>
                  Dashboard Finanziaria
                </h1>
            </div>

            {/* Control Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCharts(!showCharts)}
                className={cn(
                  "transition-all",
                  darkMode && "border-gray-600 hover:bg-gray-700"
                )}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showCharts ? 'Nascondi' : 'Mostra'} Grafici
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAllSections(!Object.values(expandedSections).some(v => v))}
                className={cn(
                  "transition-all",
                  darkMode && "border-gray-600 hover:bg-gray-700"
                )}
              >
                {Object.values(expandedSections).some(v => v) ? 
                  <Minimize2 className="h-4 w-4 mr-2" /> : 
                  <Maximize2 className="h-4 w-4 mr-2" />
                }
                {Object.values(expandedSections).some(v => v) ? 'Chiudi' : 'Espandi'} Tutto
              </Button>
              
              <DataExportImportModal
                onExport={exportData}
                onImport={importData}
                exportFilename={`orti-finance-${selectedYear}`}
                darkMode={darkMode}
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZenMode(!zenMode)}
                className={cn(
                  "transition-all",
                  darkMode && "border-gray-600 hover:bg-gray-700"
                )}
              >
                {zenMode ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                Zen Mode
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className={cn(
                  "transition-all",
                  darkMode && "border-gray-600 hover:bg-gray-700"
                )}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t pt-4 mt-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCharts(!showCharts)}
                className="w-full justify-start"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showCharts ? 'Nascondi' : 'Mostra'} Grafici
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAllSections(!Object.values(expandedSections).some(v => v))}
                className="w-full justify-start"
              >
                {Object.values(expandedSections).some(v => v) ? 
                  <Minimize2 className="h-4 w-4 mr-2" /> : 
                  <Maximize2 className="h-4 w-4 mr-2" />
                }
                {Object.values(expandedSections).some(v => v) ? 'Chiudi' : 'Espandi'} Tutto
              </Button>
              
              <DataExportImportModal
                onExport={exportData}
                onImport={importData}
                exportFilename={`orti-finance-${selectedYear}`}
                darkMode={darkMode}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <FileJson className="h-4 w-4 mr-2" />
                    Import/Export
                  </Button>
                }
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZenMode(!zenMode)}
                className="w-full justify-start"
              >
                {zenMode ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                Zen Mode
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="w-full justify-start"
              >
                {darkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </Button>
            </div>
          )}

          {/* Company & Year Info */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className={cn("text-base md:text-lg", darkMode ? "text-gray-300" : "text-slate-600")}>
              ORTI {selectedYear}
            </div>
            
            {/* Year Selector - Responsive */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setSelectedYear(selectedYear - 1)}
                className={cn(
                  "flex-1 md:flex-initial",
                  darkMode && "border-gray-600 hover:bg-gray-700"
                )}
              >
                {selectedYear - 1}
              </Button>
              <div className={cn(
                "text-lg md:text-xl font-semibold px-4 py-2 rounded flex-1 md:flex-initial text-center",
                darkMode ? "bg-blue-900 text-blue-100" : "bg-blue-50"
              )}>
                {selectedYear}
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setSelectedYear(selectedYear + 1)}
                className={cn(
                  "flex-1 md:flex-initial",
                  darkMode && "border-gray-600 hover:bg-gray-700"
                )}
              >
                {selectedYear + 1}
              </Button>
            </div>
          </div>

          {/* Quick Totals - Responsive Grid */}
          {!zenMode && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className={cn(
                "text-center p-4 rounded-lg transition-all duration-300 hover:scale-105",
                darkMode ? "bg-green-900/30 hover:bg-green-900/40" : "bg-green-50 hover:bg-green-100"
              )}>
                <TrendingUp className={cn(
                  "w-8 h-8 mx-auto mb-2",
                  darkMode ? "text-green-400" : "text-green-600"
                )} />
                <div className={cn(
                  "text-sm mb-1",
                  darkMode ? "text-green-400" : "text-green-600"
                )}>
                  Totale Entrate
                </div>
                <div className={cn(
                  "text-xl md:text-2xl font-semibold",
                  darkMode ? "text-green-300" : "text-green-700"
                )}>
                  {formatCurrency(totals.entrate)}
                </div>
              </div>
              
              <div className={cn(
                "text-center p-4 rounded-lg transition-all duration-300 hover:scale-105",
                darkMode ? "bg-red-900/30 hover:bg-red-900/40" : "bg-red-50 hover:bg-red-100"
              )}>
                <TrendingDown className={cn(
                  "w-8 h-8 mx-auto mb-2",
                  darkMode ? "text-red-400" : "text-red-600"
                )} />
                <div className={cn(
                  "text-sm mb-1",
                  darkMode ? "text-red-400" : "text-red-600"
                )}>
                  Totale Uscite
                </div>
                <div className={cn(
                  "text-xl md:text-2xl font-semibold",
                  darkMode ? "text-red-300" : "text-red-700"
                )}>
                  {formatCurrency(totals.uscite)}
                </div>
              </div>
              
              <div className={cn(
                "text-center p-4 rounded-lg transition-all duration-300 hover:scale-105",
                darkMode ? "bg-blue-900/30 hover:bg-blue-900/40" : "bg-blue-50 hover:bg-blue-100"
              )}>
                <Target className={cn(
                  "w-8 h-8 mx-auto mb-2",
                  darkMode ? "text-blue-400" : "text-blue-600"
                )} />
                <div className={cn(
                  "text-sm mb-1",
                  darkMode ? "text-blue-400" : "text-blue-600"
                )}>
                  Differenza
                </div>
                <div className={cn(
                  "text-xl md:text-2xl font-semibold",
                  totals.differenza >= 0 
                    ? darkMode ? "text-green-300" : "text-green-700"
                    : darkMode ? "text-red-300" : "text-red-700"
                )}>
                  {formatCurrency(totals.differenza)}
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Zen Mode Header - Minimal */}
        {zenMode && (
          <div className="flex items-center justify-between mb-4 px-2">
            <h1 className={cn(
              "text-lg font-light",
              darkMode ? "text-gray-100" : "text-slate-800"
            )}>
              Dashboard Finanziaria {selectedYear}
            </h1>
            <div className="flex items-center gap-2">
              <DataExportImportModal
                onExport={exportData}
                onImport={importData}
                exportFilename={`orti-finance-${selectedYear}`}
                darkMode={darkMode}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZenMode(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}



        {/* 💰 SEZIONE ENTRATE */}
        <Card className={cn(
          "mb-4 md:mb-6 transition-all duration-300 overflow-hidden",
          darkMode ? "bg-gray-800 border-gray-700" : "",
          zenMode && "shadow-sm border-0"
        )}>
          <CardHeader 
            className={cn(
              "cursor-pointer transition-all duration-300",
              darkMode ? "bg-green-900/20 hover:bg-green-900/30" : "bg-green-50 hover:bg-green-100",
              zenMode && "py-3"
            )}
            onClick={() => toggleSection('entrate')}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <div className={cn(
                  "transition-transform duration-300",
                  expandedSections.entrate && "rotate-90"
                )}>
                  <ChevronRight className="w-5 h-5" />
                </div>
                <TrendingUp className={cn(
                  "w-6 h-6",
                  darkMode ? "text-green-400" : "text-green-600"
                )} />
                <div className="flex-1 md:flex-initial">
                  <h2 className={cn(
                    "text-lg md:text-xl font-semibold",
                    darkMode ? "text-green-300" : "text-green-700"
                  )}>
                    TOTALE ENTRATE
                  </h2>
                  <div className={cn(
                    "text-sm md:text-base",
                    darkMode ? "text-green-400" : "text-green-600"
                  )}>
                    {formatCurrency(totals.entrate)}
                  </div>
                </div>
              </div>
              
              {!zenMode && (
                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <Input
                    placeholder="Nome nuova entrata..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className={cn(
                      "flex-1 md:w-48",
                      darkMode && "bg-gray-700 border-gray-600 text-gray-100"
                    )}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation()
                        handleAddCategory('revenue')
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddCategory('revenue')
                    }}
                    className={cn(
                      "whitespace-nowrap",
                      darkMode ? "bg-green-700 hover:bg-green-600" : "bg-green-600 hover:bg-green-700"
                    )}
                  >
                    <Plus className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Aggiungi</span>
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          
          <div className={cn(
            "transition-all duration-500 ease-in-out",
            expandedSections.entrate ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
          )}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={cn(
                      "border-b",
                      darkMode ? "bg-gray-700/50 border-gray-700" : "bg-slate-50"
                    )}>
                      <th className={cn(
                        "text-left p-3 md:p-4 font-medium sticky left-0 z-10",
                        darkMode ? "text-gray-300 bg-gray-800" : "text-slate-700 bg-white"
                      )}>
                        Categoria
                      </th>
                      {months.map((month) => (
                        <th key={month} className={cn(
                          "text-center p-2 font-medium min-w-[70px] md:min-w-[80px]",
                          darkMode ? "text-gray-300" : "text-slate-700"
                        )}>
                          <span className="hidden md:inline">{month}</span>
                          <span className="md:hidden">{month.slice(0, 1)}</span>
                        </th>
                      ))}
                      {!zenMode && <th className="w-16 md:w-20"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    <SortableContext
                      items={getCategoriesByType('revenue')}
                      strategy={verticalListSortingStrategy}
                    >
                      {getCategoriesByType('revenue').map((categoryName, index) => (
                        <DraggableCategoryRow
                          key={categoryName}
                          categoryName={categoryName}
                          index={index}
                          categoryType="revenue"
                          months={months}
                          editingCell={editingCell}
                          editValue={editValue}
                          expandedCategories={expandedCategories}
                          darkMode={darkMode}
                          zenMode={zenMode}
                          onCellClick={handleCellClick}
                          onCellSave={handleCellSave}
                          onToggleDetails={toggleCategoryDetails}
                          onDeleteCategory={handleDeleteCategory}
                          getCellValue={getCellValue}
                          formatCurrency={formatCurrency}
                          setEditValue={setEditValue}
                          setEditingCell={setEditingCell}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* 💸 SEZIONE USCITE */}
        <Card className={cn(
          "mb-4 md:mb-6 transition-all duration-300 overflow-hidden",
          darkMode ? "bg-gray-800 border-gray-700" : "",
          zenMode && "shadow-sm border-0"
        )}>
          <CardHeader 
            className={cn(
              "cursor-pointer transition-all duration-300",
              darkMode ? "bg-red-900/20 hover:bg-red-900/30" : "bg-red-50 hover:bg-red-100",
              zenMode && "py-3"
            )}
            onClick={() => toggleSection('uscite')}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <div className={cn(
                  "transition-transform duration-300",
                  expandedSections.uscite && "rotate-90"
                )}>
                  <ChevronRight className="w-5 h-5" />
                </div>
                <TrendingDown className={cn(
                  "w-6 h-6",
                  darkMode ? "text-red-400" : "text-red-600"
                )} />
                <div className="flex-1 md:flex-initial">
                  <h2 className={cn(
                    "text-lg md:text-xl font-semibold",
                    darkMode ? "text-red-300" : "text-red-700"
                  )}>
                    TOTALE USCITE
                  </h2>
                  <div className={cn(
                    "text-sm md:text-base",
                    darkMode ? "text-red-400" : "text-red-600"
                  )}>
                    {formatCurrency(totals.uscite)}
                  </div>
                </div>
              </div>
              
              {!zenMode && (
                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <Input
                    placeholder="Nome nuova uscita..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className={cn(
                      "flex-1 md:w-48",
                      darkMode && "bg-gray-700 border-gray-600 text-gray-100"
                    )}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation()
                        handleAddCategory('expense')
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddCategory('expense')
                    }}
                    className={cn(
                      "whitespace-nowrap",
                      darkMode ? "bg-red-700 hover:bg-red-600" : "bg-red-600 hover:bg-red-700"
                    )}
                  >
                    <Plus className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Aggiungi</span>
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          
          <div className={cn(
            "transition-all duration-500 ease-in-out",
            expandedSections.uscite ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
          )}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={cn(
                      "border-b",
                      darkMode ? "bg-gray-700/50 border-gray-700" : "bg-slate-50"
                    )}>
                      <th className={cn(
                        "text-left p-3 md:p-4 font-medium sticky left-0 z-10",
                        darkMode ? "text-gray-300 bg-gray-800" : "text-slate-700 bg-white"
                      )}>
                        Categoria
                      </th>
                      {months.map((month) => (
                        <th key={month} className={cn(
                          "text-center p-2 font-medium min-w-[70px] md:min-w-[80px]",
                          darkMode ? "text-gray-300" : "text-slate-700"
                        )}>
                          <span className="hidden md:inline">{month}</span>
                          <span className="md:hidden">{month.slice(0, 1)}</span>
                        </th>
                      ))}
                      {!zenMode && <th className="w-16 md:w-20"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    <SortableContext
                      items={getCategoriesByType('expense')}
                      strategy={verticalListSortingStrategy}
                    >
                      {getCategoriesByType('expense').map((categoryName, index) => (
                        <DraggableCategoryRow
                          key={categoryName}
                          categoryName={categoryName}
                          index={index}
                          categoryType="expense"
                          months={months}
                          editingCell={editingCell}
                          editValue={editValue}
                          expandedCategories={expandedCategories}
                          darkMode={darkMode}
                          zenMode={zenMode}
                          onCellClick={handleCellClick}
                          onCellSave={handleCellSave}
                          onToggleDetails={toggleCategoryDetails}
                          onDeleteCategory={handleDeleteCategory}
                          getCellValue={getCellValue}
                          formatCurrency={formatCurrency}
                          setEditValue={setEditValue}
                          setEditingCell={setEditingCell}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* ⚖️ DIFFERENZA */}
        <Card className={cn(
          "mb-4 md:mb-6 transition-all duration-300 overflow-hidden",
          darkMode ? "bg-gray-800 border-gray-700" : "",
          zenMode && "shadow-sm border-0"
        )}>
          <CardHeader 
            className={cn(
              "cursor-pointer transition-all duration-300",
              darkMode ? "bg-blue-900/20 hover:bg-blue-900/30" : "bg-blue-50 hover:bg-blue-100",
              zenMode && "py-3"
            )}
            onClick={() => toggleSection('differenza')}
          >
            <div className="flex items-center space-x-3">
              <div className={cn(
                "transition-transform duration-300",
                expandedSections.differenza && "rotate-90"
              )}>
                <ChevronRight className="w-5 h-5" />
              </div>
              <Calculator className={cn(
                "w-6 h-6",
                darkMode ? "text-blue-400" : "text-blue-600"
              )} />
              <div>
                <h2 className={cn(
                  "text-lg md:text-xl font-semibold",
                  darkMode ? "text-blue-300" : "text-blue-700"
                )}>
                  DIFF. ENTRATE - USCITE
                </h2>
                <div className={cn(
                  totals.differenza >= 0 
                    ? darkMode ? "text-green-400" : "text-green-600"
                    : darkMode ? "text-red-400" : "text-red-600"
                )}>
                  {formatCurrency(totals.differenza)}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <div className={cn(
            "transition-all duration-500 ease-in-out",
            expandedSections.differenza ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
          )}>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2 md:gap-4">
                {months.map((month, index) => {
                  const entrateMonth = getCategoriesByType('revenue').reduce((sum, cat) => {
                    return sum + getCellValue(cat, index + 1)
                  }, 0)
                  const usciteMonth = getCategoriesByType('expense').reduce((sum, cat) => {
                    return sum + getCellValue(cat, index + 1)
                  }, 0)
                  const diffMonth = entrateMonth - usciteMonth
                  
                  return (
                    <div key={month} className={cn(
                      "p-2 md:p-3 rounded-lg text-center transition-all duration-300 hover:scale-105",
                      darkMode ? "bg-gray-700" : "bg-slate-50"
                    )}>
                      <div className={cn(
                        "text-xs md:text-sm mb-1",
                        darkMode ? "text-gray-400" : "text-slate-600"
                      )}>
                        {month}
                      </div>
                      <div className={cn(
                        "text-sm md:text-base font-semibold",
                        diffMonth >= 0 
                          ? darkMode ? "text-green-400" : "text-green-600"
                          : darkMode ? "text-red-400" : "text-red-600"
                      )}>
                        {formatCurrency(diffMonth)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </div>
        </Card>

        {/* 📊 GRAFICI - Se attivati */}
        {showCharts && !zenMode && (
          <Card className={cn(
            "mb-4 md:mb-6 transition-all duration-300",
            darkMode ? "bg-gray-800 border-gray-700" : ""
          )}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <BarChart3 className={cn(
                  "w-6 h-6",
                  darkMode ? "text-purple-400" : "text-purple-600"
                )} />
                <h2 className={cn(
                  "text-lg md:text-xl font-semibold",
                  darkMode ? "text-purple-300" : "text-purple-700"
                )}>
                  ANDAMENTO ANNUALE
                </h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Grafico a barre semplice */}
                <div>
                  <h3 className={cn(
                    "text-sm font-medium mb-3",
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    Confronto Mensile
                  </h3>
                  <div className="relative h-48 md:h-64">
                    <div className="absolute inset-0 flex items-end justify-between gap-1">
                      {months.map((_, index) => {
                        const entrateMonth = getCategoriesByType('revenue').reduce((sum, cat) => {
                          return sum + getCellValue(cat, index + 1)
                        }, 0)
                        const usciteMonth = getCategoriesByType('expense').reduce((sum, cat) => {
                          return sum + getCellValue(cat, index + 1)
                        }, 0)
                        const maxValue = Math.max(...months.map((_, i) => {
                          const e = getCategoriesByType('revenue').reduce((s, c) => s + getCellValue(c, i + 1), 0)
                          const u = getCategoriesByType('expense').reduce((s, c) => s + getCellValue(c, i + 1), 0)
                          return Math.max(e, u)
                        }))
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex gap-1">
                              <div
                                className={cn(
                                  "flex-1 rounded-t transition-all duration-500",
                                  darkMode ? "bg-green-500" : "bg-green-600"
                                )}
                                style={{
                                  height: `${(entrateMonth / maxValue) * 100}%`,
                                  minHeight: entrateMonth > 0 ? '4px' : '0'
                                }}
                              />
                              <div
                                className={cn(
                                  "flex-1 rounded-t transition-all duration-500",
                                  darkMode ? "bg-red-500" : "bg-red-600"
                                )}
                                style={{
                                  height: `${(usciteMonth / maxValue) * 100}%`,
                                  minHeight: usciteMonth > 0 ? '4px' : '0'
                                }}
                              />
                            </div>
                            <div className={cn(
                              "text-xs",
                              darkMode ? "text-gray-400" : "text-gray-600"
                            )}>
                              {months[index].slice(0, 1)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-3 h-3 rounded",
                        darkMode ? "bg-green-500" : "bg-green-600"
                      )} />
                      <span className={cn(
                        "text-sm",
                        darkMode ? "text-gray-300" : "text-gray-600"
                      )}>Entrate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-3 h-3 rounded",
                        darkMode ? "bg-red-500" : "bg-red-600"
                      )} />
                      <span className={cn(
                        "text-sm",
                        darkMode ? "text-gray-300" : "text-gray-600"
                      )}>Uscite</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 🏦 TOTALE BANCHE & CASH FLOW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          <Card className={cn(
            "transition-all duration-300",
            darkMode ? "bg-gray-800 border-gray-700" : ""
          )}>
            <CardHeader className={cn(
              "cursor-pointer transition-all duration-300",
              darkMode ? "bg-purple-900/20 hover:bg-purple-900/30" : "bg-purple-50 hover:bg-purple-100"
            )}>
              <div className="flex items-center space-x-3">
                <Banknote className={cn(
                  "w-6 h-6",
                  darkMode ? "text-purple-400" : "text-purple-600"
                )} />
                <div>
                  <h3 className={cn(
                    "text-base md:text-lg font-semibold",
                    darkMode ? "text-purple-300" : "text-purple-700"
                  )}>
                    TOTALE BANCHE
                  </h3>
                  <div className={cn(
                    "text-sm",
                    darkMode ? "text-purple-400" : "text-purple-600"
                  )}>
                    Saldi bancari consolidati
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className={cn(
              "space-y-3",
              darkMode ? "text-gray-300" : ""
            )}>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Saldo MPS:</span>
                  <span className="font-medium">€0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Saldo Intesa:</span>
                  <span className="font-medium">€0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Saldo Banca Sella:</span>
                  <span className="font-medium">€0</span>
                </div>
                <hr className={darkMode ? "border-gray-700" : ""} />
                <div className="flex justify-between items-center font-semibold text-base md:text-lg">
                  <span>Totale:</span>
                  <span className={darkMode ? "text-purple-400" : "text-purple-600"}>€0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "transition-all duration-300",
            darkMode ? "bg-gray-800 border-gray-700" : ""
          )}>
            <CardHeader className={cn(
              "cursor-pointer transition-all duration-300",
              darkMode ? "bg-indigo-900/20 hover:bg-indigo-900/30" : "bg-indigo-50 hover:bg-indigo-100"
            )}>
              <div className="flex items-center space-x-3">
                <TrendingUp className={cn(
                  "w-6 h-6",
                  darkMode ? "text-indigo-400" : "text-indigo-600"
                )} />
                <div>
                  <h3 className={cn(
                    "text-base md:text-lg font-semibold",
                    darkMode ? "text-indigo-300" : "text-indigo-700"
                  )}>
                    CASH FLOW
                  </h3>
                  <div className={cn(
                    "text-sm",
                    darkMode ? "text-indigo-400" : "text-indigo-600"
                  )}>
                    Flusso di cassa
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className={cn(
              "space-y-3",
              darkMode ? "text-gray-300" : ""
            )}>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cassa Contanti:</span>
                  <span className="font-medium">€0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cash Flow:</span>
                  <span className={cn(
                    "font-medium",
                    totals.differenza >= 0 
                      ? darkMode ? "text-green-400" : "text-green-600"
                      : darkMode ? "text-red-400" : "text-red-600"
                  )}>
                    {formatCurrency(totals.differenza)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Totale Affidamenti:</span>
                  <span className="font-medium">€0</span>
                </div>
                <hr className={darkMode ? "border-gray-700" : ""} />
                <div className="flex justify-between items-center font-semibold text-base md:text-lg">
                  <span>Cash Flow con Affid.:</span>
                  <span className={cn(
                    totals.differenza >= 0 
                      ? darkMode ? "text-green-400" : "text-green-600"
                      : darkMode ? "text-red-400" : "text-red-600"
                  )}>
                    {formatCurrency(totals.differenza)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDragId ? (
          <div className="bg-white border border-slate-200 rounded px-4 py-2 shadow-lg">
            <div className="flex items-center space-x-2">
              <GripVertical className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-700">{activeDragId}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </div>
    </DndContext>
  )
}