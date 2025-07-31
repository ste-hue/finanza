import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Upload, RefreshCw, Trash2, Database, FileText, AlertTriangle } from 'lucide-react';

interface DataManagementProps {
  onDataUpdated?: () => void;
}

interface ImportResult {
  success: boolean;
  message: string;
  total_imported?: number;
  errors?: string[];
}

interface ResetResult {
  success: boolean;
  message: string;
  categories_preserved?: number;
}

const DataManagement: React.FC<DataManagementProps> = ({ onDataUpdated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | ResetResult | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [showTemplate, setShowTemplate] = useState(false);

  // Template JSON semplificato
  const jsonTemplate = `{
  "company_name": "ORTI",
  "import_metadata": {
    "source": "I tuoi dati",
    "import_date": "${new Date().toISOString().split('T')[0]}"
  },
  "data": [
    {
      "category_name": "Entrate Hotel",
      "subcategory_name": "Totale",
      "data_type": "consolidated",
      "is_projection": false,
      "entries": [
        {
          "year": 2024,
          "month": 1,
          "value": 15000.00,
          "notes": "Dati reali Gennaio"
        }
      ]
    },
    {
      "category_name": "Entrate Hotel", 
      "subcategory_name": "Totale",
      "data_type": "projection",
      "is_projection": true,
      "entries": [
        {
          "year": 2025,
          "month": 7,
          "value": 85000.00,
          "notes": "PREVISIONE Luglio"
        }
      ]
    }
  ]
}`;

  const handleReset = async () => {
    if (!confirm('⚠️ ATTENZIONE: Questa operazione cancellerà TUTTI i dati finanziari!\n\nSei sicuro di voler procedere?')) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/reset/all-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data: ResetResult = await response.json();
      setResult(data);
      
      if (data.success && onDataUpdated) {
        onDataUpdated();
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Errore reset: ${error}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      alert('Inserisci i dati JSON da importare');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const jsonData = JSON.parse(jsonInput);
      
      const response = await fetch(`http://localhost:8000/api/companies/${jsonData.company_name || 'ORTI'}/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData)
      });

      const data: ImportResult = await response.json();
      setResult(data);
      
      if (data.success && onDataUpdated) {
        onDataUpdated();
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Errore import: ${error}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (onDataUpdated) {
      onDataUpdated();
    }
  };

  const copyTemplate = () => {
    setJsonInput(jsonTemplate);
    setShowTemplate(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gestione Dati ORTI Finance
          </CardTitle>
          <CardDescription>
            Azzera, importa e aggiorna i dati finanziari con distinzione tra <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Consolidato</Badge> e <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Previsionale</Badge>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reset */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-500" />
              Reset Completo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Cancella tutti i dati finanziari mantenendo le 22 categorie
            </p>
            <Button 
              onClick={handleReset}
              disabled={isLoading}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              {isLoading ? 'Azzerando...' : '🗑️ Azzerra Tutto'}
            </Button>
          </CardContent>
        </Card>

        {/* Template */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              Template JSON
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Formato JSON per importare i tuoi dati
            </p>
            <Button 
              onClick={() => setShowTemplate(!showTemplate)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              📋 Mostra Template
            </Button>
          </CardContent>
        </Card>

        {/* Refresh */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-green-500" />
              Aggiorna Vista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Ricarica i dati dal database
            </p>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="w-full"
            >
              🔄 Refresh
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Template Display */}
      {showTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">📋 Template JSON</CardTitle>
            <CardDescription>
              Copia questo template e sostituisci con i tuoi dati
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong>
                  <ul className="mt-2 text-sm list-disc list-inside space-y-1">
                    <li><Badge className="bg-green-50 text-green-700 border-green-200">is_projection: false</Badge> = Dati CONSOLIDATI (reali)</li>
                    <li><Badge className="bg-orange-50 text-orange-700 border-orange-200">is_projection: true</Badge> = Dati PREVISIONALI (stime)</li>
                    <li>Entrate = valori <strong>positivi</strong> (+)</li>
                    <li>Uscite = valori <strong>negativi</strong> (-)</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                {jsonTemplate}
              </pre>
              
              <Button onClick={copyTemplate} size="sm" className="w-full">
                📋 Copia Template nell'Editor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* JSON Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Dati JSON
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Incolla qui il tuo JSON..."
              className="w-full h-40 p-3 border rounded font-mono text-sm"
            />
            <Button 
              onClick={handleImport}
              disabled={isLoading || !jsonInput.trim()}
              className="w-full"
            >
              {isLoading ? 'Importando...' : '📊 Importa Dati'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
              {result.success ? '✅ Operazione Completata' : '❌ Errore'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription>
                <div className="space-y-2">
                  <p>{result.message}</p>
                  
                  {'total_imported' in result && result.total_imported && (
                    <p className="text-sm">
                      <strong>Entries importate:</strong> {result.total_imported}
                    </p>
                  )}
                  
                  {'categories_preserved' in result && result.categories_preserved && (
                    <p className="text-sm">
                      <strong>Categorie preservate:</strong> {result.categories_preserved}
                    </p>
                  )}
                  
                  {'errors' in result && result.errors && result.errors.length > 0 && (
                    <div className="text-sm">
                      <strong>Errori:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {result.errors.map((error, index) => (
                          <li key={index} className="text-red-600">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataManagement;