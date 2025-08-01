import { toast } from '@/hooks/use-toast';

// Export data to JSON
export const exportDataToJSON = async (data: any, filename: string = 'finance-data') => {
  try {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: data
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "✅ Export completato",
      description: `Dati esportati in ${a.download}`
    });
  } catch (error) {
    console.error('Export error:', error);
    toast({
      title: "❌ Errore nell'export",
      description: "Impossibile esportare i dati",
      variant: "destructive"
    });
  }
};

// Import data from JSON file
export const importDataFromJSON = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        
        // Validate the imported data structure
        if (!parsedData.version || !parsedData.data) {
          throw new Error('Formato file non valido');
        }
        
        resolve(parsedData.data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Errore nella lettura del file'));
    };
    
    reader.readAsText(file);
  });
};

// Validate imported data structure
export const validateImportedData = (data: any): boolean => {
  try {
    // Check if data has required structure
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Add more specific validation based on your data structure
    // For example, check if it has entries array or categories object
    if (data.entries && !Array.isArray(data.entries)) {
      return false;
    }

    if (data.categories && typeof data.categories !== 'object') {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Format data for export (clean up unnecessary fields)
export const formatDataForExport = (data: any) => {
  // Remove any sensitive or unnecessary fields
  const cleanData = {
    ...data,
    // Remove any Supabase specific fields if needed
  };

  return cleanData;
};