import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConsolidationPanel } from '@/components/ConsolidationPanel'
import { VarianceAnalysisPanel } from '@/components/VarianceAnalysisPanel'
import { AdvancedVarianceAnalysis } from '@/components/AdvancedVarianceAnalysis'
import { ProjectionBackfillPanel } from '@/components/ProjectionBackfillPanel'
import { useConsolidation } from '@/hooks/useConsolidation'
import { Calendar, TrendingUp, History, AlertTriangle, Filter } from 'lucide-react'

export const ConsolidationPage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(2025)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [consolidationEvents, setConsolidationEvents] = useState([])
  
  const { loadConsolidationEvents, isMonthConsolidated, revertConsolidation } = useConsolidation()
  
  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ]

  useEffect(() => {
    loadConsolidationEvents(selectedYear).then(setConsolidationEvents)
  }, [selectedYear, loadConsolidationEvents])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consolidamento & Variance</h1>
          <p className="text-gray-600 mt-1">
            Gestisci consolidamento mensile e analizza performance vs previsioni
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

      <Tabs defaultValue="consolidate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="consolidate" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Consolida Mesi
          </TabsTrigger>
          <TabsTrigger value="variance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Variance Base
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Analisi Avanzata
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Storico Eventi
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Consolidamento */}
        <TabsContent value="consolidate" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {months.map((monthName, index) => {
              const monthNumber = index + 1
              const isConsolidated = consolidationEvents.some(
                (event: any) => event.month === monthNumber
              )
              
              return (
                <Card key={monthNumber} className={`transition-all ${
                  isConsolidated ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{monthName} {selectedYear}</CardTitle>
                      <Badge variant={isConsolidated ? 'default' : 'secondary'}>
                        {isConsolidated ? '✅ Consolidato' : '⏳ Da consolidare'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {!isConsolidated ? (
                      <ConsolidationPanel
                        year={selectedYear}
                        month={monthNumber}
                        monthName={monthName}
                        onConsolidated={() => loadConsolidationEvents(selectedYear).then(setConsolidationEvents)}
                      />
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-green-700 mb-3">
                          ✅ Mese già consolidato
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedMonth(monthNumber)}
                            className="flex-1"
                          >
                            📊 Variance
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              if (confirm(`⚠️ Sei sicuro di voler REVERTIRE il consolidamento di ${monthName}?\n\nTutti i valori torneranno a essere previsionali.`)) {
                                const result = await revertConsolidation(selectedYear, monthNumber, 'user')
                                if (result.success) {
                                  // Refresh consolidation events
                                  loadConsolidationEvents(selectedYear).then(setConsolidationEvents)
                                }
                              }
                            }}
                            className="flex-1"
                          >
                            🔄 Revert
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Tab 2: Variance Analysis */}
        <TabsContent value="variance" className="space-y-6">
          <div className="flex gap-2 mb-6">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border rounded px-3 py-2"
            >
              {months.map((month, index) => (
                <option key={index + 1} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>
          
          {/* Projection Backfill for months without forecasts */}
          <ProjectionBackfillPanel
            year={selectedYear}
            month={selectedMonth}
            monthName={months[selectedMonth - 1]}
            onProjectionsAdded={() => {
              // Refresh the variance analysis
              window.location.reload()
            }}
          />
          
          <VarianceAnalysisPanel
            year={selectedYear}
            month={selectedMonth}
            monthName={months[selectedMonth - 1]}
          />
        </TabsContent>

        {/* Tab 3: Advanced Analysis */}
        <TabsContent value="advanced" className="space-y-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Analisi Avanzata con Filtri</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Analizza variance su più mesi, filtra per categorie specifiche, esporta dati per business intelligence
            </p>
          </div>
          
          <AdvancedVarianceAnalysis
            initialYear={selectedYear}
            initialMonth={selectedMonth}
          />
        </TabsContent>

        {/* Tab 4: Storico Eventi */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Storico Consolidamenti {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              {consolidationEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nessun consolidamento effettuato per {selectedYear}
                </p>
              ) : (
                <div className="space-y-3">
                  {consolidationEvents.map((event: any) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">
                          {months[event.month - 1]} {event.year}
                        </div>
                        <div className="text-sm text-gray-600">
                          {event.total_entries_consolidated} entries consolidate
                        </div>
                        {event.notes && (
                          <div className="text-sm text-gray-500 mt-1">
                            Note: {event.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {new Date(event.consolidation_date).toLocaleDateString('it-IT')}
                        </div>
                        <div className="text-xs text-gray-500">
                          da {event.consolidated_by}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}