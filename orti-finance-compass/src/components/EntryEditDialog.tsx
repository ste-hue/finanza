import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface EntryEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  monthIndex: number;
  year: number;
  currentProjectedValue?: number;
  currentActualValue?: number;
  onSave: (value: number, isProjection: boolean, notes: string) => void;
  isLoading?: boolean;
}

export const EntryEditDialog: React.FC<EntryEditDialogProps> = ({
  isOpen,
  onClose,
  categoryName,
  monthIndex,
  year,
  currentProjectedValue = 0,
  currentActualValue = 0,
  onSave,
  isLoading = false
}) => {
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [isProjection, setIsProjection] = useState(true);

  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  useEffect(() => {
    if (isOpen) {
      // Se esiste un valore reale, editiamo quello, altrimenti la proiezione
      if (currentActualValue !== 0) {
        setValue(Math.abs(currentActualValue).toString());
        setIsProjection(false);
      } else if (currentProjectedValue !== 0) {
        setValue(Math.abs(currentProjectedValue).toString());
        setIsProjection(true);
      } else {
        setValue('');
        setIsProjection(true);
      }
      setNotes('');
    }
  }, [isOpen, currentProjectedValue, currentActualValue]);

  const handleSave = () => {
    const numValue = parseFloat(value) || 0;
    onSave(numValue, isProjection, notes);
    onClose();
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="zen-card border-border/50 backdrop-blur-sm max-w-md">
        <DialogHeader className="pb-6">
          <DialogTitle className="font-zen-jp text-xl font-light">
            {categoryName}
            <span className="text-muted-foreground font-light"> · {months[monthIndex - 1]} {year}</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground font-light">
            Modifica valore per la categoria selezionata
          </DialogDescription>
        </DialogHeader>
        
        {/* Current Values Display */}
        {(currentProjectedValue !== 0 || currentActualValue !== 0) && (
          <div className="space-y-3 p-4 bg-muted/20 rounded-xl border border-border/30">
            <h4 className="text-sm font-medium text-foreground">Valori Esistenti:</h4>
            <div className="space-y-2">
              {currentProjectedValue !== 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs bg-accent/20 border-accent/40">
                      🔮 Previsto
                    </Badge>
                  </div>
                  <span className="font-mono text-sm">{formatCurrency(Math.abs(currentProjectedValue))}</span>
                </div>
              )}
              {currentActualValue !== 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs bg-primary/20 border-primary/40">
                      ✅ Reale
                    </Badge>
                  </div>
                  <span className="font-mono text-sm font-bold">{formatCurrency(Math.abs(currentActualValue))}</span>
                </div>
              )}
              {currentProjectedValue !== 0 && currentActualValue !== 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-border/30">
                  <span className="text-xs text-muted-foreground">Varianza:</span>
                  <span className={`font-mono text-sm font-bold ${
                    currentActualValue > currentProjectedValue ? 'text-destructive' : 'text-success'
                  }`}>
                    {formatCurrency(Math.abs(currentActualValue - currentProjectedValue))}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <Label htmlFor="value" className="font-zen font-medium text-foreground">Nuovo Valore (€)</Label>
            <Input
              id="value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="zen-input mt-2 rounded-xl border-border/50 font-zen-jp text-lg"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/10 rounded-xl border border-border/20">
            <div>
              <Label htmlFor="projection" className="font-zen font-medium">Tipo di Valore</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {isProjection ? 'Valore previsto/stimato' : 'Valore reale/effettivo'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-xs text-muted-foreground">🔮 Previsto</div>
              <Switch
                id="projection"
                checked={!isProjection}
                onCheckedChange={(checked) => setIsProjection(!checked)}
                className="zen-button"
              />
              <div className="text-xs text-foreground font-medium">✅ Reale</div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="font-zen font-medium text-foreground">Note (opzionale)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Aggiungi note o spiegazioni..."
              rows={3}
              className="zen-input mt-2 rounded-xl border-border/50"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="zen-button rounded-xl border-border/50"
              disabled={isLoading}
            >
              Annulla
            </Button>
            <Button 
              onClick={handleSave} 
              className="zen-button bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                `Salva ${isProjection ? '🔮 Previsione' : '✅ Valore Reale'}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 