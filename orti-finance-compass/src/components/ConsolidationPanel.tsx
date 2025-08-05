import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface ConsolidationPanelProps {
  year: number
  month: number
  monthName: string
  selectedCompany?: string
  onConsolidated?: () => void
}

export const ConsolidationPanel: React.FC<ConsolidationPanelProps> = ({
  year,
  month,
  monthName,
  selectedCompany = 'ORTI',
  onConsolidated
}) => {
  const [consolidating, setConsolidating] = useState(false)
  const [notes, setNotes] = useState('')

  const handleConsolidate = async () => {
    setConsolidating(true)
    
    try {
      const { data, error } = await supabase.rpc('consolidate_month', {
        target_year: year,
        target_month: month,
        consolidated_by_user: 'current_user', // Replace with actual user
        consolidation_notes: notes
      })

      if (error) throw error

      toast({
        title: "✅ Consolidamento completato",
        description: `${monthName} ${year} è stato consolidato con successo`
      })

      onConsolidated?.()
    } catch (error: any) {
      toast({
        title: "❌ Errore consolidamento", 
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setConsolidating(false)
    }
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
          <Clock className="h-5 w-5" />
          Consolida {monthName} {year}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-orange-100 dark:bg-orange-800/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div className="text-sm text-orange-700 dark:text-orange-300">
            <p className="font-medium mb-1">Cosa succederà:</p>
            <ul className="space-y-1 text-xs">
              <li>• Le previsioni attuali verranno salvate come snapshot</li>
              <li>• I dati verranno marcati come consolidati</li>
              <li>• Potrai inserire i valori effettivi per calcolare le variance</li>
              <li>• L'operazione non può essere annullata</li>
            </ul>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Note (opzionale):</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Aggiungi note sul consolidamento..."
            className="mt-1 w-full p-2 border rounded-md text-sm"
            rows={2}
          />
        </div>

        <Button 
          onClick={handleConsolidate}
          disabled={consolidating}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {consolidating ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Consolidamento in corso...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Consolida {monthName}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}