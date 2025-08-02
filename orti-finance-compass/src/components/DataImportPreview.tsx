import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, FileSpreadsheet, FileText } from 'lucide-react';
import { mapCSVToFinanceEntries, FinanceEntry } from '@/utils/csvHandler';

interface ColumnMapping {
  date: string;
  description: string;
  category: string;
  type: string;
  amount: string;
  notes: string;
  tags: string;
}

interface DataImportPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any[];
  headers: string[];
  filename: string;
  fileType: 'csv' | 'excel' | 'json';
  onConfirmImport: (mappedData: FinanceEntry[]) => Promise<void>;
  sheetNames?: string[];
  selectedSheet?: string;
  onSheetChange?: (sheet: string) => void;
}

const defaultMapping: ColumnMapping = {
  date: '',
  description: '',
  category: '',
  type: '',
  amount: '',
  notes: '',
  tags: ''
};

const requiredFields = ['date', 'description', 'amount'];

export const DataImportPreview: React.FC<DataImportPreviewProps> = ({
  open,
  onOpenChange,
  data,
  headers,
  filename,
  fileType,
  onConfirmImport,
  sheetNames,
  selectedSheet,
  onSheetChange
}) => {
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>(defaultMapping);
  const [mappedPreview, setMappedPreview] = useState<FinanceEntry[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  // Auto-detect column mappings based on header names
  useEffect(() => {
    if (headers.length > 0) {
      const autoMapping: ColumnMapping = { ...defaultMapping };
      
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        
        // Date detection
        if (lowerHeader.includes('data') || lowerHeader.includes('date')) {
          autoMapping.date = header;
        }
        // Description detection
        else if (lowerHeader.includes('descrizione') || lowerHeader.includes('description') || lowerHeader.includes('desc')) {
          autoMapping.description = header;
        }
        // Category detection
        else if (lowerHeader.includes('categoria') || lowerHeader.includes('category') || lowerHeader.includes('cat')) {
          autoMapping.category = header;
        }
        // Type detection
        else if (lowerHeader.includes('tipo') || lowerHeader.includes('type') || lowerHeader.includes('entrata') || lowerHeader.includes('uscita')) {
          autoMapping.type = header;
        }
        // Amount detection
        else if (lowerHeader.includes('importo') || lowerHeader.includes('amount') || lowerHeader.includes('valore') || lowerHeader.includes('value')) {
          autoMapping.amount = header;
        }
        // Notes detection
        else if (lowerHeader.includes('note') || lowerHeader.includes('notes') || lowerHeader.includes('commento')) {
          autoMapping.notes = header;
        }
        // Tags detection
        else if (lowerHeader.includes('tag') || lowerHeader.includes('etichetta') || lowerHeader.includes('label')) {
          autoMapping.tags = header;
        }
      });
      
      setColumnMapping(autoMapping);
    }
  }, [headers]);

  // Update preview when mapping changes
  useEffect(() => {
    if (data.length > 0 && isValidMapping()) {
      try {
        const mapped = mapCSVToFinanceEntries(data.slice(0, 5), columnMapping);
        setMappedPreview(mapped);
        setValidationErrors([]);
      } catch (error) {
        setValidationErrors([error.message]);
        setMappedPreview([]);
      }
    }
  }, [columnMapping, data]);

  const isValidMapping = () => {
    return requiredFields.every(field => columnMapping[field as keyof ColumnMapping]);
  };

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfirmImport = async () => {
    if (!isValidMapping()) {
      setValidationErrors(['Mappa tutti i campi obbligatori prima di procedere']);
      return;
    }

    try {
      setImporting(true);
      const allMappedData = mapCSVToFinanceEntries(data, columnMapping);
      await onConfirmImport(allMappedData);
      onOpenChange(false);
    } catch (error) {
      setValidationErrors([error.message]);
    } finally {
      setImporting(false);
    }
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'excel':
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case 'csv':
        return <FileText className="h-5 w-5 text-blue-600" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon()}
            Anteprima Import: {filename}
          </DialogTitle>
          <DialogDescription>
            {data.length} righe trovate. Mappa le colonne del file ai campi del database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sheet selector for Excel files */}
          {fileType === 'excel' && sheetNames && sheetNames.length > 1 && (
            <div className="flex items-center gap-2">
              <Label>Foglio:</Label>
              <Select value={selectedSheet} onValueChange={onSheetChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sheetNames.map(sheet => (
                    <SelectItem key={sheet} value={sheet}>
                      {sheet}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Column mapping */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold">Mapping Colonne</h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="w-32">
                    Data <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={columnMapping.date} 
                    onValueChange={(value) => handleMappingChange('date', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona colonna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nessuna</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-32">
                    Descrizione <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={columnMapping.description} 
                    onValueChange={(value) => handleMappingChange('description', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona colonna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nessuna</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-32">
                    Importo <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={columnMapping.amount} 
                    onValueChange={(value) => handleMappingChange('amount', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona colonna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nessuna</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-32">Categoria</Label>
                  <Select 
                    value={columnMapping.category} 
                    onValueChange={(value) => handleMappingChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona colonna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nessuna</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-32">Tipo</Label>
                  <Select 
                    value={columnMapping.type} 
                    onValueChange={(value) => handleMappingChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona colonna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nessuna</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-32">Note</Label>
                  <Select 
                    value={columnMapping.notes} 
                    onValueChange={(value) => handleMappingChange('notes', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona colonna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nessuna</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-32">Tags</Label>
                  <Select 
                    value={columnMapping.tags} 
                    onValueChange={(value) => handleMappingChange('tags', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona colonna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nessuna</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <h3 className="font-semibold">Anteprima Dati Mappati</h3>
              
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {validationErrors.join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {isValidMapping() && mappedPreview.length > 0 && (
                <ScrollArea className="h-96 rounded-md border">
                  <div className="p-4 space-y-3">
                    {mappedPreview.map((entry, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{entry.description}</span>
                          <Badge variant={entry.type === 'income' ? 'default' : 'destructive'}>
                            {entry.type === 'income' ? 'Entrata' : 'Uscita'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex justify-between">
                            <span>Data: {entry.date}</span>
                            <span className="font-semibold">€ {entry.amount.toFixed(2)}</span>
                          </div>
                          {entry.category && <div>Categoria: {entry.category}</div>}
                          {entry.notes && <div>Note: {entry.notes}</div>}
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {entry.tags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {data.length > 5 && (
                      <div className="text-center text-sm text-muted-foreground">
                        ... e altre {data.length - 5} righe
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}

              {!isValidMapping() && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Seleziona almeno i campi obbligatori (Data, Descrizione, Importo) per vedere l'anteprima
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Annulla
          </Button>
          <Button
            onClick={handleConfirmImport}
            disabled={!isValidMapping() || importing || validationErrors.length > 0}
          >
            {importing ? 'Importazione...' : `Importa ${data.length} righe`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};