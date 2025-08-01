import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, FileJson, AlertCircle } from 'lucide-react';
import { exportDataToJSON, importDataFromJSON, validateImportedData } from '@/utils/dataExportImport';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DataExportImportProps {
  onExport: () => Promise<any>;
  onImport: (data: any) => Promise<void>;
  exportFilename?: string;
}

export const DataExportImport: React.FC<DataExportImportProps> = ({
  onExport,
  onImport,
  exportFilename = 'orti-finance-data'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importPreview, setImportPreview] = useState<any>(null);

  const handleExport = async () => {
    try {
      const data = await onExport();
      await exportDataToJSON(data, exportFilename);
    } catch (error) {
      toast({
        title: "❌ Errore nell'export",
        description: "Impossibile esportare i dati",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const data = await importDataFromJSON(file);
      
      if (!validateImportedData(data)) {
        toast({
          title: "❌ Formato non valido",
          description: "Il file selezionato non contiene dati validi",
          variant: "destructive"
        });
        return;
      }

      // Show preview dialog
      setImportPreview(data);
      setShowImportDialog(true);
    } catch (error) {
      toast({
        title: "❌ Errore nell'import",
        description: error instanceof Error ? error.message : "Impossibile importare i dati",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const confirmImport = async () => {
    try {
      setImporting(true);
      await onImport(importPreview);
      setShowImportDialog(false);
      setImportPreview(null);
      toast({
        title: "✅ Import completato",
        description: "I dati sono stati importati con successo"
      });
    } catch (error) {
      toast({
        title: "❌ Errore nell'import",
        description: "Impossibile importare i dati nel database",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Export/Import Dati
          </CardTitle>
          <CardDescription>
            Esporta o importa i tuoi dati finanziari in formato JSON
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleExport}
              variant="outline"
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Esporta Dati
            </Button>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex-1"
              disabled={importing}
            >
              <Upload className="mr-2 h-4 w-4" />
              {importing ? 'Importazione...' : 'Importa Dati'}
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Note importanti</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>L'export include tutti i dati finanziari dell'anno corrente</li>
                <li>L'import sovrascriverà i dati esistenti</li>
                <li>Assicurati di fare un backup prima di importare nuovi dati</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Import</DialogTitle>
            <DialogDescription>
              Stai per importare i seguenti dati. Questa operazione sovrascriverà i dati esistenti.
            </DialogDescription>
          </DialogHeader>
          
          {importPreview && (
            <div className="max-h-64 overflow-y-auto bg-muted p-4 rounded-lg">
              <pre className="text-sm">
                {JSON.stringify(importPreview, null, 2).substring(0, 500)}...
              </pre>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setImportPreview(null);
              }}
            >
              Annulla
            </Button>
            <Button
              onClick={confirmImport}
              disabled={importing}
              variant="destructive"
            >
              {importing ? 'Importazione...' : 'Conferma Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};