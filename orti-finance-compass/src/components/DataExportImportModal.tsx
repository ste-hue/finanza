import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileJson, AlertCircle, X } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface DataExportImportModalProps {
  onExport: () => Promise<any>;
  onImport: (data: any) => Promise<void>;
  exportFilename?: string;
  darkMode?: boolean;
  trigger?: React.ReactNode;
}

export const DataExportImportModal: React.FC<DataExportImportModalProps> = ({
  onExport,
  onImport,
  exportFilename = 'orti-finance-data',
  darkMode = false,
  trigger
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async () => {
    try {
      const data = await onExport();
      await exportDataToJSON(data, exportFilename);
      toast({
        title: "✅ Export completato",
        description: "I dati sono stati esportati con successo"
      });
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
      setIsOpen(false);
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

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <FileJson className="h-4 w-4 mr-2" />
      Import/Export
    </Button>
  );

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {trigger || defaultTrigger}
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className={cn(
            "w-full sm:max-w-md",
            darkMode && "bg-gray-800 border-gray-700"
          )}
        >
          <SheetHeader>
            <SheetTitle className={cn(
              "flex items-center gap-2",
              darkMode && "text-gray-100"
            )}>
              <FileJson className="h-5 w-5" />
              Import/Export Dati
            </SheetTitle>
            <SheetDescription className={darkMode ? "text-gray-400" : ""}>
              Gestisci i tuoi dati finanziari
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Export Section */}
            <div className="space-y-3">
              <h3 className={cn(
                "text-sm font-semibold",
                darkMode ? "text-gray-200" : "text-gray-700"
              )}>
                Esporta Dati
              </h3>
              <p className={cn(
                "text-sm",
                darkMode ? "text-gray-400" : "text-gray-600"
              )}>
                Salva tutti i tuoi dati finanziari in un file JSON
              </p>
              <Button
                onClick={handleExport}
                variant="outline"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Esporta Dati
              </Button>
            </div>

            {/* Import Section */}
            <div className="space-y-3">
              <h3 className={cn(
                "text-sm font-semibold",
                darkMode ? "text-gray-200" : "text-gray-700"
              )}>
                Importa Dati
              </h3>
              <p className={cn(
                "text-sm",
                darkMode ? "text-gray-400" : "text-gray-600"
              )}>
                Carica dati da un file JSON precedentemente esportato
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
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

            {/* Warning Alert */}
            <Alert className={darkMode ? "bg-gray-700 border-gray-600" : ""}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className={darkMode ? "text-gray-200" : ""}>
                Note importanti
              </AlertTitle>
              <AlertDescription className={darkMode ? "text-gray-400" : ""}>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>L'export include tutti i dati dell'anno selezionato</li>
                  <li>L'import sovrascriverà i dati esistenti</li>
                  <li>Fai sempre un backup prima di importare</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </SheetContent>
      </Sheet>

      {/* Import Confirmation Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
          <DialogHeader>
            <DialogTitle className={darkMode ? "text-gray-100" : ""}>
              Conferma Import
            </DialogTitle>
            <DialogDescription className={darkMode ? "text-gray-400" : ""}>
              Stai per importare i seguenti dati. Questa operazione sovrascriverà i dati esistenti.
            </DialogDescription>
          </DialogHeader>
          
          {importPreview && (
            <div className={cn(
              "max-h-64 overflow-y-auto p-4 rounded-lg font-mono text-xs",
              darkMode ? "bg-gray-900 text-gray-300" : "bg-muted"
            )}>
              <pre>
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