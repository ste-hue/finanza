import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AggregateDisplayProps {
  title: string;
  total: number;
  consolidated: number;
  projected: number;
  icon?: React.ReactNode;
  type?: 'revenue' | 'expense' | 'difference';
  showDelta?: boolean;
  delta?: number;
}

export const AggregateDisplay: React.FC<AggregateDisplayProps> = ({
  title,
  total,
  consolidated,
  projected,
  icon,
  type = 'revenue',
  showDelta = false,
  delta = 0
}) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('it-IT', { 
      style: 'currency', 
      currency: 'EUR', 
      minimumFractionDigits: 0 
    }).format(value);

  const consolidatedPercentage = total > 0 ? (consolidated / total) * 100 : 0;
  const projectedPercentage = total > 0 ? (projected / total) * 100 : 0;

  const getTrendIcon = () => {
    if (delta === 0) return null;
    const isPositive = type === 'expense' ? delta < 0 : delta > 0;
    return isPositive ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {showDelta && getTrendIcon()}
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Total Value */}
          <div className="flex items-baseline justify-between">
            <span className={cn(
              "text-2xl font-bold",
              type === 'difference' && total >= 0 && "text-green-600",
              type === 'difference' && total < 0 && "text-red-600"
            )}>
              {formatCurrency(total)}
            </span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-semibold">Composizione totale:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Consolidato:</span>
                      <span className="font-medium">{formatCurrency(consolidated)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Previsionale:</span>
                      <span className="font-medium">{formatCurrency(projected)}</span>
                    </div>
                    {showDelta && delta !== 0 && (
                      <div className="flex justify-between pt-1 border-t">
                        <span>Variazione:</span>
                        <span className={cn(
                          "font-medium",
                          type === 'expense' ? 
                            (delta < 0 ? "text-green-600" : "text-red-600") :
                            (delta > 0 ? "text-green-600" : "text-red-600")
                        )}>
                          {delta > 0 ? '+' : ''}{formatCurrency(delta)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Consolidato vs Previsionale</span>
              <span>{consolidatedPercentage.toFixed(0)}% / {projectedPercentage.toFixed(0)}%</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="absolute left-0 top-0 h-full bg-primary transition-all"
                style={{ width: `${consolidatedPercentage}%` }}
              />
              <div
                className="absolute top-0 h-full bg-primary/40 transition-all"
                style={{ 
                  left: `${consolidatedPercentage}%`,
                  width: `${projectedPercentage}%` 
                }}
              />
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="secondary" className="text-xs">
              <div className="h-2 w-2 rounded-full bg-primary mr-1" />
              Consolidato: {formatCurrency(consolidated)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <div className="h-2 w-2 rounded-full bg-primary/40 mr-1" />
              Previsionale: {formatCurrency(projected)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};