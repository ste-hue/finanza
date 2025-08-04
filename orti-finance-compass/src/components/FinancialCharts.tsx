import React, { useMemo } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Activity,
  Download,
  Filter
} from 'lucide-react'

interface FinancialChartsProps {
  categories: Record<string, any>
  months: string[]
  darkMode: boolean
  getCellValue: (category: string, month: number) => number
  getCategoriesByType: (type: 'revenue' | 'expense' | 'balance') => string[]
  formatCurrency: (value: number) => string
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({
  categories,
  months,
  darkMode,
  getCellValue,
  getCategoriesByType,
  formatCurrency
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = React.useState<'3m' | '6m' | '12m'>('12m')
  const [selectedChartType, setSelectedChartType] = React.useState<'overview' | 'detailed' | 'comparison' | 'trends'>('overview')
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Export chart data as CSV
  const exportToCSV = () => {
    const headers = ['Mese', 'Entrate', 'Uscite', 'Saldo', 'Margine %']
    const rows = chartData.map(d => [
      d.month,
      d.entrate.toFixed(2),
      d.uscite.toFixed(2),
      d.saldo.toFixed(2),
      d.margine.toFixed(2)
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `analisi_finanziaria_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Prepare data for charts
  const chartData = useMemo(() => {
    const monthsToShow = selectedTimeRange === '3m' ? 3 : selectedTimeRange === '6m' ? 6 : 12
    const startIndex = Math.max(0, months.length - monthsToShow)
    
    return months.slice(startIndex).map((month, idx) => {
      const actualIndex = startIndex + idx + 1
      const revenues = getCategoriesByType('revenue').reduce((sum, cat) => 
        sum + getCellValue(cat, actualIndex), 0
      )
      const expenses = getCategoriesByType('expense').reduce((sum, cat) => 
        sum + getCellValue(cat, actualIndex), 0
      )
      const balance = revenues - expenses
      
      return {
        month,
        entrate: revenues,
        uscite: expenses,
        saldo: balance,
        margine: revenues > 0 ? ((revenues - expenses) / revenues) * 100 : 0
      }
    })
  }, [months, selectedTimeRange, getCellValue, getCategoriesByType])

  // Category breakdown data for pie chart
  const categoryBreakdown = useMemo(() => {
    const revenueCategories = getCategoriesByType('revenue').map(cat => ({
      name: cat,
      value: months.reduce((sum, _, idx) => sum + getCellValue(cat, idx + 1), 0),
      type: 'revenue'
    }))
    
    const expenseCategories = getCategoriesByType('expense').map(cat => ({
      name: cat,
      value: months.reduce((sum, _, idx) => sum + getCellValue(cat, idx + 1), 0),
      type: 'expense'
    }))
    
    return { revenueCategories, expenseCategories }
  }, [getCategoriesByType, getCellValue, months])

  // Colors for charts
  const COLORS = {
    revenue: darkMode ? '#10b981' : '#059669',
    expense: darkMode ? '#ef4444' : '#dc2626',
    balance: darkMode ? '#3b82f6' : '#2563eb',
    margin: darkMode ? '#8b5cf6' : '#7c3aed',
    pieColors: [
      '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
      '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
    ]
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={cn(
          "p-3 rounded-lg shadow-lg border",
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <p className={cn(
            "font-medium mb-2",
            darkMode ? "text-gray-200" : "text-gray-700"
          )}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'margine' ? `${entry.value.toFixed(1)}%` : formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Summary cards
  const summaryData = useMemo(() => {
    const totalRevenue = chartData.reduce((sum, d) => sum + d.entrate, 0)
    const totalExpense = chartData.reduce((sum, d) => sum + d.uscite, 0)
    const avgMargin = chartData.reduce((sum, d) => sum + d.margine, 0) / chartData.length
    const trend = chartData.length > 1 ? 
      ((chartData[chartData.length - 1].saldo - chartData[0].saldo) / Math.abs(chartData[0].saldo || 1)) * 100 : 0

    return { totalRevenue, totalExpense, avgMargin, trend }
  }, [chartData])

  return (
    <Card className={cn(
      "w-full",
      darkMode ? "bg-gray-800 border-gray-700" : ""
    )}>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle className={cn(
              "text-xl md:text-2xl font-bold flex items-center gap-2",
              darkMode ? "text-purple-300" : "text-purple-700"
            )}>
              <BarChart3 className="w-6 h-6" />
              Analisi Finanziaria Avanzata
            </CardTitle>
            <CardDescription className={darkMode ? "text-gray-400" : ""}>
              Visualizzazione dettagliata dei dati finanziari
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedTimeRange} onValueChange={(value: any) => setSelectedTimeRange(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">3 Mesi</SelectItem>
                <SelectItem value="6m">6 Mesi</SelectItem>
                <SelectItem value="12m">12 Mesi</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon" 
              className={darkMode ? "border-gray-600" : ""}
              title="Filtri"
            >
              <Filter className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className={darkMode ? "border-gray-600" : ""}
              onClick={exportToCSV}
              title="Esporta come CSV"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className={cn(
          "grid gap-4 mb-6",
          isMobile ? "grid-cols-2" : "grid-cols-4"
        )}>
          <Card className={cn(
            "p-4",
            darkMode ? "bg-gray-700/50 border-gray-600" : "bg-green-50 border-green-200"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-xs md:text-sm",
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>Entrate Totali</p>
                <p className={cn(
                  "text-lg md:text-2xl font-bold",
                  darkMode ? "text-green-400" : "text-green-700"
                )}>{formatCurrency(summaryData.totalRevenue)}</p>
              </div>
              <DollarSign className={cn(
                "w-6 h-6 md:w-8 md:h-8",
                darkMode ? "text-green-500" : "text-green-600"
              )} />
            </div>
          </Card>

          <Card className={cn(
            "p-4",
            darkMode ? "bg-gray-700/50 border-gray-600" : "bg-red-50 border-red-200"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-xs md:text-sm",
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>Uscite Totali</p>
                <p className={cn(
                  "text-lg md:text-2xl font-bold",
                  darkMode ? "text-red-400" : "text-red-700"
                )}>{formatCurrency(summaryData.totalExpense)}</p>
              </div>
              <DollarSign className={cn(
                "w-6 h-6 md:w-8 md:h-8",
                darkMode ? "text-red-500" : "text-red-600"
              )} />
            </div>
          </Card>

          <Card className={cn(
            "p-4",
            darkMode ? "bg-gray-700/50 border-gray-600" : "bg-purple-50 border-purple-200"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-xs md:text-sm",
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>Margine Medio</p>
                <p className={cn(
                  "text-lg md:text-2xl font-bold",
                  darkMode ? "text-purple-400" : "text-purple-700"
                )}>{summaryData.avgMargin.toFixed(1)}%</p>
              </div>
              <Activity className={cn(
                "w-6 h-6 md:w-8 md:h-8",
                darkMode ? "text-purple-500" : "text-purple-600"
              )} />
            </div>
          </Card>

          <Card className={cn(
            "p-4",
            darkMode ? "bg-gray-700/50 border-gray-600" : "bg-blue-50 border-blue-200"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-xs md:text-sm",
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>Trend</p>
                <p className={cn(
                  "text-lg md:text-2xl font-bold flex items-center gap-1",
                  summaryData.trend >= 0 
                    ? (darkMode ? "text-green-400" : "text-green-700")
                    : (darkMode ? "text-red-400" : "text-red-700")
                )}>
                  {summaryData.trend >= 0 ? <TrendingUp className="w-4 h-4 md:w-5 md:h-5" /> : <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />}
                  {Math.abs(summaryData.trend).toFixed(1)}%
                </p>
              </div>
              <Calendar className={cn(
                "w-6 h-6 md:w-8 md:h-8",
                darkMode ? "text-blue-500" : "text-blue-600"
              )} />
            </div>
          </Card>
        </div>

        {/* Chart Tabs */}
        <Tabs value={selectedChartType} onValueChange={(value: any) => setSelectedChartType(value)} className="w-full">
          <TabsList className={cn(
            "grid w-full",
            isMobile ? "grid-cols-2 gap-1" : "grid-cols-4",
            darkMode ? "bg-gray-700" : ""
          )}>
            <TabsTrigger value="overview" className="text-xs md:text-sm">Panoramica</TabsTrigger>
            <TabsTrigger value="detailed" className="text-xs md:text-sm">Dettagliato</TabsTrigger>
            <TabsTrigger value="comparison" className="text-xs md:text-sm">Confronto</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs md:text-sm">Tendenze</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Area Chart - Cash Flow Overview */}
            <Card className={darkMode ? "bg-gray-700/50 border-gray-600" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">Flusso di Cassa</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.revenue} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.revenue} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.expense} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.expense} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                    <XAxis 
                      dataKey="month" 
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      tick={{ fill: darkMode ? "#9ca3af" : "#6b7280" }}
                    />
                    <YAxis 
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      tick={{ fill: darkMode ? "#9ca3af" : "#6b7280" }}
                      tickFormatter={(value) => formatCurrency(value).replace('€', '')}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="entrate"
                      stroke={COLORS.revenue}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="uscite"
                      stroke={COLORS.expense}
                      fillOpacity={1}
                      fill="url(#colorExpense)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-4">
            {/* Composed Chart - Multiple Metrics */}
            <Card className={darkMode ? "bg-gray-700/50 border-gray-600" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">Analisi Dettagliata</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                    <XAxis 
                      dataKey="month" 
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      tick={{ fill: darkMode ? "#9ca3af" : "#6b7280" }}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      tick={{ fill: darkMode ? "#9ca3af" : "#6b7280" }}
                      tickFormatter={(value) => formatCurrency(value).replace('€', '')}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      tick={{ fill: darkMode ? "#9ca3af" : "#6b7280" }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="entrate" fill={COLORS.revenue} />
                    <Bar yAxisId="left" dataKey="uscite" fill={COLORS.expense} />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="margine" 
                      stroke={COLORS.margin} 
                      strokeWidth={3}
                      dot={{ fill: COLORS.margin, r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Charts for Category Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className={darkMode ? "bg-gray-700/50 border-gray-600" : ""}>
                <CardHeader>
                  <CardTitle className="text-lg">Ripartizione Entrate</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown.revenueCategories.filter(c => c.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={isMobile ? false : ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={isMobile ? 60 : 80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryBreakdown.revenueCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS.pieColors[index % COLORS.pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className={darkMode ? "bg-gray-700/50 border-gray-600" : ""}>
                <CardHeader>
                  <CardTitle className="text-lg">Ripartizione Uscite</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown.expenseCategories.filter(c => c.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={isMobile ? false : ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={isMobile ? 60 : 80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryBreakdown.expenseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS.pieColors[index % COLORS.pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            {/* Bar Chart Comparison */}
            <Card className={darkMode ? "bg-gray-700/50 border-gray-600" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">Confronto Mensile</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                    <XAxis 
                      dataKey="month" 
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      tick={{ fill: darkMode ? "#9ca3af" : "#6b7280" }}
                    />
                    <YAxis 
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      tick={{ fill: darkMode ? "#9ca3af" : "#6b7280" }}
                      tickFormatter={(value) => formatCurrency(value).replace('€', '')}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="entrate" fill={COLORS.revenue} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="uscite" fill={COLORS.expense} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="saldo" fill={COLORS.balance} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            {/* Line Chart for Trends */}
            <Card className={darkMode ? "bg-gray-700/50 border-gray-600" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">Analisi delle Tendenze</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                    <XAxis 
                      dataKey="month" 
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      tick={{ fill: darkMode ? "#9ca3af" : "#6b7280" }}
                    />
                    <YAxis 
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      tick={{ fill: darkMode ? "#9ca3af" : "#6b7280" }}
                      tickFormatter={(value) => formatCurrency(value).replace('€', '')}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="entrate" 
                      stroke={COLORS.revenue} 
                      strokeWidth={3}
                      dot={{ fill: COLORS.revenue, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="uscite" 
                      stroke={COLORS.expense} 
                      strokeWidth={3}
                      dot={{ fill: COLORS.expense, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="saldo" 
                      stroke={COLORS.balance} 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ fill: COLORS.balance, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Moving Average Analysis */}
            <Card className={darkMode ? "bg-gray-700/50 border-gray-600" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">Media Mobile (3 mesi)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                  <LineChart data={chartData.map((item, idx) => {
                    const movingAvgRevenue = idx >= 2 
                      ? (chartData[idx].entrate + chartData[idx-1].entrate + chartData[idx-2].entrate) / 3
                      : item.entrate
                    const movingAvgExpense = idx >= 2 
                      ? (chartData[idx].uscite + chartData[idx-1].uscite + chartData[idx-2].uscite) / 3
                      : item.uscite
                    
                    return {
                      ...item,
                      movingAvgRevenue,
                      movingAvgExpense
                    }
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                    <XAxis 
                      dataKey="month" 
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      tick={{ fill: darkMode ? "#9ca3af" : "#6b7280" }}
                    />
                    <YAxis 
                      stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      tick={{ fill: darkMode ? "#9ca3af" : "#6b7280" }}
                      tickFormatter={(value) => formatCurrency(value).replace('€', '')}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="movingAvgRevenue" 
                      stroke={COLORS.revenue} 
                      strokeWidth={3}
                      name="Media Mobile Entrate"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="movingAvgExpense" 
                      stroke={COLORS.expense} 
                      strokeWidth={3}
                      name="Media Mobile Uscite"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}