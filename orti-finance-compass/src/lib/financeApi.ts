import { supabase } from './supabase';
import { Category, Entry } from './supabase';

// API Layer - Middleware between Frontend and Supabase
export class FinanceAPI {
  
  // ==================== COMPANIES ====================
  
  static async getCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');
    
    if (error) throw new Error(`Errore caricamento companies: ${error.message}`);
    return data || [];
  }

  static async getCompanyByName(name: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('name', name)
      .single();
    
    if (error) throw new Error(`Company '${name}' non trovata: ${error.message}`);
    return data;
  }

  // ==================== CATEGORIES ====================
  
  static async getCompanyCategories(companyId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('company_id', companyId)
      .order('sort_order');
    
    if (error) throw new Error(`Errore caricamento categorie: ${error.message}`);
    return data || [];
  }

  // ==================== FINANCIAL DATA ====================
  
  static async getFinancialData(companyId: string, year: number, month?: number) {
    // First, get all categories
    const { data: allCategories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('company_id', companyId)
      .order('sort_order');
    
    if (catError) throw new Error(`Errore caricamento categorie: ${catError.message}`);

    // Then get entries with joins
    let query = supabase
      .from('entries')
      .select(`
        *,
        subcategories!inner(
          id,
          name,
          category_id,
          categories!inner(
            id,
            name,
            type_id,
            company_id
          )
        )
      `)
      .eq('subcategories.categories.company_id', companyId)
      .eq('year', year);

    if (month) {
      query = query.eq('month', month);
    }

    query = query.order('month'); // Remove problematic nested JOIN ordering

    const { data: entries, error } = await query;
    if (error) throw new Error(`Errore caricamento dati finanziari: ${error.message}`);

    return this.processFinancialDataWithAllCategories(entries || [], allCategories || []);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static processFinancialDataWithAllCategories(rawData: any[], allCategories: Category[]) {
    const processedData = {
      entries: [] as (Entry & { categoryName: string; subcategoryName: string; categoryType: string })[],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      categorySummary: {} as Record<string, { total: number; type: string; entries: any[] }>,
      allCategories: allCategories.filter(cat => 
        !cat.name.includes('TOTALE') && 
        !cat.name.includes('DIFF.')
      )
    };

    // Initialize all categories in summary, even empty ones
    processedData.allCategories.forEach(category => {
      processedData.categorySummary[category.id] = {
        total: 0,
        type: category.type_id,
        entries: []
      };
    });

    // Process entries
    rawData.forEach(entry => {
      const categoryData = entry.subcategories?.categories;
      if (!categoryData) return;

      // Processed entry with additional info
      const processedEntry = {
        ...entry,
        categoryName: categoryData.name,
        subcategoryName: entry.subcategories.name,
        categoryType: categoryData.type_id
      };

      processedData.entries.push(processedEntry);

      // Update summary for this category
      const categoryId = categoryData.id;
      if (processedData.categorySummary[categoryId]) {
        processedData.categorySummary[categoryId].total += (entry.value || 0);
        processedData.categorySummary[categoryId].entries.push(processedEntry);
      }
    });

    // Sort entries by type for logical display order
    const typeOrder = { 'revenue': 1, 'expense': 2, 'balance': 3, 'financing': 4 };
    processedData.entries.sort((a, b) => {
      const typeCompare = (typeOrder[a.categoryType as keyof typeof typeOrder] || 999) - 
                         (typeOrder[b.categoryType as keyof typeof typeOrder] || 999);
      if (typeCompare !== 0) return typeCompare;
      
      // If same type, sort by month
      return a.month - b.month;
    });

    return processedData;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static processFinancialData(rawData: any[]) {
    const processedData = {
      entries: [] as (Entry & { categoryName: string; subcategoryName: string; categoryType: string })[],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      categorySummary: {} as Record<string, { total: number; type: string; entries: any[] }>
    };

    rawData.forEach(entry => {
      const categoryData = entry.subcategories?.categories;
      if (!categoryData) return;

      // Processed entry with additional info
      const processedEntry = {
        ...entry,
        categoryName: categoryData.name,
        subcategoryName: entry.subcategories.name,
        categoryType: categoryData.type_id
      };

      processedData.entries.push(processedEntry);

      // Summary by category
      const categoryId = categoryData.id;
      if (!processedData.categorySummary[categoryId]) {
        processedData.categorySummary[categoryId] = {
          total: 0,
          type: categoryData.type_id,
          entries: []
        };
      }

      processedData.categorySummary[categoryId].total += (entry.value || 0);
      processedData.categorySummary[categoryId].entries.push(processedEntry);
    });

    return processedData;
  }

  // ==================== MONTHLY TOTALS ====================
  
  static async getMonthlyTotals(companyId: string, year: number) {
    const data = await this.getFinancialData(companyId, year);
    
    // Group by month and calculate totals
    const monthlyTotals: Record<number, { revenues: number; expenses: number; balance: number; financing: number }> = {};
    
    for (let month = 1; month <= 12; month++) {
      monthlyTotals[month] = { revenues: 0, expenses: 0, balance: 0, financing: 0 };
    }

    data.entries.forEach(entry => {
      const month = entry.month;
      const value = Math.abs(entry.value || 0);
      const type = entry.categoryType;

      if (monthlyTotals[month] && type in monthlyTotals[month]) {
        (monthlyTotals[month] as Record<string, number>)[type] += value;
      }
    });

    return monthlyTotals;
  }

  // ==================== CRUD OPERATIONS ====================
  
  static async updateEntry(entryId: string, value: number, notes?: string) {
    const { data, error } = await supabase
      .from('entries')
      .update({ 
        value,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .select()
      .single();
    
    if (error) throw new Error(`Errore aggiornamento entry: ${error.message}`);
    return data;
  }

  static async createEntry(subcategoryId: string, year: number, month: number, value: number, notes?: string) {
    const { data, error } = await supabase
      .from('entries')
      .insert({
        subcategory_id: subcategoryId,
        year,
        month,
        value,
        notes,
        is_projection: false
      })
      .select()
      .single();
    
    if (error) throw new Error(`Errore creazione entry: ${error.message}`);
    return data;
  }

  static async upsertEntry(subcategoryId: string, year: number, month: number, value: number, notes?: string) {
    // Check if entry exists
    const { data: existing } = await supabase
      .from('entries')
      .select('id')
      .eq('subcategory_id', subcategoryId)
      .eq('year', year)
      .eq('month', month)
      .single();

    if (existing) {
      return this.updateEntry(existing.id, value, notes);
    } else {
      return this.createEntry(subcategoryId, year, month, value, notes);
    }
  }

  // ==================== CATEGORY MANAGEMENT ====================
  
  static async getCategoryWithSubcategories(categoryId: string) {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        subcategories(*)
      `)
      .eq('id', categoryId)
      .single();
    
    if (error) throw new Error(`Errore caricamento categoria: ${error.message}`);
    return data;
  }

  // ==================== UTILITIES ====================
  
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  static async healthCheck() {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('count')
        .limit(1);
      
      return { status: 'ok', error: null };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
} 