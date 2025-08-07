import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Banknote, Calculator, Edit3, Check, X, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBankBalances } from '@/hooks/useBankBalances'

interface BankBalancesPanelProps {
  year: number
  month: number
  darkMode?: boolean
  onTotalChange?: (total: number) => void
}

export const BankBalancesPanel: React.FC<BankBalancesPanelProps> = ({
  year,
  month,
  darkMode = false,
  onTotalChange
}) => {
  const { balances, totalBalance, projectedBalance, nextMonthProjectedBalance, loading, error, updateBankBalance, formatCurrency } = useBankBalances(year, month)
  const [editingBank, setEditingBank] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  React.useEffect(() => {
    onTotalChange?.(totalBalance)
  }, [totalBalance, onTotalChange])

  const handleStartEdit = (bankName: string, currentValue: number) => {
    setEditingBank(bankName)
    setEditValue(currentValue.toString())
  }

  const handleSaveEdit = async () => {
    if (editingBank && editValue) {
      const numValue = parseFloat(editValue.replace(/[^\d.-]/g, ''))
      if (!isNaN(numValue)) {
        await updateBankBalance(editingBank, numValue)
      }
    }
    setEditingBank(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setEditingBank(null)
    setEditValue('')
  }

  const getMonthName = (month: number) => {
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 
                   'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
    return months[month - 1]
  }

  if (loading) {
    return (
      <Card className={cn("mb-6", darkMode && "bg-gray-800 border-gray-700")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Caricamento saldi bancari...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("mb-6 border-red-200", darkMode && "bg-gray-800 border-red-800")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Banknote className="h-5 w-5" />
            Errore nel caricamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 text-sm">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "mb-6 transition-all duration-300",
      darkMode ? "bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-700/50" : "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200"
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className={cn("text-xl font-semibold", darkMode ? "text-gray-100" : "text-slate-800")}>
                Saldi Bancari
              </h2>
              <p className={cn("text-sm font-normal", darkMode ? "text-gray-400" : "text-slate-600")}>
                {getMonthName(month)} {year} - Saldi di riferimento
              </p>
            </div>
          </CardTitle>
          
          <div className="text-right space-y-3">
            {/* ULTIMO SALDO CONSOLIDATO */}
            <div>
              <div className={cn("text-lg font-bold", darkMode ? "text-blue-300" : "text-blue-600")}>
                {formatCurrency(totalBalance)}
              </div>
              <Badge variant="default" className="mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                Ultimo Saldo (31/07)
              </Badge>
            </div>
            
            {/* SALDO PROIETTATO FINE MESE CORRENTE */}
            {projectedBalance !== null && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className={cn("text-xl font-bold", darkMode ? "text-purple-300" : "text-purple-600")}>
                  {formatCurrency(projectedBalance)}
                </div>
                <Badge variant="outline" className={cn("mt-1", darkMode ? "text-purple-300 border-purple-400" : "text-purple-600 border-purple-300")}>
                  <Calculator className="h-3 w-3 mr-1" />
                  Proiettato Fine {getMonthName(month)} (31/{month.toString().padStart(2, '0')})
                </Badge>
              </div>
            )}
            
            {/* SALDO PROIETTATO MESE SUCCESSIVO */}
            {nextMonthProjectedBalance !== null && month < 12 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className={cn("text-lg font-semibold", darkMode ? "text-orange-300" : "text-orange-600")}>
                  {formatCurrency(nextMonthProjectedBalance)}
                </div>
                <Badge variant="outline" className={cn("mt-1", darkMode ? "text-orange-300 border-orange-400" : "text-orange-600 border-orange-300")}>
                  <Calculator className="h-3 w-3 mr-1" />
                  Proiettato {getMonthName(month + 1)} (31/{(month + 1).toString().padStart(2, '0')})
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {balances.map((balance, index) => (
            <div key={balance.bank_name}>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    balance.is_projection ? "bg-orange-400" : "bg-green-400"
                  )} />
                  <div>
                    <div className={cn("font-medium", darkMode ? "text-gray-200" : "text-slate-800")}>
                      {balance.bank_name.replace('Saldo ', '')}
                    </div>
                    <div className={cn("text-xs", darkMode ? "text-gray-400" : "text-slate-500")}>
                      Agg: {new Date(balance.last_updated).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {editingBank === balance.bank_name ? (
                    <>
                      <Input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-32 h-8 text-right font-mono"
                        placeholder="0.00"
                        autoFocus
                      />
                      <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className={cn(
                        "text-right font-mono",
                        darkMode ? "text-gray-200" : "text-slate-800"
                      )}>
                        {formatCurrency(balance.balance)}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleStartEdit(balance.bank_name, balance.balance)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {index < balances.length - 1 && (
                <Separator className="my-2 opacity-30" />
              )}
            </div>
          ))}
        </div>

        {balances.length === 0 && (
          <div className="text-center py-8">
            <Banknote className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-slate-600")}>
              Nessun saldo bancario trovato per {getMonthName(month)} {year}
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={cn("text-sm space-y-1", darkMode ? "text-gray-400" : "text-slate-600")}>
              <div>💡 Clicca sull'icona di modifica per aggiornare i saldi</div>
              {projectedBalance !== null && (
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    <Calculator className="h-3 w-3" />
                    <span>Proiezioni = Ultimo saldo consolidato + Cash Flow mensile</span>
                  </div>
                  <div className="text-xs opacity-75">
                    📅 Saldi proiettati basati su entrate e uscite previste
                  </div>
                </div>
              )}
            </div>
            <Button variant="outline" size="sm">
              <Calculator className="h-3 w-3 mr-2" />
              Ricalcola Totale
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}