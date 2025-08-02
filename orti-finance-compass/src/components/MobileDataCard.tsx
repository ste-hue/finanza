import React from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MobileDataCardProps {
  title: string
  value: number
  previousValue?: number
  type: 'revenue' | 'expense' | 'balance'
  darkMode: boolean
  onClick?: () => void
  className?: string
}

export const MobileDataCard: React.FC<MobileDataCardProps> = ({
  title,
  value,
  previousValue,
  type,
  darkMode,
  onClick,
  className
}) => {
  const formatCurrency = (val: number) => {
    if (val === 0) return '€0'
    return new Intl.NumberFormat('it-IT', { 
      style: 'currency', 
      currency: 'EUR', 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val)
  }

  const formatPercentage = (current: number, previous: number) => {
    if (previous === 0) return null
    const change = ((current - previous) / previous) * 100
    return change
  }

  const percentage = previousValue !== undefined ? formatPercentage(value, previousValue) : null
  const isPositive = percentage !== null && percentage > 0
  const isNegative = percentage !== null && percentage < 0

  const colorClasses = {
    revenue: {
      bg: darkMode ? 'bg-green-900/20' : 'bg-green-50',
      border: darkMode ? 'border-green-800' : 'border-green-200',
      text: darkMode ? 'text-green-400' : 'text-green-700',
      icon: darkMode ? 'text-green-500' : 'text-green-600'
    },
    expense: {
      bg: darkMode ? 'bg-red-900/20' : 'bg-red-50',
      border: darkMode ? 'border-red-800' : 'border-red-200',
      text: darkMode ? 'text-red-400' : 'text-red-700',
      icon: darkMode ? 'text-red-500' : 'text-red-600'
    },
    balance: {
      bg: darkMode ? 'bg-purple-900/20' : 'bg-purple-50',
      border: darkMode ? 'border-purple-800' : 'border-purple-200',
      text: darkMode ? 'text-purple-400' : 'text-purple-700',
      icon: darkMode ? 'text-purple-500' : 'text-purple-600'
    }
  }

  const colors = colorClasses[type]

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-lg border transition-all duration-200",
        "touch-manipulation active:scale-[0.98]",
        colors.bg,
        colors.border,
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
    >
      {/* Title */}
      <h3 className={cn(
        "text-xs font-medium mb-2 uppercase tracking-wider",
        darkMode ? "text-gray-400" : "text-gray-600"
      )}>
        {title}
      </h3>

      {/* Value */}
      <div className={cn("text-xl font-semibold", colors.text)}>
        {formatCurrency(value)}
      </div>

      {/* Trend */}
      {percentage !== null && (
        <div className="flex items-center gap-1 mt-2">
          {isPositive ? (
            <TrendingUp className={cn("w-4 h-4", colors.icon)} />
          ) : isNegative ? (
            <TrendingDown className={cn("w-4 h-4", colors.icon)} />
          ) : (
            <Minus className={cn("w-4 h-4", darkMode ? "text-gray-500" : "text-gray-400")} />
          )}
          <span className={cn(
            "text-xs font-medium",
            isPositive ? colors.text : isNegative ? colors.text : darkMode ? "text-gray-500" : "text-gray-500"
          )}>
            {isPositive && '+'}
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}