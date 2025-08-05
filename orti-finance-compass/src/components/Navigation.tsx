import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  Settings, 
  Calendar,
  Target,
  Cog,
  ChevronDown,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

interface NavigationProps {
  currentPage: 'dashboard' | 'consolidation' | 'admin'
  onNavigate: (page: 'dashboard' | 'consolidation' | 'admin') => void
  darkMode?: boolean
  selectedCompany?: string
  onCompanyChange?: (company: string) => void
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onNavigate,
  darkMode = false,
  selectedCompany = 'ORTI',
  onCompanyChange
}) => {
  const [companies, setCompanies] = useState<string[]>(['ORTI', 'INTUR'])
  const [showAddCompany, setShowAddCompany] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
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
          {/* Logo/Brand with Company Selector */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              darkMode ? "bg-blue-600" : "bg-blue-500"
            )}>
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "text-xl font-bold p-0 h-auto justify-start hover:bg-transparent",
                      darkMode ? "text-gray-100 hover:text-blue-300" : "text-gray-900 hover:text-blue-600"
                    )}
                  >
                    {selectedCompany} Finance
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  className={cn(
                    "w-56",
                    darkMode && "bg-gray-800 border-gray-700"
                  )}
                >
                  {companies.map((company) => (
                    <DropdownMenuItem
                      key={company}
                      onClick={() => onCompanyChange?.(company)}
                      className={cn(
                        "cursor-pointer",
                        selectedCompany === company && "bg-blue-50 text-blue-700",
                        darkMode && selectedCompany === company && "bg-blue-900 text-blue-300",
                        darkMode && "hover:bg-gray-700"
                      )}
                    >
                      {company} Finance
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className={darkMode ? "bg-gray-700" : ""} />
                  {showAddCompany ? (
                    <div className="p-2">
                      <Input
                        placeholder="Nome nuova compagnia..."
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        className={cn(
                          "mb-2",
                          darkMode && "bg-gray-900 border-gray-600"
                        )}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newCompanyName.trim()) {
                            const newCompany = newCompanyName.trim().toUpperCase()
                            if (!companies.includes(newCompany)) {
                              setCompanies([...companies, newCompany])
                              onCompanyChange?.(newCompany)
                            }
                            setNewCompanyName('')
                            setShowAddCompany(false)
                          }
                          if (e.key === 'Escape') {
                            setShowAddCompany(false)
                            setNewCompanyName('')
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (newCompanyName.trim()) {
                              const newCompany = newCompanyName.trim().toUpperCase()
                              if (!companies.includes(newCompany)) {
                                setCompanies([...companies, newCompany])
                                onCompanyChange?.(newCompany)
                              }
                              setNewCompanyName('')
                              setShowAddCompany(false)
                            }
                          }}
                          className="flex-1"
                        >
                          Aggiungi
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowAddCompany(false)
                            setNewCompanyName('')
                          }}
                          className="flex-1"
                        >
                          Annulla
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => setShowAddCompany(true)}
                      className={cn(
                        "cursor-pointer",
                        darkMode && "hover:bg-gray-700"
                      )}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Aggiungi Compagnia
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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