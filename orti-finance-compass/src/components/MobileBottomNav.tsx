import React from 'react'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileJson,
  Menu,
  Home
} from 'lucide-react'

interface MobileBottomNavProps {
  onScrollToSection: (section: 'entrate' | 'uscite' | 'differenza' | 'home') => void
  onToggleCharts: () => void
  onToggleMenu: () => void
  onExportImport: () => void
  darkMode: boolean
  showCharts: boolean
  className?: string
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onScrollToSection,
  onToggleCharts,
  onToggleMenu,
  onExportImport,
  darkMode,
  showCharts,
  className
}) => {
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 md:hidden",
      "safe-area-inset-bottom safe-area-inset-x",
      darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200",
      "border-t shadow-lg",
      className
    )}>
      <nav className="flex items-center justify-around h-16">
        {/* Home */}
        <button
          onClick={() => onScrollToSection('home')}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full",
            "transition-colors duration-200 no-select",
            darkMode 
              ? "text-gray-400 hover:text-gray-200 active:bg-gray-800" 
              : "text-gray-600 hover:text-gray-900 active:bg-gray-50"
          )}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        {/* Entrate */}
        <button
          onClick={() => onScrollToSection('entrate')}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full",
            "transition-colors duration-200 no-select",
            darkMode 
              ? "text-green-400 hover:text-green-300 active:bg-gray-800" 
              : "text-green-600 hover:text-green-700 active:bg-green-50"
          )}
        >
          <TrendingUp className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Entrate</span>
        </button>

        {/* Uscite */}
        <button
          onClick={() => onScrollToSection('uscite')}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full",
            "transition-colors duration-200 no-select",
            darkMode 
              ? "text-red-400 hover:text-red-300 active:bg-gray-800" 
              : "text-red-600 hover:text-red-700 active:bg-red-50"
          )}
        >
          <TrendingDown className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Uscite</span>
        </button>

        {/* Charts */}
        <button
          onClick={onToggleCharts}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full",
            "transition-colors duration-200 no-select",
            showCharts 
              ? darkMode 
                ? "text-purple-400 bg-gray-800" 
                : "text-purple-600 bg-purple-50"
              : darkMode 
                ? "text-gray-400 hover:text-gray-200 active:bg-gray-800" 
                : "text-gray-600 hover:text-gray-900 active:bg-gray-50"
          )}
        >
          <BarChart3 className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Grafici</span>
        </button>

        {/* Export/Import */}
        <button
          onClick={onExportImport}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full",
            "transition-colors duration-200 no-select",
            darkMode 
              ? "text-gray-400 hover:text-gray-200 active:bg-gray-800" 
              : "text-gray-600 hover:text-gray-900 active:bg-gray-50"
          )}
        >
          <FileJson className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Dati</span>
        </button>

        {/* Menu */}
        <button
          onClick={onToggleMenu}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full",
            "transition-colors duration-200 no-select",
            darkMode 
              ? "text-gray-400 hover:text-gray-200 active:bg-gray-800" 
              : "text-gray-600 hover:text-gray-900 active:bg-gray-50"
          )}
        >
          <Menu className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </nav>
    </div>
  )
}