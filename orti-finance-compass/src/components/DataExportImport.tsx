import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, FileJson, AlertCircle, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { exportDataToJSON, importDataFromJSON, validateImportedData } from '@/utils/dataExportImport';
import { exportToCSV, importFromCSV, getCSVPreview } from '@/utils/csvHandler';
import { exportToExcel, importFromExcel, getExcelPreview } from '@/utils/excelHandler';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataImportPreview } from '@/components/DataImportPreview';

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
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    data: any[];
    headers: string[];
    filename: string;
    fileType: 'csv' | 'excel' | 'json';
    sheetNames?: string[];
    selectedSheet?: string;
  } | null>(null);

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

  const handleExportCSV = async () => {
    try {
      const data = await onExport();
      // Assume the data has an 'entries' property with the financial entries
      const entries = data.entries || [];
      await exportToCSV(entries, exportFilename);
      toast({
        title: "✅ Export CSV completato",
        description: `${entries.length} voci esportate con successo`
      });
    } catch (error) {
      toast({
        title: "❌ Errore nell'export CSV",
        description: error instanceof Error ? error.message : "Impossibile esportare i dati",
        variant: "destructive"
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      const data = await onExport();
      const entries = data.entries || [];
      await exportToExcel(entries, exportFilename);
      toast({
        title: "✅ Export Excel completato",
        description: `${entries.length} voci esportate con successo`
      });
    } catch (error) {
      toast({
        title: "❌ Errore nell'export Excel",
        description: error instanceof Error ? error.message : "Impossibile esportare i dati",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      
      // Determine file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'json') {
        // Handle JSON files as before
        const data = await importDataFromJSON(file);
        
        if (!validateImportedData(data)) {
          toast({
            title: "❌ Formato non valido",
            description: "Il file selezionato non contiene dati validi",
            variant: "destructive"
          });
          return;
        }

        // Show preview dialog for JSON
        setImportPreview(data);
        setShowImportDialog(true);
      } else if (fileExtension === 'csv') {
        // Handle CSV files
        const result = await importFromCSV(file);
        const preview = await getCSVPreview(file);
        
        setPreviewData({
          data: result.data,
          headers: result.headers,
          filename: file.name,
          fileType: 'csv'
        });
        setShowDataPreview(true);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Handle Excel files
        const result = await importFromExcel(file);
        const preview = await getExcelPreview(file);
        
        setPreviewData({
          data: result.data,
          headers: result.headers,
          filename: file.name,
          fileType: 'excel',
          sheetNames: result.sheetNames,
          selectedSheet: result.sheetNames[0]
        });
        setShowDataPreview(true);
      } else {
        toast({
          title: "❌ Formato non supportato",
          description: "Supportati solo file JSON, CSV e Excel (.xlsx, .xls)",
          variant: "destructive"
        });
      }
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

  const handleSheetChange = async (sheet: string) => {
    if (!previewData || previewData.fileType !== 'excel') return;
    
    try {
      const file = fileInputRef.current?.files?.[0];
      if (!file) return;
      
      const result = await importFromExcel(file, { sheetName: sheet });
      setPreviewData({
        ...previewData,
        data: result.data,
        headers: result.headers,
        selectedSheet: sheet
      });
    } catch (error) {
      toast({
        title: "❌ Errore nel caricamento del foglio",
        description: error instanceof Error ? error.message : "Impossibile caricare il foglio",
        variant: "destructive"
      });
    }
  };

  const handleConfirmStructuredImport = async (mappedData: any[]) => {
    try {
      // Convert mapped data to the format expected by onImport
      const importData = {
        entries: mappedData,
        categories: {}, // Will be auto-generated from entries
        version: '1.0'
      };
      
      await onImport(importData);
      setShowDataPreview(false);
      setPreviewData(null);
      
      toast({
        title: "✅ Import completato",
        description: `${mappedData.length} voci importate con successo`
      });
    } catch (error) {
      throw error; // Let the preview component handle the error
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
            Esporta o importa i tuoi dati finanziari in vari formati
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Esporta Dati
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExport}>
                  <FileJson className="mr-2 h-4 w-4" />
                  Esporta come JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileText className="mr-2 h-4 w-4" />
                  Esporta come CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Esporta come Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
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
              accept=".json,.csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Formati supportati</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>JSON:</strong> Import/export completo con tutte le impostazioni</li>
                <li><strong>CSV:</strong> Formato tabellare semplice, ideale per analisi in Excel</li>
                <li><strong>Excel:</strong> Fogli di calcolo con formattazione automatica</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* JSON Import Dialog */}
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

      {/* Structured Data Import Preview */}
      {previewData && (
        <DataImportPreview
          open={showDataPreview}
          onOpenChange={setShowDataPreview}
          data={previewData.data}
          headers={previewData.headers}
          filename={previewData.filename}
          fileType={previewData.fileType}
          onConfirmImport={handleConfirmStructuredImport}
          sheetNames={previewData.sheetNames}
          selectedSheet={previewData.selectedSheet}
          onSheetChange={handleSheetChange}
        />
      )}
    </>
  );
};