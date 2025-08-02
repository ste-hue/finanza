import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  CheckCircle2, 
  Circle, 
  Calendar,
  TrendingUp,
  AlertTriangle 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedCellEditorProps {
  categoryName: string
  month: number
  year: number
  currentValue: number
  isVisible: boolean
  onSave: (value: number, isProjection: boolean) => void
  onCancel: () => void
  darkMode?: boolean
}

export const EnhancedCellEditor: React.FC<EnhancedCellEditorProps> = ({
  categoryName,
  month,
  year,
  currentValue,
  isVisible,
  onSave,
  onCancel,
  darkMode = false
}) => {
  const [value, setValue] = useState(currentValue.toString())
  const [dataType, setDataType] = useState<'consolidated' | 'projection'>('projection')
  
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  
  // Determine default data type based on date
  useEffect(() => {
    if (year < currentYear || (year === currentYear && month <= currentMonth)) {
      setDataType('consolidated') // Past/current = consolidated
    } else {
      setDataType('projection') // Future = projection
    }
  }, [year, month, currentYear, currentMonth])

  useEffect(() => {
    setValue(currentValue.toString())
  }, [currentValue, isVisible])

  if (!isVisible) return null

  const handleSave = () => {
    const numValue = parseFloat(value) || 0
    const isProjection = dataType === 'projection'
    onSave(numValue, isProjection)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ]

  const getTypeInfo = (type: 'consolidated' | 'projection') => {
    if (type === 'consolidated') {
      return {
        label: 'Consolidato',
        description: 'Valore effettivo/reale',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle2
      }
    } else {
      return {
        label: 'Previsionale',
        description: 'Valore forecast/stimato',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: Circle
      }
    }
  }

  const consolidatedInfo = getTypeInfo('consolidated')
  const projectionInfo = getTypeInfo('projection')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className={cn(
        "w-96 max-w-[90vw] transition-colors",
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
      )}>
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="text-center">
            <h3 className={cn(
              "font-semibold text-lg",
              darkMode ? "text-gray-100" : "text-gray-900"
            )}>
              Modifica Valore
            </h3>
            <p className={cn(
              "text-sm",
              darkMode ? "text-gray-400" : "text-gray-600"
            )}>
              {categoryName} - {monthNames[month - 1]} {year}
            </p>
          </div>

          {/* Value Input */}
          <div>
            <label className={cn(
              "text-sm font-medium block mb-2",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Valore (€)
            </label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="0.00"
              className="text-center text-lg font-mono"
              autoFocus
            />
          </div>

          {/* Data Type Selection */}
          <div>
            <label className={cn(
              "text-sm font-medium block mb-3",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Tipo Dato
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDataType('consolidated')}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all text-left",
                  dataType === 'consolidated' 
                    ? consolidatedInfo.color
                    : darkMode 
                    ? "border-gray-600 hover:border-gray-500" 
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium text-sm">Consolidato</span>
                </div>
                <p className="text-xs opacity-75">Valore effettivo/reale</p>
              </button>

              <button
                onClick={() => setDataType('projection')}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all text-left",
                  dataType === 'projection' 
                    ? projectionInfo.color
                    : darkMode 
                    ? "border-gray-600 hover:border-gray-500" 
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Circle className="h-4 w-4" />
                  <span className="font-medium text-sm">Previsionale</span>
                </div>
                <p className="text-xs opacity-75">Forecast/stimato</p>
              </button>
            </div>
          </div>

          {/* Smart Suggestions */}
          <div className={cn(
            "p-3 rounded-lg border",
            darkMode ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-200"
          )}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={cn(
                "h-4 w-4 mt-0.5",
                darkMode ? "text-blue-400" : "text-blue-600"
              )} />
              <div className="text-xs">
                <p className={cn(
                  "font-medium mb-1",
                  darkMode ? "text-blue-300" : "text-blue-700"
                )}>
                  Suggerimento:
                </p>
                <p className={cn(
                  darkMode ? "text-blue-400" : "text-blue-600"
                )}>
                  {year < currentYear || (year === currentYear && month <= currentMonth) 
                    ? `${monthNames[month - 1]} è un mese passato - considera "Consolidato" per valori effettivi.`
                    : `${monthNames[month - 1]} è un mese futuro - usa "Previsionale" per stime/budget.`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Salva
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}