import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react'
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
}

interface VarianceAnalysisPanelProps {
  year: number
  month: number
  monthName: string
}

export const VarianceAnalysisPanel: React.FC<VarianceAnalysisPanelProps> = ({
  year,
  month,
  monthName
}) => {
  const [varianceData, setVarianceData] = useState<VarianceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadVarianceData = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('variance_analysis')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .order('variance_percentage', { ascending: false })

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
  }, [year, month])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const getPerformanceStatus = (variance: number, type: string) => {
    if (variance === 0) return { label: 'In linea', color: 'gray', icon: Target }
    
    const isGood = (type === 'revenue' && variance > 0) || (type === 'expense' && variance < 0)
    
    return {
      label: isGood ? 'Meglio' : 'Peggio',
      color: isGood ? 'green' : 'red',
      icon: isGood ? TrendingUp : TrendingDown
    }
  }

  const getTotalVariance = () => {
    return varianceData.reduce((acc, item) => {
      if (item.category_type === 'revenue') {
        acc.revenue += item.variance_amount
      } else if (item.category_type === 'expense') {
        acc.expense += item.variance_amount
      }
      return acc
    }, { revenue: 0, expense: 0 })
  }

  const totals = getTotalVariance()
  const netVariance = totals.revenue - totals.expense

  if (loading) return <div className="p-4">Caricamento variance analysis...</div>
  if (error) return <div className="p-4 text-red-600">Errore: {error}</div>
  if (varianceData.length === 0) return <div className="p-4">Nessun dato di variance per {monthName} {year}</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Variance Analysis - {monthName} {year}
        </CardTitle>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="text-sm text-green-700 dark:text-green-300">Variance Entrate</div>
            <div className={cn(
              "text-lg font-bold",
              totals.revenue >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {totals.revenue >= 0 ? '+' : ''}{formatCurrency(totals.revenue)}
            </div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <div className="text-sm text-red-700 dark:text-red-300">Variance Uscite</div>
            <div className={cn(
              "text-lg font-bold",
              totals.expense <= 0 ? "text-green-600" : "text-red-600"
            )}>
              {totals.expense >= 0 ? '+' : ''}{formatCurrency(totals.expense)}
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-sm text-blue-700 dark:text-blue-300">Variance Netta</div>
            <div className={cn(
              "text-lg font-bold",
              netVariance >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {netVariance >= 0 ? '+' : ''}{formatCurrency(netVariance)}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {varianceData.map((item, index) => {
            const status = getPerformanceStatus(item.variance_amount, item.category_type)
            const StatusIcon = status.icon
            
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.category_name}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        item.category_type === 'revenue' && "border-green-300 text-green-700",
                        item.category_type === 'expense' && "border-red-300 text-red-700"
                      )}
                    >
                      {item.category_type === 'revenue' ? 'Entrata' : 'Uscita'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Previsione: {formatCurrency(item.projected_value)} → 
                    Effettivo: {formatCurrency(item.actual_value)}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={cn(
                    "font-bold",
                    status.color === 'green' && "text-green-600",
                    status.color === 'red' && "text-red-600",
                    status.color === 'gray' && "text-gray-600"
                  )}>
                    {item.variance_amount >= 0 ? '+' : ''}{formatCurrency(item.variance_amount)}
                  </div>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <StatusIcon className={cn(
                      "h-3 w-3",
                      status.color === 'green' && "text-green-500",
                      status.color === 'red' && "text-red-500",
                      status.color === 'gray' && "text-gray-500"
                    )} />
                    <span className="text-xs text-gray-500">
                      {Math.abs(item.variance_percentage)}% {status.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={loadVarianceData}
            className="w-full"
          >
            Aggiorna Variance Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}