import React, { useState, useMemo } from 'react'
import { useSupabaseFinance } from '@/hooks/useSupabaseFinance'
import { supabase } from '@/lib/supabase' // 🌍 Global shared client
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { 
  ChevronDown, 
  ChevronUp,
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
  FileJson,
  Filter,
  CheckCircle2,
  Circle,
  Clock
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { DataExportImportModal } from '@/components/DataExportImportModal'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { MobileDataCard } from '@/components/MobileDataCard'
import { MobileChart } from '@/components/MobileChart'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
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
// Removed: createClient import - using global client instead

// 🎯 SUBCATEGORY ROW COMPONENT (no drag and drop)
const SubcategoryRow: React.FC<{
  categoryName: string
  subcategoryName: string
  index: number
  categoryType: 'revenue' | 'expense' | 'balance'
  months: string[]
  editingCell: string | null
  editValue: string
  darkMode: boolean
  zenMode: boolean
  onCellClick: (categoryName: string, subcategoryName: string, month: number) => void
  onCellSave: () => void
  onDeleteSubcategory?: (categoryName: string, subcategoryName: string) => void
  onMoveSubcategory?: (categoryName: string, subcategoryName: string, direction: 'up' | 'down') => void
  getSubcategoryCellValue: (categoryName: string, subcategoryName: string, month: number) => number
  formatCurrency: (value: number) => string
  setEditValue: (value: string) => void
  setEditingCell: (cellId: string | null) => void
  calculateSubcategoryYearlyTotal: (categoryName: string, subcategoryName: string) => number
}> = ({
  categoryName,
  subcategoryName,
  index,
  categoryType,
  months,
  editingCell,
  editValue,
  darkMode,
  zenMode,
  onCellClick,
  onCellSave,
  onDeleteSubcategory,
  onMoveSubcategory,
  getSubcategoryCellValue,
  formatCurrency,
  setEditValue,
  setEditingCell,
  calculateSubcategoryYearlyTotal
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${categoryName}::${subcategoryName}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  const colorClass = categoryType === 'revenue' 
    ? (darkMode ? 'text-green-300' : 'text-green-600')
    : categoryType === 'balance'
    ? (darkMode ? 'text-purple-300' : 'text-purple-600')
    : (darkMode ? 'text-red-300' : 'text-red-600')

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b transition-all duration-200 bg-opacity-50",
        darkMode 
          ? "hover:bg-gray-700/20 border-gray-700 bg-gray-800/20" 
          : "hover:bg-slate-50/50 border-slate-100 bg-slate-50/20",
        index % 2 === 0 && (darkMode ? "bg-gray-800/10" : "bg-slate-50/10"),
        isDragging && (darkMode ? 'bg-gray-700/40' : 'bg-slate-100/60')
      )}
    >
      <td className={cn(
        "p-3 font-medium sticky left-0 z-10 pl-8",
        darkMode ? "text-gray-300 bg-gray-800/80" : "text-slate-600 bg-white/80"
      )}>
        <div className="flex items-center space-x-2">
          <span className="text-xs">├─</span>
          
          {/* 🎯 Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className={cn(
              "cursor-grab active:cursor-grabbing p-1 rounded transition-colors opacity-60 hover:opacity-100",
              darkMode ? "hover:bg-gray-600" : "hover:bg-slate-200"
            )}
          >
            <GripVertical className="w-3 h-3 text-gray-400" />
          </div>
          
          <span className={cn("text-sm", colorClass)}>{subcategoryName}</span>
          
          {/* 📱 Mobile Reorder Buttons */}
          {onMoveSubcategory && (
            <div className="md:hidden flex space-x-1 ml-auto">
              <button
                onClick={() => onMoveSubcategory(categoryName, subcategoryName, 'up')}
                className={cn(
                  "p-1 rounded transition-colors",
                  darkMode ? "hover:bg-gray-600 text-gray-400" : "hover:bg-slate-200 text-slate-500"
                )}
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => onMoveSubcategory(categoryName, subcategoryName, 'down')}
                className={cn(
                  "p-1 rounded transition-colors",
                  darkMode ? "hover:bg-gray-600 text-gray-400" : "hover:bg-slate-200 text-slate-500"
                )}
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </td>

      {/* Month cells */}
      {months.map((_, monthIndex) => {
        const month = monthIndex + 1
        const cellId = `${categoryName}-${subcategoryName}-${month}`
        const value = getSubcategoryCellValue(categoryName, subcategoryName, month)
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
                onClick={() => onCellClick(categoryName, subcategoryName, month)}
                className={cn(
                  "w-full h-7 md:h-8 text-xs md:text-sm rounded px-1 md:px-2 transition-all group",
                  darkMode ? "hover:bg-gray-600" : "hover:bg-slate-200",
                  colorClass
                )}
              >
                {formatCurrency(value)}
              </button>
            )}
          </td>
        )
      })}

      {/* Yearly Total Cell */}
      <td className={cn(
        "p-1 md:p-2 text-center font-semibold border-l-2",
        categoryType === 'revenue' 
          ? (darkMode ? "border-green-600/30" : "border-green-500/30")
          : categoryType === 'balance'
          ? (darkMode ? "border-purple-600/30" : "border-purple-500/30")
          : (darkMode ? "border-red-600/30" : "border-red-500/30")
      )}>
        <span className={cn("text-sm", colorClass)}>
          {formatCurrency(calculateSubcategoryYearlyTotal(categoryName, subcategoryName))}
        </span>
      </td>

      {!zenMode && (
        <td className="p-2 text-center">
          {onDeleteSubcategory && (
            <button
              onClick={() => onDeleteSubcategory(categoryName, subcategoryName)}
              className={cn(
                "p-1 rounded transition-colors opacity-60 hover:opacity-100",
                darkMode ? "hover:bg-red-700/30 text-red-400" : "hover:bg-red-100 text-red-600"
              )}
              title={`Cancella sottocategoria "${subcategoryName}"`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </td>
      )}
    </tr>
  )
}

// 🎯 DRAGGABLE CATEGORY ROW COMPONENT
const DraggableCategoryRow: React.FC<{
  categoryName: string
  index: number
  categoryType: 'revenue' | 'expense' | 'balance'
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
  getCategoryValidationStatus?: (categoryName: string) => { hasIssues: boolean; issueMonths: number[] }
  validateCategoryMonth?: (categoryName: string, month: number) => { isValid: boolean; difference: number; categoryTotal: number; subcategorySum: number }
  calculateCategoryYearlyTotal: (categoryName: string) => number
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
  setEditingCell,
  getCategoryValidationStatus,
  validateCategoryMonth,
  calculateCategoryYearlyTotal
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
    : categoryType === 'balance'
    ? (darkMode ? 'text-purple-400' : 'text-purple-700')
    : (darkMode ? 'text-red-400' : 'text-red-700')
  const bgColorClass = categoryType === 'revenue' 
    ? (darkMode ? 'hover:bg-green-900/30' : 'hover:bg-green-50')
    : categoryType === 'balance'
    ? (darkMode ? 'hover:bg-purple-900/30' : 'hover:bg-purple-50')
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
          
          {(categoryType === 'revenue' || categoryType === 'expense') && (
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
          
          <span className="flex-1 flex items-center gap-2">
            {categoryName}
            {getCategoryValidationStatus && (() => {
              const validation = getCategoryValidationStatus(categoryName)
              if (validation.hasIssues) {
                return (
                  <span 
                    className="text-yellow-500 text-xs"
                    title={`Problemi di validazione nei mesi: ${validation.issueMonths.join(', ')}`}
                  >
                    ⚠️
                  </span>
                )
              }
              return null
            })()}
          </span>
        </div>
      </td>

      {/* Month cells */}
      {months.map((_, monthIndex) => {
        const month = monthIndex + 1
        const cellId = `${categoryName}-${month}`
        const value = getCellValue(categoryName, month)
        const isEditing = editingCell === cellId
        
        // Check validation for this specific month
        const hasValidationIssue = validateCategoryMonth && (() => {
          const validation = validateCategoryMonth(categoryName, month)
          // 🎯 Solo mostra warning se ci sono sottocategorie con dati E c'è discrepanza
          return validation.hasSubcategories && !validation.isValid
        })()
        
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
                  "w-full h-7 md:h-8 text-xs md:text-sm rounded px-1 md:px-2 transition-all group relative",
                  darkMode ? "hover:bg-gray-700" : "hover:bg-slate-100",
                  value > 0 && "font-medium",
                  hasValidationIssue && "ring-1 ring-yellow-400"
                )}
                title={hasValidationIssue ? "⚠️ Discrepanza con sottocategorie" : ""}
              >
                {value === 0 ? (
                  <span className={darkMode ? "text-gray-500" : "text-slate-400"}>−</span>
                ) : (
                  <span className={cn("font-medium", colorClass)}>{formatCurrency(value)}</span>
                )}
                {hasValidationIssue && (
                  <span className="absolute -top-1 -right-1 text-yellow-500 text-xs">⚠️</span>
                )}
                {!zenMode && (
                  <Edit3 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-50 transition-opacity inline" />
                )}
              </button>
            )}
          </td>
        )
      })}

      {/* Yearly Total Cell */}
      <td className={cn(
        "p-1 md:p-2 text-center font-bold border-l-2",
        categoryType === 'revenue' 
          ? (darkMode ? "border-green-600/50" : "border-green-500/50")
          : categoryType === 'balance'
          ? (darkMode ? "border-purple-600/50" : "border-purple-500/50")
          : (darkMode ? "border-red-600/50" : "border-red-500/50")
      )}>
        <span className={cn("font-bold", colorClass)}>
          {formatCurrency(calculateCategoryYearlyTotal(categoryName))}
        </span>
      </td>

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
  const [viewFilter, setViewFilter] = useState<'all' | 'consolidated' | 'projections'>('all')
  const [showMobileExportModal, setShowMobileExportModal] = useState(false)
  
  // Refs for scroll navigation
  const headerRef = React.useRef<HTMLDivElement>(null)
  const entrateRef = React.useRef<HTMLDivElement>(null)
  const usciteRef = React.useRef<HTMLDivElement>(null)
  const differenzaRef = React.useRef<HTMLDivElement>(null)

    const {
    loading, 
    error, 
    yearTotals, 
    categoryMonthlyData,
    categories,
    subcategories,
    subcategoryMonthlyData,
    viewMode,
    setViewMode,
    saveEntry,
    createCategory,
    deleteCategory,
    exportData,
    importData,
    updateCategoryOrder,
    updateCategoriesOrderOptimistic,
    updateSubcategoriesOrderOptimistic,
    loadData
  } = useSupabaseFinance(selectedYear)

  // 🔗 Sync viewFilter with viewMode from hook
  React.useEffect(() => {
    if (viewFilter === 'all') {
      setViewMode('combined')
    } else if (viewFilter === 'consolidated') {
      setViewMode('consolidated')  
    } else if (viewFilter === 'projections') {
      setViewMode('projections')
    }
  }, [viewFilter, setViewMode])

  // 🌍 Global Supabase client - no more multiple instances!
  // Import moved to top level to use shared singleton

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

  // 💰 Format currency compact (for non-zen mode)
  const formatCurrencyCompact = (value: number) => {
    if (value === 0) return '−'
    
    const absValue = Math.abs(value)
    const sign = value < 0 ? '-' : ''
    
    if (absValue >= 1000000) {
      return `${sign}${(absValue / 1000000).toFixed(1)}M€`
    } else if (absValue >= 1000) {
      return `${sign}${(absValue / 1000).toFixed(0)}k€`
    } else {
      return `${sign}${absValue.toFixed(0)}€`
    }
  }

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
    // 🧮 Check if category value is calculated from subcategories
    const subcategoryList = getSubcategoriesList(categoryName)
    let subcategorySum = 0
    let hasSubcategoryData = false
    
    if (subcategoryList.length > 0) {
      subcategorySum = subcategoryList.reduce((sum, subName) => {
        const subValue = getSubcategoryCellValue(categoryName, subName, month)
        if (subValue > 0) hasSubcategoryData = true
        return sum + subValue
      }, 0)
    }
    
    if (hasSubcategoryData) {
      toast({
        title: "🧮 Valore calcolato automaticamente",
        description: `"${categoryName}" per questo mese mostra la somma delle sottocategorie (${subcategorySum.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}). Espandi per modificare i dettagli.`,
      })
      return
    }
    
    const cellId = `${categoryName}-${month}`
    setEditingCell(cellId)
    const currentValue = getCellValue(categoryName, month)
    const valueString = currentValue.toString()
    setEditValue(valueString)
    setOriginalValue(valueString) // 🔧 Track original value for comparison
  }

  // 🔍 Handle subcategory cell click (now editable!)
  const handleSubcategoryCellClick = (categoryName: string, subcategoryName: string, month: number) => {
    const cellId = `${categoryName}-${subcategoryName}-${month}`
    setEditingCell(cellId)
    const currentValue = getSubcategoryCellValue(categoryName, subcategoryName, month)
    const valueString = currentValue.toString()
    setEditValue(valueString)
    setOriginalValue(valueString)
  }

  const handleCellSave = async () => {
    if (!editingCell) return
    
    const cellParts = editingCell.split('-')
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
      // 🎯 Intelligent projection detection
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      
      let categoryName: string
      let subcategoryName: string | undefined
      let month: number
      
      if (cellParts.length === 2) {
        // Format: "CategoryName-Month" (main category)
        [categoryName, month] = [cellParts[0], parseInt(cellParts[1])]
      } else if (cellParts.length === 3) {
        // Format: "CategoryName-SubcategoryName-Month" (subcategory)
        [categoryName, subcategoryName, month] = [cellParts[0], cellParts[1], parseInt(cellParts[2])]
      } else {
        throw new Error(`Invalid cell ID format: ${editingCell}`)
      }
      
      // Logic: future months = projections, past/current = consolidated
      const isProjection = (selectedYear > currentYear) || 
                          (selectedYear === currentYear && month > currentMonth)
      
      if (subcategoryName) {
        // 🔍 Save subcategory entry
        await saveEntry({
          categoryName: categoryName,
          subcategoryName: subcategoryName, 
          month,
          value,
          isProjection
        })
        
        // ⚠️ Validate after saving (solo se ci sono sottocategorie con dati)
        setTimeout(() => {
          const validation = validateCategoryMonth(categoryName, month)
          if (validation.hasSubcategories && !validation.isValid) {
            toast({
              title: "⚠️ Validazione",
              description: `ATTENZIONE: La somma delle sottocategorie (${validation.subcategorySum.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}) non corrisponde al totale di "${categoryName}" (${validation.categoryTotal.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })})`,
              variant: "destructive"
            })
          } else {
            toast({
              title: "✅ Sottocategoria aggiornata",
              description: `${subcategoryName} (${categoryName}) - ${month}/${selectedYear}: ${value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} ✓`
            })
          }
        }, 500) // Delay to allow data refresh
      } else {
        // 🎯 Save main category entry
        await saveEntry({
          categoryName: categoryName,
          month,
          value,
          isProjection
        })
        
        toast({
          title: "✅ Categoria aggiornata", 
          description: `${categoryName} - ${month}/${selectedYear}: ${value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}`
        })
      }
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
    // 🧮 Check if we should calculate from subcategories
    const subcategoryList = getSubcategoriesList(categoryName)
    let hasSubcategoryData = false
    let subcategorySum = 0
    
    if (subcategoryList.length > 0) {
      subcategorySum = subcategoryList.reduce((sum, subName) => {
        const subValue = getSubcategoryCellValue(categoryName, subName, month)
        if (subValue > 0) hasSubcategoryData = true
        return sum + subValue
      }, 0)
    }
    
    // 🎯 Se ci sono sottocategorie con dati, usa la loro somma
    if (hasSubcategoryData) {
      return subcategorySum
    }
    
    // 🎯 Altrimenti usa il valore della categoria principale
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

  // 🔍 Get subcategory cell value based on view mode
  const getSubcategoryCellValue = (categoryName: string, subcategoryName: string, month: number): number => {
    const subcategoryMonthData = subcategoryMonthlyData?.[categoryName]?.[subcategoryName]?.[month]
    if (!subcategoryMonthData) return 0
    
    switch (viewMode) {
      case 'consolidated':
        return subcategoryMonthData.consolidated
      case 'projections':
        return subcategoryMonthData.projections
      case 'combined':
      default:
        return subcategoryMonthData.consolidated + subcategoryMonthData.projections
    }
  }

  // 📊 Calculate yearly total for a category
  const calculateCategoryYearlyTotal = (categoryName: string): number => {
    let total = 0
    for (let month = 1; month <= 12; month++) {
      total += getCellValue(categoryName, month)
    }
    return total
  }

  // 📊 Calculate yearly total for a subcategory
  const calculateSubcategoryYearlyTotal = (categoryName: string, subcategoryName: string): number => {
    let total = 0
    for (let month = 1; month <= 12; month++) {
      total += getSubcategoryCellValue(categoryName, subcategoryName, month)
    }
    return total
  }

  // 🧮 Check if category has subcategories with data
  const hasSubcategoryData = (categoryName: string): boolean => {
    const categorySubcategories = subcategories?.[categoryName]
    if (!categorySubcategories) return false
    
    return Object.keys(categorySubcategories).some(subName => {
      const subData = categorySubcategories[subName]
      return subData.consolidated > 0 || subData.projections > 0
    })
  }

  // 🔍 Validate that subcategory totals match category total for a specific month
  const validateCategoryMonth = (categoryName: string, month: number): { isValid: boolean; difference: number; categoryTotal: number; subcategorySum: number; hasSubcategories: boolean } => {
    const categoryTotal = getCellValue(categoryName, month)
    
    const subcategoryList = getSubcategoriesList(categoryName)
    
    // 🎯 Se non ci sono sottocategorie, è sempre valido
    if (subcategoryList.length === 0) {
      return {
        isValid: true,
        difference: 0,
        categoryTotal,
        subcategorySum: 0,
        hasSubcategories: false
      }
    }
    
    // Controlla se le sottocategorie hanno effettivamente dei dati
    const subcategorySum = subcategoryList.reduce((sum, subName) => {
      return sum + getSubcategoryCellValue(categoryName, subName, month)
    }, 0)
    
    // 🎯 Se le sottocategorie sono tutte a zero, non validare (categoria normale)
    if (subcategorySum === 0) {
      return {
        isValid: true,
        difference: 0,
        categoryTotal,
        subcategorySum: 0,
        hasSubcategories: false
      }
    }
    
    // 🎯 Solo se ci sono sottocategorie con dati, allora valida
    const difference = Math.abs(categoryTotal - subcategorySum)
    
    return {
      isValid: difference < 0.01, // Allow for small rounding errors
      difference,
      categoryTotal,
      subcategorySum,
      hasSubcategories: true
    }
  }

  // 🔍 Get validation status for a category (all months)
  const getCategoryValidationStatus = (categoryName: string): { hasIssues: boolean; issueMonths: number[] } => {
    const issueMonths: number[] = []
    
    for (let month = 1; month <= 12; month++) {
      const validation = validateCategoryMonth(categoryName, month)
      // 🎯 Solo segnala problemi se ci sono sottocategorie con dati E c'è una discrepanza
      if (validation.hasSubcategories && !validation.isValid) {
        issueMonths.push(month)
      }
    }
    
    return {
      hasIssues: issueMonths.length > 0,
      issueMonths
    }
  }

  // 📋 Get list of subcategories for a category (sorted by sort_order)
  const getSubcategoriesList = (categoryName: string): string[] => {
    const categorySubcategories = subcategories?.[categoryName]
    if (!categorySubcategories) return []
    
    return Object.keys(categorySubcategories)
      .filter(subName => subName !== 'Main') // Exclude generic "Main" subcategory
      .sort((a, b) => {
        // 🎯 Sort by sort_order instead of alphabetically
        const sortOrderA = categorySubcategories[a]?.sort_order || 0
        const sortOrderB = categorySubcategories[b]?.sort_order || 0
        return sortOrderA - sortOrderB
      })
  }

  // ➕ Add new category
  const handleAddCategory = async (type: 'revenue' | 'expense' | 'balance') => {
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

  // 🗑️ Delete subcategory (clear all its entries)
  const handleDeleteSubcategory = async (categoryName: string, subcategoryName: string) => {
    if (!window.confirm(`Sei sicuro di voler cancellare tutte le entries di "${subcategoryName}" dalla categoria "${categoryName}"?`)) {
      return
    }

    try {
      // For now, we'll set all values to 0 instead of deleting entries
      // This preserves the data structure while clearing the values
      const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      
      for (const month of months) {
        const currentValue = getSubcategoryCellValue(categoryName, subcategoryName, month)
        if (currentValue !== 0) {
          // Set value to 0 for both consolidated and projections
          const currentMonth = new Date().getMonth() + 1
          const currentYear = new Date().getFullYear()
          const isProjection = (selectedYear > currentYear) || 
                              (selectedYear === currentYear && month > currentMonth)
          
          await saveEntry({
            categoryName: categoryName,
            subcategoryName: subcategoryName,
            month,
            value: 0,
            isProjection
          })
        }
      }
      
      toast({
        title: "✅ Sottocategoria azzerata",
        description: `Tutti i valori di "${subcategoryName}" sono stati azzerati`,
      })
    } catch (error) {
      toast({
        title: "❌ Errore",
        description: "Impossibile azzerare la sottocategoria",
        variant: "destructive"
      })
    }
  }

  // 📊 Get category data by type (MEMOIZED to prevent re-renders)
  const revenueCategories = useMemo(() => {
    return Object.entries(categories)
      .filter(([name, data]) => {
        const categoryType = data.type
        return categoryType === 'revenue' || categoryType === 'revenues'
      })
      .sort((a, b) => a[1].sort_order - b[1].sort_order)
      .map(([name, _]) => name)
  }, [categories])

  const expenseCategories = useMemo(() => {
    return Object.entries(categories)
      .filter(([name, data]) => {
        const categoryType = data.type
        return categoryType === 'expense' || categoryType === 'expenses'
      })
      .sort((a, b) => a[1].sort_order - b[1].sort_order)
      .map(([name, _]) => name)
  }, [categories])

  const balanceCategories = useMemo(() => {
    return Object.entries(categories)
      .filter(([name, data]) => {
        const categoryType = data.type
        return categoryType === 'balance'
      })
      .sort((a, b) => a[1].sort_order - b[1].sort_order)
      .map(([name, _]) => name)
  }, [categories])

  // Legacy function for backward compatibility
  const getCategoriesByType = (type: string) => {
    if (type === 'revenue') return revenueCategories
    if (type === 'expense') return expenseCategories
    if (type === 'balance') return balanceCategories
    // Fallback for other types
    return Object.entries(categories)
      .filter(([name, data]) => {
        const categoryType = data.type
        const matches = categoryType === type || 
                       (type === 'expense' && categoryType === 'expenses') ||
                       (type === 'revenue' && categoryType === 'revenues')
        return matches
      })
      .sort((a, b) => a[1].sort_order - b[1].sort_order)
      .map(([name, _]) => name)
  }

  // 📅 Determine month status: Date logic + Data logic combined
  const getMonthStatus = (month: number, year: number = selectedYear) => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1 // Agosto = 8
    const currentYear = currentDate.getFullYear()
    
    let hasConsolidated = false
    let hasProjections = false
    
    // Check all categories for this month
    Object.values(categoryMonthlyData || {}).forEach(categoryData => {
      const monthData = categoryData[month]
      if (monthData) {
        if (monthData.consolidated > 0) hasConsolidated = true
        if (monthData.projections > 0) hasProjections = true
      }
    })
    
    // Logic combining date and data:
    if (year < currentYear) {
      // Past years: check data
      return hasConsolidated ? 'consolidated' : 'projections'
    }
    
    if (year > currentYear) {
      // Future years: always projections
      return 'projections'
    }
    
    // Current year (2025):
    if (month === currentMonth) {
      // Current month (Agosto) = always Attuale
      return 'current'
    }
    
    if (month < currentMonth) {
      // Past months (Luglio, Giugno...) - check if still has projections
      if (hasProjections) {
        return 'current' // Not yet consolidated = Attuale
      } else {
        return 'consolidated' // Fully consolidated
      }
    }
    
    // Future months (Settembre+) = always projections
    return 'projections'
  }

  // 🎯 Always show all months - let values change based on filter
  const shouldShowMonth = (month: number) => {
    return true // Show all columns, values will change based on viewMode
  }

  // 🧮 Calculate totals (respecting current viewMode filter AND subcategory sums)
  const calculateTotals = () => {
    const entrate = revenueCategories
    const uscite = expenseCategories
    
    // 🎯 Use getCellValue which automatically calculates from subcategories when present
    const getTotalForCategory = (categoryName: string) => {
      // Sum all 12 months for this category using getCellValue
      let total = 0
      for (let month = 1; month <= 12; month++) {
        total += getCellValue(categoryName, month)
      }
      return total
    }
    
    const totaleEntrate = entrate.reduce((sum, cat) => sum + getTotalForCategory(cat), 0)
    const totaleUscite = uscite.reduce((sum, cat) => sum + getTotalForCategory(cat), 0)
    
    return {
      entrate: totaleEntrate,
      uscite: totaleUscite,
      differenza: totaleEntrate - totaleUscite
    }
  }

  // 🎯 Handle subcategory drag & drop
  const handleSubcategoryDragEnd = async (activeId: string, overId: string) => {
    const [activeCategoryName, activeSubcategoryName] = activeId.split('::')
    const [overCategoryName, overSubcategoryName] = overId.split('::')
    
    if (activeCategoryName !== overCategoryName) {
      setActiveDragId(null)
      return
    }
    
    const subcategoryList = getSubcategoriesList(activeCategoryName)
    const activeIndex = subcategoryList.indexOf(activeSubcategoryName)
    const overIndex = subcategoryList.indexOf(overSubcategoryName)
    
    if (activeIndex === overIndex) {
      setActiveDragId(null)
      return
    }
    
    try {
      // 🎯 OPTIMISTIC UPDATE: Update UI immediately, save to DB in background
      
      // 1️⃣ STEP 1: Calculate new subcategory order locally
      const reorderedSubcategories = [...subcategoryList]
      const [movedSubcategory] = reorderedSubcategories.splice(activeIndex, 1)
      reorderedSubcategories.splice(overIndex, 0, movedSubcategory)
      
      // 2️⃣ STEP 2: Update UI state immediately (OPTIMISTIC)
      // This updates the local state instantly - NO LOADING, NO FLASH!
      updateSubcategoriesOrderOptimistic(activeCategoryName, reorderedSubcategories)
      // This creates smooth UX while DB updates in background
      
      // 3️⃣ STEP 3: Save to database in BACKGROUND (async, non-blocking)
      const saveToDatabase = async () => {
        try {
          await updateSubcategoriesOrder(activeCategoryName, reorderedSubcategories)
          return true
        } catch (dbError) {
          // 4️⃣ STEP 4: If DB fails, revert UI (rare case)
          console.error('Database save failed, reverting UI:', dbError)
          await loadData() // Only reload on error
          throw dbError
        }
      }
      
      // Start database save in background (don't await)
      saveToDatabase()
      
      // ✨ IMMEDIATE SUCCESS - No loading, no flash!
      toast({
        title: "✅ Sottocategoria spostata",
        description: `${activeSubcategoryName} riordinata istantaneamente`
      })
      
      // 🚀 NO loadData() here - UI already updated optimistically!
      
    } catch (err: unknown) {
      console.error('🚨 SUBCATEGORY DRAG ERROR:', err)
      toast({
        title: "❌ Errore drag & drop",
        description: (err as Error)?.message || "Impossibile riordinare sottocategoria",
        variant: "destructive"
      })
    }
    
    setActiveDragId(null)
  }

  // 📱 Handle mobile subcategory reordering
  const handleMoveSubcategory = async (categoryName: string, subcategoryName: string, direction: 'up' | 'down') => {
    try {
      const subcategoryList = getSubcategoriesList(categoryName)
      const currentIndex = subcategoryList.indexOf(subcategoryName)
      
      if (currentIndex === -1) return
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      
      if (newIndex < 0 || newIndex >= subcategoryList.length) return
      
      // 🎯 OPTIMISTIC UPDATE: Swap positions immediately
      const reorderedSubcategories = [...subcategoryList]
      const [movedSubcategory] = reorderedSubcategories.splice(currentIndex, 1)
      reorderedSubcategories.splice(newIndex, 0, movedSubcategory)
      
      // Update UI immediately
      updateSubcategoriesOrderOptimistic(categoryName, reorderedSubcategories)
      
      // Save to database in background
      const saveToDatabase = async () => {
        try {
          await updateSubcategoriesOrder(categoryName, reorderedSubcategories)
          return true
        } catch (dbError) {
          console.error('Database save failed, reverting UI:', dbError)
          await loadData() // Only reload on error
          throw dbError
        }
      }
      
      saveToDatabase()
      
      toast({
        title: "✅ Sottocategoria spostata",
        description: `${subcategoryName} spostata ${direction === 'up' ? 'su' : 'giù'} istantaneamente`
      })
      
    } catch (error) {
      console.error('🚨 MOBILE SUBCATEGORY MOVE ERROR:', error)
      toast({
        title: "❌ Errore spostamento",
        description: "Impossibile spostare la sottocategoria",
        variant: "destructive"
      })
    }
  }

  // Helper function to update subcategories order in database
  const updateSubcategoriesOrder = async (categoryName: string, reorderedSubcategories: string[]) => {
    // Get category ID
    const categoryData = categories[categoryName]
    if (!categoryData?.id) {
      throw new Error(`Category not found: ${categoryName}`)
    }
    
    // Get all subcategories for this category
    const { data: subcategoriesList, error: fetchError } = await supabase
      .from('subcategories')
      .select('id, name')
      .eq('category_id', categoryData.id)
    
    if (fetchError) {
      throw new Error(`Could not fetch subcategories: ${fetchError.message}`)
    }
    
    if (!subcategoriesList) {
      throw new Error('Could not fetch subcategories')
    }
    
    // Update sort_orders
    const dbUpdates = reorderedSubcategories.map((subcategoryName, index) => {
      const subcategoryRecord = subcategoriesList.find(sub => sub.name === subcategoryName)
      
      if (!subcategoryRecord) {
        console.warn(`⚠️ Subcategory not found in DB: ${subcategoryName}`)
        return null
      }
      
      return supabase
        .from('subcategories')
        .update({ sort_order: index + 1 })
        .eq('id', subcategoryRecord.id)
    }).filter(Boolean)
    
    const results = await Promise.all(dbUpdates)
    const errors = results.filter(result => result?.error)
    
    if (errors.length > 0) {
      throw new Error(`Database update failed: ${errors.map(e => e.error?.message).join(', ')}`)
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

    // 🎯 Check if we're dragging subcategories (format: "categoryName::subcategoryName")
    const isSubcategoryDrag = activeId.includes('::') && overId.includes('::')
    
    if (isSubcategoryDrag) {
      return handleSubcategoryDragEnd(activeId, overId)
    }

    // 🎯 Handle main category drag & drop
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
      // 🎯 OPTIMISTIC UPDATE: Update UI immediately, save to DB in background
      
      // 1️⃣ STEP 1: Calculate new sort orders locally
      const sameTypeCategories = getCategoriesByType(activeCategory.type)
      const activeIndex = sameTypeCategories.indexOf(activeId)
      const overIndex = sameTypeCategories.indexOf(overId)
      
      // Create new order: move active category to over position
      const reorderedCategories = [...sameTypeCategories]
      const [movedCategory] = reorderedCategories.splice(activeIndex, 1)
      reorderedCategories.splice(overIndex, 0, movedCategory)
      
      // 2️⃣ STEP 2: Update UI state immediately (OPTIMISTIC)
      // This updates the local state instantly - NO LOADING, NO FLASH!
      updateCategoriesOrderOptimistic(reorderedCategories, activeCategory.type)
      // This creates smooth UX while DB updates in background
      
      // 3️⃣ STEP 3: Save to database in BACKGROUND (async, non-blocking)
      const saveToDatabase = async () => {
        try {
          // Get ORTI company ID
          const { data: company } = await supabase
            .from('companies')
            .select('id')
            .eq('name', 'ORTI')
            .single()
          
          if (!company) throw new Error('Company ORTI not found')
          
          // Get category IDs for the reordered list
          const { data: categoryList } = await supabase
            .from('categories')
            .select('id, name')
            .eq('company_id', company.id)
            .eq('type_id', activeCategory.type)
          
          if (!categoryList) throw new Error('Could not fetch categories')
          
          // Update sort_orders in database
          const dbUpdates = reorderedCategories.map((categoryName, index) => {
            const categoryRecord = categoryList.find(cat => cat.name === categoryName)
            if (!categoryRecord) return null
            
            return supabase
              .from('categories')
              .update({ sort_order: index + 1 })
              .eq('id', categoryRecord.id)
          }).filter(Boolean)
          
          const results = await Promise.all(dbUpdates)
          const errors = results.filter(result => result.error)
          
          if (errors.length > 0) {
            throw new Error('Database update failed')
          }
          
          // Success - no need to update UI, it's already updated!
          return true
          
        } catch (dbError) {
          // 4️⃣ STEP 4: If DB fails, revert UI (rare case)
          console.error('Database save failed, reverting UI:', dbError)
          await loadData() // Only reload on error
          throw dbError
        }
      }
      
      // Start database save in background (don't await)
      saveToDatabase()

      // ✨ IMMEDIATE SUCCESS - No loading, no flash!
      toast({
        title: "✅ Ordine aggiornato",
        description: `${activeId} spostata istantaneamente`
      })
      
      // 🚀 NO loadData() here - UI already updated optimistically!

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

  // 🧮 Memoize totals calculation to prevent infinite re-renders (now depends on viewMode)
  const totals = useMemo(() => calculateTotals(), [categories, viewMode])
  
  // Handle scroll to section
  const handleScrollToSection = (section: 'entrate' | 'uscite' | 'differenza' | 'home') => {
    const refs = {
      home: headerRef,
      entrate: entrateRef,
      uscite: usciteRef,
      differenza: differenzaRef
    }
    
    const targetRef = refs[section]
    if (targetRef?.current) {
      const yOffset = -80 // Account for fixed header/nav
      const element = targetRef.current
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }
  
  // Swipe navigation between sections
  const sections = ['home', 'entrate', 'uscite', 'differenza'] as const
  const [currentSectionIndex, setCurrentSectionIndex] = React.useState(0)
  
  useSwipeGesture({
    onSwipeLeft: () => {
      if (currentSectionIndex < sections.length - 1) {
        const nextSection = sections[currentSectionIndex + 1]
        handleScrollToSection(nextSection)
        setCurrentSectionIndex(currentSectionIndex + 1)
      }
    },
    onSwipeRight: () => {
      if (currentSectionIndex > 0) {
        const prevSection = sections[currentSectionIndex - 1]
        handleScrollToSection(prevSection)
        setCurrentSectionIndex(currentSectionIndex - 1)
      }
    }
  }, {
    threshold: 75,
    timeout: 300
  })

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
        zenMode && "p-2 md:p-4",
        !zenMode && "pb-20 md:pb-0" // Add padding for mobile bottom nav
      )}>
        <div className={cn(
          "mx-auto transition-all duration-300",
          zenMode ? "max-w-full" : "max-w-7xl p-4 md:p-6"
        )}>
          {/* 📊 HEADER - Responsive & Enhanced */}
          {!zenMode && (
          <div ref={headerRef} className={cn(
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
              {/* 🎯 View Filter Controls */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={viewFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewFilter('all')}
                  className={cn(
                    "transition-all px-3 py-1 text-xs",
                    viewFilter === 'all' 
                      ? darkMode ? "bg-blue-600 text-white" : "bg-blue-600 text-white"
                      : darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Filter className="h-3 w-3 mr-1" />
                  Tutto
                </Button>
                <Button
                  variant={viewFilter === 'consolidated' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewFilter('consolidated')}
                  className={cn(
                    "transition-all px-3 py-1 text-xs",
                    viewFilter === 'consolidated' 
                      ? darkMode ? "bg-green-600 text-white" : "bg-green-600 text-white"
                      : darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Consolidato
                </Button>
                <Button
                  variant={viewFilter === 'projections' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewFilter('projections')}
                  className={cn(
                    "transition-all px-3 py-1 text-xs",
                    viewFilter === 'projections' 
                      ? darkMode ? "bg-orange-600 text-white" : "bg-orange-600 text-white"
                      : darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Circle className="h-3 w-3 mr-1" />
                  Previsionale
                </Button>
              </div>

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
              {/* 🎯 Mobile View Filter Controls */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 px-2">Filtro Vista:</p>
                <div className="flex gap-1">
                  <Button
                    variant={viewFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewFilter('all')}
                    className="flex-1 text-xs"
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    Tutto
                  </Button>
                  <Button
                    variant={viewFilter === 'consolidated' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewFilter('consolidated')}
                    className="flex-1 text-xs"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Consolidato
                  </Button>
                  <Button
                    variant={viewFilter === 'projections' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewFilter('projections')}
                    className="flex-1 text-xs"
                  >
                    <Circle className="h-3 w-3 mr-1" />
                    Previsionale
                  </Button>
                </div>
              </div>

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

          {/* Mobile Summary Cards - Only on mobile */}
          {!zenMode && (
            <div className="md:hidden grid grid-cols-2 gap-3 mb-4">
              <MobileDataCard
                title="Entrate"
                value={totals.entrate}
                type="revenue"
                darkMode={darkMode}
                onClick={() => handleScrollToSection('entrate')}
              />
              <MobileDataCard
                title="Uscite"
                value={totals.uscite}
                type="expense"
                darkMode={darkMode}
                onClick={() => handleScrollToSection('uscite')}
              />
              <MobileDataCard
                title="Differenza"
                value={totals.differenza}
                type={totals.differenza >= 0 ? 'revenue' : 'expense'}
                darkMode={darkMode}
                onClick={() => handleScrollToSection('differenza')}
                className="col-span-2"
              />
            </div>
          )}

          {/* Quick Totals - Responsive Grid (Desktop) */}
          {!zenMode && (
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
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
        <Card ref={entrateRef} className={cn(
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
                      {months.map((month, monthIndex) => {
                        const monthNumber = monthIndex + 1
                        const monthStatus = getMonthStatus(monthNumber)
                        const shouldShow = shouldShowMonth(monthNumber)
                        
                        if (!shouldShow) return null
                        
                        return (
                          <th key={month} className={cn(
                            "text-center p-2 font-medium min-w-[70px] md:min-w-[80px] relative",
                            darkMode ? "text-gray-300" : "text-slate-700"
                          )}>
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                <span className="hidden md:inline">{month}</span>
                                <span className="md:hidden">{month.slice(0, 1)}</span>
                                {/* 📅 Status Indicator */}
                                {monthStatus === 'consolidated' && (
                                  <CheckCircle2 className="h-3 w-3 text-green-500" title="Consolidato" />
                                )}
                                {monthStatus === 'projections' && (
                                  <Circle className="h-3 w-3 text-orange-500" title="Previsionale" />
                                )}
                                {monthStatus === 'current' && (
                                  <Clock className="h-3 w-3 text-blue-500" title="Mese corrente" />
                                )}
                              </div>
                              {/* Status Badge for better visibility */}
                              {viewFilter === 'all' && (
                                <div className={cn(
                                  "text-[8px] px-1 rounded-full font-medium",
                                  monthStatus === 'consolidated' 
                                    ? "bg-green-100 text-green-700" 
                                    : monthStatus === 'projections'
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-blue-100 text-blue-700"
                                )}>
                                  {monthStatus === 'consolidated' ? 'C' : 
                                   monthStatus === 'projections' ? 'P' : 'A'}
                                </div>
                              )}
                            </div>
                          </th>
                        )
                      })}
                      {/* Colonna Totale Anno */}
                      <th className={cn(
                        "text-center p-2 font-medium min-w-[80px] md:min-w-[100px] border-l-2",
                        darkMode 
                          ? "text-gray-300 border-green-600/50" 
                          : "text-slate-700 border-green-500/50"
                      )}>
                        <span className="hidden md:inline">Totale Anno</span>
                        <span className="md:hidden">Tot</span>
                      </th>
                      {!zenMode && <th className="w-16 md:w-20"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    <SortableContext
                      items={getCategoriesByType('revenue')}
                      strategy={verticalListSortingStrategy}
                    >
                      {getCategoriesByType('revenue').map((categoryName, index) => (
                        <React.Fragment key={categoryName}>
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
                            getCategoryValidationStatus={getCategoryValidationStatus}
                            validateCategoryMonth={validateCategoryMonth}
                            calculateCategoryYearlyTotal={calculateCategoryYearlyTotal}
                          />
                          
                          {/* Render subcategories when category is expanded */}
                          {expandedCategories[categoryName] && (
                            <SortableContext 
                              items={getSubcategoriesList(categoryName).map(subName => `${categoryName}::${subName}`)}
                              strategy={verticalListSortingStrategy}
                            >
                              {getSubcategoriesList(categoryName).map((subcategoryName, subIndex) => (
                                <SubcategoryRow
                                  key={`${categoryName}-${subcategoryName}`}
                                  categoryName={categoryName}
                                  subcategoryName={subcategoryName}
                                  index={subIndex}
                                  categoryType="revenue"
                                  months={months}
                                  editingCell={editingCell}
                                  editValue={editValue}
                                  darkMode={darkMode}
                                  zenMode={zenMode}
                                  onCellClick={handleSubcategoryCellClick}
                                  onCellSave={handleCellSave}
                                  onDeleteSubcategory={handleDeleteSubcategory}
                                  onMoveSubcategory={handleMoveSubcategory}
                                  getSubcategoryCellValue={getSubcategoryCellValue}
                                  formatCurrency={formatCurrency}
                                  setEditValue={setEditValue}
                                  setEditingCell={setEditingCell}
                                  calculateSubcategoryYearlyTotal={calculateSubcategoryYearlyTotal}
                                />
                              ))}
                            </SortableContext>
                          )}
                        </React.Fragment>
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* 💸 SEZIONE USCITE */}
        <Card ref={usciteRef} className={cn(
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
                      {months.map((month, monthIndex) => {
                        const monthNumber = monthIndex + 1
                        const monthStatus = getMonthStatus(monthNumber)
                        const shouldShow = shouldShowMonth(monthNumber)
                        
                        if (!shouldShow) return null
                        
                        return (
                          <th key={month} className={cn(
                            "text-center p-2 font-medium min-w-[70px] md:min-w-[80px] relative",
                            darkMode ? "text-gray-300" : "text-slate-700"
                          )}>
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                <span className="hidden md:inline">{month}</span>
                                <span className="md:hidden">{month.slice(0, 1)}</span>
                                {/* 📅 Status Indicator */}
                                {monthStatus === 'consolidated' && (
                                  <CheckCircle2 className="h-3 w-3 text-green-500" title="Consolidato" />
                                )}
                                {monthStatus === 'projections' && (
                                  <Circle className="h-3 w-3 text-orange-500" title="Previsionale" />
                                )}
                                {monthStatus === 'current' && (
                                  <Clock className="h-3 w-3 text-blue-500" title="Mese corrente" />
                                )}
                              </div>
                              {/* Status Badge for better visibility */}
                              {viewFilter === 'all' && (
                                <div className={cn(
                                  "text-[8px] px-1 rounded-full font-medium",
                                  monthStatus === 'consolidated' 
                                    ? "bg-green-100 text-green-700" 
                                    : monthStatus === 'projections'
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-blue-100 text-blue-700"
                                )}>
                                  {monthStatus === 'consolidated' ? 'C' : 
                                   monthStatus === 'projections' ? 'P' : 'A'}
                                </div>
                              )}
                            </div>
                          </th>
                        )
                      })}
                      {/* Colonna Totale Anno */}
                      <th className={cn(
                        "text-center p-2 font-medium min-w-[80px] md:min-w-[100px] border-l-2",
                        darkMode 
                          ? "text-gray-300 border-red-600/50" 
                          : "text-slate-700 border-red-500/50"
                      )}>
                        <span className="hidden md:inline">Totale Anno</span>
                        <span className="md:hidden">Tot</span>
                      </th>
                      {!zenMode && <th className="w-16 md:w-20"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    <SortableContext
                      items={getCategoriesByType('expense')}
                      strategy={verticalListSortingStrategy}
                    >
                      {getCategoriesByType('expense').map((categoryName, index) => (
                        <React.Fragment key={categoryName}>
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
                            getCategoryValidationStatus={getCategoryValidationStatus}
                            validateCategoryMonth={validateCategoryMonth}
                            calculateCategoryYearlyTotal={calculateCategoryYearlyTotal}
                          />
                          
                          {/* Render subcategories when category is expanded */}
                          {expandedCategories[categoryName] && (
                            <SortableContext 
                              items={getSubcategoriesList(categoryName).map(subName => `${categoryName}::${subName}`)}
                              strategy={verticalListSortingStrategy}
                            >
                              {getSubcategoriesList(categoryName).map((subcategoryName, subIndex) => (
                                <SubcategoryRow
                                  key={`${categoryName}-${subcategoryName}`}
                                  categoryName={categoryName}
                                  subcategoryName={subcategoryName}
                                  index={subIndex}
                                  categoryType="expense"
                                  months={months}
                                  editingCell={editingCell}
                                  editValue={editValue}
                                  darkMode={darkMode}
                                  zenMode={zenMode}
                                  onCellClick={handleSubcategoryCellClick}
                                  onCellSave={handleCellSave}
                                  onDeleteSubcategory={handleDeleteSubcategory}
                                  onMoveSubcategory={handleMoveSubcategory}
                                  getSubcategoryCellValue={getSubcategoryCellValue}
                                  formatCurrency={formatCurrency}
                                  setEditValue={setEditValue}
                                  setEditingCell={setEditingCell}
                                  calculateSubcategoryYearlyTotal={calculateSubcategoryYearlyTotal}
                                />
                              ))}
                            </SortableContext>
                          )}
                        </React.Fragment>
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* ⚖️ DIFFERENZA */}
        <Card ref={differenzaRef} className={cn(
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
                        {zenMode ? formatCurrency(diffMonth) : formatCurrencyCompact(diffMonth)}
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

        {/* 🏦 SALDI BANCARI - Sezione dinamica */}
        <Card className={cn(
          "mb-4 md:mb-6 transition-all duration-300",
          darkMode ? "bg-gray-800 border-gray-700" : ""
        )}>
          <CardHeader 
            className={cn(
              "cursor-pointer transition-all duration-300",
              darkMode ? "bg-purple-900/20 hover:bg-purple-900/30" : "bg-purple-50 hover:bg-purple-100"
            )}
            onClick={() => toggleSection('banche')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Banknote className={cn(
                  "w-6 h-6 transition-transform duration-200",
                  darkMode ? "text-purple-400" : "text-purple-600"
                )} />
                <div>
                  <h3 className={cn(
                    "text-base md:text-lg font-semibold",
                    darkMode ? "text-purple-300" : "text-purple-700"
                  )}>
                    🏦 SALDI BANCARI
                  </h3>
                  <div className={cn(
                    "text-sm",
                    darkMode ? "text-purple-400" : "text-purple-600"
                  )}>
                    {balanceCategories.filter(cat => cat.includes('Saldo')).length} conti bancari • Totale: {formatCurrency(
                      balanceCategories.filter(cat => cat.includes('Saldo') && !cat.includes('Totale')).reduce((sum, cat) => {
                        const categoryData = categories[cat]
                        return sum + (categoryData?.consolidated || 0) + (categoryData?.projections || 0)
                      }, 0)
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddCategory('balance')
                  }}
                  className={cn(
                    "transition-all duration-200",
                    darkMode ? "hover:bg-purple-800/50 text-purple-400" : "hover:bg-purple-200 text-purple-600"
                  )}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <ChevronDown className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  expandedSections.banche ? "transform rotate-180" : "",
                  darkMode ? "text-purple-400" : "text-purple-600"
                )} />
              </div>
            </div>
          </CardHeader>
          
          <div className={cn(
            "transition-all duration-500 ease-in-out",
            expandedSections.banche ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
          )}>
            <CardContent>
              {balanceCategories.filter(cat => cat.includes('Saldo') && !cat.includes('Totale')).length > 0 ? (
                <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                  <SortableContext 
                    items={balanceCategories.filter(cat => cat.includes('Saldo') && !cat.includes('Totale'))} 
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {balanceCategories.filter(cat => cat.includes('Saldo') && !cat.includes('Totale')).map((categoryName, index) => (
                        <DraggableCategoryRow
                          key={categoryName}
                          categoryName={categoryName}
                          index={index}
                          categoryType="balance" // Correct type for balance categories with purple colors
                          months={months}
                          editingCell={editingCell}
                          editValue={editValue}
                          expandedCategories={expandedCategories}
                          darkMode={darkMode}
                          zenMode={zenMode}
                          onCellClick={handleCellClick}
                          onCellSave={handleCellSave}
                          onToggleDetails={(cat) => setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))}
                          onDeleteCategory={handleDeleteCategory}
                          getCellValue={getCellValue}
                          formatCurrency={formatCurrency}
                          setEditValue={setEditValue}
                          setEditingCell={setEditingCell}
                          calculateCategoryYearlyTotal={calculateCategoryYearlyTotal}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className={cn(
                  "text-center py-8",
                  darkMode ? "text-gray-400" : "text-gray-500"
                )}>
                  <Banknote className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nessun conto bancario trovato</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCategory('balance')}
                    className="mt-3"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi Conto
                  </Button>
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        {/* 🏦 TOTALI E CASH FLOW */}
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
                    Mese per mese
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-3">
                {months.map((month, index) => {
                  const totaleBanche = balanceCategories.filter(cat => cat.includes('Saldo') && !cat.includes('Totale')).reduce((sum, cat) => {
                    return sum + getCellValue(cat, index + 1)
                  }, 0)
                  
                  return (
                    <div key={month} className={cn(
                      "p-2 md:p-3 rounded-lg text-center transition-all duration-300 hover:scale-105",
                      darkMode ? "bg-gray-700" : "bg-purple-50"
                    )}>
                      <div className={cn(
                        "text-xs md:text-sm mb-1",
                        darkMode ? "text-gray-400" : "text-purple-600"
                      )}>
                        {month}
                      </div>
                      <div className={cn(
                        "text-sm md:text-base font-semibold",
                        darkMode ? "text-purple-400" : "text-purple-600"
                      )}>
                        {zenMode ? formatCurrency(totaleBanche) : formatCurrencyCompact(totaleBanche)}
                      </div>
                    </div>
                  )
                })}
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
                    Mese per mese
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-3">
                {months.map((month, index) => {
                  const entrateMonth = getCategoriesByType('revenue').reduce((sum, cat) => {
                    return sum + getCellValue(cat, index + 1)
                  }, 0)
                  const usciteMonth = getCategoriesByType('expense').reduce((sum, cat) => {
                    return sum + getCellValue(cat, index + 1)
                  }, 0)
                  const totaleBanche = balanceCategories.filter(cat => cat.includes('Saldo') && !cat.includes('Totale')).reduce((sum, cat) => {
                    return sum + getCellValue(cat, index + 1)
                  }, 0)
                  const diffMonth = entrateMonth - usciteMonth
                  const cashFlow = totaleBanche + diffMonth
                  
                  return (
                    <div key={month} className={cn(
                      "p-2 md:p-3 rounded-lg text-center transition-all duration-300 hover:scale-105",
                      darkMode ? "bg-gray-700" : "bg-indigo-50"
                    )}>
                      <div className={cn(
                        "text-xs md:text-sm mb-1",
                        darkMode ? "text-gray-400" : "text-indigo-600"
                      )}>
                        {month}
                      </div>
                      <div className={cn(
                        "text-sm md:text-base font-semibold",
                        cashFlow >= 0 
                          ? darkMode ? "text-green-400" : "text-green-600"
                          : darkMode ? "text-red-400" : "text-red-600"
                      )}>
                        {zenMode ? formatCurrency(cashFlow) : formatCurrencyCompact(cashFlow)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 📚 LEGENDA - Spiegazione simboli e colori */}
        {!zenMode && (
          <Card className={cn(
            "mx-4 md:mx-6 mb-4 md:mb-6 transition-all duration-300",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-slate-50 border-slate-200"
          )}>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <h3 className={cn(
                  "text-sm font-semibold mb-3 flex items-center gap-2",
                  darkMode ? "text-gray-300" : "text-slate-700"
                )}>
                  <Target className="h-4 w-4" />
                  Legenda Filtri e Indicatori
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {/* Filtri Vista */}
                  <div>
                    <p className={cn("font-medium mb-2", darkMode ? "text-gray-300" : "text-slate-700")}>
                      🎯 Filtri Vista:
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Filter className="h-3 w-3 text-blue-500" />
                        <span className={darkMode ? "text-gray-400" : "text-slate-600"}>
                          Tutto - Mostra consolidato + previsionale
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span className={darkMode ? "text-gray-400" : "text-slate-600"}>
                          Consolidato - Solo dati reali/storici
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-orange-500" />
                        <span className={darkMode ? "text-gray-400" : "text-slate-600"}>
                          Previsionale - Solo proiezioni/forecast
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Indicatori Mesi */}
                  <div>
                    <p className={cn("font-medium mb-2", darkMode ? "text-gray-300" : "text-slate-700")}>
                      📅 Stato Mesi:
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span className="bg-green-100 text-green-700 px-1 rounded text-[8px] font-medium">C</span>
                        <span className={darkMode ? "text-gray-400" : "text-slate-600"}>
                          Consolidato (mesi passati)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-blue-500" />
                        <span className="bg-blue-100 text-blue-700 px-1 rounded text-[8px] font-medium">A</span>
                        <span className={darkMode ? "text-gray-400" : "text-slate-600"}>
                          Attuale (mese corrente + passati non consolidati)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-orange-500" />
                        <span className="bg-orange-100 text-orange-700 px-1 rounded text-[8px] font-medium">P</span>
                        <span className={darkMode ? "text-gray-400" : "text-slate-600"}>
                          Previsionale (mesi futuri)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Colori Categorie */}
                  <div>
                    <p className={cn("font-medium mb-2", darkMode ? "text-gray-300" : "text-slate-700")}>
                      🎨 Colori Categorie:
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className={darkMode ? "text-green-400" : "text-green-700"}>Verde</span>
                        <span className={darkMode ? "text-gray-400" : "text-slate-600"}>- Entrate</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        <span className={darkMode ? "text-red-400" : "text-red-700"}>Rosso</span>
                        <span className={darkMode ? "text-gray-400" : "text-slate-600"}>- Uscite</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Banknote className="h-3 w-3 text-purple-500" />
                        <span className={darkMode ? "text-purple-400" : "text-purple-700"}>Viola</span>
                        <span className={darkMode ? "text-gray-400" : "text-slate-600"}>- Saldi Bancari</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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
      
      {/* Mobile Bottom Navigation */}
      {!zenMode && (
        <MobileBottomNav
          onScrollToSection={handleScrollToSection}
          onToggleCharts={() => setShowCharts(!showCharts)}
          onToggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onExportImport={() => setShowMobileExportModal(true)}
          darkMode={darkMode}
          showCharts={showCharts}
        />
      )}
      
      {/* Mobile Export/Import Modal */}
      {showMobileExportModal && (
        <DataExportImportModal
          onExport={exportData}
          onImport={importData}
          exportFilename={`orti-finance-${selectedYear}`}
          darkMode={darkMode}
          onOpenChange={setShowMobileExportModal}
        />
      )}
    </div>
    </DndContext>
  )
}