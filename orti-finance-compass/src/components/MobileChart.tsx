import React from 'react'
import { cn } from '@/lib/utils'

interface MobileChartProps {
  data: Array<{
    month: string
    entrate: number
    uscite: number
  }>
  darkMode: boolean
  className?: string
}

export const MobileChart: React.FC<MobileChartProps> = ({
  data,
  darkMode,
  className
}) => {
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.entrate, d.uscite))
  )

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`
    }
    return value.toString()
  }

  return (
    <div className={cn(
      "w-full overflow-x-auto touch-scroll",
      className
    )}>
      <div className="min-w-[600px] p-4">
        {/* Chart Area */}
        <div className="relative h-40 mb-4">
          <div className="absolute inset-0 flex items-end justify-between gap-2">
            {data.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end h-full">
                  {/* Entrate Bar */}
                  <div
                    className={cn(
                      "flex-1 rounded-t-sm transition-all duration-500",
                      darkMode ? "bg-green-500" : "bg-green-600"
                    )}
                    style={{
                      height: `${(item.entrate / maxValue) * 100}%`,
                      minHeight: item.entrate > 0 ? '2px' : '0'
                    }}
                  />
                  {/* Uscite Bar */}
                  <div
                    className={cn(
                      "flex-1 rounded-t-sm transition-all duration-500",
                      darkMode ? "bg-red-500" : "bg-red-600"
                    )}
                    style={{
                      height: `${(item.uscite / maxValue) * 100}%`,
                      minHeight: item.uscite > 0 ? '2px' : '0'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 -ml-8 h-full flex flex-col justify-between text-xs">
            <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
              {formatValue(maxValue)}
            </span>
            <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
              {formatValue(maxValue / 2)}
            </span>
            <span className={darkMode ? "text-gray-400" : "text-gray-600"}>0</span>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between">
          {data.map((item, index) => (
            <div key={index} className="flex-1 text-center">
              <span className={cn(
                "text-xs",
                darkMode ? "text-gray-400" : "text-gray-600"
              )}>
                {item.month}
              </span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-3 h-3 rounded",
              darkMode ? "bg-green-500" : "bg-green-600"
            )} />
            <span className={cn(
              "text-xs",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>Entrate</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-3 h-3 rounded",
              darkMode ? "bg-red-500" : "bg-red-600"
            )} />
            <span className={cn(
              "text-xs",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>Uscite</span>
          </div>
        </div>
      </div>
    </div>
  )
}