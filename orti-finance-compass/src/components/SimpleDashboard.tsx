import React, { useState } from 'react'
import { useSupabaseFinance } from '@/hooks/useSupabaseFinance'
import { EdgeFunctionsPanel } from '@/components/EdgeFunctionsPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Calendar, BarChart3, Sparkles, Database, ChevronLeft, ChevronRight, Plus, Edit3 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

// 🧘 ZEN CALENDAR DASHBOARD - Horizontal months, vertical categories, pure zen
export const SimpleDashboard: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(2025)
  const [activeTab, setActiveTab] = useState<'calendar' | 'analytics' | 'projections' | 'data'>('calendar')
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [originalValue, setOriginalValue] = useState('')
  
  const { 
    loading, 
    error, 
    yearTotals, 
    monthlyData,
    categories,
    categoryMonthlyData,
    viewMode,
    saveEntry 
  } = useSupabaseFinance(selectedYear)

  const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
  
  // 💰 Format currency
  const formatCurrency = (value: number) => 
    value === 0 ? '−' : new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value)

  // 🎯 Navigation tabs
  const navTabs = [
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'projections', label: 'Proiezioni', icon: Sparkles },
    { id: 'data', label: 'Dati', icon: Database },
  ] as const

  // 📊 Categories with structure (COMPLETE categories from database)
  const categoryStructure = [
    {
      title: '💰 ENTRATE',
      items: ['Entrate Hotel', 'Entrate Residence', 'Entrate CVM', 'Entrate Supermercato', 'Rientro Sospesi', 'Caparre Intur']
    },
    {
      title: '💸 USCITE', 
      items: ['Salari e Stipendi', 'Utenze', 'Materie Prime/Consumo', 'Tasse e Imposte', 'Commissioni Portali', 'Mutui e Finanziamenti', 'Consulenze', 'Godimento Beni di Terzi', 'Varie ed Eventuali', 'Canoni e servizi']
    },
    {
      title: '⚖️ DIFFERENZA (Entrate - Uscite)',
      items: ['Diff. Entrate-Uscite']
    },
    {
      title: '🏦 SALDI E CASH FLOW',
      items: ['Saldo Banca Sella', 'Saldo MPS', 'Saldo Intesa', 'Totale Banche', 'Cassa Contanti', 'Cash Flow', 'Fin. MPS 60 mesi', 'Totale Affidamenti', 'Cash Flow con Affid.']
    }
  ]

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
    // 🎯 Get exact value for this category and month from granular data
    const categoryMonthData = categoryMonthlyData?.[categoryName]?.[month]
    if (!categoryMonthData) return 0
    
    // Return value based on current view mode
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

  // 🔄 Loading state
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

  // ❌ Error state  
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
    <div className="min-h-screen bg-slate-50">
      {/* 🧘 ZEN NAVIGATION */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Tabs */}
            <div className="flex space-x-8">
              {navTabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === id 
                      ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
            
            {/* Year Selector */}
            <div className="flex items-center space-x-2 bg-slate-100 rounded-lg px-4 py-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSelectedYear(selectedYear - 1)}
                className="h-8 w-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xl font-semibold min-w-[4rem] text-center">
                {selectedYear}
              </span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSelectedYear(selectedYear + 1)}
                className="h-8 w-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 HEADER TOTALS */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-light text-slate-800 mb-2">{selectedYear}</h1>
            <div className="text-lg text-slate-600 font-medium">Orti</div>
          </div>
          
          <div className="grid grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-1">Entrate Totali</div>
              <div className="text-2xl font-semibold text-green-600">
                {formatCurrency(yearTotals.revenues)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-1">Uscite Totali</div>
              <div className="text-2xl font-semibold text-red-600">
                {formatCurrency(yearTotals.expenses)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-1">Risultato Netto</div>
              <div className={`text-2xl font-semibold ${yearTotals.difference >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatCurrency(yearTotals.difference)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-1">Cash Flow Medio</div>
              <div className="text-2xl font-semibold text-purple-600">
                {formatCurrency(yearTotals.difference / 12)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📅 CONTENT BASED ON ACTIVE TAB */}
      <div className="max-w-full mx-auto px-6 py-6">
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">Calendario Finanziario</h2>
            <div className="text-slate-600">{selectedYear}</div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              {/* Header */}
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left p-4 font-medium text-slate-700 w-48">Categoria</th>
                  {months.map((month, index) => (
                    <th key={month} className="text-center p-4 font-medium text-slate-700 min-w-[100px]">
                      {month}
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody>
                {/* RENDER ALL CATEGORY SECTIONS */}
                {categoryStructure.map((section, sectionIndex) => (
                  <React.Fragment key={section.title}>
                    {/* Section Header */}
                    <tr className={`${
                      sectionIndex === 0 ? 'bg-green-50' :    // ENTRATE
                      sectionIndex === 1 ? 'bg-red-50' :      // USCITE  
                      sectionIndex === 2 ? 'bg-blue-50' :     // DIFFERENZA
                      'bg-purple-50'                           // SALDI
                    }`}>
                      <td colSpan={13} className={`p-4 font-semibold border-b ${
                        sectionIndex === 0 ? 'text-green-700 border-green-200' :
                        sectionIndex === 1 ? 'text-red-700 border-red-200' :      
                        sectionIndex === 2 ? 'text-blue-700 border-blue-200' :   
                        'text-purple-700 border-purple-200'                       
                      }`}>
                        {section.title}
                      </td>
                    </tr>
                    
                    {/* Section Items */}
                    {section.items.map((categoryName) => (
                      <tr key={categoryName} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="p-3 text-sm text-slate-700 font-medium">{categoryName}</td>
                        {months.map((_, monthIndex) => {
                          const month = monthIndex + 1
                          const cellId = `${categoryName}-${month}`
                          const value = getCellValue(categoryName, month)
                          const isEditing = editingCell === cellId
                          
                          return (
                            <td key={month} className="p-2 text-center">
                              {isEditing ? (
                                <div className="flex items-center space-x-1">
                                  <Input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleCellSave()
                                      if (e.key === 'Escape') setEditingCell(null)
                                    }}
                                    onBlur={handleCellSave}
                                    className="h-8 text-sm"
                                    autoFocus
                                  />
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleCellClick(categoryName, month)}
                                  className="w-full h-8 text-sm hover:bg-slate-100 rounded px-2 transition-colors flex items-center justify-center group"
                                >
                                  {value === 0 ? (
                                    <span className="text-slate-400">−</span>
                                  ) : (
                                    <span className="text-slate-700">{formatCurrency(value)}</span>
                                  )}
                                  <Edit3 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
                                </button>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                

              </tbody>
            </table>
          </div>
        </div>
        )}

        {activeTab === 'analytics' && (
          <EdgeFunctionsPanel />
        )}

        {activeTab === 'projections' && (
          <Card className="p-8 text-center">
            <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-800 mb-2">Proiezioni Avanzate</h3>
            <p className="text-slate-600">
              Sezione per analisi predittive e modelli di forecasting.
              Integrazione con AI/ML models in development.
            </p>
          </Card>
        )}

        {activeTab === 'data' && (
          <Card className="p-8 text-center">
            <Database className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-800 mb-2">Gestione Dati</h3>
            <p className="text-slate-600">
              Import/Export dati, backup, sincronizzazione e amministrazione database.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}