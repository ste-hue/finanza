import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Filter, 
  Download,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Calendar,
  FileBarChart
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface VarianceData {
  category_name: string
  category_type: 'revenue' | 'expense' | 'balance'
  projected_value: number
  actual_value: number
  variance_amount: number
  variance_percentage: number
  consolidation_date: string
  year: number
  month: number
}

interface AdvancedVarianceAnalysisProps {
  initialYear?: number
  initialMonth?: number
}

export const AdvancedVarianceAnalysis: React.FC<AdvancedVarianceAnalysisProps> = ({
  initialYear = 2025,
  initialMonth = new Date().getMonth() + 1
}) => {
  // State
  const [varianceData, setVarianceData] = useState<VarianceData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [yearFilter, setYearFilter] = useState(initialYear)
  const [monthFilter, setMonthFilter] = useState<'all' | number>('all')
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<'all' | 'revenue' | 'expense' | 'balance'>('all')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [varianceRangeFilter, setVarianceRangeFilter] = useState<'all' | 'positive' | 'negative' | 'significant'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Sorting
  const [sortBy, setSortBy] = useState<'category_name' | 'variance_amount' | 'variance_percentage'>('variance_percentage')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ]

  // Load variance data
  const loadVarianceData = async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('variance_analysis')
        .select('*')
        .eq('year', yearFilter)

      if (monthFilter !== 'all') {
        query = query.eq('month', monthFilter)
      }

      const { data, error } = await query.order('variance_percentage', { ascending: false })

      if (error) throw error
      setVarianceData(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVarianceData()
  }, [yearFilter, monthFilter])

  // Get unique categories for filter
  const availableCategories = useMemo(() => {
    return [...new Set(varianceData.map(item => item.category_name))].sort()
  }, [varianceData])

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = varianceData.filter(item => {
      // Category type filter
      if (categoryTypeFilter !== 'all' && item.category_type !== categoryTypeFilter) {
        return false
      }

      // Selected categories filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(item.category_name)) {
        return false
      }

      // Variance range filter
      if (varianceRangeFilter === 'positive' && item.variance_amount <= 0) return false
      if (varianceRangeFilter === 'negative' && item.variance_amount >= 0) return false
      if (varianceRangeFilter === 'significant' && Math.abs(item.variance_percentage) < 10) return false

      // Search term filter
      if (searchTerm && !item.category_name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'category_name':
          comparison = a.category_name.localeCompare(b.category_name)
          break
        case 'variance_amount':
          comparison = a.variance_amount - b.variance_amount
          break
        case 'variance_percentage':
          comparison = a.variance_percentage - b.variance_percentage
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [varianceData, categoryTypeFilter, selectedCategories, varianceRangeFilter, searchTerm, sortBy, sortOrder])

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value)
  }

  // Get performance indicator
  const getPerformanceStatus = (variance: number, type: string) => {
    if (variance === 0) return { label: 'In linea', color: 'gray', icon: Target }
    
    const isGood = (type === 'revenue' && variance > 0) || (type === 'expense' && variance < 0)
    
    return {
      label: isGood ? 'Meglio' : 'Peggio',
      color: isGood ? 'green' : 'red',
      icon: isGood ? TrendingUp : TrendingDown
    }
  }

  // Calculate totals
  const totals = useMemo(() => {
    return filteredAndSortedData.reduce((acc, item) => {
      if (item.category_type === 'revenue') {
        acc.revenueVariance += item.variance_amount
      } else if (item.category_type === 'expense') {
        acc.expenseVariance += item.variance_amount
      }
      acc.netVariance = acc.revenueVariance - acc.expenseVariance
      return acc
    }, { revenueVariance: 0, expenseVariance: 0, netVariance: 0 })
  }, [filteredAndSortedData])

  // Export function
  const exportData = () => {
    const csvContent = [
      ['Categoria', 'Tipo', 'Previsto', 'Effettivo', 'Variance €', 'Variance %', 'Mese', 'Anno'].join(','),
      ...filteredAndSortedData.map(item => [
        item.category_name,
        item.category_type,
        item.projected_value,
        item.actual_value,
        item.variance_amount,
        item.variance_percentage,
        item.month,
        item.year
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `variance-analysis-${yearFilter}-${monthFilter === 'all' ? 'all' : monthFilter}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtri Avanzati Variance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Year Filter */}
            <div>
              <label className="text-sm font-medium block mb-2">Anno</label>
              <Select value={yearFilter.toString()} onValueChange={(value) => setYearFilter(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Filter */}
            <div>
              <label className="text-sm font-medium block mb-2">Mese</label>
              <Select value={monthFilter.toString()} onValueChange={(value) => setMonthFilter(value === 'all' ? 'all' : parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i mesi</SelectItem>
                  {months.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Type Filter */}
            <div>
              <label className="text-sm font-medium block mb-2">Tipo Categoria</label>
              <Select value={categoryTypeFilter} onValueChange={(value: any) => setCategoryTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i tipi</SelectItem>
                  <SelectItem value="revenue">Solo Entrate</SelectItem>
                  <SelectItem value="expense">Solo Uscite</SelectItem>
                  <SelectItem value="balance">Solo Saldi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Variance Range Filter */}
            <div>
              <label className="text-sm font-medium block mb-2">Range Variance</label>
              <Select value={varianceRangeFilter} onValueChange={(value: any) => setVarianceRangeFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le variance</SelectItem>
                  <SelectItem value="positive">Solo positive</SelectItem>
                  <SelectItem value="negative">Solo negative</SelectItem>
                  <SelectItem value="significant">Solo significative (>10%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <Input
              placeholder="Cerca per nome categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Category Multi-Select */}
          {availableCategories.length > 0 && (
            <div className="mt-4">
              <label className="text-sm font-medium block mb-2">Categorie Specifiche (lascia vuoto per tutte)</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableCategories.map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCategories([...selectedCategories, category])
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== category))
                        }
                      }}
                    />
                    <label htmlFor={category} className="text-sm">{category}</label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="mt-4 flex justify-between items-center">
            <div className="flex gap-4">
              <Badge variant="outline">{filteredAndSortedData.length} risultati</Badge>
              {varianceData.length > 0 && filteredAndSortedData.length !== varianceData.length && (
                <Badge variant="secondary">Filtrati da {varianceData.length}</Badge>
              )}
            </div>
            <Button onClick={exportData} size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Totals Summary */}
      {filteredAndSortedData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-sm text-blue-600">Variance Entrate</div>
              <div className={cn("text-2xl font-bold", totals.revenueVariance >= 0 ? "text-green-600" : "text-red-600")}>
                {formatCurrency(totals.revenueVariance)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="text-sm text-orange-600">Variance Uscite</div>
              <div className={cn("text-2xl font-bold", totals.expenseVariance <= 0 ? "text-green-600" : "text-red-600")}>
                {formatCurrency(totals.expenseVariance)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="text-sm text-purple-600">Variance Netta</div>
              <div className={cn("text-2xl font-bold", totals.netVariance >= 0 ? "text-green-600" : "text-red-600")}>
                {formatCurrency(totals.netVariance)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Dettaglio Variance Analysis</span>
            <div className="flex gap-2 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSortBy('variance_percentage')
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
                }}
                className="flex items-center gap-1"
              >
                % Variance
                {sortBy === 'variance_percentage' && (
                  sortOrder === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Caricamento...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Errore: {error}</div>
          ) : filteredAndSortedData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              Nessun dato trovato con i filtri selezionati
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Previsto</TableHead>
                    <TableHead className="text-right">Effettivo</TableHead>
                    <TableHead className="text-right">Variance €</TableHead>
                    <TableHead className="text-right">Variance %</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Periodo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.map((item, index) => {
                    const performance = getPerformanceStatus(item.variance_amount, item.category_type)
                    const PerformanceIcon = performance.icon
                    
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.category_name}</TableCell>
                        <TableCell>
                          <Badge variant={
                            item.category_type === 'revenue' ? 'default' :
                            item.category_type === 'expense' ? 'destructive' : 'secondary'
                          }>
                            {item.category_type === 'revenue' ? 'Entrata' :
                             item.category_type === 'expense' ? 'Uscita' : 'Saldo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(item.projected_value)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(item.actual_value)}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-mono font-semibold",
                          item.variance_amount >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(item.variance_amount)}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-mono font-semibold",
                          item.variance_percentage >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {item.variance_percentage.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <PerformanceIcon className={cn(
                              "h-4 w-4",
                              performance.color === 'green' ? "text-green-500" :
                              performance.color === 'red' ? "text-red-500" : "text-gray-500"
                            )} />
                            <span className={cn(
                              "text-sm",
                              performance.color === 'green' ? "text-green-700" :
                              performance.color === 'red' ? "text-red-700" : "text-gray-700"
                            )}>
                              {performance.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {months[item.month - 1]} {item.year}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}