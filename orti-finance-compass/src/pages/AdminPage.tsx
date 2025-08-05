import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataExportImportModal } from '@/components/DataExportImportModal'
import { useSupabaseFinance } from '@/hooks/useSupabaseFinance'
import { 
  Settings, 
  FolderTree, 
  Upload, 
  Download, 
  Trash2, 
  Plus,
  Edit3,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface AdminPageProps {
  selectedCompany?: string
  onCompanyChange?: (company: string) => void
}

export const AdminPage: React.FC<AdminPageProps> = ({ 
  selectedCompany = 'ORTI',
  onCompanyChange 
}) => {
  const [selectedYear, setSelectedYear] = useState(2025)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({})
  const [subcategoriesData, setSubcategoriesData] = useState<any[]>([])
  
  const {
    categories,
    createCategory,
    createSubcategory,
    deleteCategory,
    exportData,
    importData,
    loadData
  } = useSupabaseFinance(selectedYear, selectedCompany)

  // Load subcategories
  const loadSubcategories = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select(`
          id, name, category_id,
          categories (
            id, name, type_id
          )
        `)
        .order('name')

      if (error) throw error
      setSubcategoriesData(data || [])
    } catch (err: any) {
      toast({
        title: "❌ Errore caricamento subcategories",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    loadSubcategories()
  }, [])

  const handleCreateCategory = async (type: 'revenue' | 'expense' | 'balance') => {
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
      toast({
        title: "✅ Categoria creata",
        description: `${newCategoryName} aggiunta come ${type}`
      })
    } catch (err: any) {
      toast({
        title: "❌ Errore creazione categoria",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  const handleCreateSubcategory = async () => {
    if (!newSubcategoryName.trim() || !selectedCategoryId) {
      toast({
        title: "❌ Dati mancanti",
        description: "Seleziona categoria e inserisci nome subcategoria",
        variant: "destructive"
      })
      return
    }

    try {
      await createSubcategory({
        name: newSubcategoryName.trim(),
        categoryId: selectedCategoryId
      })

      setNewSubcategoryName('')
      setSelectedCategoryId('')
      loadSubcategories()
    } catch (err: any) {
      // Error handling is done in the hook
      console.error('Error creating subcategory:', err)
    }
  }

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const getCategoryType = (type: string) => {
    switch(type) {
      case 'revenue': return { label: 'Entrata', color: 'bg-green-100 text-green-800' }
      case 'expense': return { label: 'Uscita', color: 'bg-red-100 text-red-800' }
      case 'balance': return { label: 'Saldo', color: 'bg-purple-100 text-purple-800' }
      default: return { label: type, color: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Amministrazione</h1>
          <p className="text-gray-600 mt-1">
            Gestisci categorie, subcategorie e impostazioni sistema
          </p>
        </div>
        
        <div className="flex gap-2">
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border rounded px-3 py-2"
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Categorie & Subcategorie
          </TabsTrigger>
          <TabsTrigger value="import-export" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import/Export
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Impostazioni
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Categories & Subcategories */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create New Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Nuova Categoria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Nome categoria..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleCreateCategory('revenue')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    + Entrata
                  </Button>
                  <Button 
                    onClick={() => handleCreateCategory('expense')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    + Uscita
                  </Button>
                  <Button 
                    onClick={() => handleCreateCategory('balance')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    + Saldo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Create New Subcategory */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Nuova Subcategoria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Seleziona categoria padre...</option>
                  {Object.entries(categories).map(([name, data]) => (
                    <option key={name} value={data.id}>
                      {name} ({getCategoryType(data.type).label})
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Nome subcategoria..."
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                />
                <Button 
                  onClick={handleCreateSubcategory}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crea Subcategoria
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Categories Tree View */}
          <Card>
            <CardHeader>
              <CardTitle>Struttura Categorie e Subcategorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(categories).map(([categoryName, categoryData]) => {
                  const categoryId = categoryData.id || categoryName
                  const isExpanded = expandedCategories[categoryId]
                  const categorySubcategories = subcategoriesData.filter(
                    sub => sub.category_id === categoryId
                  )
                  const typeInfo = getCategoryType(categoryData.type)

                  return (
                    <div key={categoryName} className="border rounded p-3">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleCategoryExpansion(categoryId)}
                      >
                        <div className="flex items-center gap-3">
                          {categorySubcategories.length > 0 ? (
                            isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                          ) : (
                            <div className="w-4 h-4" />
                          )}
                          <span className="font-medium">{categoryName}</span>
                          <Badge className={typeInfo.color}>
                            {typeInfo.label}
                          </Badge>
                          {categorySubcategories.length > 0 && (
                            <Badge variant="outline">
                              {categorySubcategories.length} subcategorie
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteCategory(categoryName)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      {isExpanded && categorySubcategories.length > 0 && (
                        <div className="ml-7 mt-3 space-y-2">
                          {categorySubcategories.map((subcategory) => (
                            <div key={subcategory.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{subcategory.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Delete subcategory logic here
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Import/Export */}
        <TabsContent value="import-export" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Dati
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Esporta tutti i dati del {selectedYear} in formato JSON o Excel
                </p>
                <DataExportImportModal
                  onExport={exportData}
                  onImport={importData}
                  exportFilename={`orti-finance-${selectedYear}`}
                  darkMode={false}
                  trigger={
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export/Import Dati
                    </Button>
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Excel Avanzato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Importa dati da fogli Excel con mapping automatico categorie
                </p>
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Excel (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Anno Corrente</label>
                  <Input type="number" value={selectedYear} readOnly />
                </div>
                <div>
                  <label className="text-sm font-medium">Valuta</label>
                  <Input value="EUR (€)" readOnly />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Statistiche Database</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Categorie</div>
                    <div className="font-bold">{Object.keys(categories).length}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Subcategorie</div>
                    <div className="font-bold">{subcategoriesData.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Anno</div>
                    <div className="font-bold">{selectedYear}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Status</div>
                    <div className="font-bold text-green-600">Attivo</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}