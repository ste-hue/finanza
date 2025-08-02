import Papa from 'papaparse';
import { saveAs } from 'file-saver';

export interface CSVImportOptions {
  delimiter?: string;
  encoding?: string;
  skipEmptyLines?: boolean;
  transformHeader?: (header: string) => string;
}

export interface CSVExportOptions {
  delimiter?: string;
  headers?: string[] | boolean;
  skipEmptyRows?: boolean;
}

// Type for finance entry data
export interface FinanceEntry {
  id?: string;
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  notes?: string;
  tags?: string[];
  [key: string]: any; // Allow additional fields
}

// Export data to CSV
export const exportToCSV = (
  data: FinanceEntry[],
  filename: string = 'finance-data',
  options: CSVExportOptions = {}
) => {
  try {
    const {
      delimiter = ',',
      headers = true,
      skipEmptyRows = true
    } = options;

    // Prepare data for CSV
    const csvData = data.map(entry => ({
      Data: entry.date,
      Descrizione: entry.description,
      Categoria: entry.category,
      Tipo: entry.type === 'income' ? 'Entrata' : 'Uscita',
      Importo: entry.amount,
      Note: entry.notes || '',
      Tags: Array.isArray(entry.tags) ? entry.tags.join('; ') : ''
    }));

    // Generate CSV string
    const csv = Papa.unparse(csvData, {
      delimiter,
      header: !!headers,
      skipEmptyLines: skipEmptyRows
    });

    // Create blob and download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }); // Add BOM for Excel
    saveAs(blob, `${filename}-${new Date().toISOString().split('T')[0]}.csv`);

    return { success: true, rowCount: data.length };
  } catch (error) {
    console.error('CSV Export error:', error);
    throw new Error(`Errore durante l'export CSV: ${error.message}`);
  }
};

// Import data from CSV
export const importFromCSV = (
  file: File,
  options: CSVImportOptions = {}
): Promise<{ data: any[], headers: string[], errors: any[] }> => {
  return new Promise((resolve, reject) => {
    const {
      delimiter,
      encoding = 'UTF-8',
      skipEmptyLines = true,
      transformHeader = (header: string) => header.trim()
    } = options;

    Papa.parse(file, {
      delimiter,
      encoding,
      skipEmptyLines,
      header: true,
      transformHeader,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }

        resolve({
          data: results.data,
          headers: results.meta.fields || [],
          errors: results.errors
        });
      },
      error: (error) => {
        reject(new Error(`Errore durante la lettura del CSV: ${error.message}`));
      }
    });
  });
};

// Map CSV data to finance entries
export const mapCSVToFinanceEntries = (
  csvData: any[],
  columnMapping: { [key: string]: string }
): FinanceEntry[] => {
  return csvData.map((row, index) => {
    try {
      // Get values based on mapping
      const date = row[columnMapping.date] || '';
      const description = row[columnMapping.description] || '';
      const category = row[columnMapping.category] || 'Generale';
      const type = determineTransactionType(
        row[columnMapping.type],
        row[columnMapping.amount]
      );
      const amount = parseAmount(row[columnMapping.amount]);
      const notes = row[columnMapping.notes] || '';
      const tags = parseTags(row[columnMapping.tags]);

      // Validate required fields
      if (!date || !description || isNaN(amount)) {
        throw new Error(`Riga ${index + 1}: dati mancanti o non validi`);
      }

      return {
        date: normalizeDate(date),
        description: description.trim(),
        category: category.trim(),
        type,
        amount: Math.abs(amount),
        notes: notes.trim(),
        tags
      };
    } catch (error) {
      throw new Error(`Errore alla riga ${index + 1}: ${error.message}`);
    }
  });
};

// Helper functions
const determineTransactionType = (
  typeValue: string | undefined,
  amountValue: string | number | undefined
): 'income' | 'expense' => {
  if (typeValue) {
    const normalized = typeValue.toString().toLowerCase().trim();
    if (normalized.includes('entrat') || normalized.includes('income') || normalized === '+') {
      return 'income';
    }
    if (normalized.includes('uscit') || normalized.includes('expense') || normalized === '-') {
      return 'expense';
    }
  }

  // If no type specified, determine by amount sign
  const amount = typeof amountValue === 'number' ? amountValue : parseFloat(amountValue || '0');
  return amount >= 0 ? 'income' : 'expense';
};

const parseAmount = (value: string | number | undefined): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  // Clean the string: remove currency symbols, spaces, and convert commas
  const cleaned = value.toString()
    .replace(/[€$£¥]/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '') // Remove thousand separators
    .replace(',', '.'); // Convert decimal comma to point

  return parseFloat(cleaned) || 0;
};

const parseTags = (value: string | undefined): string[] => {
  if (!value) return [];
  
  // Split by common delimiters
  return value.split(/[,;|]/)
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
};

const normalizeDate = (dateStr: string): string => {
  // Try to parse various date formats
  const date = new Date(dateStr);
  
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  // Try Italian format (dd/mm/yyyy)
  const italianMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (italianMatch) {
    const [, day, month, year] = italianMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Return original if can't parse
  return dateStr;
};

// Auto-detect CSV delimiter
export const detectDelimiter = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const firstLine = text.split('\n')[0];
      
      // Count occurrences of common delimiters
      const delimiters = [',', ';', '\t', '|'];
      const counts = delimiters.map(d => ({
        delimiter: d,
        count: (firstLine.match(new RegExp(d, 'g')) || []).length
      }));

      // Return delimiter with highest count
      const best = counts.reduce((a, b) => a.count > b.count ? a : b);
      resolve(best.delimiter);
    };
    reader.readAsText(file.slice(0, 1024)); // Read only first 1KB
  });
};

// Get preview of CSV data
export const getCSVPreview = async (
  file: File,
  rowLimit: number = 5
): Promise<{ headers: string[], rows: any[], delimiter: string }> => {
  const delimiter = await detectDelimiter(file);
  
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      delimiter,
      header: true,
      preview: rowLimit + 1, // +1 for header
      complete: (results) => {
        resolve({
          headers: results.meta.fields || [],
          rows: results.data,
          delimiter
        });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};