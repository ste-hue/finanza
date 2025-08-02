import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Circle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthConsolidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  monthName: string;
  projectedRevenues: number;
  projectedExpenses: number;
  onConfirm: () => void;
}

export const MonthConsolidationDialog: React.FC<MonthConsolidationDialogProps> = ({
  open,
  onOpenChange,
  year,
  month,
  monthName,
  projectedRevenues,
  projectedExpenses,
  onConfirm
}) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('it-IT', { 
      style: 'currency', 
      currency: 'EUR', 
      minimumFractionDigits: 0 
    }).format(value);

  const projectedDifference = projectedRevenues - projectedExpenses;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Circle className="h-5 w-5" />
            Consolidamento Mese
          </DialogTitle>
          <DialogDescription>
            Stai per consolidare i dati previsionali di {monthName} {year}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-medium text-sm">Stato Attuale</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tipo dati:</span>
                <Badge variant="outline" className="text-xs">
                  <Circle className="h-3 w-3 mr-1" />
                  Previsionali
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ricavi previsti:</span>
                <span className="font-medium">{formatCurrency(projectedRevenues)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Costi previsti:</span>
                <span className="font-medium">{formatCurrency(projectedExpenses)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Differenza:</span>
                <span className={cn(
                  "font-medium",
                  projectedDifference >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(projectedDifference)}
                </span>
              </div>
            </div>
          </div>

          {/* What will happen */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Cosa succederà:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• I dati verranno marcati come consolidati</li>
                <li>• I valori attuali diventeranno i valori effettivi</li>
                <li>• Verrà salvato il delta tra previsione e consuntivo</li>
                <li>• Non sarà possibile annullare l'operazione</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* After consolidation preview */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Dopo il consolidamento
            </h4>
            <p className="text-sm text-muted-foreground">
              I dati saranno marcati come consolidati e potrai inserire nuovi valori 
              effettivi se necessario. Il sistema terrà traccia delle differenze 
              tra i valori previsionali e quelli effettivi.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleConfirm}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Consolida Mese
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};