import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FinanceEntry } from './csvHandler';

export interface ExcelImportOptions {
  sheetName?: string | number; // Sheet name or index
  headerRow?: number; // Row index where headers are located (0-based)
  startRow?: number; // Row index where data starts (0-based)
}

export interface ExcelExportOptions {
  sheetName?: string;
  includeHeaders?: boolean;
  autoWidth?: boolean;
  dateFormat?: string;
}

// Export data to Excel
export const exportToExcel = (
  data: FinanceEntry[],
  filename: string = 'finance-data',
  options: ExcelExportOptions = {}
) => {
  try {
    const {
      sheetName = 'Dati Finanziari',
      includeHeaders = true,
      autoWidth = true,
      dateFormat = 'dd/mm/yyyy'
    } = options;

    // Prepare data for Excel
    const excelData = data.map(entry => ({
      Data: entry.date,
      Descrizione: entry.description,
      Categoria: entry.category,
      Tipo: entry.type === 'income' ? 'Entrata' : 'Uscita',
      Importo: entry.amount,
      Note: entry.notes || '',
      Tags: Array.isArray(entry.tags) ? entry.tags.join('; ') : ''
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData, { header: includeHeaders ? undefined : 0 });

    // Apply date format to date column
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let row = 1; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 }); // Column A (Data)
      if (ws[cellAddress]) {
        ws[cellAddress].t = 'd';
        ws[cellAddress].z = dateFormat;
      }
    }

    // Auto-width columns
    if (autoWidth) {
      const colWidths = calculateColumnWidths(excelData);
      ws['!cols'] = colWidths;
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(blob, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);

    return { success: true, rowCount: data.length };
  } catch (error) {
    console.error('Excel Export error:', error);
    throw new Error(`Errore durante l'export Excel: ${error.message}`);
  }
};

// Import data from Excel
export const importFromExcel = (
  file: File,
  options: ExcelImportOptions = {}
): Promise<{ data: any[], headers: string[], sheetNames: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });

        const {
          sheetName = 0, // Default to first sheet
          headerRow = 0,
          startRow = 1
        } = options;

        // Get sheet
        const sheetNameStr = typeof sheetName === 'number' 
          ? workbook.SheetNames[sheetName] 
          : sheetName;
        
        if (!sheetNameStr || !workbook.Sheets[sheetNameStr]) {
          throw new Error(`Foglio '${sheetName}' non trovato nel file Excel`);
        }

        const worksheet = workbook.Sheets[sheetNameStr];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Use array of arrays
          raw: false, // Format values
          dateNF: 'yyyy-mm-dd'
        }) as any[][];

        if (jsonData.length <= headerRow) {
          throw new Error('Il file non contiene dati');
        }

        // Extract headers and data
        const headers = jsonData[headerRow].map(h => h?.toString() || '');
        const data = jsonData.slice(startRow).map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        }).filter(row => Object.values(row).some(v => v !== null && v !== undefined && v !== ''));

        resolve({
          data,
          headers,
          sheetNames: workbook.SheetNames
        });
      } catch (error) {
        reject(new Error(`Errore durante la lettura del file Excel: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Errore durante la lettura del file'));
    };

    reader.readAsBinaryString(file);
  });
};

// Get preview of Excel data
export const getExcelPreview = async (
  file: File,
  rowLimit: number = 5
): Promise<{ headers: string[], rows: any[], sheets: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        
        // Use first sheet for preview
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          raw: false,
          dateNF: 'yyyy-mm-dd'
        }) as any[][];

        if (jsonData.length === 0) {
          resolve({ headers: [], rows: [], sheets: workbook.SheetNames });
          return;
        }

        const headers = jsonData[0].map(h => h?.toString() || '');
        const rows = jsonData.slice(1, rowLimit + 1).map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });

        resolve({
          headers,
          rows,
          sheets: workbook.SheetNames
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Errore durante la lettura del file'));
    };

    reader.readAsBinaryString(file);
  });
};

// Calculate column widths based on content
const calculateColumnWidths = (data: any[]): { wch: number }[] => {
  if (data.length === 0) return [];

  const headers = Object.keys(data[0]);
  const widths = headers.map(header => {
    const maxLength = Math.max(
      header.length,
      ...data.map(row => (row[header]?.toString() || '').length)
    );
    return { wch: Math.min(maxLength + 2, 50) }; // Max width of 50
  });

  return widths;
};

// Export multiple sheets to Excel
export const exportMultipleSheetsToExcel = (
  sheets: { name: string; data: FinanceEntry[] }[],
  filename: string = 'finance-data-complete'
) => {
  try {
    const wb = XLSX.utils.book_new();

    sheets.forEach(({ name, data }) => {
      const excelData = data.map(entry => ({
        Data: entry.date,
        Descrizione: entry.description,
        Categoria: entry.category,
        Tipo: entry.type === 'income' ? 'Entrata' : 'Uscita',
        Importo: entry.amount,
        Note: entry.notes || '',
        Tags: Array.isArray(entry.tags) ? entry.tags.join('; ') : ''
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Auto-width
      const colWidths = calculateColumnWidths(excelData);
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, name);
    });

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(blob, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);

    return { success: true, sheetCount: sheets.length };
  } catch (error) {
    console.error('Excel Export error:', error);
    throw new Error(`Errore durante l'export Excel: ${error.message}`);
  }
};

// Validate Excel file structure
export const validateExcelStructure = async (file: File): Promise<{
  isValid: boolean;
  sheets: string[];
  errors: string[];
}> => {
  try {
    const result = await new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          resolve(workbook);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsBinaryString(file);
    });

    const errors: string[] = [];
    const sheets = result.SheetNames;

    if (sheets.length === 0) {
      errors.push('Il file Excel non contiene fogli');
    }

    return {
      isValid: errors.length === 0,
      sheets,
      errors
    };
  } catch (error) {
    return {
      isValid: false,
      sheets: [],
      errors: [`Errore durante la validazione: ${error.message}`]
    };
  }
};