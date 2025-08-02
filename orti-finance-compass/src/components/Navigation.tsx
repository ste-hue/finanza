import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  Settings, 
  Calendar,
  Target,
  Cog
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationProps {
  currentPage: 'dashboard' | 'consolidation' | 'admin'
  onNavigate: (page: 'dashboard' | 'consolidation' | 'admin') => void
  darkMode?: boolean
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onNavigate,
  darkMode = false
}) => {
  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Vista principale finanziaria',
      color: 'blue'
    },
    {
      id: 'consolidation' as const,
      label: 'Consolidamento',
      icon: Target,
      description: 'Gestione consolidamento e variance',
      color: 'orange',
      badge: 'NEW'
    },
    {
      id: 'admin' as const,
      label: 'Amministrazione',
      icon: Settings,
      description: 'Gestione categorie e impostazioni',
      color: 'purple'
    }
  ]

  return (
    <div className={cn(
      "border-b transition-colors duration-300",
      darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    )}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between py-4">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              darkMode ? "bg-blue-600" : "bg-blue-500"
            )}>
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className={cn(
                "text-xl font-bold",
                darkMode ? "text-gray-100" : "text-gray-900"
              )}>
                ORTI Finance
              </h1>
              <p className={cn(
                "text-xs",
                darkMode ? "text-gray-400" : "text-gray-500"
              )}>
                Dashboard Finanziario
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "relative h-auto py-3 px-4 flex flex-col items-center gap-1 transition-all",
                    isActive && "shadow-md",
                    !isActive && darkMode && "hover:bg-gray-700",
                    !isActive && !darkMode && "hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs px-1.5 py-0.5 h-auto"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs opacity-75 hidden md:block",
                    isActive ? "opacity-100" : "opacity-60"
                  )}>
                    {item.description}
                  </span>
                </Button>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "text-sm px-3 py-1.5 rounded-full",
              darkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
            )}>
              ✅ Sistema Attivo
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}