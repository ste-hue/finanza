import { supabase, Company, Category, Subcategory, Entry, FinancialAccount, CategoryWithSubcategories, SubcategoryWithEntries } from './supabase';

// Service per gestire operazioni finanziarie con Supabase
export class FinanceService {
  
  // ==================== COMPANIES ====================
  
  static async getCompanies(): Promise<Company[]> {
    console.log('🔍 FinanceService.getCompanies() - Starting query...');
    
    try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');
    
      console.log('📡 FinanceService.getCompanies() - Raw response:', { data, error });
      
      if (error) {
        console.error('❌ FinanceService.getCompanies() - Error:', {
          message: error?.message || String(error),
          details: error?.details,
          hint: error?.hint,
          code: error?.code
        });
        throw error;
      }
      
      console.log('✅ FinanceService.getCompanies() - Success:', data?.length, 'companies found');
    return data || [];
    } catch (err) {
      console.error('💥 FinanceService.getCompanies() - Exception:', {
        message: err?.message || String(err),
        name: err?.name || 'Unknown',
        stack: err?.stack
      });
      throw err;
    }
  }
  
  static async createCompany(name: string, description?: string): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .insert({ name, description })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // ==================== CATEGORIES ====================
  
  static async getCompanyCategories(companyId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('company_id', companyId)
      .order('sort_order');
    
    if (error) throw error;
    return data || [];
  }

  // NEW: Get categories with their subcategories
  static async getCategoriesWithSubcategories(companyId: string): Promise<CategoryWithSubcategories[]> {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        subcategories (
          id,
          name,
          description,
          sort_order,
          created_at,
          updated_at
        )
      `)
      .eq('company_id', companyId)
      .order('sort_order');
    
    if (error) throw error;
    return data || [];
  }
  
  static async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // ==================== SUBCATEGORIES ====================

  static async getSubcategories(categoryId: string): Promise<Subcategory[]> {
    // 🚀 REFACTORED: Use API Backend to get categories with subcategories
    console.log('🔄 FinanceService.getSubcategories() - Using API Backend for categoryId:', categoryId);
    
    try {
      // Get all categories for ORTI company (includes subcategories)
      const response = await fetch(`http://localhost:8000/companies/ORTI/categories`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Find the specific category and return its subcategories
        const category = result.categories?.find((cat: any) => cat.id === categoryId);
        const subcategories = category?.subcategories || [];
        
        console.log('✅ FinanceService.getSubcategories() - Success:', subcategories.length, 'subcategories found for category', categoryId);
        return subcategories;
      } else {
        throw new Error(result.message || 'API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ FinanceService.getSubcategories() - Error:', error);
      // Return empty array instead of throwing to prevent cascading errors
      return [];
    }
  }

  static async createSubcategory(subcategory: Omit<Subcategory, 'id' | 'created_at' | 'updated_at'>): Promise<Subcategory> {
    // 🚀 REFACTORED: Use API Backend instead of direct Supabase
    console.log('🔄 FinanceService.createSubcategory() - Using API Backend:', subcategory);
    
    try {
      const response = await fetch(`http://localhost:8000/categories/${subcategory.category_id}/subcategories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: subcategory.name,
          sort_order: subcategory.sort_order || 1
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ FinanceService.createSubcategory() - Success:', result.subcategory);
        return result.subcategory;
      } else {
        throw new Error(result.message || 'API returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ FinanceService.createSubcategory() - Error:', error);
      throw error;
    }
  }
  
  // ==================== ENTRIES ====================
  
  static async getCategoryEntries(categoryId: string, year?: number): Promise<Entry[]> {
    let query = supabase
      .from('entries')
      .select(`
        *,
        subcategories!inner(
          category_id,
          name
        )
      `)
      .eq('subcategories.category_id', categoryId);
    
    if (year) {
      query = query.eq('year', year);
    }
    
    query = query.order('year').order('month');
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  static async getSubcategoryEntries(subcategoryId: string, year?: number): Promise<Entry[]> {
    let query = supabase
      .from('entries')
      .select('*')
      .eq('subcategory_id', subcategoryId);
    
    if (year) {
      query = query.eq('year', year);
    }
    
    query = query.order('year').order('month');
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  // FIXED: Correct upsert with subcategory_id constraint
  static async upsertEntry(entry: Omit<Entry, 'id' | 'created_at' | 'updated_at'>): Promise<Entry> {
    const { data, error } = await supabase
      .from('entries')
      .upsert(entry, { 
        onConflict: 'subcategory_id,year,month', // FIXED: was category_id
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // FIXED: Delete using subcategory_id
  static async deleteEntry(subcategoryId: string, year: number, month: number): Promise<void> {
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('subcategory_id', subcategoryId) // FIXED: was category_id
      .eq('year', year)
      .eq('month', month);
    
    if (error) throw error;
  }
  
  static async getEntriesByTypeAndMonth(companyId: string, year: number, month: number): Promise<{
    revenue: Entry[];
    expense: Entry[];
    balance: Entry[];
    financing: Entry[];
  }> {
    const { data, error } = await supabase
      .from('entries')
      .select(`
        *,
        subcategories!inner(
          category_id,
          name,  
          categories!inner(
            type_id,
            company_id
          )
        )
      `)
      .eq('subcategories.categories.company_id', companyId)
      .eq('year', year)
      .eq('month', month);

    if (error) throw error;

    const groupedEntries = {
      revenue: [] as Entry[],
      expense: [] as Entry[],
      balance: [] as Entry[],
      financing: [] as Entry[]
    };

    (data || []).forEach(entry => {
      const entryWithRels = entry as Entry & {
        subcategories?: {
          categories?: {
            type_id: string;
          };
        };
      };
      
      const typeId = entryWithRels.subcategories?.categories?.type_id;
      if (typeId && groupedEntries[typeId as keyof typeof groupedEntries]) {
        groupedEntries[typeId as keyof typeof groupedEntries].push(entry);
      }
    });

    return groupedEntries;
  }
  
  // ==================== BULK OPERATIONS ====================
  
  static async getCompanyData(companyId: string, year?: number) {
    // Get company info
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
    
    if (companyError) throw companyError;
    
    // Get full hierarchy: categories → subcategories → entries
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select(`
        *,
        subcategories (
          id,
          name,
          description,
          sort_order,
          created_at,
          updated_at,
          entries (
            id,
            year,
            month,
            value,
            is_projection,
            notes,
            created_at,
            updated_at
          )
        )
      `)
      .eq('company_id', companyId)
      .order('sort_order');
    
    if (categoriesError) throw categoriesError;
    
    // Filter entries by year if provided
    const processedCategories = (categoriesData || []).map(cat => ({
        ...cat,
      subcategories: (cat.subcategories || []).map(subcat => ({
        ...subcat,
        entries: year 
          ? (subcat.entries || []).filter((entry: Entry) => entry.year === year)
          : (subcat.entries || [])
      }))
    }));
    
    return {
      company,
      categories: processedCategories
    };
  }
  
  // ==================== FINANCIAL ACCOUNTS ====================
  
  static async getCompanyAccounts(companyId: string): Promise<FinancialAccount[]> {
    const { data, error } = await supabase
      .from('financial_accounts')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }
  
  static async createAccount(account: Omit<FinancialAccount, 'id' | 'created_at' | 'updated_at'>): Promise<FinancialAccount> {
    const { data, error } = await supabase
      .from('financial_accounts')
      .insert(account)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // ==================== UTILITY METHODS ====================
  
  static async getMonthlyTotals(companyId: string, year: number, month: number) {
    const { data, error } = await supabase
      .from('entries')
      .select(`
        value,
        subcategories!inner(
          categories!inner(
            type_id,
            company_id
          )
        )
      `)
      .eq('subcategories.categories.company_id', companyId)
      .eq('year', year)
      .eq('month', month);
    
    if (error) throw error;
    
    // Aggregate by category type
    const totals = {
      revenue: 0,
      expense: 0,
      balance: 0,
      financing: 0
    };
    
    data?.forEach(entry => {
      const entryWithRels = entry as {
        value: number;
        subcategories?: {
          categories?: {
            type_id: string;
          };
        };
      };
      
      const typeId = entryWithRels.subcategories?.categories?.type_id;
      if (typeId && typeId in totals) {
        totals[typeId as keyof typeof totals] += entryWithRels.value || 0;
      }
    });
    
    return totals;
  }
} 